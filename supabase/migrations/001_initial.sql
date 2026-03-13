create table if not exists agents (
  id text primary key,
  name text not null,
  role text not null,
  status text not null,
  config jsonb not null,
  credit_score integer not null default 500,
  wallets jsonb not null default '{}'::jsonb,
  encrypted_seed text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contract_trust_records (
  id text primary key,
  contract_address text not null,
  chain_key text not null,
  score text not null,
  confidence double precision not null,
  reasons jsonb not null,
  raw_analysis text not null,
  is_proxy boolean not null default false,
  contract_age integer not null default 0,
  last_volume_usd double precision not null default 0,
  has_verified_source boolean not null default false,
  scored_at timestamptz not null,
  refresh_trigger text,
  unique (contract_address, chain_key)
);

create table if not exists loans (
  id text primary key,
  request_id text not null,
  lender_agent_id text not null references agents(id) on delete cascade,
  borrower_agent_id text not null references agents(id) on delete cascade,
  principal double precision not null,
  interest_rate double precision not null,
  interest_amount double precision not null,
  total_repayment double precision not null,
  chain_key text not null,
  target_contract text not null,
  trust_score text not null,
  status text not null,
  lender_tx_hash text,
  borrower_tx_hash text,
  bridge_tx_hash text,
  is_cross_chain boolean not null default false,
  lender_chain_key text,
  created_at timestamptz not null,
  disbursed_at timestamptz,
  repaid_at timestamptz,
  due_at timestamptz not null
);

create table if not exists credit_history (
  agent_id text primary key references agents(id) on delete cascade,
  total_loans integer not null,
  successful_repayments integer not null,
  defaulted_loans integer not null,
  total_borrowed double precision not null,
  total_repaid double precision not null,
  average_repayment_days double precision not null,
  score integer not null,
  last_updated timestamptz not null
);

create table if not exists agent_balances (
  id text primary key,
  agent_id text not null references agents(id) on delete cascade,
  chain_key text not null,
  address text not null,
  usdt_human text not null,
  usdt_raw text not null,
  native_human text not null,
  updated_at timestamptz not null,
  unique (agent_id, chain_key)
);

create table if not exists skill_executions (
  execution_id text primary key,
  skill_id text not null,
  agent_id text not null references agents(id) on delete cascade,
  chain_key text not null,
  status text not null,
  input jsonb not null,
  output jsonb,
  error text,
  tx_hash text,
  started_at timestamptz not null,
  completed_at timestamptz
);

create table if not exists alerts (
  id text primary key,
  type text not null,
  severity text not null,
  agent_id text not null references agents(id) on delete cascade,
  message text not null,
  metadata jsonb,
  dismissed boolean not null default false,
  created_at timestamptz not null
);

create table if not exists orchestrator_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  timestamp timestamptz not null
);

create index if not exists idx_agents_role on agents(role);
create index if not exists idx_agents_status on agents(status);
create index if not exists idx_trust_chain_score on contract_trust_records(chain_key, score);
create index if not exists idx_loans_status on loans(status);
create index if not exists idx_loans_borrower on loans(borrower_agent_id);
create index if not exists idx_balances_agent on agent_balances(agent_id);
create index if not exists idx_skills_agent on skill_executions(agent_id);
create index if not exists idx_alerts_agent on alerts(agent_id);
create index if not exists idx_events_timestamp on orchestrator_events(timestamp desc);

create or replace function set_agents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_agents_updated_at on agents;
create trigger trg_agents_updated_at
before update on agents
for each row
execute function set_agents_updated_at();
