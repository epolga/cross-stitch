# Pinterest AI Agent — VS Code Technical Implementation Plan

## Goal

Build a safe AI-assisted Pinterest campaign reporting and recommendation system for your cross-stitch website.

Current business model:

* You automatically upload new Pins every 2–3 days.

* Each Pin points to one design page on your website.

* You have about 7–8 active Pinterest ads.

* Current ad budget is about $12/day.

* The goal is AdSense revenue from visitors who arrive from Pinterest.

The first version should **not change campaigns automatically**. It should collect data, analyze it, and email you a daily recommendation report.

Recommended first stage:

```text

Report-only agent

No automatic ad changes

No automatic budget changes

No automatic pausing

```

---

## 1. High-level architecture

```text

Pinterest Ads API

        ↓

GA4 Data API

        ↓

AdSense Management API

        ↓

AWS Lambda scheduled by EventBridge

        ↓

DynamoDB table with daily metrics

        ↓

AI summary/recommendation step

        ↓

Email report via Amazon SES

```

Later you can add:

```text

Private dashboard

Approve / Reject buttons

Semi-automatic Pinterest changes

```

---

## 2. Tools to install on your computer

### Required

Install these locally for VS Code development:

1\. **Node.js 20 LTS or newer**

2\. **Git**

3\. **VS Code**

4\. **AWS CLI v2**

5\. **AWS SAM CLI** or **Serverless Framework**

6\. **TypeScript**

7\. **Postman** or **Thunder Client** VS Code extension for API testing

### Recommended VS Code extensions

Install:

* ESLint

* Prettier

* AWS Toolkit

* GitHub Pull Requests and Issues

* Thunder Client

* DotENV

* GitLens

Optional:

* Cursor / Claude Code / GitHub Copilot for coding assistance

---

## 3. Cloud services you need

### AWS

Use your existing AWS account.

Create or use:

* AWS Lambda

* Amazon EventBridge

* Amazon DynamoDB

* Amazon SES

* AWS Secrets Manager

* CloudWatch Logs

* IAM roles/policies

### Google

You need access to:

* GA4 Data API

* AdSense Management API

This requires a Google Cloud project and OAuth credentials or service account setup, depending on what the API allows for your account access.

### Pinterest

You need:

* Pinterest developer app

* Ad account access

* OAuth access token

* Required scopes for reading ad reports

* Later: scopes for editing ads/campaigns if you move to Phase 2

---

## 4. Suggested repository structure

Create a new repo, separate from your website repo at first.

Example:

```text

pinterest-ai-agent/

  package.json

  tsconfig.json

  .env.example

  README.md

  src/

    index.ts

    config.ts

    types.ts

    services/

      pinterestClient.ts

      ga4Client.ts

      adsenseClient.ts

      dynamoClient.ts

      sesClient.ts

      aiClient.ts

    jobs/

      dailyReportJob.ts

    logic/

      attribution.ts

      scoring.ts

      recommendations.ts

      emailTemplate.ts

    scripts/

      testPinterest.ts

      testGa4.ts

      testAdsense.ts

      testEmail.ts

  infra/

    template.yaml

```

If you use Serverless Framework instead of SAM:

```text

serverless.yml

```

If you prefer Terraform later, you can add:

```text

terraform/

```

But for the first version, SAM or Serverless Framework is simpler.

---

## 5. Environment variables

Create `.env.example`:

```env

AWS_REGION=us-east-1

DYNAMODB_TABLE=PinterestAdReports

REPORT_EMAIL_TO=your-email@example.com

REPORT_EMAIL_FROM=ann@cross-stitch.com

PINTEREST_AD_ACCOUNT_ID=

PINTEREST_ACCESS_TOKEN_SECRET_NAME=pinterest-agent/access-token

GA4_PROPERTY_ID=

GOOGLE_CREDENTIALS_SECRET_NAME=pinterest-agent/google-credentials

ADSENSE_ACCOUNT_ID=

OPENAI_API_KEY_SECRET_NAME=pinterest-agent/openai-api-key

REPORT_MODE=advisor_only

```

Important:

* Do not store real API keys in `.env` for production.

* Use AWS Secrets Manager for real credentials.

* Keep `.env` only for local testing.

---

## 6. DynamoDB table design

Create table:

```text

PinterestAdReports

```

Recommended primary key:

```text

PK: REPORT#2026-05-14

SK: PIN#<pin_or_ad_id>

```

Example item:

```json

{

  "PK": "REPORT#2026-05-14",

  "SK": "PIN#horse_245_ad1",

  "date": "2026-05-14",

  "pinId": "horse_245_ad1",

  "adId": "123456789",

  "campaignId": "987654321",

  "designId": "245",

  "url": "https://cross-stitch.com/Horse-9-245-Free-Design.aspx",

  "utmSource": "pinterest",

  "utmMedium": "paidsocial",

  "utmCampaign": "warmup_2026_05",

  "utmContent": "horse_245_ad1",

  "spend": 1.72,

  "impressions": 1800,

  "clicks": 18,

  "outboundClicks": 12,

  "ctr": 0.01,

  "cpc": 0.143,

  "ga4Sessions": 11,

  "engagedSessions": 3,

  "pageviews": 18,

  "adsenseRevenue": 0.31,

  "revenuePer100Sessions": 2.82,

  "estimatedProfitLoss": -1.41,

  "score": 62,

  "recommendation": "Keep watching. Engagement is low but CPC is acceptable.",

  "createdAt": "2026-05-14T06:00:00Z"

}

```

Add a second item for daily summary:

```text

PK: REPORT#2026-05-14

SK: SUMMARY

```

Example:

```json

{

  "PK": "REPORT#2026-05-14",

  "SK": "SUMMARY",

  "totalSpend": 12.00,

  "estimatedAdsenseRevenue": 3.40,

  "estimatedProfitLoss": -8.60,

  "bestPin": "horse_245_ad1",

  "worstPin": "basketball_245_ad1",

  "agentSummary": "Horse performed best today. Basketball had impressions but weak outbound clicks. No automatic changes were made."

}

```

---

## 7. UTM requirement

This is critical.

Every promoted Pin should have a unique `utm_content`.

Example:

