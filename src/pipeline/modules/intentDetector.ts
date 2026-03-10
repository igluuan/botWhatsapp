import { isGreeting } from "./greetingDetector.js";
import { isHelp } from "./helpDetector.js";
import { hasMoneyValue } from "./moneyDetector.js";
import { isSmallTalk } from "./smallTalkDetector.js";
import { isExpenseQuery } from "./expenseQueryDetector.js";

export type MessageIntent =
  | "greeting"
  | "help"
  | "small_talk"
  | "financial"
  | "expense_query"
  | "unknown";

export const detectIntent = (text: string): MessageIntent => {
  if (isGreeting(text)) return "greeting";
  if (isHelp(text)) return "help";
  if (isSmallTalk(text)) return "small_talk";
  if (isExpenseQuery(text)) return "expense_query";
  if (hasMoneyValue(text)) return "financial";
  return "unknown";
};
