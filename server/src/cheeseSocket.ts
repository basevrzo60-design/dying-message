import type { Server } from "socket.io";
import { CheeseManager, type CheeseRoom } from "./CheeseManager.js";
export function attachCheese(io: Server) {
  const gm = new CheeseManager();
  const ns = io.of("/cheese");
  const publish = (room: CheeseRoom) => {
    for (const p of room.players)
      if (p.socketId) ns.to(p.socketId).emit("state", gm.snapshot(room, p));
  };
  ns.on("connection", (socket) => {
    let count = 0;
    const rate = setInterval(() => {
      count = 0;
    }, 1000);
    socket.on("action", (request, ack) => {
      if (typeof ack !== "function") return;
      try {
        if (++count > 25) throw Error("ส่งคำสั่งเร็วเกินไป กรุณารอสักครู่");
        if (
          !request ||
          typeof request !== "object" ||
          typeof request.event !== "string"
        )
          throw Error("คำสั่งไม่ถูกต้อง");
        const event = request.event;
        const data = request.data ?? {};
        if (typeof data !== "object" || Array.isArray(data))
          throw Error("ข้อมูลไม่ถูกต้อง");
        if (["create", "join", "rejoin"].includes(event)) {
          const { room, player } =
            event === "create"
              ? gm.create(socket.id, data)
              : event === "join"
                ? gm.join(socket.id, data)
                : gm.rejoin(socket.id, data);
          ack({ ok: true, session: gm.credentials(room, player) });
          publish(room);
        } else if (event === "leave") {
          const room = gm.leave(socket.id);
          ack({ ok: true });
          socket.emit("state", null);
          publish(room);
        } else {
          const room = gm.action(socket.id, event, data);
          ack({ ok: true });
          publish(room);
        }
      } catch (error) {
        ack({
          ok: false,
          error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        });
      }
    });
    socket.on("disconnect", () => {
      clearInterval(rate);
      const room = gm.disconnect(socket.id);
      if (room) publish(room);
    });
  });
  const timer = setInterval(() => {
    for (const room of gm.rooms.values()) {
      if (
        !room.players.some((p) => p.socketId) &&
        Date.now() - room.lastActive > 3600000
      ) {
        gm.rooms.delete(room.code);
        continue;
      }
      if (
        room.phase === "night" &&
        room.auto &&
        room.deadline &&
        room.deadline <= Date.now() &&
        !gm.paused(room)
      ) {
        gm.advance(room);
        publish(room);
      }
    }
  }, 500);
  timer.unref();
  io.httpServer?.once("close", () => clearInterval(timer));
  return gm;
}
