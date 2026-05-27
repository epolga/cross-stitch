import "dotenv/config";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { yesterdayDateStr } from "../src/services/dateUtils";
import { putMarkdown } from "../src/services/aiArtifactStore";
import { putAiAnalysis } from "../src/services/historyStore";

interface DesignPerformance {
  designId: number;
  albumId: number;
  albumCaption: string;
  pinId: string;
  designCaption: string;
  designUrl: string;
  impressions: number;
  clicks: number;
  outboundClicks: number;
  ctr: number;
  saves: number;
  error?: string;
}

interface PerformanceFile {
  generatedAt: string;
  window: { label: string; startDate: string; endDate: string };
  totalPins: number;
  successCount: number;
  errorCount: number;
  designs: DesignPerformance[];
}

interface AlbumAggregate {
  albumId: number;
  albumCaption: string;
  designCount: number;
  impressions: number;
  clicks: number;
  outboundClicks: number;
  saves: number;
  avgImpressionsPerDesign: number;
  ctr: number;
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey || apiKey === "your-key-here") {
  console.error("Set ANTHROPIC_API_KEY in .env");
  process.exit(1);
}

function aggregateByAlbum(designs: DesignPerformance[]): AlbumAggregate[] {
  const byAlbum = new Map<number, AlbumAggregate>();
  for (const d of designs) {
    if (d.error) continue;
    let agg = byAlbum.get(d.albumId);
    if (!agg) {
      agg = {
        albumId: d.albumId,
        albumCaption: d.albumCaption || "(unknown)",
        designCount: 0,
        impressions: 0,
        clicks: 0,
        outboundClicks: 0,
        saves: 0,
        avgImpressionsPerDesign: 0,
        ctr: 0,
      };
      byAlbum.set(d.albumId, agg);
    }
    agg.designCount++;
    agg.impressions += d.impressions;
    agg.clicks += d.clicks;
    agg.outboundClicks += d.outboundClicks;
    agg.saves += d.saves;
  }
  for (const agg of byAlbum.values()) {
    agg.avgImpressionsPerDesign =
      agg.designCount > 0 ? Math.round(agg.impressions / agg.designCount) : 0;
    agg.ctr =
      agg.impressions > 0
        ? Math.round((agg.clicks / agg.impressions) * 100000) / 100000
        : 0;
  }
  return [...byAlbum.values()].sort((a, b) => b.impressions - a.impressions);
}

