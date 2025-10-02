import { NextResponse } from 'next/server';
import { createUser, createTestUser } from '@/lib/DataAccess';
import AWS from 'aws-sdk';

// Configure AWS SDK with credentials from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Initialize SES client
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// POST handler for subscription confirmation
export async function POST(request: Request) {
  try {
   
     
    const body = await request.json();
    // Print request JSON to console
    
    const { email, password, username, subscriptionId } = body;
    console.log('Request JSON:',email, password, username, subscriptionId);
    
    // Validate request body
    if (!email || !password || !username || !subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if request is from localhost
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost');
   
      // Call appropriate user creation function
    if (isLocalhost) {
      console.log('Request from localhost, creating test user');
      await createTestUser(email, password, username, subscriptionId);
    } else {
      console.log('Request from non-localhost, creating regular user');
      await createUser(email, password, username, subscriptionId);
    }
   
    // Send notification email to admin
    const adminEmail = 'olga.epstein@gmail.com'; // Replace with your admin email address
    const fromEmail = 'ann@cross-stitch-pattern.net'; // Replace with your admin email address
    const params = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [adminEmail],
      },
      Message: {
        Subject: {
          Data: 'New Subscription Notification',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <h1>New Subscription Alert</h1>
              <p>A new subscription has been confirmed:</p>
              <ul>
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Subscription ID:</strong> ${subscriptionId}</li>
              </ul>
              <p>Please review the details in the admin dashboard.</p>
              <p>Best regards,<br>Cross-Stitch System</p>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `New Subscription Alert\n\nA new subscription has been confirmed:\n- Username: ${username}\n- Email: ${email}\n- Subscription ID: ${subscriptionId}\n\nPlease review the details in the admin dashboard.\n\nBest regards,\nCross-Stitch System`,
            Charset: 'UTF-8',
          },
        },
      },
    };
    console.log('Sending notification email to admin: ', adminEmail, ' from: ', fromEmail);
    await ses.sendEmail(params).promise();

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing subscription confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}