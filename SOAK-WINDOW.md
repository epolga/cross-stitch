# Milestone 5 — Dual-Write Soak Window

7 consecutive days of automatic parity checks before stripping the `fs.writeFileSync` calls. Each morning the cron runs `npm run verify-parity` as the last step of `daily-run.bat`; a non-zero exit lands in `daily-run.log` as `ERROR: parity check failed`.

## Daily log

| Day | Date       | Cron parity | Notes                                                                                                                |
|-----|------------|-------------|----------------------------------------------------------------------------------------------------------------------|
| 0   | 2026-05-23 | ✓ (manual)  | Post-backfill audit: 13 pass, 1 warn (trend@2026-05-21 — confidence=null in source from old max_tokens=1500 truncation), 0 fail |
| 1   | 2026-05-24 | ⏳ pending   | First cron-driven check                                                                                              |
| 2   | 2026-05-25 | ⏳ pending   |                                                                                                                      |
| 3   | 2026-05-26 | ⏳ pending   |                                                                                                                      |
| 4   | 2026-05-27 | ⏳ pending   |                                                                                                                      |
| 5   | 2026-05-28 | ⏳ pending   |                                                                                                                      |
| 6   | 2026-05-29 | ⏳ pending   |                                                                                                                      |
| 7   | 2026-05-30 | ⏳ pending   | If all green, proceed to cutover step (below)                                                                        |

Mark each row as `✓` (passed) or `✗` (failed, with a short root-cause note) after reviewing `daily-run.log` the morning after the cron runs.

## What to verify each morning

1. Open `automation/pinterest-agent/daily-run.log` and scroll to the latest run.
2. Confirm the last lines include `Saved → DDB ...` for each dual-write step and a final `Pipeline complete` line.
3. Look for any `ERROR: parity check failed` line — if present, capture the failure block and tick the day as `✗`.
4. If the run completed but a `⚠` warning surfaced, note it (warnings don't fail the cron — `confidence=null` is the only currently-expected one and applies only to historical days, not new ones).

## What to verify at day 7 (the cutover)

Only proceed if days 1–7 all show `✓`.

- [ ] Re-run `npm run verify-parity` manually one more time to confirm the green streak holds.
- [ ] Read cutover — switch `src/services/historyBuilder.ts` `loadReports` from `fs.readdirSync(reports/)` to `historyStore.queryRange("DAILY_BUSINESS", ...)`. Run `npm run history` and confirm `business-history.json` matches the prior day's content byte-for-byte before deleting any JSON.
- [ ] Strip the JSON writes:
  - `daily-business-report.ts` — remove `fs.writeFileSync(reportPath, ...)`
  - `export-design-pin-map.ts` — remove the JSON write (keep records in memory for the perf step? confirm dependency before deleting)
  - `build-design-performance.ts` — remove the JSON write (check that `test-ai-design-analysis.ts` no longer reads `design-performance.json`; switch it to `queryRange("DESIGN_PERFORMANCE")`)
  - `test-ai-trend-analysis.ts` — remove the local .md / .json / confidence file writes; markdown lives only in S3
  - `test-ai-design-analysis.ts` — same as above; remove `design-insights.{md,json}` writes
- [ ] Update `verify-history-parity.ts` to skip checks that no longer have a JSON side (or delete the script entirely if every input is gone).
- [ ] Remove `verify-parity` from `daily-run.bat` once there's nothing to verify against.
- [ ] Disable the day-7 reminder: `schtasks /Delete /TN MilestoneFiveSoakReminder /F` (created 2026-05-23 to nudge daily at 8:57 AM from 2026-05-30 onward until the cutover lands).
- [ ] Delete `automation/pinterest-agent/soak-reminder.bat`.
- [ ] Remove the "While SOAK-WINDOW.md exists" section from [CLAUDE.md](CLAUDE.md).
- [ ] Delete this file (`SOAK-WINDOW.md`).
- [ ] Mark Milestone 5 complete in [FOCUS.md](FOCUS.md) and [the milestones doc](../cross-stitch-platform-docs/plan/cross-stitch/Pinterest%20AI%20Agent%20%E2%80%94%20Milestones%20and%20Roadmap.md).

## If a parity check fails mid-window

1. Read the failure block — it lists every file that diverged and the specific field(s) that mismatched.
2. Decide whether the diff is a real bug in the dual-write or a benign drift (e.g. a manual edit to a JSON file that wasn't propagated to DDB).
3. If it's a real bug: fix the dual-write, re-run the affected script, re-run `verify-parity`, and **reset the soak counter to day 1** in the daily log table above. The seven-day clock only counts consecutive green days.
4. If it was a benign one-off (rare; document why in the day's Notes column), no reset.

## Related references

- [FOCUS.md](FOCUS.md) — high-level Milestone 5 checklist
- [Milestones and Roadmap.md — Milestone 5](../cross-stitch-platform-docs/plan/cross-stitch/Pinterest%20AI%20Agent%20%E2%80%94%20Milestones%20and%20Roadmap.md) — implementation plan
- [business-history-schema.md](../cross-stitch-platform-docs/plan/integration/business-history-schema.md) — entity shapes that parity is verifying
- `scripts/verify-history-parity.ts` — the verifier itself
- `scripts/backfill-history.ts` — one-shot backfill (already run)
