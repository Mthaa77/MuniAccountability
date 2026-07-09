-- Workflow persistence schema for AGSA review decisions, production gate reviews
-- and draft remediation actions.
-- This migration is provider-neutral PostgreSQL SQL. Apply it only after tenant and
-- authentication strategy are selected for the hosted environment.

create table if not exists workflow_review_decisions (
  decision_key text primary key,
  tenant_id text not null default 'prototype',
  document_id text not null,
  page_number integer not null,
  issue text not null,
  status text not null check (status in ('accepted', 'correction', 'excluded')),
  reviewer text not null,
  decided_at timestamptz not null,
  citation_ids jsonb not null default '[]'::jsonb,
  rationale text,
  replacement_text text,
  replacement_field text,
  replacement_value text,
  source_store_schema text not null default 'agsa-review-decisions-v0.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflow_review_decisions_document_idx
  on workflow_review_decisions (tenant_id, document_id, page_number);

create table if not exists workflow_production_gate_reviews (
  decision_key text primary key,
  tenant_id text not null default 'prototype',
  gate_id text not null check (
    gate_id in (
      'mfma_annexure_mapping',
      'treasury_financial_pulse_unlock',
      'durable_workflow_store'
    )
  ),
  status text not null check (status in ('accepted', 'needs_correction', 'excluded')),
  reviewer text not null,
  decided_at timestamptz not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  rationale text,
  correction_required text,
  source_store_schema text not null default 'production-gate-reviews-v0.1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflow_production_gate_reviews_gate_idx
  on workflow_production_gate_reviews (tenant_id, gate_id, status);

create table if not exists workflow_draft_actions (
  id text primary key,
  tenant_id text not null default 'prototype',
  municipality_id text not null,
  title text not null,
  linked_finding text,
  owner text not null,
  reviewer text not null,
  assigned_to text,
  due_date date,
  status text not null check (
    status in (
      'not_started',
      'in_progress',
      'evidence_submitted',
      'under_review',
      'approved',
      'rejected',
      'overdue',
      'escalated',
      'closed_with_residual_risk'
    )
  ),
  required_evidence jsonb not null default '[]'::jsonb,
  escalation_rule text,
  source_refs jsonb not null default '[]'::jsonb,
  source_queue_item_id text,
  source_finding_id text,
  evidence_attachments jsonb not null default '[]'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  closure_note text,
  residual_risk text,
  source_store_schema text not null default 'draft-actions-v0.1',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists workflow_draft_actions_municipality_idx
  on workflow_draft_actions (tenant_id, municipality_id, status);

create table if not exists workflow_persistence_migrations (
  id text primary key,
  tenant_id text not null default 'prototype',
  source_provider text not null,
  target_provider text not null,
  source_snapshot jsonb not null,
  row_counts jsonb not null,
  parity_checks jsonb not null,
  generated_at timestamptz not null,
  applied_at timestamptz,
  applied_by text
);
