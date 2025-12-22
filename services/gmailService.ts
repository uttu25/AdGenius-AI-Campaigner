
import { GmailConfig } from "../types";

/**
 * Helper to encode strings to Base64URL (no padding, URL safe)
 */
const base64UrlEncode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Exchanges the Refresh Token for a fresh Access Token using Google OAuth2
 */
const getAccessToken = async (config: GmailConfig): Promise<string> => {
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

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Failed to authenticate with Google (OAuth2 Error)");
  }

  return data.access_token;
};

/**
 * Sends a real email campaign message via Gmail API.
 * Performs real authentication and message dispatch.
 */
export const sendEmailMessage = async (
  config: GmailConfig,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!config.clientId || !config.clientSecret || !config.refreshToken || !config.userEmail) {
    return { success: false, error: "Gmail API configuration is incomplete (check Client ID/Secret/Token)." };
  }

  try {
    // 1. Get a fresh Access Token
    const accessToken = await getAccessToken(config);

    // 2. Construct the RFC 2822 Message
    // Note: Gmail API expects the message in 'raw' format (Base64URL encoded)
    const emailLines = [
      `From: ${config.userEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      body,
    ];
    const rawMessage = base64UrlEncode(emailLines.join('\r\n'));

    // 3. Dispatch via Gmail API
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: rawMessage,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle API errors (like 400 Bad Request if email is invalid format)
      return { 
        success: false, 
        error: data.error?.message || `Gmail API Error: ${response.status}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Gmail Service Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error connecting to Google Services" 
    };
  }
};
