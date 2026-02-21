function readPrice(value: string | undefined, fallback: string): string {
  const normalized = (value || '').trim();
  return normalized || fallback;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return rounded > 0 ? rounded : fallback;
}

export default function PaidModeBanner() {
  const monthlyPrice = readPrice(
    process.env.PAYPAL_MONTHLY_PRICE || process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PRICE,
    '4.50',
  );
  const yearlyPrice = readPrice(
    process.env.PAYPAL_YEARLY_PRICE || process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PRICE,
    '27',
  );
  const trialDownloads = readPositiveInteger(
    process.env.TRIAL_DOWNLOAD_LIMIT || process.env.NEXT_PUBLIC_TRIAL_DOWNLOAD_LIMIT,
    10,
  );
  const trialDays = readPositiveInteger(
    process.env.TRIAL_DURATION_DAYS || process.env.NEXT_PUBLIC_TRIAL_DURATION_DAYS,
    30,
  );

  return (
    <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-6xl px-4 py-2 text-center text-sm text-amber-950">
        <span className="font-semibold">{`Free trial: ${trialDownloads} downloads for ${trialDays} days`}</span>
        <span>{` | Then unlimited access for $${monthlyPrice}/month or $${yearlyPrice}/year | Cancel anytime`}</span>
      </div>
    </div>
  );
}
