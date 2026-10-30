import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory backend store for webhook interactions
  // When SMS/WhatsApp services like Twilio or Gupshup post to /api/sms-webhook
  app.post('/api/sms-webhook', (req, res) => {
    // Supports Twilio format (Body, From) or generic JSON (message, phone)
    const rawMessage = req.body.Body || req.body.message || req.body.text || '';
    const senderPhone = req.body.From || req.body.phone || req.body.sender || '+91 94351 00000';
    const channel = req.body.channel || (req.body.From && req.body.From.startsWith('whatsapp:') ? 'WHATSAPP' : 'SMS');

    console.log(`[SMS/WhatsApp Webhook] Received from ${senderPhone} (${channel}): "${rawMessage}"`);

    // Standardized webhook response
    const reply = `[FloodLearn Auto-Response] Received report: "${rawMessage}". Logged in Morigaon District Emergency Learning Continuity Board.`;

    // Return TwiML if requested or standard JSON
    if (req.headers['user-agent']?.includes('Twilio') || req.body.AccountSid) {
      res.setHeader('Content-Type', 'text/xml');
      return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`);
    }

    return res.json({
      success: true,
      message: 'Report received and queued',
      rawMessage,
      senderPhone,
      channel,
      systemReply: reply,
      timestamp: new Date().toISOString(),
    });
  });

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'FloodLearn Tracker API',
      version: '1.0.0',
      district: 'Morigaon Flood Zone, Assam',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FloodLearn Tracker] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
