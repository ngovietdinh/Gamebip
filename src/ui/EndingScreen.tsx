import { paletteFor } from '../art/palette'
import { Background } from '../art/backgrounds'
import { FogCanvas } from '../art/FogCanvas'
import type { FallacyId } from '../engine/types'
import { registry, useGame } from '../game'
import { AchievementsPanel } from './AchievementsPanel'

export function EndingScreen() {
  const final = useGame((s) => s.final)
  const run = useGame((s) => s.run)
  const startLoop = useGame((s) => s.startLoop)
  const newGame = useGame((s) => s.newGame)
  const toTitle = useGame((s) => s.toTitle)
  if (!final) return null
  const e = registry.content.endings[final.ending]
  const good = final.ending === 'good'
  const p = paletteFor(good ? 'sang' : final.ending === 'loop' ? 'toi' : 'chieu')
  const accused = registry.characters[final.accused]

  const groups = new Map<FallacyId, number>()
  for (const m of run.mistakes) groups.set(m.fallacy, (groups.get(m.fallacy) ?? 0) + 1)

  return (
    <div className={`ending ending-${final.ending}`}>
      <div className="ending-bg">
        <Background art={good ? 'ferry' : final.ending === 'loop' ? 'market' : 'riverbank'} p={p} />
        <FogCanvas density={good ? 0.12 : 0.8} color={p.fog} />
      </div>
      <div className="ending-scroll">
        <article className="ending-card">
          <div className="card-kicker">{e.kicker}</div>
          <h1>{e.title}</h1>
          {e.paragraphs.map((para, i) => (
            <p key={i} className="ending-p" style={{ animationDelay: `${0.4 + i * 0.6}s` }}>
              {para}
            </p>
          ))}

          <section className="summary">
            <h3>Tổng kết</h3>
            <dl>
              <dt>Người bị buộc tội</dt>
              <dd>{accused?.name ?? final.accused}</dd>
              <dt>Bằng chứng hợp lệ</dt>
              <dd>
                {final.validCount} / {final.evidence.length} đã chọn
              </dd>
              <dt>Điểm Tỉnh táo</dt>
              <dd>{run.sanity}/100</dd>
              <dt>Số lần bị lừa</dt>
              <dd>{run.mistakes.length}</dd>
              {run.loop > 1 && (
                <>
                  <dt>Số lần tỉnh dậy ở chợ phiên</dt>
                  <dd>{run.loop}</dd>
                </>
              )}
              {!!run.flags['deadline_passed'] && (
                <>
                  <dt>Kết ẩn</dt>
                  <dd>Bạn đã ở lại qua "hạn chót" — và chẳng có gì xảy ra.</dd>
                </>
              )}
            </dl>

            <h3>Các lỗi tư duy đã mắc</h3>
            {groups.size === 0 ? (
              <p className="muted">Không mắc lỗi nào. Sương chẳng lừa được bạn.</p>
            ) : (
              <ul className="fallacy-summary">
                {[...groups.entries()].map(([f, n]) => (
                  <li key={f}>
                    <strong>
                      {registry.fallacies[f].name} × {n}
                    </strong>
                    <span>{registry.fallacies[f].short}</span>
                    <details>
                      <summary>Xem lại</summary>
                      {run.mistakes
                        .filter((m) => m.fallacy === f)
                        .map((m, i) => (
                          <div key={i} className="mistake-recap">
                            <em>
                              {m.at.label}
                              {m.at.loop > 1 ? ` · lần ${m.at.loop}` : ''}
                            </em>
                            <p>{m.explain.split('\n\n')[0]}</p>
                            <p className="missed-inline">Manh mối bỏ lỡ: {m.missed}</p>
                          </div>
                        ))}
                    </details>
                  </li>
                ))}
              </ul>
            )}

            <h3>Thành tựu</h3>
            <AchievementsPanel highlight={run.achievements} />
          </section>

          <div className="ending-actions">
            {final.ending === 'loop' ? (
              <button className="btn primary big" onClick={startLoop}>
                Mở mắt (lần thứ {run.loop + 1})
              </button>
            ) : (
              <button className="btn primary big" onClick={newGame}>
                Chơi lại
              </button>
            )}
            <button className="btn ghost" onClick={toTitle}>
              Về màn hình chính
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}
