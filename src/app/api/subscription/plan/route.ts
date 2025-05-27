import { NextResponse } from 'next/server';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  console.log('PAYPAL_CLIENT_ID:', clientId ? 'Present' : 'Missing');
  console.log('PAYPAL_CLIENT_SECRET:', clientSecret ? 'Present' : 'Missing');

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials');
  }

  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to get access token');
  }
  return data.access_token;
}

export async function POST() {
  try {
    console.log('API: Creating subscription plan');
    const accessToken = await getAccessToken();

    // Create a product
    const productResponse = await fetch('https://api-m.sandbox.paypal.com/v1/catalogs/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `PRODUCT-${Date.now()}`,
      },
      body: JSON.stringify({
        name: 'Cross Stitch Subscription',
        description: 'Monthly subscription for cross-stitch services',
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    });

    const productData = await productResponse.json();
    if (!productResponse.ok) {
      throw new Error(productData.error_description || 'Failed to create product');
    }
    const productId = productData.id;
    console.log('API: Created product:', productId);

    // Create a plan
    const planResponse = await fetch('https://api-m.sandbox.paypal.com/v1/billing/plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': `PLAN-${Date.now()}`,
      },
      body: JSON.stringify({
        product_id: productId,
        name: 'Monthly Subscription',
        description: 'Monthly subscription for $10',
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Ongoing
            pricing_scheme: { fixed_price: { value: '10', currency_code: 'USD' } },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: { value: '0', currency_code: 'USD' },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    });

    const planData = await planResponse.json();
    if (!planResponse.ok) {
      throw new Error(planData.error_description || 'Failed to create plan');
    }
    console.log('API: Created plan:', planData.id);

    return NextResponse.json({ planId: planData.id });
  } catch (error) {
    console.error('API: Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}