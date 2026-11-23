export type POS = 'noun' | 'verb' | 'doing';

export interface Slot {
  id: string;
  label: string;
  pos: POS;
  filler: string;
  fillerZh: string;
  hint?: string;
}

export type Layer = 'L1' | 'L2' | 'L3';

export type SentenceRole =
  | 'emotion'
  | 'purpose'
  | 'lead'
  | 'body'
  | 'closing'
  | 'signoff'
  | 'heading';

export interface Sentence {
  id: string;
  layer: Layer;
  role: SentenceRole;
  en: string;
  zh: string;
  cue: string;
  resultWord?: string;
  connector?: string;
  slots: string[];
  storyNodeIndex?: number;
}

export type TemplateId =
  | 'suggest'
  | 'invite'
  | 'notice'
  | 'apology'
  | 'thanks'
  | 'intro'
  | 'congrats';

export interface Template {
  id: TemplateId;
  name: string;
  priority: number;
  optional?: boolean;
  storyLine: string[];
  storyLineDetail: string;
  keywords: string[];
  sentenceIds: string[];
  paragraphs: string[][];
  warnings: string[];
  firstWordChain: string;
}
