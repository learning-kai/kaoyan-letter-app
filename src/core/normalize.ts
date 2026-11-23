/**
 * 文本规范化：统一中英文标点、合并空白、提取槽位与词序列
 */

export interface TargetToken {
  type: 'word' | 'slot';
  raw: string; // 原始展示词，如 "First" 或 "{{aspect}}"
  normalized: string; // 小写无标点词，或槽位 id
  trailingPunct: string; // 跟随标点（, . 等）
  slotId?: string;
}

export interface UserToken {
  raw: string;
  normalized: string;
  trailingPunct: string;
  isBracketPlaceholder: boolean;
}

export function normalizePunctuationAndSpaces(input: string): string {
  return input
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/；/g, ';')
    .replace(/：/g, ':')
    .replace(/？/g, '?')
    .replace(/！/g, '!')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripEdgePunct(token: string): { core: string; trailing: string } {
  const match = token.match(/^([^.,;:!?]*?)([.,;:!?]*)$/);
  if (!match) return { core: token, trailing: '' };
  return { core: match[1], trailing: match[2] };
}

export function tokenizeTarget(templateEn: string): TargetToken[] {
  const cleaned = normalizePunctuationAndSpaces(templateEn);
  if (!cleaned) return [];
  const parts = cleaned.split(' ');
  const tokens: TargetToken[] = [];

  for (const part of parts) {
    const slotMatch = part.match(/^\{\{(\w+)\}\}([.,;:!?]*)$/);
    if (slotMatch) {
      tokens.push({
        type: 'slot',
        raw: `{{${slotMatch[1]}}}`,
        normalized: slotMatch[1],
        trailingPunct: slotMatch[2] || '',
        slotId: slotMatch[1],
      });
    } else {
      const { core, trailing } = stripEdgePunct(part);
      if (core) {
        tokens.push({
          type: 'word',
          raw: core,
          normalized: core.toLowerCase(),
          trailingPunct: trailing,
        });
      }
    }
  }
  return tokens;
}

export function tokenizeUser(userInput: string): UserToken[] {
  const cleaned = normalizePunctuationAndSpaces(userInput);
  if (!cleaned) return [];

  // 先将方括号占位符（如 [X]、[]、[能力]、[my topic]）保护为单个 token
  const rawTokens: string[] = [];
  const regex = /\[[^\]]*\][.,;:!?]*|[^\s]+/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(cleaned)) !== null) {
    rawTokens.push(m[0]);
  }

  return rawTokens
    .map((part) => {
      const bracketMatch = part.match(/^(\[[^\]]*\])([.,;:!?]*)$/);
      if (bracketMatch) {
        return {
          raw: bracketMatch[1],
          normalized: bracketMatch[1].toLowerCase(),
          trailingPunct: bracketMatch[2] || '',
          isBracketPlaceholder: true,
        };
      }
      const { core, trailing } = stripEdgePunct(part);
      return {
        raw: core || part,
        normalized: (core || part).toLowerCase(),
        trailingPunct: trailing,
        isBracketPlaceholder: false,
      };
    })
    .filter((t) => t.raw.length > 0);
}