```text

https://cross-stitch.com/Horse-9-245-Free-Design.aspx

?utm_source=pinterest

&utm_medium=paidsocial

&utm_campaign=warmup_2026_05

&utm_content=horse_245_ad1

```

For your business, the agent must connect:

```text

Pin → webpage → GA4 session → AdSense revenue

```

Without unique `utm_content`, the agent will not reliably know which Pin created value.

---

## 8. Metrics to collect

### From Pinterest

Collect per ad or promoted pin:

* campaign id

* ad group id

* ad id

* pin id

* spend

* impressions

* clicks

* outbound clicks

* CTR

* CPC

* saves

* engagement rate

### From GA4

Collect by date and UTM fields:

* sessions

* engaged sessions

* engagement rate

* average engagement time

* page views

* landing page

* source / medium

* campaign

* manual ad content / `utm_content`

* relevant custom events, if available

Useful custom events later:

* PDF download click

* newsletter signup

* registration

* returning visitor

### From AdSense

Collect:

* estimated earnings

* page views

* impressions

* RPM

* clicks

Important warning:

AdSense may not always give perfect per-Pin attribution. You may need to estimate AdSense revenue using GA4 sessions/pageviews and AdSense page-level or URL-level reporting if available.

---

## 9. Scoring logic for first version

Start simple. Avoid over-optimization.

Example score:

```text

score = 0

+20 if CPC is below target

+20 if outbound click rate is good

+20 if GA4 engagement is good

+20 if revenue per 100 sessions is good

+10 if pageviews per session are good

+10 if the design deserves more creative tests

-20 if spend is high and revenue is weak

-15 if clicks are high but engagement is low

-15 if saves exist but outbound clicks are weak

-10 if data volume is too small

```

Possible recommendation labels:

```text

KEEP

WATCH

CREATE_VARIATION

PAUSE_CANDIDATE

NEEDS_MORE_DATA

```

Do not allow direct automatic changes yet.

---

## 10. AI agent role

The AI should not be the source of truth for numbers.

Correct design:

```text

Code calculates metrics

Code calculates score

AI explains the result in human language

AI suggests next actions

```

Bad design:

```text

Raw data → AI guesses everything

```

The AI prompt should say:

```text

You are a Pinterest ads analyst for a cross-stitch website.

The business earns mainly from AdSense.

Do not recommend increasing spend unless revenue-per-session or engagement supports it.

Do not make any automatic changes.

Produce a short daily report with conservative recommendations.

```

---

## 11. Daily email report format

Subject:

```text

Daily Pinterest Ads Report — 2026-05-14

```

Body:

```text

Daily Pinterest Ads Report — 2026-05-14

Overall:

- Spend: $12.00

- Estimated AdSense revenue from Pinterest: $3.40

- Estimated result: -$8.60

- Total Pinterest sessions: 114

- Engaged sessions: 31

Best performers:

1\. Horse design — good CPC and best estimated revenue

2\. Owl design — lower traffic but better engagement

Weak performers:

1\. Basketball design — many impressions, weak outbound clicks

2\. Donkey design — clicks are acceptable, but page engagement is weak

Recommended actions:

1\. Keep Horse running.

2\. Create 2 new Horse Pin variations.

3\. Watch Donkey for one more day.

4\. Consider pausing Basketball if tomorrow remains weak.

Safety:

No automatic campaign changes were made.

```

---

## 12. Local development steps in VS Code

### Step 1 — create project

```bash

mkdir pinterest-ai-agent

cd pinterest-ai-agent

npm init -y

```

### Step 2 — install TypeScript

```bash

npm install -D typescript ts-node esbuild @types/node eslint prettier

npx tsc --init

```

### Step 3 — install AWS packages

```bash

npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-sesv2 @aws-sdk/client-secrets-manager

```

### Step 4 — install Google packages

```bash

npm install googleapis @google-analytics/data

```

### Step 5 — install HTTP and utility packages

```bash

npm install axios zod date-fns

```

### Step 6 — install AI SDK package

For OpenAI:

```bash

npm install openai

```

For Anthropic:

```bash

npm install @anthropic-ai/sdk

```

You can choose one first. Do not build both at the beginning unless needed.

---

## 13. Files to create first

### `src/config.ts`

Purpose:

* read environment variables

* validate required settings

* fail early if something is missing

### `src/types.ts`

Purpose:

* define TypeScript types for Pinterest metrics, GA4 metrics, AdSense metrics, combined report rows, and recommendations

### `src/services/pinterestClient.ts`

Purpose:

* call Pinterest API

* fetch ad metrics by date

* normalize response into your own internal format

### `src/services/ga4Client.ts`

Purpose:

* call GA4 Data API

* fetch metrics grouped by campaign and `utm_content`

### `src/services/adsenseClient.ts`

Purpose:

* fetch AdSense earnings/performance report

* initially daily site-level data may be enough

* later improve URL-level or page-level matching if available

### `src/services/dynamoClient.ts`

Purpose:

* save report rows

* save daily summary

* read recent history for trend comparison

### `src/services/sesClient.ts`

Purpose:

* send daily email report

### `src/logic/attribution.ts`

Purpose:

* merge Pinterest, GA4, and AdSense data

* match by date + UTM campaign + UTM content + landing page

### `src/logic/scoring.ts`

Purpose:

* calculate score and recommendation labels

### `src/logic/recommendations.ts`

Purpose:

* convert metrics into recommended actions

### `src/logic/emailTemplate.ts`

Purpose:

* produce plain-text email body

### `src/jobs/dailyReportJob.ts`

Purpose:

* orchestrate the full report job

### `src/index.ts`

Purpose:

* AWS Lambda handler

---

## 14. First test scripts

Before deploying Lambda, test locally.

Create scripts:

```text

src/scripts/testPinterest.ts

src/scripts/testGa4.ts

src/scripts/testAdsense.ts

src/scripts/testEmail.ts

```

Add package scripts:

```json

{

  "scripts": {

    "build": "tsc --noEmit",

    "test:pinterest": "ts-node src/scripts/testPinterest.ts",

    "test:ga4": "ts-node src/scripts/testGa4.ts",

    "test:adsense": "ts-node src/scripts/testAdsense.ts",

    "test:email": "ts-node src/scripts/testEmail.ts"

  }

}

```

