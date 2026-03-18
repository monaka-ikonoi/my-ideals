export type SearchIndex = {
  tokens: string[];
  compactTexts: string[];
};

function uniq<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function normalizeSearchText(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[「」『』【】（）()[\]{}"'`]/g, ' ')
    .replace(/[・･·•,，、。!！?？:：;；/／\\|｜]/g, ' ')
    .replace(/[_\-—–~〜]/g, ' ')
    .replace(/([a-z])([0-9])/g, '$1 $2')
    .replace(/([0-9])([a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([ぁ-んァ-ヶー一-龠々〆ヵヶ])/g, '$1 $2')
    .replace(/([ぁ-んァ-ヶー一-龠々〆ヵヶ])([a-z0-9])/g, '$1 $2')
    .replace(/[\u30a1-\u30f6]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60)) // katakana to hiragana
    .replace(/\s+/g, ' ')
    .trim();
}

export function compileSearchIndex(searchable: string[]): SearchIndex {
  const normalizedTexts = uniq(searchable.map(normalizeSearchText).filter(Boolean));

  return {
    tokens: uniq(normalizedTexts.flatMap(text => text.split(' ').filter(Boolean))),
    compactTexts: uniq(normalizedTexts.map(text => text.replace(/\s+/g, ''))),
  };
}

export function compileSearchQuery(query: string): SearchIndex | null {
  const compiled = compileSearchIndex([query]);
  return compiled.tokens.length === 0 && compiled.compactTexts.length === 0 ? null : compiled;
}

export function matchSearchIndex(index: SearchIndex | undefined, query: SearchIndex): boolean {
  if (!index) return false;

  if (query.compactTexts.some(compact => index.compactTexts.some(text => text.includes(compact)))) {
    return true;
  }

  return query.tokens.every(token => {
    return (
      index.tokens.some(t => t.includes(token)) || index.compactTexts.some(t => t.includes(token))
    );
  });
}
