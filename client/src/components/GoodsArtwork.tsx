import type { Good } from "../types/game";
import { goodLabel } from "../types/goods";
import { Coins, ShieldAlert } from "lucide-react";

export function GoodsArtwork({
  good,
}: {
  good: Pick<Good, "name" | "type" | "value" | "penalty">;
}) {
  return (
    <>
      <div
        className={`px-2 py-1.5 text-center text-[11px] font-semibold ${good.type === "legal" ? "bg-[#e4ecd9] text-[#355329]" : "bg-[#f1ddd5] text-[#873e30]"}`}
      >
        {good.type === "legal" ? "ถูกกฎหมาย" : "สินค้าต้องห้าม"}
      </div>
      <img
        src={`/goods/${good.name.toLowerCase()}.png`}
        alt={goodLabel(good.name)}
        width={1024}
        height={1024}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="aspect-square w-full object-cover bg-[#f5efdf]"
      />
      <div className="px-2 pt-2 pb-3">
        <div className="font-sans text-sm sm:text-base font-bold text-ink leading-6 mb-2">
          {goodLabel(good.name)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-[#dec17b] bg-[#fff0be] py-2 text-[#715010]">
            <div className="text-[11px] font-semibold">มูลค่า</div>
            <div className="flex items-center justify-center gap-1">
              <Coins size={15} aria-hidden="true" />
              <strong className="text-2xl leading-8 tabular-nums">
                {good.value}
              </strong>
            </div>
            <div className="text-[10px]">เหรียญ</div>
          </div>
          <div className="rounded-lg border border-[#dca89b] bg-[#fae3dc] py-2 text-[#903c2e]">
            <div className="text-[11px] font-semibold">ค่าปรับ</div>
            <div className="flex items-center justify-center gap-1">
              <ShieldAlert size={15} aria-hidden="true" />
              <strong className="text-2xl leading-8 tabular-nums">
                {good.penalty}
              </strong>
            </div>
            <div className="text-[10px]">เหรียญ</div>
          </div>
        </div>
      </div>
    </>
  );
}
