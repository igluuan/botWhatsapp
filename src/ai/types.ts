import type { ParsedFinancialMessage } from "../parser/types.js";

export type AIInterpretationResult = {
  matched: boolean;
  reason: string;
  data: ParsedFinancialMessage | null;
};

export type AIClientResponse = {
  content: string;
};
