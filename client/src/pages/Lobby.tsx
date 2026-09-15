import { useState } from "react";
import { Check, Copy, ArrowRight, Shield } from "lucide-react";
import { Shell } from "../components/Layout";
import { PlayerList, Chat } from "../components/GameUI";
import type { Snapshot, Act } from "../types/game";
export function Lobby({
  snap,
  act,
  leave,
}: {
  snap: Snapshot;
  act: Act;
  leave: () => void;
}) {
  const me = snap.room.players.find((p) => p.id === snap.playerId)!;
  const [copied, setCopied] = useState(false);
  const [copyUnavailable, setCopyUnavailable] = useState(false);
  return (
    <Shell eyebrow="โต๊ะพร้อมแล้ว" title={snap.room.name}>
      <div className="flex flex-wrap gap-5 justify-between items-center mb-8">
        <button
          onClick={async () => {
            try {
              if (!navigator.clipboard) throw Error("Clipboard unavailable");
              await navigator.clipboard.writeText(snap.room.id);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopyUnavailable(true);
            }
          }}
          className="btn-secondary text-xs"
        >
          <span className="text-muted">รหัสห้อง</span>
          <b className="tracking-widest">{snap.room.id}</b>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <span className="text-sm text-muted">
          {snap.room.players.length} / {snap.room.maxPlayers} คน ·{" "}
          {snap.room.isPrivate ? "โต๊ะส่วนตัว" : "โต๊ะทั่วไป"}
          {snap.room.demo ? " · โหมดฝึกเล่น" : ""}
        </span>
      </div>
      {copyUnavailable && (
        <div className="mb-5 text-sm">
          <label htmlFor="copy-room">
            แตะค้างบนรหัสเพื่อคัดลอก แล้วส่งให้เพื่อน
          </label>
          <input
            id="copy-room"
            readOnly
            value={snap.room.id}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5 sm:gap-8">
        <div className="panel">
          <h2 className="font-display text-2xl sm:text-3xl mb-5">
            พบเพื่อนร่วมโต๊ะ
          </h2>
          <PlayerList snap={snap} />
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() =>
                act(me.isReady ? "player_unready" : "player_ready")
              }
              className="btn-primary"
            >
              <Check size={16} />
              {me.isReady ? "ยกเลิกพร้อม" : "พร้อมแล้ว"}
            </button>
            {me.isHost && (
              <button
                disabled={
                  snap.room.players.length < 3 ||
                  !snap.room.players.every((p) => p.isReady && p.isConnected)
                }
                onClick={() => act("start_game")}
                className="btn-secondary"
              >
                เริ่มเกม
                <ArrowRight size={16} />
              </button>
            )}
            <button onClick={leave} className="text-xs text-muted ml-auto">
              ออกจากห้อง
            </button>
          </div>
          <p className="text-xs text-muted mt-5">
            {me.isHost
              ? "ต้องมีผู้เล่นอย่างน้อย 3 คน และทุกคนกดพร้อมก่อนเริ่มเกม"
              : "เจ้าของห้องจะเริ่มเกมเมื่อทุกคนพร้อม"}
          </p>
        </div>
        <div>
          <Chat snap={snap} act={act} />
          <div className="p-6 text-xs text-muted leading-6">
            <Shield size={24} className="text-gold mb-3" />
            ส่งรหัสห้องให้เพื่อน เมื่อเจ้าของห้องเริ่มเกม
            ทุกคนจะเข้าสู่กระดานพร้อมกัน
          </div>
        </div>
      </div>
    </Shell>
  );
}
