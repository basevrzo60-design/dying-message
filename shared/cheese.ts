export type CheesePhase =
  "lobby" | "reveal" | "night" | "recruit" | "morning" | "vote" | "result";
export type CheeseRole = "mouse" | "leader" | "henchman";
export type CheesePerson = {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
};
export type CheeseSession = { code: string; id: string; token: string };
export type CheeseView = {
  code: string;
  name: string;
  capacity: number;
  hostId: string;
  round: number;
  phase: CheesePhase;
  hour: number;
  auto: boolean;
  deadline: number | null;
  paused: boolean;
  players: CheesePerson[];
  henchmenCount: number;
  confirmedCount: number;
  voteCount: number;
  me: {
    id: string;
    role: CheeseRole | null;
    hour: number | null;
    confirmed: boolean;
    awake: boolean;
    companions: string[];
    canPeek: boolean;
    nightDone: boolean;
    peek: { id: string; hour: number } | null;
    knownCompanions: string[];
    team: string[];
    voted: boolean;
  };
  result: null | {
    winner: "mice" | "thieves";
    accused: string | null;
    tied: boolean;
    players: { id: string; role: CheeseRole; hour: number; votes: number }[];
  };
};
// Keep the thieves' team close to one third of the table without making
// smaller games overwhelming: 4–6 players get one henchman, 7–8 get two.
export const henchmenFor = (count: number) =>
  Math.max(1, Math.floor((count - 1) / 3));
export const hourLabel = (hour: number) =>
  hour === 6 ? "6 โมงเช้า" : `ตี ${hour}`;
export const roleLabel = (role: CheeseRole | null) =>
  role === "leader"
    ? "หัวหน้าโจร"
    : role === "henchman"
      ? "ลูกน้องโจร"
      : "หนูทั่วไป";
