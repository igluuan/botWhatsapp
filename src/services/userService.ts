import { prisma } from "../database/prisma.js";

const normalizePhoneFromJid = (jid: string): string => {
  return jid.split("@")[0].split(":")[0];
};

export const resolveOrCreateUserIdFromJid = async (jid: string): Promise<string> => {
  const phoneNumber = normalizePhoneFromJid(jid);
  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: {},
    create: { phoneNumber },
    select: { id: true },
  });
  return user.id;
};
