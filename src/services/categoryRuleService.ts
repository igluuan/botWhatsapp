import { prisma } from "../database/prisma.js";

const normalizeKeyword = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const saveUserCategoryRule = async (
  userId: string,
  description: string,
  category: string,
): Promise<void> => {
  const keyword = normalizeKeyword(description);
  if (!keyword || keyword.length < 2) return;

  await prisma.userCategoryRule.upsert({
    where: { userId_keyword: { userId, keyword } },
    create: { userId, keyword, category },
    update: { category },
  });
};

export const findUserCategoryRule = async (
  userId: string,
  description: string,
): Promise<string | null> => {
  const key = normalizeKeyword(description);
  if (!key) return null;

  const exact = await prisma.userCategoryRule.findFirst({
    where: { userId, keyword: key },
    select: { category: true },
  });
  if (exact) return exact.category;

  const rules = await prisma.userCategoryRule.findMany({
    where: { userId },
    select: { keyword: true, category: true },
    orderBy: { keyword: "desc" },
  });

  for (const rule of rules) {
    if (key.includes(rule.keyword)) return rule.category;
  }

  return null;
};

export const listUserCategoryRules = async (
  userId: string,
): Promise<Array<{ keyword: string; category: string }>> => {
  const rules = await prisma.userCategoryRule.findMany({
    where: { userId },
    select: { keyword: true, category: true },
    orderBy: { keyword: "asc" },
  });
  return rules;
};

export const deleteUserCategoryRule = async (
  userId: string,
  description: string,
): Promise<boolean> => {
  const keyword = normalizeKeyword(description);
  if (!keyword) return false;

  try {
    await prisma.userCategoryRule.delete({
      where: { userId_keyword: { userId, keyword } },
    });
    return true;
  } catch {
    return false;
  }
};
