function readPrice(value: string | undefined, fallback: string): string {
  const normalized = (value || '').trim();
  return normalized || fallback;
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

  return (
    <div className="sticky top-0 z-30 border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-6xl px-4 py-2 text-center text-sm text-amber-950">
        <span className="font-semibold">Unlimited cross-stitch patterns</span>
        <span>{` | $${monthlyPrice}/month or $${yearlyPrice}/year | Cancel anytime`}</span>
      </div>
    </div>
  );
}
