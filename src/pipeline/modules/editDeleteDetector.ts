export type EditDeleteIntent =
  | { action: "edit_category"; transactionId: string; newCategory: string }
  | { action: "edit_amount"; transactionId: string; newAmount: number }
  | { action: "delete"; transactionId: string }
  | null;

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const extractShortId = (text: string): string | null => {
  const match = text.match(/#([a-f0-9]{8})\b/i);
  return match ? match[1].toLowerCase() : null;
};

const CATEGORY_EDIT_PATTERNS = [
  /muda\s+categoria/u,
  /corrige\s+categoria/u,
  /corrigir\s+categoria/u,
  /alterar\s+categoria/u,
  /categoria\s+errada/u,
  /troca\s+categoria/u,
  /edita\s+categoria/u,
];

const AMOUNT_EDIT_PATTERNS = [
  /muda\s+valor/u,
  /corrige\s+valor/u,
  /corrigir\s+valor/u,
  /alterar\s+valor/u,
  /valor\s+errado/u,
  /troca\s+valor/u,
  /edita\s+valor/u,
];

const DELETE_PATTERNS = [
  /apaga\s+/u,
  /apagar\s+/u,
  /deleta\s+/u,
  /deletar\s+/u,
  /remove\s+/u,
  /remover\s+/u,
  /cancela\s+/u,
  /cancelar\s+/u,
  /exclui\s+/u,
  /excluir\s+/u,
];

const AMOUNT_PATTERN = /r?\$?\s*(\d+(?:[.,]\d{1,2})?)/i;

const extractNewCategory = (text: string): string | null => {
  const prefixMatch = text.match(/(?:pra|para|como|:\s*)([a-záéíóúãõâêôàç\s]+?)(?:\s+#|\s*$)/iu);
  if (prefixMatch) {
    const candidate = prefixMatch[1].trim();
    if (candidate.length >= 2) return candidate.toLowerCase();
  }
  return null;
};

export const detectEditDeleteIntent = (text: string): EditDeleteIntent => {
  const key = normalize(text);
  const shortId = extractShortId(text);

  if (!shortId) return null;

  if (DELETE_PATTERNS.some((p) => p.test(key))) {
    return { action: "delete", transactionId: shortId };
  }

  if (CATEGORY_EDIT_PATTERNS.some((p) => p.test(key))) {
    const newCategory = extractNewCategory(key);
    if (!newCategory) return null;
    return { action: "edit_category", transactionId: shortId, newCategory };
  }

  if (AMOUNT_EDIT_PATTERNS.some((p) => p.test(key))) {
    const amountMatch = key.match(AMOUNT_PATTERN);
    if (!amountMatch) return null;
    const raw = amountMatch[1].replace(",", ".");
    const newAmount = parseFloat(raw);
    if (!isFinite(newAmount) || newAmount <= 0) return null;
    return { action: "edit_amount", transactionId: shortId, newAmount };
  }

  return null;
};
