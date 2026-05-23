# FOCUS

> Claude re-reads this file periodically (via `/loop`) to stay on task during long sessions.
> Edit the sections below — they take effect on the next loop tick, no restart needed.

## Current goal
Continue **Milestone 5 — DynamoDB historical-memory layer**. The storage layer, IAM, schema contract, and DDB/S3 wrappers shipped on 2026-05-22.

**Next subtask: wire dual-writes into the daily scripts (Step 5 of the M5 implementation plan).** Start with `daily-business-report.ts` → `historyStore.putDailyBusiness`, get one clean daily run end-to-end (JSON + DDB), then move to the rest.

Reference docs:
- [Milestones and Roadmap.md → Milestone 5](plan/Pinterest%20AI%20Agent%20%E2%80%94%20Milestones%20and%20Roadmap.md) — 13-step implementation plan.
- [business-history-schema.md](../cross-stitch-platform-docs/plan/integration/business-history-schema.md) — v1 schema contract, source of truth for entity shapes. §5.1 documents the agent-vs-admin credential split.
- Saved memory: `aws-iam-setup` (refreshed with the M5 policies), `aws-env-var-conflict` (defensive pattern for admin scripts), `feedback-no-unsolicited-suggestions`, `verify-ai-claims-panda-case`.

## Done when
- [x] IAM policies created and attached. `CrossStitch-Agents` gained `CrossStitch-BusinessHistory-Write` + `CrossStitch-AIReports-Write` (scoped to `analysis/*`). `CrossStitch-Developers` gained `CrossStitch-BusinessHistory-Admin`. Decided 2026-05-22 in favor of group-attached customer-managed policies rather than a separate `pinterest-agent-writer` user.
- [x] Schema designed and contracted: [`plan/integration/business-history-schema.md`](../cross-stitch-platform-docs/plan/integration/business-history-schema.md) v1 (platform-docs commit `b363726`). Five entity families: `DAILY_BUSINESS`, `AI_ANALYSIS` (folds trend + design under an `analysisType` discriminator), `DESIGN_PIN_MAP`, `DESIGN_PERFORMANCE`, `ANOMALY_EVENT`. No GSIs in v1.
- [x] Storage created: `CrossStitchBusinessHistory` DynamoDB table (PAY_PER_REQUEST, deletion protection, PITR) and `cross-stitch-ai-reports` S3 bucket (SSE-S3, block-public-access). Idempotent `npm run init` script — cross-stitch commit `f1f8999`.
- [x] DDB and S3 wrappers shipped: `src/services/historyStore.ts` and `src/services/aiArtifactStore.ts` — cross-stitch commit `e9c8b01`. Smoke-tested at import + sortKey level; not yet exercised against the real table.
- [ ] **Dual-write into the daily scripts (Step 5)** — add DDB writes alongside the existing `fs.writeFileSync` calls. JSON stays as the on-disk debug artifact during the soak window.
  - [x] `daily-business-report.ts` → `putDailyBusiness` (commit `9313b1d`, 2026-05-22; verified DAILY_BUSINESS#2026-05-21 via queryRange)
  - [x] `export-design-pin-map.ts` → `batchPutDesignPinMap` (commit `be8c807`, 2026-05-23; 63 rows written + verified via queryRange — count and first/last records match the JSON snapshot)
  - [x] `build-design-performance.ts` → `batchPutDesignPerformance` (commit `64a8df9`, 2026-05-23; 63 rows × snapshotDate 2026-05-22; totals match the JSON snapshot — imp=46712, clk=1112, outbound=55, saves=347)
  - [x] `test-ai-trend-analysis.ts` → `putMarkdown` + `putAiAnalysis` (commit `99fb854`, 2026-05-23; AI_ANALYSIS#2026-05-23T04:50:29.078Z#trend + S3 analysis/2026-05-22/...-trend.md verified end-to-end via queryRange + getMarkdown. Bumped `max_tokens` 1500→3000 to keep the confidence JSON block from truncating)
  - [x] `test-ai-design-analysis.ts` → `putMarkdown` + `putAiAnalysis` (commit `d81c2f4`, 2026-05-23; AI_ANALYSIS#2026-05-23T04:57:47.783Z#design + S3 analysis/2026-05-22/...-design.md verified end-to-end via queryRange + getMarkdown — topAlbums/underperformingAlbums/designDirectionsToCreate/sourceWindow all round-trip)
  - [ ] `build-recommendation-history.ts` — re-evaluate; it currently *summarizes* `ai-recommendations-history.json` rather than writing it, so it may not need a dual-write at all.
- [ ] Backfill script — `scripts/backfill-history.ts` walks every existing `reports/*.json` + AI markdown into DDB/S3. Idempotent.
- [ ] Parity verifier — `scripts/verify-history-parity.ts` daily diff during the soak window.
- [ ] Read cutover — `historyBuilder.loadReports` → `historyStore.queryRange`.
- [ ] One-week dual-write soak with daily parity check.
- [ ] Strip the `fs.writeFileSync` calls; markdown lives only in S3 after this.
- [ ] Anomaly detector — `src/services/anomalyDetector.ts` writing `ANOMALY_EVENT` rows after `npm run history`. Notifications deferred to Milestone 8.
- [ ] End-to-end verified: one day's data flows APIs → DDB → AI analysis without local JSON being the source of truth.

## Out of scope (do NOT do, even if tempting)
- Starting Milestone 7 (Lambda + EventBridge) before Milestone 5 ships.
- Migrating credentials to Secrets Manager (belongs to the AWS migration milestone).
- Restructuring the existing local JSON formats — they stay as debug artifacts during the soak window. Schema design is for the new DynamoDB layer only.
- Adding new pipeline steps beyond what's already in `daily-run.bat`.
- Adding GSIs to `CrossStitchBusinessHistory`. The schema commits to "v1 = no GSIs". Only add when a real query demands one.

## Working style for this session
- Verify before recommending: re-read each script before editing it. The wrappers landed today; the API may surprise you on second look (e.g. `putAiAnalysis` takes domain fields and builds the SortKey internally — don't pass `SortKey` from the caller).
- For dual-write: **add the DDB write next to the existing `fs.writeFileSync` — don't replace it**. JSON stays as the on-disk debug artifact until the parity-verified soak window ends.
- Ask Olga which script to start with rather than picking unilaterally. The natural order is `daily-business-report` first, but she may want to batch differently.
- Finish the asked task and stop. See saved memory `feedback-no-unsolicited-suggestions`.
- When AI claims something causal about the data, verify against raw records before relaying. See saved memory `verify-ai-claims-panda-case`.

## Drift checks
<!-- Questions I should ask myself when re-reading this file. -->
- Am I still working on the **Current goal**, or did I wander?
- Have I started anything in **Out of scope**? If so, stop and back out.
- Is anything in **Done when** finished? If so, mark it and tell Olga.
- Is the goal itself stale? If so, flag it — don't silently invent a new one.

---
_Last edited by Olga (via Claude Opus 4.7): 2026-05-22 — closed IAM + schema + storage init + wrappers. Tomorrow starts dual-write._
