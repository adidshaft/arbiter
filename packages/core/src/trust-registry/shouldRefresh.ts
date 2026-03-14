import type { ContractTrustRecord } from '../types/index.js'

export interface RefreshOptions {
  now?: Date
  staleThresholdHours?: number
  unverifiedThresholdHours?: number
  volumeSpikeMultiplier?: number
  currentVolumeUsd?: number
}

const HOURS_TO_MS = 60 * 60 * 1000

const ageInHours = (now: Date, then: Date): number => (now.getTime() - then.getTime()) / HOURS_TO_MS

export function shouldRefresh(record: ContractTrustRecord, options: RefreshOptions = {}): boolean {
  const now = options.now ?? new Date()
  const staleThresholdHours = options.staleThresholdHours ?? 24
  const unverifiedThresholdHours = options.unverifiedThresholdHours ?? 6
  const volumeSpikeMultiplier = options.volumeSpikeMultiplier ?? 3

  if (ageInHours(now, record.scoredAt) > staleThresholdHours) {
    return true
  }

  if (!record.hasVerifiedSource && ageInHours(now, record.scoredAt) > unverifiedThresholdHours) {
    return true
  }

  if (typeof options.currentVolumeUsd === 'number' && options.currentVolumeUsd > 0) {
    const lastVolume = Math.max(record.lastVolumeUsd, 0)
    if (lastVolume === 0) {
      return options.currentVolumeUsd > 0
    }

    if (options.currentVolumeUsd > lastVolume * volumeSpikeMultiplier) {
      return true
    }
  }

  return false
}

