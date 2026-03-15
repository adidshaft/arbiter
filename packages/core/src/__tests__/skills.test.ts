import { describe, expect, it } from 'vitest'
import { SKILLS, getSkillById } from '../skills/definitions.js'

describe('skill catalog', () => {
  it('exposes five skills', () => {
    expect(SKILLS).toHaveLength(5)
  })

  it('finds skills by id', () => {
    const skill = getSkillById('bridge-usdt')
    expect(skill?.name).toBe('Bridge USDT')
    expect(skill?.supportedChains).toContain('ARBITRUM')
    expect(getSkillById('missing-skill')).toBeUndefined()
  })
})

