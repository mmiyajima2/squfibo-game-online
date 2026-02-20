import { ComboType } from '../types/index.js';
import { CardDTO } from './CardDTO.js';
import { PositionDTO } from './PositionDTO.js';

/**
 * 役（コンボ）情報のDTO
 *
 * 成立した役の情報を転送するためのデータ構造
 */
export interface ComboDTO {
  /** 役の種類 */
  type: ComboType;
  /** 役を構成するカード配列 */
  cards: CardDTO[];
  /** 役を構成するカードの位置配列 */
  positions: PositionDTO[];
}
