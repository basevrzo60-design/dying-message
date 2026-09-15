export type {
  Good,
  Player,
  PrivatePlayer,
  Room,
  Snapshot,
} from "../../../shared/types";
export type Act = (event: string, data?: unknown) => Promise<any>;
