import { GOODS, legalGoods } from "../../../shared/goods";
export { goodLabel, HAND_SIZE, MAX_EXCHANGE } from "../../../shared/goods";
export const goods = GOODS;
export const legal = legalGoods.map((g) => g.name);
export const phaseLabels: Record<string, string> = {
  LOBBY: "รอผู้เล่น",
  DRAW: "จั่วการ์ด",
  SELECT_GOODS: "จัดสินค้า",
  DECLARE: "สำแดงสินค้า",
  BRIBE: "เสนอสินบน",
  SHERIFF_DECISION: "รอนายอำเภอตัดสิน",
  INSPECTION_RESULT: "ผลการตรวจ",
  GAME_OVER: "จบเกม",
};
