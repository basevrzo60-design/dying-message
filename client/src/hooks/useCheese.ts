import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { CheeseSession, CheeseView } from "../../../shared/cheese";
type Reply = { ok: boolean; error?: string; session?: CheeseSession };
const key = "cheese-room-session-v1";
export function useCheese() {
  const [view, setView] = useState<CheeseView | null>(null);
  const [connected, setConnected] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const socket = useRef<Socket | null>(null);
  const session = useRef<CheeseSession | null>(null);
  const pending = useRef(false);
  function save(value: CheeseSession | null) {
    session.current = value;
    try {
      if (value) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
    } catch {
      /* Session still works until this page closes. */
    }
  }
  useEffect(() => {
    try {
      session.current = JSON.parse(sessionStorage.getItem(key) || "null");
    } catch {
      session.current = null;
    }
    const base = (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");
    const client = io(`${base}/cheese`, { autoConnect: false });
    socket.current = client;
    client.on("state", (state: CheeseView | null) => {
      setView(state);
      setRecovering(false);
    });
    client.on("connect", () => {
      setConnected(true);
      setError("");
      if (session.current) {
        setRecovering(true);
        client
          .timeout(8000)
          .emit(
            "action",
            { event: "rejoin", data: session.current },
            (err: Error | null, reply: Reply) => {
              setRecovering(false);
              if (err) {
                setError("คืนที่นั่งไม่สำเร็จ กดเชื่อมต่อใหม่");
                return;
              }
              if (!reply.ok) {
                if (!reply.error?.includes('เครื่องอื่น')) save(null);
                setView(null);
                setError(reply.error || "คืนที่นั่งไม่ได้");
              }
            },
          );
      } else setRecovering(false);
    });
    client.on("disconnect", () => {
      setConnected(false);
      setBusy(false);
      pending.current = false;
    });
    client.on("connect_error", () => {
      setConnected(false);
      setRecovering(false);
      setError(
        "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจเครือข่ายและเปิดเซิร์ฟเวอร์เกม",
      );
    });
    client.connect();
    return () => {
      client.removeAllListeners();
      client.disconnect();
      socket.current = null;
    };
  }, []);
  async function act(
    event: string,
    data: Record<string, unknown> = {},
  ): Promise<boolean> {
    if (pending.current) return false;
    if (!socket.current?.connected) {
      setError("กำลังรอเชื่อมต่อเซิร์ฟเวอร์");
      return false;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    return new Promise((resolve) =>
      socket
        .current!.timeout(8000)
        .emit("action", { event, data }, (err: Error | null, reply: Reply) => {
          pending.current = false;
          setBusy(false);
          if (err) {
            setError("ยังไม่ได้รับคำตอบ ตรวจสถานะก่อนลองอีกครั้ง");
            resolve(false);
            return;
          }
          if (!reply.ok) {
            setError(reply.error || "ทำรายการไม่สำเร็จ");
            resolve(false);
            return;
          }
          if (reply.session) save(reply.session);
          if (event === "leave") {
            save(null);
            setView(null);
          }
          resolve(true);
        }),
    );
  }
  function reconnect() {
    socket.current?.disconnect();
    socket.current?.connect();
  }
  return { view, connected, recovering, busy, error, setError, act, reconnect };
}
