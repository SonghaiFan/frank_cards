export const START_SCREEN_DESCRIPTION_LIMIT = 100;

const CJK_CHARACTER = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;
const WORD_CONNECTORS = new Set(["'", "’", "-"]);

export const countTextUnits = (value: string): number => {
  let count = 0;
  let insideWord = false;

  for (const character of value) {
    if (CJK_CHARACTER.test(character)) {
      count += 1;
      insideWord = false;
    } else if (WORD_CHARACTER.test(character)) {
      if (!insideWord) count += 1;
      insideWord = true;
    } else if (!WORD_CONNECTORS.has(character)) {
      insideWord = false;
    }
  }

  return count;
};

export const limitTextUnits = (value: string, limit: number): string => {
  if (limit <= 0) return "";

  let count = 0;
  let insideWord = false;
  let result = "";

  for (const character of value) {
    let startsUnit = false;

    if (CJK_CHARACTER.test(character)) {
      startsUnit = true;
      insideWord = false;
    } else if (WORD_CHARACTER.test(character)) {
      startsUnit = !insideWord;
      insideWord = true;
    } else if (!WORD_CONNECTORS.has(character)) {
      insideWord = false;
    }

    if (startsUnit && count >= limit) break;
    if (startsUnit) count += 1;
    result += character;
  }

  return result.trimEnd();
};
