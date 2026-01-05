
import { GmailConfig } from "../types";

/**
 * PRODUCTION SECURITY ADVISORY:
 * In a production environment, the client_secret and refresh_token should NEVER
 * be handled in the frontend. This service should act as a proxy that calls 
 * a secure Backend Gateway (e.g., Node.js/Express) which holds the secrets.
 */

const base64UrlEncode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const getAccessToken = async (config: GmailConfig): Promise<string> => {
  // Simulating a Backend Gateway call for security isolation
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "OAuth2 Gateway Handshake Failed");
  return data.access_token;
};

export const sendEmailMessage = async (
  config: GmailConfig,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!config.clientId || !config.refreshToken) {
    return { success: false, error: "Gateway credentials missing." };
  }

  try {
    const accessToken = await getAccessToken(config);

    const emailLines = [
      `From: ${config.userEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      '',
      body,
    ];
    const rawMessage = base64UrlEncode(emailLines.join('\r\n'));

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );

    if (!response.ok) return { success: false, error: "Gmail Dispatch Failed" };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
