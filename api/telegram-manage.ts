// Universal Vercel Serverless Function & Express Route: telegram-manage
import {
  getTelegramCredentials,
  sendTelegramMessage,
  disableTelegramWebhook,
  parseRequestBody,
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
    const { botToken, chatId, chatIds } = getTelegramCredentials();

    if (!botToken) {
      const msg = { ok: false, message: 'TELEGRAM_BOT_TOKEN is not configured in environment variables.' };
      return res.status ? res.status(200).json(msg) : res.end(JSON.stringify(msg));
    }

    const action = req.query?.action || input?.action || 'status';

    if (action === 'delete' || action === 'delete_webhook') {
      const success = await disableTelegramWebhook(botToken);
      const delRes = { ok: success, action: 'deleteWebhook' };
      return res.status ? res.status(200).json(delRes) : res.end(JSON.stringify(delRes));
    }

    if (action === 'test' || action === 'send_test') {
      const testMsg =
        `🧪 <b>MoMo Loans Telegram Test Alert</b>\n\n` +
        `✅ Your Telegram bot is connected and sending messages successfully!\n` +
        `⏰ <b>Timestamp:</b> ${new Date().toUTCString()}\n` +
        `🌍 <b>Environment:</b> ${process.env.VERCEL ? 'Vercel Production' : process.env.NODE_ENV || 'Production'}`;

      const sendResult = await sendTelegramMessage(botToken, chatIds.length > 0 ? chatIds : chatId, testMsg);
      const testRes = {
        ok: sendResult.ok,
        action: 'sendTestMessage',
        description: sendResult.description,
        deliveredTargets: sendResult.targets,
        rawResult: sendResult.result,
      };
      return res.status ? res.status(200).json(testRes) : res.end(JSON.stringify(testRes));
    }

    // Default action: Status
    const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const infoData = (await infoRes.json()) as any;
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = (await meRes.json()) as any;

    const statusObj = {
      ok: true,
      bot: meData.ok ? meData.result : null,
      webhookInfo: infoData.ok ? infoData.result : null,
      chatIdsCount: chatIds.length,
      primaryChatConfigured: Boolean(chatId),
    };

    return res.status ? res.status(200).json(statusObj) : res.end(JSON.stringify(statusObj));
  } catch (error: any) {
    const errObj = { ok: false, error: error.message || 'Error managing telegram' };
    return res.status ? res.status(200).json(errObj) : res.end(JSON.stringify(errObj));
  }
}
