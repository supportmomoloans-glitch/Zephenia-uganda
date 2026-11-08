// Universal Vercel Serverless & Express Health & Diagnostics Endpoint
import {
  getTelegramCredentials,
  getSafeTelegramDiagnostics,
  sendTelegramMessage,
  parseRequestBody,
} from './_telegram';

export default async function handler(req: any, res: any) {
  try {
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

    const input = parseRequestBody(req);
    const shouldSendTest = req.query?.test === '1' || req.query?.test === 'true' || input?.test === true;

    const diagnostics = await getSafeTelegramDiagnostics();
    let testResult: any = null;

    if (shouldSendTest) {
      const { botToken, chatId, chatIds } = getTelegramCredentials();
      if (botToken && chatId) {
        const testText =
          `🔔 <b>MoMo Loans Health Check Test</b>\n\n` +
          `✅ Telegram dispatch connection is fully operational!\n` +
          `⏰ <b>Server Time:</b> ${new Date().toUTCString()}\n` +
          `🌍 <b>Platform:</b> ${process.env.VERCEL ? 'Vercel Production' : process.env.NODE_ENV || 'Production'}`;

        const dispatch = await sendTelegramMessage(botToken, chatIds.length > 0 ? chatIds : chatId, testText);
        testResult = {
          attempted: true,
          delivered: dispatch.ok,
          description: dispatch.description,
          targets: dispatch.targets,
        };
      } else {
        testResult = {
          attempted: false,
          error: 'Cannot dispatch test message: botToken or chatId is not configured.',
        };
      }
    }

    const payload = {
      status: 'ok',
      ...diagnostics,
      ...(testResult ? { testMessage: testResult } : {}),
    };

    if (res.status && typeof res.status === 'function') {
      return res.status(200).json(payload);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(payload));
    }
  } catch (error: any) {
    const errorPayload = {
      status: 'error',
      message: error.message || 'Internal health check error',
    };
    if (res.status && typeof res.status === 'function') {
      return res.status(200).json(errorPayload);
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(errorPayload));
    }
  }
}
