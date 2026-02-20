import { Link } from 'react-router-dom'
import zentaiImg from '../assets/zentai.png'
import tefudaImg from '../assets/tefuda.png'
import daiyakuImg from '../assets/daiyaku.png'
import koyakuImg from '../assets/koyaku.png'
import './Manual.css'

export function Manual() {
  return (
    <div className="manual-container">
      <header className="manual-header">
        <div className="manual-header-inner">
          <Link to="/" className="manual-back">← トップへ</Link>
          <h1>SquFibo ゲームルール</h1>
          <p className="manual-subtitle">すくふぃぼ の遊びかた</p>
        </div>
      </header>

      <main className="manual-main">

        {/* 1. ゲームの概要 */}
        <section className="manual-section">
          <h2><span className="section-num">1</span> ゲームの概要</h2>
          <p>
            SquFibo（すくふぃぼ）は、<strong>2人で楽しめるカードゲーム</strong>です。
            数字と色が書かれたカードを3×3のボードに並べて「役（やく）」を作り、
            <strong>星（★）をたくさん集めたほうが勝ち</strong>です！
          </p>
          <p>
            物理的なカードとボードで遊ぶこともできますし、Webブラウザでもオンライン対戦ができます。
          </p>
          <img src={zentaiImg} alt="ゲームボード全体の様子" className="manual-screenshot" />
        </section>

        {/* 2. 用意するもの */}
        <section className="manual-section">
          <h2><span className="section-num">2</span> 用意するもの</h2>

          <h3>カード（合計42枚）</h3>
          <p>カードには「数字」と「色」の2つの情報があります。数字は 1・4・9・16 の4種類、色は赤と青の2種類です。</p>
          <div className="card-table-wrapper">
            <table className="card-table">
              <thead>
                <tr>
                  <th>数字</th>
                  <th>🔴 赤</th>
                  <th>🔵 青</th>
                  <th>合計</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1</strong></td>
                  <td>4枚</td>
                  <td>4枚</td>
                  <td>8枚</td>
                </tr>
                <tr>
                  <td><strong>4</strong></td>
                  <td>4枚</td>
                  <td>4枚</td>
                  <td>8枚</td>
                </tr>
                <tr className="highlight-row">
                  <td><strong>9</strong></td>
                  <td>9枚</td>
                  <td>9枚</td>
                  <td>18枚</td>
                </tr>
                <tr>
                  <td><strong>16</strong></td>
                  <td>4枚</td>
                  <td>4枚</td>
                  <td>8枚</td>
                </tr>
                <tr className="total-row">
                  <td>合計</td>
                  <td>21枚</td>
                  <td>21枚</td>
                  <td>42枚</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>その他</h3>
          <ul>
            <li>3×3のボード（9マスのグリッド）</li>
            <li>星トークン 21個（コインや小石でも代用できます）</li>
          </ul>

          <div className="info-box">
            <strong>物理ボードゲームを手作りする場合：</strong><br />
            厚紙に数字と色を書いてカードを作りましょう。ボードは方眼紙やノートの升目でも大丈夫です。
            星トークンの代わりに、コイン・ボタン・小石なども使えます。
          </div>
        </section>

        {/* 3. ゲームの準備 */}
        <section className="manual-section">
          <h2><span className="section-num">3</span> ゲームの準備</h2>
          <ol className="step-list">
            <li>42枚のカードをよくシャッフルして、山札（やまふだ）として中央に置きます。</li>
            <li>2人のプレイヤーがそれぞれ山札から <strong>8枚</strong> 引いて手札にします。</li>
            <li>3×3のボードを2人の間に置きます。</li>
            <li>星トークン21個を脇に置きます。</li>
            <li>どちらが先攻（さきこう）か決めます。</li>
          </ol>
        </section>

        {/* 4. ターンの流れ */}
        <section className="manual-section">
          <h2><span className="section-num">4</span> 1ターンの流れ</h2>
          <p>先攻のプレイヤーから始めて、交互にターンを行います。1回のターンは次の手順で進めます。</p>

          <div className="turn-flow">
            <div className="turn-step">
              <div className="step-badge">①</div>
              <div className="step-content">
                <strong>ボードがいっぱいなら、カードを1枚取り除く</strong>
                <p>ボードの9マスがすべて埋まっている場合、ボード上のカード1枚を選んで取り除きます（山札には戻りません）。</p>
                <p>9マス全部が埋まっていない場合は、この手順はスキップします。</p>
              </div>
            </div>

            <div className="turn-step">
              <div className="step-badge">②</div>
              <div className="step-content">
                <strong>手札から1枚選び、ボードに置く</strong>
                <p>手札から好きな1枚を選び、ボードの空いているマスに置きます。</p>
                <p className="note">※ 手札がない場合は、山札から1枚引いてそのままボードに置きます。</p>
              </div>
            </div>

            <div className="turn-step">
              <div className="step-badge">③</div>
              <div className="step-content">
                <strong>役（やく）を宣言する</strong>
                <p>今置いたカードを含む「役」が成立していれば宣言します。役の条件は次のセクションで説明します。</p>
              </div>
            </div>

            <div className="turn-step">
              <div className="step-badge">④</div>
              <div className="step-content">
                <strong>報酬を受け取る</strong>
                <p>役が成立していれば、役の3枚がボードから取り除かれ、山札から決められた枚数を手札に引き、星を獲得します。</p>
              </div>
            </div>

            <div className="turn-step">
              <div className="step-badge">⑤</div>
              <div className="step-content">
                <strong>相手のターンへ</strong>
                <p>相手プレイヤーのターンになります。</p>
              </div>
            </div>
          </div>

          <img src={tefudaImg} alt="手札からカードを選んでボードに置く場面" className="manual-screenshot" />
        </section>

        {/* 5. 役の作り方 */}
        <section className="manual-section">
          <h2><span className="section-num">5</span> 役（やく）の作り方</h2>

          <p>
            役を作るには、<strong>隣り合う3枚のカード</strong>で条件を満たす必要があります。
            「隣り合う」とは、縦・横・またはL字型に並んでいることです。
            ななめ（対角線）には隣り合いません。
          </p>

          <div className="adjacency-diagram">
            <div className="diagram-label">隣り合う例（青＝役のカード、灰＝空きマス）</div>
            <div className="diagrams">
              <div className="diagram">
                <div className="diagram-title">横3つ ✅</div>
                <div className="grid-3x3">
                  <div className="cell combo">○</div><div className="cell combo">○</div><div className="cell combo">○</div>
                  <div className="cell empty">　</div><div className="cell empty">　</div><div className="cell empty">　</div>
                  <div className="cell empty">　</div><div className="cell empty">　</div><div className="cell empty">　</div>
                </div>
              </div>
              <div className="diagram">
                <div className="diagram-title">縦3つ ✅</div>
                <div className="grid-3x3">
                  <div className="cell combo">○</div><div className="cell empty">　</div><div className="cell empty">　</div>
                  <div className="cell combo">○</div><div className="cell empty">　</div><div className="cell empty">　</div>
                  <div className="cell combo">○</div><div className="cell empty">　</div><div className="cell empty">　</div>
                </div>
              </div>
              <div className="diagram">
                <div className="diagram-title">L字型 ✅</div>
                <div className="grid-3x3">
                  <div className="cell combo">○</div><div className="cell combo">○</div><div className="cell empty">　</div>
                  <div className="cell combo">○</div><div className="cell empty">　</div><div className="cell empty">　</div>
                  <div className="cell empty">　</div><div className="cell empty">　</div><div className="cell empty">　</div>
                </div>
              </div>
              <div className="diagram">
                <div className="diagram-title">ななめ ❌</div>
                <div className="grid-3x3">
                  <div className="cell combo">○</div><div className="cell empty">　</div><div className="cell empty">　</div>
                  <div className="cell empty">　</div><div className="cell combo">○</div><div className="cell empty">　</div>
                  <div className="cell empty">　</div><div className="cell empty">　</div><div className="cell combo">○</div>
                </div>
              </div>
            </div>
          </div>

          <h3>大役（だいやく）― 星★★★ 3つ獲得</h3>
          <div className="combo-card combo-big">
            <div className="combo-condition">
              条件：同じ色の「1」「4」「16」が隣り合う
            </div>
            <div className="combo-reward">
              報酬：役の3枚をボードから取り除き、山札から <strong>3枚</strong> 手札に引く ＋ <strong>星3つ</strong> 獲得
            </div>
            <div className="combo-example">
              例：赤の「1」・赤の「4」・赤の「16」がL字型に並んでいれば大役成立！
            </div>
          </div>

          <img src={daiyakuImg} alt="大役（1・4・16）が成立している画面" className="manual-screenshot manual-screenshot--small" />

          <h3>小役（こやく）― 星★ 1つ獲得</h3>
          <div className="combo-card combo-small">
            <div className="combo-condition">
              条件：同じ色・同じ数字のカードが3枚隣り合う
            </div>
            <div className="combo-reward">
              報酬：役の3枚をボードから取り除き、山札から <strong>1枚</strong> 手札に引く ＋ <strong>星1つ</strong> 獲得
            </div>
            <div className="combo-example">
              例：青の「9」が横に3枚並んでいれば小役成立！
            </div>
          </div>

          <img src={koyakuImg} alt="小役（同じ数字3枚）が成立している画面" className="manual-screenshot manual-screenshot--small" />

          <div className="info-box">
            <strong>ポイント：</strong> 役を成立させると山札からカードを補充できます。
            役を作れると手札が増え、次のターンで有利になります！
          </div>
        </section>

        {/* 6. ゲームの終わり */}
        <section className="manual-section">
          <h2><span className="section-num">6</span> ゲームの終わり・勝敗</h2>

          <p>次のどちらかになったらゲーム終了です：</p>
          <ul>
            <li>星が <strong>21個すべて</strong> 配り終わった</li>
            <li><strong>山札がなくなった</strong></li>
          </ul>

          <div className="winner-box">
            🏆 <strong>勝敗：</strong> 星をより多く持っているプレイヤーの勝ちです！<br />
            星の数が同じ場合は <strong>引き分け</strong> です。
          </div>
        </section>

        {/* 7. Web版での遊び方 */}
        <section className="manual-section">
          <h2><span className="section-num">7</span> Webブラウザ版での操作方法</h2>

          <ol>
            <li>手札のカードをクリック（またはタップ）して選ぶ</li>
            <li>ボードの置きたいマスをクリックして配置する</li>
            <li>役が成立した場合は、宣言ボタンを押して確定する</li>
          </ol>

        </section>

      </main>

      <footer className="manual-footer">
        <Link to="/" className="btn btn-primary">トップページに戻る</Link>
        <p>&copy; 2026 SquFibo Game</p>
      </footer>
    </div>
  )
}