Test order:

1\. Pinterest credentials

2\. GA4 credentials

3\. AdSense credentials

4\. DynamoDB write

5\. SES email

6\. Full daily report job

---

## 15. AWS infrastructure

Create:

### DynamoDB table

```text

PinterestAdReports

```

Billing mode:

```text

PAY_PER_REQUEST

```

Keys:

```text

PK string

SK string

```

### Secrets Manager secrets

Create secrets:

```text

pinterest-agent/access-token

pinterest-agent/google-credentials

pinterest-agent/openai-api-key

```

Optional if using Anthropic:

```text

pinterest-agent/anthropic-api-key

```

### Lambda

Name:

```text

pinterest-ai-daily-report

```

Runtime:

```text

Node.js 20.x

```

Timeout:

```text

60 seconds initially

```

Memory:

```text

512 MB

```

### EventBridge schedule

Run once per day.

Example:

```text

Every day at 07:00 Israel time

```

Because EventBridge cron uses UTC, convert carefully.

Israel time changes with daylight saving, so a fixed UTC time may shift by one hour during the year. This is acceptable for a report, or you can use EventBridge Scheduler with a timezone-aware schedule.

### SES

Use SES to send the report email.

You need:

* verified sender identity, for example `ann@cross-stitch.com`

* production SES access if sending to non-verified recipients

* if only sending to yourself, SES sandbox may be enough if your receiving email is verified

---

## 16. IAM permissions

Lambda execution role needs:

```text

DynamoDB PutItem

DynamoDB GetItem

DynamoDB Query

DynamoDB UpdateItem

SecretsManager GetSecretValue

SES SendEmail

SES SendRawEmail

CloudWatch Logs CreateLogGroup

CloudWatch Logs CreateLogStream

CloudWatch Logs PutLogEvents

```

Use least privilege and restrict resources to your specific table, secrets, and sender identity.

---

## 17. First implementation milestone

Milestone 1: Manual local report

Goal:

```text

Run npm script locally and print report in terminal.

```

Command:

```bash

npm run report:local

```

Expected output:

```text

Pinterest spend: $12.00

Pinterest clicks: 86

GA4 sessions: 74

Estimated AdSense revenue: $2.91

Recommendation: Continue Horse, watch Donkey, pause candidate Basketball.

```

No database yet.

---

## 18. Second implementation milestone

Milestone 2: Save report to DynamoDB

Goal:

```text

Run locally and store report rows in DynamoDB.

```

Check table manually in AWS Console.

---

## 19. Third implementation milestone

Milestone 3: Send email

Goal:

```text

Run locally and receive email report.

```

At this point, you already have a useful tool.

---

## 20. Fourth implementation milestone

Milestone 4: Deploy Lambda

Goal:

```text

Deploy to AWS Lambda and run manually from AWS Console.

```

Check:

* Lambda logs

* DynamoDB rows

* SES email delivery

---

## 21. Fifth implementation milestone

Milestone 5: Schedule daily run

Goal:

```text

EventBridge runs Lambda once per day.

```

The report should arrive automatically by email.

---

## 22. Sixth implementation milestone

Milestone 6: Add history comparison

After a few days of data, add trend logic:

```text

Compare today vs yesterday

Compare last 3 days

Compare last 7 days

Detect improving / declining ads

```

This is when recommendations become much more useful.

---

## 23. Seventh implementation milestone

Milestone 7: Add approval workflow

Only after you trust the report.

Add a private dashboard:

```text

/reports/pinterest

```

Show:

* daily summaries

* per-pin metrics

* recommendation

* Approve / Reject buttons

At this stage the agent can prepare changes but should not apply them without approval.

---

## 24. Phase 2: semi-automatic actions

Possible approved actions:

```text

Pause ad

Duplicate ad

Create new ad from existing Pin

Increase budget slightly

Decrease budget slightly

```

Hard safety rules:

```text

Never increase total daily budget above your configured maximum.

Never increase one campaign budget by more than 10% at a time.

Never pause an ad with too little data.

Never change more than N ads per day.

Always log old value and new value.

Always send an email after any approved change.

```

Recommended config:

```env

MAX_DAILY_BUDGET=12

MAX_BUDGET_INCREASE_PERCENT=10

MIN_CLICKS_BEFORE_PAUSE=30

MIN_SPEND_BEFORE_PAUSE=3

AUTO_APPLY_CHANGES=false

```

---

## 25. What not to build first

Do not start with:

* automatic budget scaling

* automatic campaign pausing

* complex dashboard

* too many AI prompts

* many different models

* real-time monitoring

Start with one daily report.

---

## 26. Recommended first week plan

### Day 1

* Create repo

* Install packages

* Create `.env.example`

* Create basic TypeScript structure

* Test AWS credentials

### Day 2

* Connect Pinterest API

* Fetch one day of ad metrics

* Print raw data

### Day 3

* Connect GA4 Data API

* Fetch sessions by UTM campaign/content

### Day 4

* Connect AdSense API

* Fetch daily earnings report

### Day 5

* Merge data

* Calculate first score

* Print report locally

### Day 6

* Save report to DynamoDB

* Send email through SES

### Day 7

* Deploy Lambda

* Add EventBridge schedule

---

## 27. Minimum useful version

The minimum useful version does only this:

```text

1\. Pull yesterday's Pinterest ad metrics.

2\. Pull yesterday's GA4 Pinterest traffic metrics.

3\. Pull yesterday's AdSense revenue.

4\. Estimate revenue per Pinterest session.

5\. Save report to DynamoDB.

6\. Email a short recommendation.

```

This is enough to start learning whether Pinterest traffic is profitable.

---

## 28. Important business warning

Do not optimize for clicks alone.

For your site, the important metric is closer to:

```text

AdSense revenue per 100 Pinterest sessions

```

or:

```text

AdSense revenue per promoted Pin / ad spend

```

A Pin with cheap clicks may still be bad if visitors do not stay, view pages, or generate ad revenue.

---

## 29. Recommended first AI prompt

Use this kind of prompt for the summarizer:

