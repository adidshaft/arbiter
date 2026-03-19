import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseArgs } from './_shared.mjs'

const TABLES = [
  'contract_trust_records',
  'credit_history',
  'agent_balances',
  'skill_executions',
  'orchestrator_events',
  'alerts',
  'loans',
  'agents',
]

function escapeReplacement(value) {
  return value.replace(/\$/g, '$$$$')
}

function renderPrefixedSql(source, prefix) {
  if (prefix.length === 0) {
    return source
  }

  let rendered = source

  for (const table of TABLES) {
    rendered = rendered.replace(new RegExp(`\\b${table}\\b`, 'g'), escapeReplacement(`${prefix}${table}`))
  }

  rendered = rendered.replace(/\bset_agents_updated_at\b/g, escapeReplacement(`${prefix}set_agents_updated_at`))
  rendered = rendered.replace(/\btrg_agents_updated_at\b/g, escapeReplacement(`${prefix}trg_agents_updated_at`))
  rendered = rendered.replace(/\bidx_agents_role\b/g, escapeReplacement(`${prefix}idx_agents_role`))
  rendered = rendered.replace(/\bidx_agents_status\b/g, escapeReplacement(`${prefix}idx_agents_status`))
  rendered = rendered.replace(/\bidx_trust_chain_score\b/g, escapeReplacement(`${prefix}idx_trust_chain_score`))
  rendered = rendered.replace(/\bidx_loans_status\b/g, escapeReplacement(`${prefix}idx_loans_status`))
  rendered = rendered.replace(/\bidx_loans_borrower\b/g, escapeReplacement(`${prefix}idx_loans_borrower`))
  rendered = rendered.replace(/\bidx_balances_agent\b/g, escapeReplacement(`${prefix}idx_balances_agent`))
  rendered = rendered.replace(/\bidx_skills_agent\b/g, escapeReplacement(`${prefix}idx_skills_agent`))
  rendered = rendered.replace(/\bidx_alerts_agent\b/g, escapeReplacement(`${prefix}idx_alerts_agent`))
  rendered = rendered.replace(/\bidx_events_timestamp\b/g, escapeReplacement(`${prefix}idx_events_timestamp`))

  return rendered
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const prefix = typeof args.prefix === 'string' ? args.prefix : process.env.SUPABASE_TABLE_PREFIX ?? 'arbiter_'
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(scriptDirectory, '../../..')
  const sourcePath = path.resolve(scriptDirectory, '../../../supabase/migrations/001_initial.sql')
  const outputPath = typeof args.out === 'string' ? path.resolve(repoRoot, args.out) : null
  const source = fs.readFileSync(sourcePath, 'utf8')
  const rendered = renderPrefixedSql(source, prefix)

  if (outputPath) {
    fs.writeFileSync(outputPath, rendered)
    console.log(`Wrote ${outputPath}`)
    return
  }

  process.stdout.write(rendered)
}

main()
