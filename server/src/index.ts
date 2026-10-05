import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { GameManager } from "./GameManager.js";
import { thaiMessage } from "../../shared/messages.js";
import { attachCheese } from "./cheeseSocket.js";
import { attachDying } from "./dyingSocket.js";
const app = express();
const origins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173"
).split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean);
const allowOrigin = (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
  if (!origin || origins.includes(origin.replace(/\/$/, "")) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error("Origin is not allowed"));
};
app.use(cors({ origin: allowOrigin }));
app.get("/health", (_, res) => res.json({ ok: true }));
const http = createServer(app);
const io = new Server(http, {
  cors: { origin: allowOrigin },
  maxHttpBufferSize: 16384,
});
const gm = new GameManager();
attachCheese(io);
attachDying(io);
const pending = new Set<string>();
function publish(room: any) {
  for (const p of room.players)
    if (p.isConnected && !p.bot)
      io.to(p.socketId).emit("game_state", gm.snapshot(room, p));
  schedule(room);
}
function schedule(room: any) {
  if (pending.has(room.id) || room.status !== "playing") return;
  const actor = room.players.find(
    (p: any) =>
      p.id ===
      (room.phase === "SHERIFF_DECISION"
        ? room.currentSheriffId
        : room.currentMerchantId),
  );
  if (room.phase !== "INSPECTION_RESULT" && !actor?.bot) return;
  pending.add(room.id);
  setTimeout(
    () => {
      pending.delete(room.id);
      try {
        if (room.phase === "INSPECTION_RESULT") gm.advance(room);
        else if (actor.bot) {
          const phase = room.phase;
          const event =
            phase === "DRAW"
              ? "draw_cards"
              : phase === "SELECT_GOODS"
                ? "seal_bag"
                : phase === "DECLARE"
                  ? "declare_goods"
                  : phase === "BRIBE"
                    ? "offer_bribe"
                    : "accept_bag";
          gm.action(
            room,
            actor,
            event,
            phase === "DRAW"
              ? { ids: [] }
              : phase === "SELECT_GOODS"
                ? { ids: actor.hand.slice(0, 3).map((c: any) => c.id) }
                : phase === "DECLARE"
                  ? { good: "Apple", quantity: actor.bag.length }
                  : { amount: 0 },
          );
        }
        publish(room);
      } catch (e) {
        console.error(e);
      }
    },
    room.phase === "INSPECTION_RESULT" ? 4500 : 1800,
  );
}
io.on("connection", (socket) => {
  let count = 0;
  const interval = setInterval(() => (count = 0), 1000);
  const on = (event: string, fn: (data: any) => any) =>
    socket.on(event, (data, ack) => {
      try {
        if (++count > 20) throw Error("Please slow down");
        const result = fn(data ?? {});
        if (typeof ack === "function") ack({ ok: true, ...result });
      } catch (e) {
        const error = thaiMessage(
          e instanceof Error ? e.message : "Something went wrong",
        );
        if (typeof ack === "function") ack({ ok: false, error });
        else socket.emit("error_message", error);
      }
    });
  for (const event of ["create_room", "join_room", "rejoin_room"])
    on(event, (data) => {
      try {
        gm.auth(socket.id);
        throw Error("Leave your current room first");
      } catch (e) {
        if ((e as Error).message !== "Join a room first") throw e;
      }
      const { room, player } =
        event === "create_room"
          ? gm.create(socket.id, data)
          : event === "join_room"
            ? gm.join(socket.id, data)
            : gm.rejoin(socket.id, data);
      socket.join(room.id);
      publish(room);
      return { roomId: room.id, playerId: player.id, token: player.token };
    });
  on("leave_room", () => {
    const room = gm.leave(socket.id, true);
    socket.leave(room.id);
    publish(room);
  });
  for (const event of ["player_ready", "player_unready"])
    on(event, () => {
      const { room, player } = gm.auth(socket.id);
      if (room.status !== "lobby") throw Error("Game already started");
      player.isReady = event === "player_ready";
      publish(room);
    });
  on("start_game", () => {
    const { room, player } = gm.auth(socket.id);
    gm.start(room, player);
    publish(room);
  });
  for (const event of [
    "draw_cards",
    "select_goods",
    "seal_bag",
    "declare_goods",
    "offer_bribe",
    "accept_bribe",
    "reject_bribe",
    "inspect_bag",
    "accept_bag",
  ])
    on(event, (data) => {
      const { room, player } = gm.auth(socket.id);
      gm.action(room, player, event, data);
      publish(room);
    });
  on("send_message", (data) => {
    const { room, player } = gm.auth(socket.id);
    const text = gm.text(data.text, "Message", 300);
    const message = {
      id: crypto.randomUUID(),
      name: player.name,
      text,
      time: new Date().toISOString(),
    };
    room.messages = [...room.messages, message].slice(-100);
    publish(room);
  });
  on("back_to_lobby", () => {
    const { room, player } = gm.auth(socket.id);
    if (!player.isHost || room.status !== "finished")
      throw Error("Only the host can restart after the game");
    room.status = "lobby";
    room.phase = "LOBBY";
    room.players.forEach((p) => (p.isReady = p.bot));
    publish(room);
  });
  socket.on("disconnect", () => {
    clearInterval(interval);
    try {
      publish(gm.leave(socket.id));
    } catch {}
  });
});
setInterval(() => {
  for (const [id, r] of gm.rooms)
    if (
      !r.players.some((p) => p.isConnected && !p.bot) &&
      Date.now() - r.lastActive > 3600000
    )
      gm.rooms.delete(id);
}, 60000).unref();
const port = Number(process.env.PORT) || 3000;
http.listen(port, "0.0.0.0", () =>
  console.log(`Game server listening on port ${port}`),
);
