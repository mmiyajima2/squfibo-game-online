export type CommentaryType = 'action' | 'combo' | 'star' | 'turn' | 'discard' | 'draw' | 'cancel' | 'clear' | 'cpu';

export interface CommentaryMessage {
  type: CommentaryType;
  icon: string;
  text: string;
  timestamp: number;
}

export class CommentaryBuilder {
  static createMessage(type: CommentaryType, icon: string, text: string): CommentaryMessage {
    return {
      type,
      icon,
      text,
      timestamp: Date.now(),
    };
  }

  static playerPlacedCard(cardColor: string, cardValue: number): CommentaryMessage {
    return this.createMessage('action', '✅', `あなたが${cardColor}${cardValue}を置きました`);
  }

  static cpuPlacedCard(cardColor: string, cardValue: number): CommentaryMessage {
    return this.createMessage('action', '🎴', `CPUが${cardColor}${cardValue}を置きました`);
  }

  static playerClaimedCombo(comboName: string): CommentaryMessage {
    return this.createMessage('combo', '💫', `あなたが「${comboName}」を達成！`);
  }

  static cpuClaimedCombo(comboName: string): CommentaryMessage {
    return this.createMessage('combo', '💫', `CPUが「${comboName}」を達成！`);
  }

  static playerGotStar(): CommentaryMessage {
    return this.createMessage('star', '⭐', 'あなたが星を獲得しました！');
  }

  static cpuGotStar(): CommentaryMessage {
    return this.createMessage('star', '⭐', 'CPUが星を獲得しました！');
  }

  static playerTurn(): CommentaryMessage {
    return this.createMessage('turn', '👤', 'あなたのターンです');
  }

  static cpuTurn(): CommentaryMessage {
    return this.createMessage('turn', '🤖', 'CPUのターンです');
  }

  static gameStart(): CommentaryMessage {
    return this.createMessage('turn', '🎮', 'ゲームを開始します！');
  }

  static gameEnd(winner: string): CommentaryMessage {
    return this.createMessage('star', '🏆', `${winner}の勝利です！`);
  }

  static lowerPlayerPlacedCard(cardColor: string, cardValue: number): CommentaryMessage {
    return this.createMessage('action', '✅', `下側が${cardColor}${cardValue}を置きました`);
  }

  static upperPlayerPlacedCard(cardColor: string, cardValue: number): CommentaryMessage {
    return this.createMessage('action', '✅', `上側が${cardColor}${cardValue}を置きました`);
  }

  static lowerPlayerTurn(): CommentaryMessage {
    return this.createMessage('turn', '👤', '下側のターンです');
  }

  static upperPlayerTurn(): CommentaryMessage {
    return this.createMessage('turn', '👤', '上側のターンです');
  }

  static lowerPlayerClaimedCombo(comboName: string): CommentaryMessage {
    return this.createMessage('combo', '💫', `下側が「${comboName}」を達成！`);
  }

  static upperPlayerClaimedCombo(comboName: string): CommentaryMessage {
    return this.createMessage('combo', '💫', `上側が「${comboName}」を達成！`);
  }
}