```text

You are analyzing Pinterest ads for a cross-stitch pattern website.

The business earns mainly from AdSense on the website.

Be conservative.

Do not recommend increasing ad spend unless engagement and estimated revenue support it.

Do not recommend automatic actions.

Classify each ad as KEEP, WATCH, CREATE_VARIATION, PAUSE_CANDIDATE, or NEEDS_MORE_DATA.

Explain the reasoning briefly.

```

---

## 30. AI memory and long-term understanding storage

The AI itself does not permanently remember your business automatically.

Correct architecture:

```text

Database = long-term memory

AI = reasoning engine using that memory

```

This means:

```text

Historical metrics → stored permanently

AI findings → stored permanently

Current analysis → uses both

```

The system should store:

1\. Raw numerical metrics

2\. AI-generated understandings

3\. Confidence levels

4\. Evidence supporting findings

5\. Whether findings remained valid over time

---

## 31. Recommended AI insights table

Create a second DynamoDB logical entity for AI findings.

Option A:

```text

Separate table:

AIInsights

```

Option B (recommended initially):

```text

Store insights in the same DynamoDB table

using different PK/SK prefixes.

```

Example:

```text

PK: INSIGHT#creative_pattern

SK: 2026-05-14#animal-warm-colors

```

---

## 32. Example AI insight record

Example:

```json

{

  "PK": "INSIGHT#creative_pattern",

  "SK": "2026-05-14#animal-warm-colors",

  "insightType": "creative_pattern",

  "statement": "Warm-color animal designs appear to generate better engaged Pinterest traffic than cold-color floral designs.",

  "confidence": 0.68,

  "status": "active",

  "recommendedAction": "Create more warm animal pin variations before increasing floral campaign budgets.",

  "evidence": {

    "dateRange": "2026-05-01 to 2026-05-14",

    "pinsCompared": 12,

    "averageEngagementAnimalWarm": 0.34,

    "averageEngagementFloralCold": 0.18,

    "averageRevenueAnimalWarm": 0.042,

    "averageRevenueFloralCold": 0.019

  },

  "affectedThemes": [

    "horse",

    "owl",

    "woodland"

  ],

  "createdAt": "2026-05-14T07:00:00Z",

  "lastValidatedAt": "2026-05-14T07:00:00Z"

}

```

---

## 33. Types of AI understandings to store

Recommended categories:

```text

creative_pattern

board_performance

keyword_performance

audience_behavior

seasonal_trend

visual_style

monetization_pattern

engagement_pattern

upload_timing

campaign_structure

```

Examples:

```text

Horse themes perform better than floral themes.

Warm backgrounds outperform cold backgrounds.

Beginner wording improves CTR.

Pinterest traffic from certain boards produces stronger AdSense RPM.

Religious patterns monetize better despite lower CTR.

```

---

## 34. Important principle: text + evidence

Do not store only text.

Do not store only numbers.

Correct structure:

```text

AI conclusion

+

Evidence supporting it

+

Confidence level

+

Suggested action

```

This allows the system to:

```text

Re-check old findings later

Detect when a pattern stopped working

Avoid hallucinated conclusions

Track business learning over time

```

---

## 35. Insight lifecycle

Insights should not live forever automatically.

Suggested statuses:

```text

active

weakening

testing

rejected

expired

```

Example:

```text

Warm-color animal designs worked in spring

but stopped working later.

```

The system should be able to:

```text

Lower confidence

Mark old findings as weakening

Eventually expire outdated understandings

```

---

## 36. Confidence scoring

The AI should never claim certainty without evidence.

Suggested confidence scale:

```text

0.0–0.3 = weak

0.3–0.6 = moderate

0.6–0.8 = strong

0.8–1.0 = very strong

```

Confidence can depend on:

```text

Number of Pins analyzed

Amount of traffic

Time duration

Consistency across campaigns

Agreement with previous findings

```

---

## 37. Retrieving past understandings into prompts

Before generating a new report, your code should retrieve:

```text

Recent insights

Relevant insights for the same theme

Board-related findings

Keyword-related findings

Recent campaign trends

```

Example prompt context:

```text

Previous findings:

- Horse themes historically perform well.

- Warm colors improved engagement.

- Beginner wording improved CTR.

Current metrics:

...

Please analyze whether earlier findings still appear valid.

```

This creates long-term learning behavior.

---

## 38. Important architecture principle

The AI should NOT invent memory.

Correct design:

```text

Code retrieves relevant historical findings.

Code retrieves relevant metrics.

AI analyzes in context.

New findings are stored back into database.

```

This loop creates the agent's persistent understanding.

---

## 39. Example learning loop

### Day 1

AI notices:

```text

Horse themes outperform floral themes.

```

Stored in DynamoDB.

---

### Day 10

Before analysis:

Code retrieves:

```text

Previous finding:

Horse themes outperform floral themes.

```

Current metrics confirm it.

AI updates confidence upward.

---

### Day 40

Trend weakens.

AI updates:

```text

Status: weakening

Confidence lowered

```

This creates evolving business understanding.

---

## 40. Optional future improvement: embeddings/vector search

You do NOT need vector databases initially.

Simple DynamoDB retrieval is enough.

Later, if the project becomes very large, you may optionally add:

```text

embeddings

semantic similarity search

vector databases

RAG pipelines

```

Possible future tools:

```text

OpenSearch

pgvector

Pinecone

Weaviate

Chroma

```

But for the first versions:

```text

DynamoDB + structured insight records is enough.

```

---

## 41. What the agent actually is

Important conceptual clarification:

The agent is NOT only the AI model.

Correct understanding:

```text

Agent = AI model + skill + memory + tools + workflow

```

For this Pinterest system:

```text

AI model:

Claude / GPT

Skill:

Business rules, heuristics, prompts, safety constraints

Memory:

DynamoDB reports, findings, historical metrics

Tools:

Pinterest API

GA4 API

AdSense API

SES

DynamoDB

Workflow:

Scheduled Lambda jobs and reporting pipeline

```

The agent becomes operational because it:

```text

Reads metrics

Stores history

Uses tools/APIs

Analyzes patterns

Generates recommendations

Maintains business understanding

Runs on schedule

```

---

## 42. What a skill actually is

A skill is NOT one magical object.

Technically, a skill is usually:

```text

A structured collection of documents, rules, prompts, schemas, examples, and heuristics.

```

