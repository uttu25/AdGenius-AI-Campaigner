import { GmailConfig } from "../types";

const base64UrlEncode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const getAccessToken = async (config: GmailConfig): Promise<string> => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await fetch(`${API_URL}/api/auth/google/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Token Refresh Failed");
  return data.access_token;
};

export const sendEmailMessage = async (
  config: GmailConfig,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!config.clientId || !config.refreshToken) return { success: false, error: "Gateway credentials missing." };
  try {
    const accessToken = await getAccessToken(config);
    const emailLines = [
      `From: ${config.userEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ];
    const rawMessage = base64UrlEncode(emailLines.join('\r\n'));
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );
    if (!response.ok) return { success: false, error: "Gmail Dispatch Failed" };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
