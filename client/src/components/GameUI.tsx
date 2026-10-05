import { useState, useEffect, useRef } from "react";
import { Crown, Check, Shield, Coins, MessageCircle, Send } from "lucide-react";
import type { Snapshot, Good, Act } from "../types/game";
import { goodLabel } from "../types/goods";
import { GoodsArtwork } from "./GoodsArtwork";
export function PlayerList({ snap }: { snap: Snapshot }) {
  return (
    <div className="space-y-3">
      {snap.room.players.map((p) => (
        <div
          key={p.id}
          className={`rounded-lg border p-4 ${p.id === snap.room.currentMerchantId ? "border-gold bg-[#fbf2dc]" : "border-[#e3e2d6] bg-white/40"}`}
        >
          <div className="flex gap-3 items-center">
            <span className="text-3xl bg-[#efeee3] p-2 rounded-full">
              {p.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold truncate">
                {p.name}
                {p.id === snap.playerId && (
                  <span className="text-[9px] text-muted">คุณ</span>
                )}
                {p.isHost && <Crown size={13} className="text-gold" />}
              </div>
              <div className="text-[10px] text-muted mt-1 flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${p.isConnected ? "bg-[#6b8e57]" : "bg-red-400"}`}
                />
                {snap.room.status === "lobby"
                  ? p.isReady
                    ? "พร้อมแล้ว"
                    : "ยังไม่พร้อม"
                  : p.role === "Sheriff"
                    ? "นายอำเภอ"
                    : "พ่อค้า"}
                {!p.isConnected && " · ออฟไลน์"}
              </div>
            </div>
            {p.role === "Sheriff" && snap.room.status !== "lobby" && (
              <Shield size={20} className="text-gold" />
            )}
            {p.isReady && snap.room.status === "lobby" && (
              <Check size={17} className="text-forest" />
            )}
          </div>
          {snap.room.status !== "lobby" && (
            <div className="flex mt-3 text-xs text-muted">
              <span className="flex gap-1.5 items-center">
                <Coins size={13} className="text-gold" />
                {p.coins} เหรียญ
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
export function Chat({ snap, act }: { snap: Snapshot; act: Act }) {
  const [message, setMessage] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Some browsers return a Promise from scrolling. Effects must only return
    // a cleanup function or undefined, never the scrolling result.
    const list = end.current?.parentElement;
    if (list) list.scrollTop = list.scrollHeight;
  }, [snap.room.messages.length]);
  return (
    <div className="panel">
      <h3 className="font-display text-2xl flex items-center gap-2">
        <MessageCircle size={18} />
        แชตในโต๊ะ
      </h3>
      <div
        className="h-44 max-md:h-[min(38dvh,20rem)] overflow-y-auto overscroll-contain my-4 space-y-3"
        aria-live="polite"
      >
        {!snap.room.messages.length && (
          <p className="text-xs text-muted leading-6">
            โต๊ะยังเงียบอยู่ ลองทักเพื่อนสักหน่อย
            <br />
            หรือเริ่มด้วยคำโกหกที่น่าเชื่อ
          </p>
        )}
        {snap.room.messages.map((m) => (
          <div key={m.id} className="text-xs break-words">
            <span className="font-semibold">{m.name}</span>
            <span className="text-muted text-[9px] ml-2">
              {new Date(m.time).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <p className="text-muted mt-1">{m.text}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (message.trim()) {
            const r = await act("send_message", { text: message });
            if (r?.ok) setMessage("");
          }
        }}
      >
        <input
          aria-label="ข้อความแชต"
          placeholder="มีแต่แอปเปิล สาบานได้…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
          className="text-xs min-w-0 py-2"
        />
        <button
          className="bg-forest text-white rounded-lg p-3"
          aria-label="ส่งข้อความ"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
export function GoodCard({
  good,
  selected,
  onClick,
}: {
  good: Good;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={!onClick}
      aria-pressed={onClick ? !!selected : undefined}
      onClick={onClick}
      aria-label={`${goodLabel(good.name)} มูลค่า ${good.value} เหรียญ ค่าปรับ ${good.penalty} เหรียญ`}
      className={`relative min-w-0 w-full overflow-hidden rounded-xl border-2 text-center transition-transform enabled:hover:-translate-y-1 disabled:opacity-100 ${selected ? "border-gold bg-[#f8eccc] ring-2 ring-gold shadow-lg" : "border-[#dedbc9] bg-[#fbf8ed]"}`}
    >
      {selected && (
        <span className="absolute right-1 top-9 z-10 rounded-full bg-forest p-1.5 text-white shadow-md">
          <Check size={18} />
        </span>
      )}
      <GoodsArtwork good={good} />
    </button>
  );
}
