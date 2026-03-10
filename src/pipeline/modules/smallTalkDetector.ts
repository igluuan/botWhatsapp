const SMALL_TALK = ["tudo bem", "como vai", "beleza", "e ai"];

export const isSmallTalk = (text: string): boolean => {
  return SMALL_TALK.some((pattern) => text.includes(pattern));
};