async function main() {
  const perfPath = path.join(process.cwd(), "reports", "design-performance.json");
  if (!fs.existsSync(perfPath)) {
    console.error("design-performance.json not found. Run `npm run perf` first.");
    process.exit(1);
  }

  const perf: PerformanceFile = JSON.parse(fs.readFileSync(perfPath, "utf-8"));
  const albumAggregates = aggregateByAlbum(perf.designs);

  const designSummary = perf.designs
    .filter((d) => !d.error)
    .map((d) => ({
      designId: d.designId,
      albumCaption: d.albumCaption,
      designCaption: d.designCaption,
      impressions: d.impressions,
      clicks: d.clicks,
      outboundClicks: d.outboundClicks,
      ctr: d.ctr,
      saves: d.saves,
    }))
    .sort((a, b) => b.impressions - a.impressions);

  const summary = {
    window: perf.window,
    totalDesignsWithPins: perf.successCount,
    albumAggregates,
    designs: designSummary,
  };

  const prompt = `You are a content strategy analyst for a cross-stitch pattern website. The site sells nothing directly — it monetizes via AdSense, and traffic comes mostly from Pinterest. You're analyzing organic Pinterest pin performance to recommend which design types Olga should create more of.

Important context:
- Only ${perf.successCount} of ${perf.totalPins} designs have pin IDs. Olga only started pinning a few months ago, so the sample is small and skewed toward recent designs.
- "Album" is the current theme categorization (e.g. Cats, Birds, Bookmarks). It is a temporary stand-in for richer themes / styles.
- Some albums have many designs, some have just 1-2 — be honest about statistical significance.
- Window: ${perf.window.startDate} to ${perf.window.endDate} (${perf.window.label}).

Performance data:

${JSON.stringify(summary, null, 2)}

Answer three questions, with numbers from the data backing every claim:

1. **Which design themes/styles appear strongest?** Look at album-level totals AND per-design averages. Distinguish "high volume because there are many designs" from "high volume per design". Identify what the top designs have in common beyond their album label (subject matter, style cues, season).

2. **Which albums underperform?** Look at low avgImpressionsPerDesign or low CTR. Explicitly mark which albums have too few designs to judge confidently — don't recommend cutting an album that has only one design.

3. **Which design types should be created more?** Based on the top performers, recommend 2-4 concrete design directions for Olga to prioritize in new pins. Be specific (e.g. "more kitten portraits with soft pastels" — not "more cute things").

Then add a short **Caveats** paragraph noting what this snapshot can't see (seasonality, pin-age effects, engagement quality, audience drift).

Output a JSON recommendation block at the end:

\`\`\`json
{
  "topAlbums": ["album1", "album2", "album3"],
  "underperformingAlbums": ["albumX"],
  "designDirectionsToCreate": ["specific direction 1", "specific direction 2"],
  "confidence": 0.0,
  "reasoning": "one sentence"
}
\`\`\`

Keep it concrete and data-grounded. Cite numbers, not vibes.`;

  console.log(
    `\n=== AI Design Analysis (${perf.window.startDate} → ${perf.window.endDate}, ${perf.successCount} designs) ===\n`
  );

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    // Bumped 4000 → 8000 on 2026-05-27 after the 2026-05-26 run cut off
    // mid-recommendation block ("Stylized cartoon-adjacent nursery animals"
    // with no closing quote/bracket/brace), which caused the parser to skip
    // the S3+DDB dual-write and the next-day verify-parity to log a "no
    // structured block in JSON" warning. Same shape of bug as the documented
    // trend@2026-05-21 historical gap that was previously bumped 1500 → 3000.
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const generatedAt = new Date().toISOString();

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  console.log(text);
  console.log();

  const dateStr = yesterdayDateStr();
  const analysisDir = path.join(process.cwd(), "reports", "ai-analysis");
  if (!fs.existsSync(analysisDir)) fs.mkdirSync(analysisDir, { recursive: true });

  const mdBody = `# AI Design Analysis (${dateStr})\n\nWindow: ${perf.window.startDate} → ${perf.window.endDate}\nDesigns analyzed: ${perf.successCount}\n\n${text}\n`;

  const mdPath = path.join(analysisDir, `${dateStr}-design-analysis.md`);
  fs.writeFileSync(mdPath, mdBody);

  const latestMdPath = path.join(process.cwd(), "reports", "design-insights.md");
  fs.writeFileSync(latestMdPath, mdBody);

  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  const recommendation = jsonMatch ? JSON.parse(jsonMatch[1]) : null;

  const jsonBody =
    JSON.stringify(
      {
        date: dateStr,
        window: perf.window,
        totalDesignsAnalyzed: perf.successCount,
        analysis: text,
        recommendation,
      },
      null,
      2
    ) + "\n";

  const jsonPath = path.join(analysisDir, `${dateStr}-design-analysis.json`);
  fs.writeFileSync(jsonPath, jsonBody);

  const latestJsonPath = path.join(process.cwd(), "reports", "design-insights.json");
  fs.writeFileSync(latestJsonPath, jsonBody);

  if (recommendation) {
    const historyFilePath = path.join(
      process.cwd(),
      "reports",
      "ai-recommendations-history.json"
    );
    const existing: unknown[] = fs.existsSync(historyFilePath)
      ? JSON.parse(fs.readFileSync(historyFilePath, "utf-8"))
      : [];
    existing.push({
      date: dateStr,
      analysisType: "design",
      topAlbums: recommendation.topAlbums,
      underperformingAlbums: recommendation.underperformingAlbums,
      designDirectionsToCreate: recommendation.designDirectionsToCreate,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      sourceWindow: perf.window,
    });
    fs.writeFileSync(historyFilePath, JSON.stringify(existing, null, 2) + "\n");
    console.log(`  Saved → ${historyFilePath}`);
  }

  console.log(`  Saved → ${mdPath}`);
  console.log(`  Saved → ${jsonPath}`);
  console.log(`  Saved → ${latestMdPath}`);
  console.log(`  Saved → ${latestJsonPath}\n`);

  // Dual-write to S3 + DynamoDB. JSON above stays as the canonical artifact
  // during the parity-verified soak window. Only persist a DDB row when the
  // AI produced a structured recommendation — without topAlbums/reasoning
  // the row would be incomplete.
  // Schema reference: plan/integration/business-history-schema.md §4.3, §10.
  if (!recommendation) {
    console.log("  (no recommendation block in AI output → skipping S3 + DDB dual-write)\n");
    return;
  }
  try {
    const s3Key = await putMarkdown(dateStr, generatedAt, "design", mdBody);
    await putAiAnalysis({
      generatedAt,
      analysisType: "design",
      forDate: dateStr,
      reasoning: recommendation.reasoning,
      markdownS3Key: s3Key,
      topAlbums: recommendation.topAlbums,
      underperformingAlbums: recommendation.underperformingAlbums,
      designDirectionsToCreate: recommendation.designDirectionsToCreate,
      totalDesignsAnalyzed: perf.successCount,
      confidence: recommendation.confidence,
      sourceWindow: perf.window,
    });
    console.log(`  Saved → S3 cross-stitch-ai-reports/${s3Key}`);
    console.log(`  Saved → DDB CrossStitchBusinessHistory[AI_ANALYSIS#${generatedAt}#design]\n`);
  } catch (err) {
    console.error(`  S3/DDB dual-write failed:`, err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
