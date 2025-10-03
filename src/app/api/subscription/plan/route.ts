import { NextResponse } from 'next/server';

// Interface for PayPal product
interface PayPalProduct {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
}

// Interface for PayPal products list response
interface PayPalProductsResponse {
  products: PayPalProduct[];
}

// Interface for PayPal error response
interface PayPalErrorResponse {
  name?: string;
  message?: string;
  details?: unknown[];
  error_description?: string;
}

// Interface for plan details
interface PlanDetails {
  name: string;
  description: string;
  price: string;
  frequency: {
    interval_unit: 'MONTH' | 'YEAR';
    interval_count: number;
  };
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

  console.log('PAYPAL_CLIENT_ID:', clientId ? 'Present' : 'Missing');
  console.log('PAYPAL_CLIENT_SECRET:', clientSecret ? 'Present' : 'Missing');
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials');
  }

  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as PayPalErrorResponse).error_description || 'Failed to get access token');
  }
  return data.access_token;
}

async function getExistingProduct(accessToken: string, productName: string) {
  const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
  const response = await fetch(`${apiUrl}/v1/catalogs/products?page_size=100`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const errorData = data as PayPalErrorResponse;
    throw new Error(errorData.message || errorData.error_description || 'Failed to fetch products');
  }

  const productData = data as PayPalProductsResponse;
  const product = productData.products?.find((p: PayPalProduct) => p.name === productName);
  return product ? product.id : null;
}

async function createProduct(accessToken: string, productName: string) {
  const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
  const response = await fetch(`${apiUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `PRODUCT-${Date.now()}`,
    },
    body: JSON.stringify({
      name: productName,
      description: 'Subscription for cross-stitch services',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorData = data as PayPalErrorResponse;
    throw new Error(errorData.message || errorData.error_description || 'Failed to create product');
  }
  return data.id;
}

async function createPlan(accessToken: string, productId: string, planDetails: PlanDetails) {
  const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
  const response = await fetch(`${apiUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'PayPal-Request-Id': `PLAN-${Date.now()}-${planDetails.name}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name: planDetails.name,
      description: planDetails.description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: planDetails.frequency,
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Ongoing
          pricing_scheme: { fixed_price: { value: planDetails.price, currency_code: 'USD' } },
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

  const data = await response.json();
  if (!response.ok) {
    const errorData = data as PayPalErrorResponse;
    throw new Error(errorData.message || errorData.error_description || `Failed to create ${planDetails.name}`);
  }
  return data.id;
}

export async function POST() {
  try {
    console.log('API: Creating subscription plans');
    const accessToken = await getAccessToken();

    // Check for existing product or create a new one
    const productName = 'Cross Stitch Subscription';
    let productId = await getExistingProduct(accessToken, productName);
    if (!productId) {
      productId = await createProduct(accessToken, productName);
      console.log('API: Created product:', productId);
    } else {
      console.log('API: Found existing product:', productId);
    }

    // Ensure productId is not null
    if (!productId) {
      throw new Error('Failed to obtain a valid product ID');
    }

    // Define plan details
    const plans: PlanDetails[] = [
      {
        name: 'Monthly Subscription',
        description: 'Monthly subscription for $4.50',
        price: '4.50',
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
      },
      {
        name: 'Yearly Subscription',
        description: 'Yearly subscription for $27',
        price: '27',
        frequency: { interval_unit: 'YEAR', interval_count: 1 },
      },
    ];

    // Create both plans
    const planIds = await Promise.all(
      plans.map(async (plan) => {
        const planId = await createPlan(accessToken, productId, plan);
        console.log(`API: Created ${plan.name}:`, planId);
        return { name: plan.name, id: planId };
      })
    );

    // Return monthly and yearly plan IDs
    const response = {
      monthlyPlanId: planIds.find((p) => p.name === 'Monthly Subscription')?.id,
      yearlyPlanId: planIds.find((p) => p.name === 'Yearly Subscription')?.id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('API: Error creating subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plans' },
      { status: 500 }
    );
  }
}