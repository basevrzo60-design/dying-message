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
export const henchmenFor = (count: number) => (count <= 5 ? 1 : 2);
export const hourLabel = (hour: number) =>
  hour === 6 ? "6 โมงเช้า" : `ตี ${hour}`;
export const roleLabel = (role: CheeseRole | null) =>
  role === "leader"
    ? "หัวหน้าโจร"
    : role === "henchman"
      ? "ลูกน้องโจร"
      : "หนูทั่วไป";
