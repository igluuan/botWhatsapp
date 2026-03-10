import Fastify, { FastifyInstance } from "fastify";
import { env } from "./config/env.js";
import { getLatestQr, isWhatsAppConnected } from "./whatsapp/connection.js";
import QRCode from "qrcode";

export const buildServer = (): FastifyInstance => {
  const server = Fastify({
    logger: {
      level: env.nodeEnv === "development" ? "debug" : "info",
    },
  });

  server.get("/health", async () => {
    return { status: "ok" };
  });

  server.get("/qr", async (request, reply) => {
    const qr = getLatestQr();
    if (!qr) {
      return reply.status(404).send({ error: "QR Code not available or already connected" });
    }

    const qrImage = await QRCode.toBuffer(qr);
    return reply.type("image/png").send(qrImage);
  });

  server.get("/", async (request, reply) => {
    const connected = isWhatsAppConnected();
    const qr = getLatestQr();

    if (connected) {
      return reply.type("text/html").send(`
        <html>
          <head><meta refresh="5"></head>
          <body>
            <h1>WhatsApp Bot Connected</h1>
          </body>
        </html>
      `);
    }

    if (qr) {
      return reply.type("text/html").send(`
        <html>
          <head><meta refresh="5"></head>
          <body>
            <h1>WhatsApp Bot Disconnected</h1>
            <p>Scan the QR Code below to connect:</p>
            <img src="/qr" />
            <script>
              setTimeout(() => {
                window.location.reload();
              }, 5000);
            </script>
          </body>
        </html>
      `);
    }

    return reply.type("text/html").send(`
      <html>
        <head><meta http-equiv="refresh" content="2"></head>
        <body>
          <h1>WhatsApp Bot Initializing...</h1>
          <p>Please wait while we generate a QR Code.</p>
        </body>
      </html>
    `);
  });

  return server;
};
