import type { TrustScore } from '@arbiter/core'
import { getTrustScoreStyle } from '../../lib/formatters'

export default function TrustScoreBadge({ score }: { score: TrustScore }): JSX.Element {
  const style = getTrustScoreStyle(score)
  return <span className={`arbiter-badge ${style.className}`}>{style.label}</span>
}

