export type ParsedFinancialMessage = {
  type: "expense" | "income";
  amount: number;
  category: string;
  payment_method: string | null;
  description: string;
};

export type DeterministicParserResult = {
  matched: boolean;
  reason: string;
  data: ParsedFinancialMessage | null;
};