The skill teaches the AI:

```text

How to think

How to behave

What business goals matter

What safety rules exist

How outputs should look

```

The skill contains relatively stable knowledge.

The database contains changing observations.

---

## 43. Recommended skill structure

Recommended project structure:

```text

automation/

  pinterest-agent/

    src/

    skills/

      pinterest-agent/

        instructions.md

        business-rules.json

        prompt-templates.md

        examples.md

        heuristics.md

        output-schemas/

          recommendation-schema.json

          report-schema.json

        findings/

          validated-findings.md

```

The `skills/pinterest-agent/` folder becomes the operational knowledge package.

---

## 44. What belongs inside the skill

Examples of good skill content:

### Business goals

```text

Pinterest traffic → website → AdSense revenue.

Prefer long-term engaged traffic quality over cheap clicks.

```

### Safety rules

```text

Do not auto-pause ads with insufficient data.

Do not recommend aggressive budget increases.

```

### Creative heuristics

```text

Warm-color animal patterns often perform well.

Avoid keyword stuffing.

Prefer readable Pinterest titles.

```

### Prompt templates

```text

Analyze campaign metrics conservatively.

Focus on engagement and monetization quality.

```

### Output schemas

```json

{

  "recommendation": "KEEP",

  "confidence": 0.72,

  "reasoning": "..."

}

```

### Few-shot examples

```text

High CTR + weak engagement

→ likely misleading creative.

```

---

## 45. What should NOT belong inside the skill

Do NOT store temporary daily data inside the skill.

Bad examples:

```text

Horse pin yesterday had CTR 0.72%.

```

Temporary observations belong in:

```text

DynamoDB reports

Insight records

Historical metrics tables

```

The skill should contain:

```text

Stable reusable operational knowledge.

```

---

## 46. Relationship between skill and memory

Important distinction:

```text

Skill = stable operational knowledge

Memory = changing historical business observations

```

Examples:

### Skill

```text

Do not optimize only for CTR.

```

### Memory

```text

Basketball pin underperformed this week.

```

The agent uses BOTH simultaneously.

---

## 47. Recommended repository approach

Initially, keep the agent inside the existing cross-stitch repository.

Recommended structure:

```text

cross-stitch/

  app/

  src/

  automation/

    pinterest-agent/

      src/

      skills/

      prompts/

      reports/

```

Advantages:

```text

Shared business context

Shared utilities

Simpler management for solo developer

Easier integration with existing website metadata

```

The website deployment and agent deployment should still remain separate.

---

## 48. Recommended Git workflow

Recommended initial workflow:

```text

main

  stable production website

feature/pinterest-agent

  agent development and experimentation

```

Create branch:

```bash

git checkout -b feature/pinterest-agent

```

Reasoning:

```text

The agent architecture will evolve quickly.

API integrations may change.

Dependencies may change.

AWS tooling may require experimentation.

```

This keeps production website work isolated from agent experimentation.

---

## 49. Recommended first skill files

Start small.

Recommended first files:

### `instructions.md`

Contains:

```text

Business goals

Core priorities

Safety principles

```

### `business-rules.json`

Contains:

```json

{

  "primaryGoal": "adsense_revenue_per_engaged_session",

  "maxBudgetIncreasePercent": 10,

  "minimumClicksBeforePause": 30,

  "allowAutomaticChanges": false

}

```

### `heuristics.md`

Contains:

```text

Warm-color animal patterns often perform well.

Beginner wording improves CTR.

```

### `prompt-templates.md`

Contains:

```text

Daily reporting prompt

Creative generation prompt

Board selection prompt

```

### `examples.md`

Contains:

```text

Input metrics → good interpretation examples.

```

---

## 50. How the skill will be used operationally

Example workflow:

```text

Lambda starts

↓

Retrieve metrics

↓

Retrieve historical findings

↓

Load skill files

↓

Construct AI prompt

↓

Call Claude/GPT

↓

Generate recommendations

↓

Store new findings

↓

Send report

```

This creates consistent long-term behavior.

---

## 51. AI API access and subscriptions

Important clarification:

ChatGPT Plus subscription is NOT sufficient for building the AWS-based agent.

Reason:

```text

ChatGPT Plus = interactive ChatGPT website/app usage

OpenAI API = programmatic access from your code

```

The Pinterest agent will run from:

```text

AWS Lambda

```

Therefore it must call:

```text

OpenAI API

or

Anthropic API

```

using API keys.

These API systems are billed separately from ChatGPT or Claude subscriptions.

---

## 52. Recommended initial AI setup

Recommended initial setup:

```text

OpenAI API

+

GPT-5.5

+

Daily reporting workflow

```

This is sufficient for:

```text

Campaign analysis

Recommendation generation

Pin title suggestions

Board suggestions

Daily reports

```

The expected API cost for the first version should be relatively small because:

```text

Only one or a few daily reports

Moderate prompt sizes

Small datasets initially

```

---

## 53. How AI calls work technically

The AI call is just another API request from your TypeScript code.

Workflow:

```text

Lambda retrieves metrics

↓

Code builds prompt

↓

Code calls OpenAI/Claude API

↓

AI returns recommendations

↓

Recommendations stored in DynamoDB

↓

SES sends report email

```

---

## 54. Recommended AI client file

Recommended file:

```text

automation/pinterest-agent/src/services/aiClient.ts

```

Purpose:

```text

Send prompts to AI

Receive recommendations

Validate output structure

Return parsed analysis results

```

---

## 55. API key storage

For local development:

```env

OPENAI_API_KEY=...

ANTHROPIC_API_KEY=...

```

For AWS production:

```text

AWS Secrets Manager

```

Recommended secrets:

```text

pinterest-agent/openai-api-key

pinterest-agent/anthropic-api-key

```

Never hardcode API keys into source code.

---

## 56. Example operational AI flow

Example:

```text

Pinterest metrics

+

GA4 metrics

+

AdSense metrics

+

Historical findings

+

Skill instructions

↓

AI analysis call

↓

Structured recommendation JSON

↓

DynamoDB storage

↓

Email report

```

---

## 57. OAuth authentication approach for Google APIs

The original service-account approach for GA4 authentication failed because Google Analytics UI refused the service-account email during access assignment.

