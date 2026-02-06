interface ComboRulesPanelProps {
  onClose?: () => void;
}

export function ComboRulesPanel({ onClose }: ComboRulesPanelProps = {}) {
  return (
    <div className="combo-rules-panel">
      {onClose && (
        <button className="combo-rules-close-button" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      )}
      <div className="combo-rules-title">★ 役のつくりかた ★</div>

      <div className="combo-rules-subtitle">【大役】</div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">1 + 4 + 16 ★★★</div>
        <div className="combo-rule-combinations">
          同じ色で、タテ・ヨコ・L字に連なる
        </div>
        <div className="combo-rule-note">
          3枚除去 / 3枚ドロー / ★3個
        </div>
      </div>

      <div className="combo-rules-subtitle">【小役】</div>

      <div className="combo-rule-section">
        <div className="combo-rule-header">同じ数字・同じ色の3枚 ★</div>
        <div className="combo-rule-combinations">
          タテ・ヨコ・L字に連なる
        </div>
        <div className="combo-rule-note">
          3枚除去 / 1枚ドロー / ★1個
        </div>
      </div>

      <div className="combo-rule-important">
        ※同じ色で作る！<br />
        ※今置いたカードを入れる！
      </div>
    </div>
  );
}
