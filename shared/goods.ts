import type { GoodName, Good } from "./types.js";
export const HAND_SIZE = 8;
export const MAX_EXCHANGE = 3;
export interface GoodsDefinition {
  name: GoodName;
  label: string;
  type: Good["type"];
  value: number;
  penalty: number;
  icon: string;
  copies: number;
}
export const GOODS: GoodsDefinition[] = [
  {
    name: "Apple",
    label: "แอปเปิล",
    type: "legal",
    value: 2,
    penalty: 2,
    icon: "🍎",
    copies: 24,
  },
  {
    name: "Cheese",
    label: "ชีส",
    type: "legal",
    value: 3,
    penalty: 2,
    icon: "🧀",
    copies: 24,
  },
  {
    name: "Bread",
    label: "ขนมปัง",
    type: "legal",
    value: 3,
    penalty: 2,
    icon: "🍞",
    copies: 24,
  },
  {
    name: "Chicken",
    label: "ไก่",
    type: "legal",
    value: 4,
    penalty: 2,
    icon: "🍗",
    copies: 24,
  },
  {
    name: "Fish",
    label: "ปลา",
    type: "legal",
    value: 4,
    penalty: 3,
    icon: "🐟",
    copies: 24,
  },
  {
    name: "Honey",
    label: "น้ำผึ้ง",
    type: "legal",
    value: 5,
    penalty: 3,
    icon: "🍯",
    copies: 24,
  },
  {
    name: "Pepper",
    label: "พริกไทย",
    type: "contraband",
    value: 6,
    penalty: 4,
    icon: "🌶️",
    copies: 12,
  },
  {
    name: "Mead",
    label: "เหล้าน้ำผึ้ง",
    type: "contraband",
    value: 7,
    penalty: 4,
    icon: "🍺",
    copies: 12,
  },
  {
    name: "Silk",
    label: "ผ้าไหม",
    type: "contraband",
    value: 8,
    penalty: 4,
    icon: "🧶",
    copies: 12,
  },
  {
    name: "Crossbow",
    label: "หน้าไม้",
    type: "contraband",
    value: 9,
    penalty: 4,
    icon: "🏹",
    copies: 12,
  },
  {
    name: "Tea",
    label: "ชาลักลอบ",
    type: "contraband",
    value: 9,
    penalty: 5,
    icon: "🍵",
    copies: 12,
  },
  {
    name: "Jewels",
    label: "อัญมณี",
    type: "contraband",
    value: 12,
    penalty: 6,
    icon: "💎",
    copies: 12,
  },
];
export const legalGoods = GOODS.filter((g) => g.type === "legal");
export const goodLabel = (name: string) =>
  GOODS.find((g) => g.name === name)?.label ?? name;
