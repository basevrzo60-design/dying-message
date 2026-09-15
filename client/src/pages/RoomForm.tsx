import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Shell } from "../components/Layout";
import type { Act } from "../types/game";
export function RoomForm({
  join,
  act,
  busy,
}: {
  join?: boolean;
  act: Act;
  busy: boolean;
}) {
  const [priv, setPriv] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    await act(join ? "join_room" : "create_room", {
      playerName: d.playerName,
      roomName: d.roomName,
      roomId: d.roomId,
      password: d.password,
      maxPlayers: Number(d.maxPlayers),
      isPrivate: priv,
    });
  }
  return (
    <Shell
      eyebrow="เริ่มค่ำคืนแห่งการบลัฟ"
      title={join ? "มีที่ว่างรอคุณอยู่" : "เปิดโต๊ะค้าขาย"}
    >
      <div className="grid md:grid-cols-2 gap-12">
        <form onSubmit={submit} className="panel space-y-6">
          <div>
            <label htmlFor="playerName">ชื่อพ่อค้าของคุณ</label>
            <input
              id="playerName"
              name="playerName"
              placeholder="ให้เราเรียกคุณว่าอะไร?"
              maxLength={20}
              required
              autoComplete="nickname"
            />
          </div>
          {join ? (
            <>
              <div>
                <label htmlFor="roomId">รหัสห้อง</label>
                <input
                  id="roomId"
                  name="roomId"
                  placeholder="SHF-A8K2"
                  required
                  className="uppercase"
                />
              </div>
              <div>
                <label htmlFor="password">
                  รหัสผ่าน{" "}
                  <span className="font-normal text-muted">
                    (เฉพาะห้องส่วนตัว)
                  </span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  maxLength={64}
                  placeholder="ใส่รหัสผ่านห้อง"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="roomName">ชื่อห้อง</label>
                <input
                  id="roomName"
                  name="roomName"
                  placeholder="ชุมนุมพ่อค้าเจ้าเล่ห์"
                  defaultValue="ชุมนุมพ่อค้าเจ้าเล่ห์"
                  maxLength={32}
                  required
                />
              </div>
              <div>
                <label htmlFor="maxPlayers">จำนวนผู้เล่นสูงสุด</label>
                <select id="maxPlayers" name="maxPlayers" defaultValue="6">
                  {[3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} คน
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setPriv(!priv)}
                role="switch"
                aria-checked={priv}
                className="w-full flex justify-between items-center text-sm"
              >
                <span className="flex items-center gap-2">
                  <LockKeyhole size={17} />
                  ห้องส่วนตัว
                </span>
                <span
                  className={`w-10 rounded-full p-1 ${priv ? "bg-forest" : "bg-[#d9dacd]"}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white ${priv ? "translate-x-4" : ""}`}
                  />
                </span>
              </button>
              {priv && (
                <div>
                  <label htmlFor="password">รหัสผ่าน</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="ตั้งรหัสผ่าน"
                    maxLength={64}
                    required
                  />
                </div>
              )}
            </>
          )}
          <button disabled={busy} className="btn-primary w-full">
            {busy ? "กำลังเปิดประตูเมือง…" : join ? "เข้าห้อง" : "สร้างห้อง"}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="relative rounded-xl min-h-80 overflow-hidden">
          <img
            src="/market.png"
            alt="นายอำเภอและพ่อค้าในตลาดยุคกลาง"
            className="absolute h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#203521] to-transparent" />
          <div className="absolute bottom-8 px-8 text-cream">
            <p className="eyebrow text-[#dbc38f]">
              เก็บสีหน้าให้ดี ก่อนเดินผ่านประตู
            </p>
            <h2 className="font-display text-4xl italic mt-3">
              พ่อค้าทุกคนมีความลับ
            </h2>
            <p className="text-sm mt-4 text-cream/75">
              ส่งรหัสห้องให้เพื่อนอีก 2–5 คน
              <br />
              นายอำเภอกำลังรอพบคุณ
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
