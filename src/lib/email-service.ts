// File: src/app/lib/emailservice.ts

import AWS from 'aws-sdk';

// Initialize SES client (reuse your existing configuration)
const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// Administrative email for notifications like IP logs (updated to specified address)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'Olga.Epstein@gmail.com';

/**
 * Sends an email using AWS SES (v2 SDK).
 * @param params - Email parameters including recipient, subject, and body.
 * @returns A promise that resolves to the message ID if successful.
 * @throws Error if sending fails.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  body: string;
  from?: string; // Optional; defaults to verified sender
  isHtml?: boolean; // Optional; defaults to true for HTML body
}) {
  const { to, subject, body, from = process.env.AWS_SES_FROM_EMAIL || 'no-reply@yourdomain.com', isHtml = true } = params;

  // Validate required environment variables
  if (!process.env.AWS_SES_FROM_EMAIL) {
    throw new Error('AWS_SES_FROM_EMAIL environment variable is required');
  }

  // Construct the message body conditionally to avoid undefined Data
  const messageBody: AWS.SES.Body = {};
  if (isHtml) {
    messageBody.Html = {
      Data: body,
      Charset: 'UTF-8',
    };
  } else {
    messageBody.Text = {
      Data: body,
      Charset: 'UTF-8',
    };
  }

  const paramsForSend: AWS.SES.SendEmailRequest = {
    Source: from,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: messageBody,
    },
  };

  try {
    const response = await ses.sendEmail(paramsForSend).promise();
    console.log('Email sent successfully. Message ID:', response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error('Error sending email via SES:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

 
/**
 * Convenience function to send email to admin..
 */
 export async function sendEmailToAdmin(
  subject: string,
  body: string,
  from?: string, // Optional; defaults to verified sender
  isHtml?: boolean // Optional; defaults to true for HTML body
) {
    const paramsForSend = {
      to: ADMIN_EMAIL,
      subject,
      body,
      from,
      isHtml
    };
  return sendEmail(paramsForSend);
}

