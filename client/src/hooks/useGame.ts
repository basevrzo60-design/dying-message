import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import type { Snapshot, Act } from "../types/game";
export function useGame() {
  const [snap, setSnap] = useState<Snapshot | null>(null),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const lastRoomRoute = useRef("");
  const roomRoute = snap
    ? `/${snap.room.status === "lobby" ? "lobby" : "game"}/${snap.room.id}`
    : "";
  const notify = (message: string) => {
    setToast(message);
  };
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const socket = io(import.meta.env.VITE_SERVER_URL || undefined, {
      autoConnect: false,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      const saved =
        sessionStorage.getItem("sheriff-session") ||
        localStorage.getItem("sheriff-session");
      if (saved) {
        try {
          socket.emit("rejoin_room", JSON.parse(saved), (r: any) => {
            if (!r.ok) {
              setSnap(null);
              sessionStorage.removeItem("sheriff-session");
              localStorage.removeItem("sheriff-session");
              notify(r.error);
            } else notify("กลับเข้าห้องเรียบร้อยแล้ว");
          });
        } catch {
          localStorage.removeItem("sheriff-session");
          sessionStorage.removeItem("sheriff-session");
        }
      }
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("game_state", (next: Snapshot) => setSnap(next));
    socket.on("error_message", notify);
    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    if (roomRoute && roomRoute !== lastRoomRoute.current) {
      lastRoomRoute.current = roomRoute;
      navigate(roomRoute);
    } else if (!roomRoute) {
      lastRoomRoute.current = "";
    }
  }, [roomRoute, navigate]);
  const act: Act = async (event, data = {}) => {
    if (!socketRef.current?.connected) {
      notify("กำลังเชื่อมต่อกับตลาด กรุณาลองอีกครั้งสักครู่");
      return { ok: false };
    }
    setBusy(true);
    return new Promise((resolve) =>
      socketRef
        .current!.timeout(8000)
        .emit(event, data, (err: Error | null, r: any) => {
          setBusy(false);
          if (err) {
            notify("เซิร์ฟเวอร์ไม่ตอบกลับ กรุณาลองอีกครั้ง");
            resolve({ ok: false });
            return;
          }
          if (!r.ok) notify(r.error);
          else if (r.token) {
            const session = JSON.stringify({
              roomId: r.roomId,
              playerId: r.playerId,
              token: r.token,
            });
            sessionStorage.setItem("sheriff-session", session);
            localStorage.setItem("sheriff-session", session);
          }
          resolve(r);
        }),
    );
  };
  const leave = async () => {
    const r = await act("leave_room");
    if (r.ok) {
      setSnap(null);
      sessionStorage.removeItem("sheriff-session");
      localStorage.removeItem("sheriff-session");
      navigate("/");
    }
  };
  return { snap, connected, busy, toast, setToast, act, leave, roomRoute };
}
