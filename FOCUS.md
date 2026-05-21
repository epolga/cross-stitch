# FOCUS

> Claude re-reads this file periodically (via `/loop`) to stay on task during long sessions.
> Edit the sections below — they take effect on the next loop tick, no restart needed.

## Current goal
Start **Milestone 5 — DynamoDB historical-memory layer**. Reminder set the evening of 2026-05-21 for the next working session (planned 2026-05-22). On reading this, greet Olga, surface the four starting tasks below, and ask which she wants to tackle first.

Reference docs: [Milestones and Roadmap.md → Milestone 5](plan/Pinterest%20AI%20Agent%20%E2%80%94%20Milestones%20and%20Roadmap.md), [Memory and Trend Analysis.md → Milestone 8 (schema names)](plan/Pinterest%20AI%20Agent%20%E2%80%94%20Memory%20and%20Trend%20Analysis.md), saved memory entry `aws-iam-setup` for the least-privilege pattern.

## Done when
- [ ] IAM extension approach chosen (extend `pinterest-agent` read-only policy with writes on new analytics tables, **or** create a separate `pinterest-agent-writer` user). Least-privilege pattern recommends the first option.
- [ ] DynamoDB schemas designed for: `DailyBusinessReport`, `BusinessHistorySnapshot`, `AITrendRecommendation`, `DesignPinMap`, `DesignPerformance`, `AIDesignInsight`.
- [ ] Daily scripts wired to dual-write (keep local JSON as debug/archive; also persist to DynamoDB): `daily`, `history`, `ai:trend`, `pinmap`, `perf`, `ai:design`.
- [ ] Anomaly detection added on top of the trend layer (second pending piece of Milestone 5).
- [ ] End-to-end verified: one day's data flows from APIs → DynamoDB → AI analysis without local JSON being the source of truth.

## Out of scope (do NOT do, even if tempting)
- Starting Milestone 7 (Lambda + EventBridge) before Milestone 5 schemas stabilize — that's the documented sequence.
- Migrating credentials to Secrets Manager (belongs to the AWS migration milestone).
- Restructuring the existing local JSON formats — they stay as debug artifacts; schema design is for the new DynamoDB layer.
- Adding new pipeline steps beyond what's already in `daily-run.bat`.

## Working style for this session
- Verify before recommending: re-read each script and its current output shape before proposing a schema. Don't assume nothing changed overnight.
- Ask Olga which subtask to start with (IAM, schema design, or wiring) rather than picking unilaterally.
- Finish the asked task and stop — see saved memory `feedback-no-unsolicited-suggestions`.
- When AI claims something causal about the data, verify against raw records before relaying — see saved memory `verify-ai-claims-panda-case`.

## Drift checks
<!-- Questions I should ask myself when re-reading this file. -->
- Am I still working on the **Current goal**, or did I wander?
- Have I started anything in **Out of scope**? If so, stop and back out.
- Is anything in **Done when** finished? If so, mark it and tell Olga.
- Is the goal itself stale? If so, flag it — don't silently invent a new one.

---
_Last edited by Olga (via Claude): 2026-05-21 evening — set the Milestone 5 reminder for next session_
