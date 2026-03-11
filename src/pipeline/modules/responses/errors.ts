export const notUnderstoodResponse = (): string => {
  return "Hmm, não entendi 🤔\nTenta assim: *uber 25* ou *mercado 80*";
};

export const duplicateTransactionResponse = (): string => {
  return [
    "Espera — isso parece igual ao que acabei de anotar 🤨",
    "Já registrei algo parecido agora há pouco. É diferente?",
  ].join("\n");
};

export const invalidAmountResponse = (): string => {
  return [
    "Não achei o valor aí 💰",
    "Tenta: *farmácia 35* ou *gasolina 120,50*",
  ].join("\n");
};

export const aiUnavailableResponse = (): string => {
  return [
    "Tô com dificuldades técnicas agora 😓",
    "Mas consigo anotar: *descrição valor*",
    "Ex: *mercado 80*",
  ].join("\n");
};

export const transactionNotFoundResponse = (transactionId: string): string => {
  return [
    `Não achei o lançamento #${transactionId} 🔍`,
    "O ID aparece quando você registra algo.",
  ].join("\n");
};

export const unexpectedRegistrationErrorResponse = (): string => {
  return "Algo deu errado aqui 😬\nPode tentar de novo?";
};

export const unexpectedProcessingErrorResponse = (): string => {
  return "Algo deu errado aqui 😬\nPode tentar de novo?";
};

export const editCategorySuccessResponse = (transactionId: string, category: string): string => {
  return `✅ Atualizado!\ncategoria → *${category}* · 🆔 #${transactionId}`;
};

export const editAmountSuccessResponse = (transactionId: string, amount: number): string => {
  const formatted = amount.toFixed(2).replace(".", ",");
  return `Feito! 🔄 valor atualizado → *R$ ${formatted}*\n🆔 #${transactionId}`;
};

export const deleteSuccessResponse = (transactionId: string): string => {
  return Math.random() < 0.5
    ? `🗑️ Removido! #${transactionId}`
    : `Pronto, apaguei! 🗑️ #${transactionId}`;
};
