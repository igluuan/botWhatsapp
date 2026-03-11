import makeWASocket, {
  type WASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { env } from "../config/env.js";
import type { PipelineIncomingMessage } from "../pipeline/types.js";
import { Boom } from "@hapi/boom";

let latestQr: string | null = null;
let isConnected = false;
let retryCount = 0;

export const getLatestQr = (): string | null => latestQr;
export const isWhatsAppConnected = (): boolean => isConnected;

const toDate = (value: unknown): Date => {
  if (typeof value === "number") {
    return new Date(value * 1000);
  }

  if (
    typeof value === "object" &&
    value &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return new Date(value.toNumber() * 1000);
  }

  return new Date();
};

export const initializeWhatsAppConnection = async (
  onMessage: (message: PipelineIncomingMessage, socket: WASocket) => Promise<void>,
): Promise<WASocket> => {
  const { state, saveCreds } = await useMultiFileAuthState(env.whatsappAuthDir);
  const { version } = await fetchLatestBaileysVersion();
  
  const socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    syncFullHistory: false,
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQr = qr;
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      
      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect,
      );

      if (shouldReconnect) {
        const delay = Math.min(retryCount * 2000, 15000);
        console.log(`Reconnecting in ${delay}ms...`);
        setTimeout(() => {
            initializeWhatsAppConnection(onMessage);
        }, delay);
        retryCount++;
      }
    } else if (connection === "open") {
      console.log("opened connection");
      latestQr = null;
      isConnected = true;
      retryCount = 0;
    }
  });
  socket.ev.on("messages.upsert", async (event) => {
    if (event.type !== "notify") {
      return;
    }

    for (const message of event.messages) {
      if (!message.message || message.key.fromMe) {
        continue;
      }

      // Use JID real (preferindo o alternativo se existir, para lidar com LIDs)
      // @ts-ignore - remoteJidAlt pode não estar na tipagem padrão ainda, mas existe em runtime
      const effectiveJid = message.key.remoteJidAlt || message.key.remoteJid;
      
      const remoteJid = effectiveJid;
      if (!remoteJid || remoteJid === "status@broadcast") {
        continue;
      }

      await onMessage({
        messageId: message.key.id ?? "",
        remoteJid,
        pushName: message.pushName ?? undefined,
        timestamp: toDate(message.messageTimestamp),
        rawPayload: message,
      }, socket);
    }
  });

  return socket;
};
