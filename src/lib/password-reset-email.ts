import {
  SESClient,
  SendEmailCommand,
} from '@aws-sdk/client-ses';

const REGION = process.env.AWS_REGION || 'us-east-1';

// Who is sending the email
const FROM_EMAIL =
  process.env.SES_FROM_EMAIL || 'no-reply@cross-stitch-pattern.net';

// Base URL of your website (to generate the reset link)
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://scross-stitch-pattern.net';

const sesClient = new SESClient({ region: REGION });

export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
}) {
  const { to, token } = params;

  // User will be directed to /reset-password/[token]
  const resetLink = `${APP_BASE_URL}/reset-password/${encodeURIComponent(
    token,
  )}`;

  const subject = 'Reset your password on Cross-Stitch-Pattern.net';

  const textBody = [
    'You requested to reset your password on Cross-Stitch-Pattern.net.',
    '',
    'To choose a new password, please follow this link:',
    resetLink,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    'Happy stitching,',
    'Cross-Stitch-Pattern.net',
  ].join('\n');

  const htmlBody = `
    <p>You requested to reset your password on <strong>Cross-Stitch-Pattern.net</strong>.</p>

    <p>To choose a new password, please click the button below:</p>

    <p>
      <a href="${resetLink}"
         style="
           display:inline-block;
           padding:10px 18px;
           border-radius:4px;
           background-color:#4b6cb7;
           color:#ffffff;
           text-decoration:none;
           font-weight:500;
         ">
        Reset password
      </a>
    </p>

    <p>If the button does not work, copy and paste this link into your browser:</p>

    <p><a href="${resetLink}">${resetLink}</a></p>

    <p>If you did not request a password reset, you can safely ignore this email.</p>

    <p>Happy stitching,<br/>Cross-Stitch-Pattern.net</p>
  `;

  await sesClient.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
          Html: { Data: htmlBody },
        },
      },
    }),
  );
}
