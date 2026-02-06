import { HandDTO } from './HandDTO';

/**
 * プレイヤー情報のDTO
 *
 * ゲーム内のプレイヤーの状態を表す
 */
export interface PlayerDTO {
  /** プレイヤーの一意識別子 */
  id: string;
  /** プレイヤーの獲得した星の数 */
  stars: number;
  /** プレイヤーの手札 */
  hand: HandDTO;
}