For this Pinterest agent project, OAuth user authentication is acceptable and simpler.

Advantages:

```text

Reliable

Simpler for solo developer

Officially supported

Works for both GA4 and AdSense APIs

```

Architecture:

```text

User grants access once

↓

Google issues refresh token

↓

Lambda uses refresh token automatically later

```

---

## 58. Google OAuth setup summary

Completed steps:

```text

Created Google Cloud project

Enabled Google Analytics Data API

Enabled AdSense Management API

Configured Google Auth Platform branding

Created OAuth Desktop App client

Downloaded OAuth client JSON

```

Important:

```text

OAuth client secret is private credential.

Never commit to GitHub.

Never expose publicly.

```

---

## 59. Recommended local project structure

Recommended structure:

```text

automation/

  pinterest-agent/

    scripts/

    src/

    skills/

    google-oauth-client.json

```

The OAuth client JSON should remain:

```text

Outside Git tracking

```

Add to `.gitignore`:

```text

google-oauth-client.json

```

---

## 60. Local refresh-token generation workflow

Install packages:

```bash

npm install googleapis open

npm install -D tsx typescript

```

Recommended script:

```text

scripts/get-google-refresh-token.ts

```

Purpose:

```text

Open browser login

Authenticate Google account

Request GA4 + AdSense permissions

Retrieve refresh token

```

---

## 61. Recommended OAuth scopes

Recommended scopes:

```text

https://www.googleapis.com/auth/analytics.readonly

https://www.googleapis.com/auth/adsense.readonly

```

These provide read-only access for:

```text

GA4 reporting

AdSense reporting

Campaign analysis

```

---

## 62. Refresh token architecture

Flow:

```text

User authenticates once locally

↓

Google returns refresh token

↓

Refresh token stored securely

↓

Lambda exchanges refresh token for temporary access tokens automatically

```

This avoids repeated browser login.

---

## 63. Recommended credential storage

Recommended AWS Secrets Manager secrets:

```text

pinterest-agent/google-oauth-client

pinterest-agent/google-refresh-token

```

The OAuth secret should contain:

```json

{

  "clientId": "...",

  "clientSecret": "...",

  "refreshToken": "..."

}

```

---

## 64. Future operational Google flow

Example:

```text

Lambda starts

↓

Loads OAuth credentials from Secrets Manager

↓

Obtains temporary Google access token

↓

Reads GA4 metrics

↓

Reads AdSense metrics

↓

Combines with Pinterest metrics

↓

Runs AI analysis

```

---

## 65. Important security principles

Never:

```text

Commit OAuth JSON into GitHub

Expose client_secret publicly

Expose refresh_token publicly

Paste credentials into chat systems

```

Treat:

```text

client_secret

refresh_token

```

as production credentials.

---

## 66. Current implementation milestone: Google reporting works

Completed milestone:

```text

Google OAuth user authentication works

GA4 Data API access works

AdSense Management API access works

Daily Google report script works

```

Current working script:

```text

automation/pinterest-agent/scripts/daily-google-report.ts

```

Current output example for 2026-05-14:

```text

Pinterest PaidSocial sessions: 107

Pinterest organic sessions: 47

Pinterest referral sessions: 5

Total Pinterest sessions: 159

AdSense estimated earnings: $23.15

Estimated revenue / 100 Pinterest sessions: $14.56

```

The script saves output to:

```text

reports/2026-05-14-google-report.json

```

Important caveat:

```text

The current revenue estimate uses total site AdSense earnings divided by Pinterest sessions.

It is not yet true Pinterest-attributed AdSense revenue.

```

Future improvement:

```text

Use GA4 Pinterest landing pages

+

AdSense URL/page/channel reporting

```

to estimate revenue more accurately by Pinterest traffic/page.

---

## 67. Pinterest API integration status

Completed milestone:

```text

Pinterest API app already exists

Pinterest OAuth flow already exists

Pinterest access token already works

Pinterest Ads API access works

```

Existing uploader integration already contains:

```text

OAuth refresh flow

Token persistence

Pins/boards publishing

Ads read scope

```

Current token scopes:

```text

ads:read

boards:read

boards:write

pins:read

pins:write

```

Verified working Pinterest Ads API access:

```text

Ad Account ID: 549769986352

Name: Cross Stitch Patterns

Country: US

Currency: USD

```

---

## 68. Recommended Pinterest architecture

Current uploader application and new Pinterest agent are separate systems.

Recommended architecture:

```text

Uploader

→ publishing workflow

Pinterest Agent

→ analytics/reporting/AI workflow

```

Initially:

```text

Pinterest Agent may reuse existing Pinterest token.

```

Long-term:

```text

Separate credentials and token management are preferable.

```

Advantages:

```text

Cleaner permissions

Cleaner separation

Reduced operational risk

Independent deployments

```

---

## 69. Pinterest token storage understanding

Important architectural distinction:

```text

AWS Secrets Manager stores credentials.

It does NOT refresh OAuth tokens automatically.

```

Therefore:

```text

Secrets Manager = secure storage

Refresh logic = application code

```

---

## 70. Initial Pinterest token strategy

For the first development stage:

```text

Use existing Pinterest access token manually.

```

Store locally in:

```text

.env

```

Example:

```env

PINTEREST_ACCESS_TOKEN=pina_...

PINTEREST_AD_ACCOUNT_ID=549769986352

```

Later:

```text

Move secrets into AWS Secrets Manager.

```

---

## 71. Production Pinterest token strategy

Production architecture should eventually support automatic Pinterest token refresh.

Recommended stored credentials:

```json

{

  "clientId": "...",

  "clientSecret": "...",

  "accessToken": "...",

  "refreshToken": "...",

  "expiresAt": "..."

}

```

Recommended operational flow:

```text

Lambda starts

↓

Read Pinterest credentials from Secrets Manager

↓

Check token expiration

↓

If expired:

  Call Pinterest OAuth token endpoint

  Obtain new access token

  Save updated credentials back to Secrets Manager

↓

Continue Pinterest API calls

```

---

## 72. Important operational insight

OAuth refresh logic is separate from secret storage.

Important understanding:

```text

Secrets Manager does not manage OAuth lifecycle.

The application itself must refresh tokens.

```

