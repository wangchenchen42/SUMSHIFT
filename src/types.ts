export enum GameMode {
  CLASSIC = 'CLASSIC',
  TIME = 'TIME',
}

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  grid: Block[];
  target: number;
  score: number;
  mode: GameMode;
  isGameOver: boolean;
  selectedIds: string[];
  timeLeft: number;
  level: number;
}
