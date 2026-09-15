export type GoodName =
  | "Apple"
  | "Cheese"
  | "Bread"
  | "Chicken"
  | "Pepper"
  | "Mead"
  | "Silk"
  | "Crossbow"
  | "Fish"
  | "Honey"
  | "Tea"
  | "Jewels";
export interface Good {
  id: string;
  name: GoodName;
  type: "legal" | "contraband";
  value: number;
  penalty: number;
  image: string;
}
export interface Player {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  score: number;
  bonus: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  role: string;
  merchantStand: Good[];
  contraband: Good[];
  handCount: number;
  bagCount: number;
  declaredGoods?: GoodName;
  bribe: number;
}
export interface PrivatePlayer {
  hand: Good[];
  bag: Good[];
}
export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  isPrivate: boolean;
  status: "lobby" | "playing" | "finished";
  players: Player[];
  round: number;
  maxRounds: number;
  currentSheriffId: string;
  currentMerchantId: string;
  phase: string;
  eventLog: string[];
  messages: { id: string; name: string; text: string; time: string }[];
  winner?: string;
  revealed: Good[];
  demo: boolean;
  deckCount: number;
  discardCount: number;
}
export interface Snapshot {
  room: Room;
  privatePlayer: PrivatePlayer;
  playerId: string;
}
