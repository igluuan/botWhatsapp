import { buildServer } from "./server.js";
import { env } from "./config/env.js";
import { initializeWhatsAppConnection } from "./whatsapp/connection.js";
import { processIncomingMessage } from "./pipeline/processIncomingMessage.js";

const start = async (): Promise<void> => {
  const server = buildServer();

  try {
    await server.listen({
      host: "0.0.0.0",
      port: env.port,
    });
    await initializeWhatsAppConnection(processIncomingMessage);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

void start();
