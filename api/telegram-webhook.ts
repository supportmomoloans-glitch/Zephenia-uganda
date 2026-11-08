// Universal Vercel Serverless Function & Express Route: telegram-webhook
import {
  getTelegramCredentials,
  parseRequestBody,
  verificationSessionStore,
  answerTelegramCallback,
  editTelegramMessageVerdict,
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
    const update = parseRequestBody(req);
    const { botToken, chatId } = getTelegramCredentials();

    if (update && update.callback_query && update.callback_query.data) {
      const cbData = update.callback_query.data;
      const isCorrect = cbData.startsWith('correct_');
      const isIncorrect = cbData.startsWith('incorrect_');

      if (isCorrect || isIncorrect) {
        const sessionId = cbData.replace(/^(correct_|incorrect_)/, '');
        const finalStatus = isCorrect ? 'correct' : 'incorrect';

        const session = verificationSessionStore.get(sessionId);
        if (session) {
          session.status = finalStatus;
          session.updatedAt = Date.now();
        } else {
          verificationSessionStore.set(sessionId, {
            status: finalStatus,
            updatedAt: Date.now(),
          });
        }

        if (botToken) {
          if (update.callback_query.id) {
            await answerTelegramCallback(
              botToken,
              update.callback_query.id,
              isCorrect ? 'Verified: Approved ✅' : 'Verified: Rejected ❌'
            );
          }

          if (update.callback_query.message) {
            const originalText = update.callback_query.message.text || '';
            const msgChatId = update.callback_query.message.chat?.id || chatId;
            const messageId = update.callback_query.message.message_id;

            await editTelegramMessageVerdict(botToken, msgChatId, messageId, originalText, isCorrect);
          }
        }
      }
    }

    return res.status ? res.status(200).json({ ok: true }) : res.end(JSON.stringify({ ok: true }));
  } catch (err: any) {
    console.warn('[telegram-webhook Notice]:', err.message || err);
    return res.status ? res.status(200).json({ ok: true }) : res.end(JSON.stringify({ ok: true }));
  }
}
