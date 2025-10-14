import axios from 'axios';

export async function POST(req) {
  try {
    // Parse the incoming webhook request body
    const body = await req.json();

    // Extract PayPal-specific headers for signature verification
    const headers = req.headers;
    const transmissionId = headers.get('PayPal-Transmission-Id');
    const transmissionTime = headers.get('PayPal-Transmission-Time');
    const certUrl = headers.get('PayPal-Cert-Url');
    const authAlgo = headers.get('PayPal-Auth-Algo');
    const transmissionSig = headers.get('PayPal-Transmission-Sig');
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    console.log('Received PayPal webhook:', body);
    // Validate environment variables
    if (!webhookId || !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('Missing required environment variables: PAYPAL_WEBHOOK_ID, PAYPAL_CLIENT_ID, or PAYPAL_CLIENT_SECRET');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Obtain PayPal access token (production endpoint)
    const authResponse = await axios.post(
      'https://api-m.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
      }
    );

    const accessToken = authResponse.data.access_token;
    if (!accessToken) {
      console.error('Failed to obtain PayPal access token');
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log('All request headers:', Object.fromEntries(headers));
    console.log('PayPal access token obtained successfully');
    console.log('certUrl:', certUrl);
    
    // Verify webhook signature (production endpoint)
    const verifyUrl = 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature';
    const verifyPayload = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body,
    };

    const verifyResponse = await axios.post(verifyUrl, verifyPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const protocol = headers.get('x-forwarded-proto') || 'https';
    const host = headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    const notifyAdmin = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/notify-admin`, { method: 'POST' });
        if (response.ok) {
          console.log('Admin notified of webhook received.');
        } else {
          throw new Error(`API response not OK: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to send email notification to admin:', error);
      }
    };

    if (verifyResponse.status !== 200) {
      console.error('Webhook verification API call failed with status:', verifyResponse.status);
      await notifyAdmin();
      return new Response(JSON.stringify({ error: 'Webhook verification failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await notifyAdmin();
    if (verifyResponse.data.verification_status !== 'SUCCESS') {
      console.log('verifyResponse.data:', verifyResponse.data);
      console.error('Webhook signature verification failed:', verifyResponse.data);
      await notifyAdmin();
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Process the webhook event
    const eventType = body.event_type;
    console.log(`Received PayPal webhook event: ${eventType}`, body);

    // Handle specific event types
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const paymentId = body.resource.id;
      const amount = body.resource.amount.value;
      console.log(`Payment completed: ID=${paymentId}, Amount=${amount}`);
      // Add your business logic here (e.g., update database, send confirmation)
    } else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = body.resource.id;
      console.log(`Order approved: ID=${orderId}`);
      // Add your business logic here
    }

    // Respond with 2xx status to acknowledge receipt
    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}