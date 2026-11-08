// Universal Vercel Serverless Function & Express Route: checkVerification
import {
  getTelegramCredentials,
  parseRequestBody,
  verificationSessionStore,
  answerTelegramCallback,
  editTelegramMessageVerdict,
  disableTelegramWebhook,
  checkBotTokenValidity,
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

  try {
    const input = parseRequestBody(req);
    const sessionId = input.sessionId || req.query?.sessionId;

    if (!sessionId) {
      const payload = { status: 'correct' };
      return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
    }

    // 1. Check in-memory store (instant response on persistent servers or warm serverless)
    const existingSession = verificationSessionStore.get(sessionId);
    if (existingSession && existingSession.status !== 'pending') {
      const payload = { status: existingSession.status };
      return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
    }

    const { botToken, chatId } = getTelegramCredentials();

    // 2. If bot token is not configured or unauthorized (401), auto-resolve to avoid blocking
    if (!botToken || botToken.includes('EXAMPLE')) {
      const payload = { status: existingSession?.status || 'correct' };
      return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
    }

    const isTokenValid = await checkBotTokenValidity(botToken);
    if (!isTokenValid) {
      const payload = { status: existingSession?.status || 'correct' };
      return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
    }

    // 3. Query Telegram getUpdates for callback_query resolution
    const fetchTelegramUpdates = async () => {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?limit=50&allowed_updates=${encodeURIComponent(
        '["callback_query","message"]'
      )}`;
      return await fetch(url);
    };

    let tgRes = await fetchTelegramUpdates();

    // If 409 Conflict because webhook is active, remove webhook once and retry
    if (tgRes.status === 409) {
      await disableTelegramWebhook(botToken);
      tgRes = await fetchTelegramUpdates();
    }

    if (tgRes.ok) {
      const data = (await tgRes.json()) as any;
      if (data && data.ok && Array.isArray(data.result)) {
        for (let i = data.result.length - 1; i >= 0; i--) {
          const update = data.result[i];
          const cbData = update.callback_query?.data;

          if (cbData && (cbData.includes(sessionId) || cbData.endsWith(sessionId))) {
            const isCorrect = cbData.startsWith('correct_');
            const isIncorrect = cbData.startsWith('incorrect_');

            if (isCorrect || isIncorrect) {
              const finalStatus = isCorrect ? 'correct' : 'incorrect';

              // Update in-memory session store
              if (existingSession) {
                existingSession.status = finalStatus;
                existingSession.updatedAt = Date.now();
              } else {
                verificationSessionStore.set(sessionId, {
                  status: finalStatus,
                  updatedAt: Date.now(),
                });
              }

              // Acknowledge Telegram callback toast
              if (update.callback_query?.id) {
                await answerTelegramCallback(
                  botToken,
                  update.callback_query.id,
                  isCorrect ? 'Verified: Approved ✅' : 'Verified: Rejected ❌'
                );
              }

              // Update original Telegram message buttons to reflect verdict
              if (update.callback_query?.message) {
                const origText = update.callback_query.message.text || '';
                const msgChatId = update.callback_query.message.chat?.id || chatId;
                const msgId = update.callback_query.message.message_id;
                await editTelegramMessageVerdict(botToken, msgChatId, msgId, origText, isCorrect);
              }

              const payload = { status: finalStatus };
              return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
            }
          }
        }
      }
    }

    const payload = { status: existingSession?.status || 'pending' };
    return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
  } catch (error: any) {
    console.warn('[checkVerification Notice]:', error.message || error);
    const payload = { status: 'pending' };
    return res.status ? res.status(200).json(payload) : res.end(JSON.stringify(payload));
  }
}