This applies not only to Pinterest, but generally to:

```text

OAuth-based APIs

Google APIs

Pinterest APIs

Many SaaS integrations

```

---

## 73. Current recommended next milestone

Next recommended implementation:

```text

scripts/test-pinterest-ad-report.ts

```

Goal:

```text

Retrieve yesterday's Pinterest Ads metrics.

```

Target metrics:

```text

Spend

Impressions

Clicks

CTR

CPC

Outbound clicks

Campaign/ad-group/ad performance

```

This enables the first:

```text

Pinterest spend

+

GA4 sessions

+

AdSense revenue

```

combined business report.

---

## 74. Future WPF Uploader integration

The existing WPF Uploader application can become part of the Pinterest agent ecosystem.

Recommended long-term architecture:

```text

WPF Uploader

↓

Requests AI suggestions from Pinterest Agent backend

↓

Receives:

  title suggestions

  description suggestions

  board suggestions

  keyword suggestions

  UTM suggestions

↓

User reviews/approves

↓

Uploader publishes to Pinterest

```

The uploader becomes:

```text

Publishing interface / operational frontend

```

for the AI agent.

---

## 75. Recommended uploader integration architecture

Recommended long-term architecture:

```text

WPF Uploader

↓

HTTP request

↓

AWS API Gateway

↓

Lambda

↓

AI analysis + historical memory + skill files

↓

Structured publishing recommendations

```

Advantages:

```text

AI keys stay in AWS

Centralized memory system

Shared business logic

Shared recommendation engine

Cleaner security model

```

---

## 76. Short-term uploader integration recommendation

Short-term recommendation:

```text

Keep uploader publishing logic unchanged.

```

Initially:

```text

Uploader only requests recommendations.

```

Example:

```text

Title suggestion

Description suggestion

Board suggestion

UTM suggestion

```

The user remains:

```text

final approval authority

```

before publishing.

---

## 77. Example future API contract

Example uploader request:

```json

{

  "designId": "245",

  "theme": "horse",

  "pageUrl": "https://cross-stitch.com/Horse-9-245-Free-Design.aspx",

  "availableBoards": [

    "Animals",

    "Horses",

    "Beginner Cross Stitch"

  ],

  "imageDescription": "horse cross-stitch pattern"

}

```

Example agent response:

```json

{

  "title": "Horse Cross Stitch Pattern PDF",

  "description": "A printable horse cross-stitch chart for your next stitching project.",

  "recommendedBoard": "Animals",

  "utmContent": "horse_245_pin_01"

}

```

---

## 78. Recommended future AI recommendation categories

Planned recommendation categories:

```text

Pin title optimization

Description optimization

Board selection

Keyword suggestions

UTM naming

Seasonal recommendations

Beginner-vs-advanced wording optimization

Creative duplication suggestions

```

Future advanced categories:

```text

Predicted CTR

Predicted engagement quality

Predicted monetization quality

Pattern/theme clustering

```

---

## 78A. External platform API access acquisition

Important early parallel milestone:

```text

Apply for developer/API access to external marketing platforms as early as possible.

```

Reason:

```text

Approval/review processes may take days, weeks, or longer.

Development can continue meanwhile.

```

Recommended current targets:

```text

Pinterest (already approved)

Meta / Facebook / Instagram

Reddit

Google Ads

```

Lower current priority:

```text

TikTok

X / Twitter

```

Recommended operational strategy:

```text

Apply early

↓

Continue development while waiting for approvals

↓

Integrate APIs gradually later

```

Important operational recommendation:

```text

Use consistent business identity

Use consistent email/domain

Maintain privacy policy page

Keep approval notes/documentation

```

This milestone should happen in parallel with technical development rather than after the Pinterest Agent is completed.

---

## 79. Current project progress estimate

Current estimated project progress:

```text

Phase 1 (measurement foundation): ~70% complete

```

Already completed:

```text

Google OAuth

GA4 integration

AdSense integration

Pinterest Ads integration

Unified reporting

Historical JSON reporting

Basic profitability estimation

```

---

## 80. Remaining estimated work

### Phase 1 — Intelligent advisor

Remaining:

```text

AI analysis layer

Historical memory improvements

Automated scheduling

Email reporting

Better attribution quality

```

Estimated:

```text

3–7 focused development days

```

Expected outcome:

```text

Useful business advisor agent

```

---

### Phase 2 — Semi-autonomous assistant

Features:

```text

Uploader integration

AI publishing suggestions

Board recommendations

Campaign suggestions

Anomaly detection

Trend detection

```

Estimated:

```text

1–3 additional weeks

```

Expected outcome:

```text

AI-assisted Pinterest workflow

```

---

### Phase 3 — Controlled automation

Features:

```text

Automatic budget adjustments

Automatic ad pausing

Automatic experiments

Automatic creative duplication

```

Estimated:

```text

Several additional weeks or months

```

Reason:

```text

Safety and rollback logic become important.

```

---

## 81. Important strategic milestone already achieved

The project already has:

```text

Traffic source metrics

+

Website analytics

+

Revenue analytics

+

Profitability estimation

```

This forms:

```text

closed business measurement loop

```

which is the real foundation of the future intelligent marketing agent.

---

## 82. Future evolution beyond Pinterest Agent

The current Pinterest AI Agent is only the first stage of a broader:

```text

multi-platform marketing intelligence system

```

The long-term vision is not limited to Pinterest.

Future system goals:

```text

Unified traffic intelligence

Unified profitability analysis

Cross-platform content optimization

Semi-automated marketing workflows

```

---

## 83. Recommended next strategic direction

After the Pinterest-focused agent becomes stable and useful, the next recommended direction is:

```text

Multi-platform promotion agent

```

This future system would analyze and optimize traffic across multiple platforms simultaneously.

Possible future integrations:

```text

Pinterest

Google Ads

Meta / Facebook / Instagram

Reddit Ads

TikTok Business

Email campaigns

SEO analytics

```

---

## 84. Recommended future architecture evolution

Long-term architecture:

```text

Platform APIs

↓

Unified metrics layer

↓

Historical business memory

↓

AI reasoning layer

↓

Recommendation engine

↓

Human approval / automation

↓

Publishing & campaign systems

```

The Pinterest Agent becomes:

```text

first specialized module

```

inside the future broader marketing intelligence ecosystem.

---

## 85. Recommended future optimization targets

Future optimization goals should focus on:

```text

Revenue per visitor

Profit after ad spend

Email signups

Download conversions

Returning visitors

Engagement quality

Long-term traffic value

```

rather than:

```text

raw clicks only

```

---

## 86. Recommended implementation sequence

### Stage 1 — Pinterest Intelligence

Current project.

Goal:

```text

Reliable Pinterest business intelligence system

```

---

### Stage 2 — Unified reporting

Add:

```text

Google Ads

Email metrics

SEO metrics

```

Goal:

```text

Cross-platform profitability visibility

```

---

### Stage 3 — Cross-platform recommendations

Examples:

```text

Suggest best platform for specific design themes

Suggest best campaign allocation

Suggest best-performing content style

Suggest seasonal promotion timing

```

---

### Stage 4 — Semi-automated promotion workflows

Examples:

```text

Generate suggested ads

Generate suggested posts

Generate suggested campaign structures

Prepare publishing queues

Prepare experiments

```

Human approval should remain part of the workflow.

---

## 87. Important strategic understanding

The long-term goal is not:

```text

fully autonomous uncontrolled marketing

```

The recommended direction is:

```text

AI-assisted business intelligence and decision support

```

with gradually increasing automation where safe and useful.

---

## 88. Recommended early external platform applications

Important strategic recommendation:

```text

Apply for external platform developer access early.

```

Reason:

```text

Approvals may take days, weeks, or longer.

Development can continue meanwhile.

```

---

## 89. Recommended current platform application priorities

### High priority

#### Meta / Facebook / Instagram

Recommended actions:

```text

Create Meta Developer account

Create developer application

Prepare for Marketing API access later

```

Reason:

```text

Most important likely expansion after Pinterest.

```

Planned future uses:

```text

Campaign analytics

Ad management

Creative recommendations

Cross-platform profitability analysis

```

---

#### Reddit Developer Platform

Recommended actions:

```text

Create Reddit developer application

Explore Reddit API and Ads ecosystem

```

Reason:

```text

Craft and embroidery communities may convert well.

Approval burden is lower than Meta.

```

---

### Lower current priority

#### X / Twitter

Current recommendation:

```text

Postpone for now.

```

Reason:

```text

Less suitable visual discovery platform for current niche.

More restrictive/expensive API ecosystem.

```

---

#### TikTok

Current recommendation:

```text

Possible future expansion.

Not urgent currently.

```

Potential future uses:

```text

Timelapse stitching videos

Process videos

Beginner tutorials

```

---

## 90. Recommended strategic implementation sequence

Recommended order:

```text

Pinterest

↓

Meta

↓

Google Ads

↓

Reddit

```

Reason:

```text

Avoid excessive simultaneous complexity.

```

---

## 91. Important operational recommendation

When creating developer applications:

```text

Use consistent business identity

Use consistent contact email

Verify domains early

Maintain privacy policy page

Keep approval-related notes/documentation

```

Existing established website/business significantly improves approval likelihood.

---

## 92. Recommended next-day tasks

Planned tasks for the next development session:

```text

Apply for Meta Developer account/app

Apply for Reddit developer app

Continue Pinterest AI Agent development

Continue unified reporting improvements

Begin planning AI recommendation layer

```

---

## 93. Important profitability interpretation understanding

The current AI analysis layer initially reasons mostly from:

```text

short-term direct profitability

```

Example:

```text

Spend today

↓

Revenue today

↓

Immediate ROI estimate

```

This is useful but incomplete.

---

## 94. Important strategic business insight

For content/media-style websites, weak short-term margins may still be strategically acceptable.

Possible long-term effects of Pinterest traffic:

```text

Returning visitors

Email signups

Organic sharing

Brand recognition

SEO signals

Additional page views later

Future monetization

```

Therefore:

```text

temporary weak profitability does not automatically mean the campaign is bad

```

if the traffic quality is strong.

---

## 95. Example important reasoning distinction

### Short-term interpretation

```text

$12 spend → -$1 loss

Scaling may increase losses.

```

### Long-term growth interpretation

```text

Traffic may still create long-term business value.

Growth investment may be strategically rational.

```

Future versions of the agent should distinguish between:

```text

short-term profitability

```

and:

```text

long-term audience acquisition value

```

---

## 96. Future advanced optimization goals

Future AI reasoning should eventually include:

```text

Returning visitor quality

Newsletter signup growth

Long-term monetization quality

Organic amplification

Traffic retention

Engagement depth

Cross-session value

```

rather than relying only on:

```text

same-day revenue attribution

```

---

## 97. Important AI interpretation insight

The current AI recommendation:

```text

Hold spend

Thin margin risk

```

was not necessarily wrong.

The AI reasoned conservatively because it currently sees mostly:

```text

short-term business metrics

```

The recommendation quality will improve as the system gains:

```text

historical memory

trend analysis

returning-user metrics

newsletter metrics

longitudinal monetization understanding

```

---

## 98. Current estimated remaining implementation time

### To reach useful intelligent advisor stage

Estimated remaining focused work:

```text

approximately 5–10 additional focused development days

```

Remaining major milestones:

```text

Historical memory system

Trend analysis

Multi-day AI reasoning

Better attribution quality

Automated scheduling

Email reporting

Uploader recommendation integration

```

Expected outcome:

```text

useful persistent business intelligence assistant

```

---

## 99. Longer-term roadmap estimate

### Semi-autonomous assistant

Estimated:

```text

additional several weeks

```

Features:

```text

AI-assisted publishing

Board recommendations

Creative recommendations

Campaign suggestions

Cross-platform optimization

```

---

### Advanced automation stage

Estimated:

```text

weeks to months

```

because:

```text

risk management

rollback systems

confidence thresholds

safety logic

```

become increasingly important.

---

## 100. Final recommended starting point

Start with this exact target:

```text

A daily email report generated by AWS Lambda, stored in DynamoDB, using Pinterest + GA4 + AdSense data, with no automatic changes.

```

Once you trust the recommendations for at least 2–3 weeks, add an approval dashboard.

