/**
 * Slide model shared by every talk deck. A deck is pure content: TalkDeck.astro
 * renders it, DeckBlock.astro renders each block. Inline emphasis in strings
 * is rendered via set:html; token classes (hl / mut / str / kw / var) are
 * styled in DeckBlock.astro.
 */

export enum BlockKind {
  Lead = 'lead',
  Pills = 'pills',
  Cards = 'cards',
  Code = 'code',
  Checklist = 'checklist',
  Stats = 'stats',
  Quote = 'quote',
  Columns = 'columns',
  Figure = 'figure',
}

export enum SlideLayout {
  Default = 'default',
  Center = 'center',
  /** The talk's cover art fills the slide; the text stays for screen readers. */
  Cover = 'cover',
}

/** Interactive figures from the write-ups that a slide can show. */
export type FigureKey =
  | 'SdkBoundary'
  | 'ContractMap'
  | 'RaceLoss'
  | 'MechanismBench'
  | 'CrossingsChart'
  | 'CallCrossing'
  | 'StalenessLadder'
  | 'TransferStates'
  | 'ChangeClassifier'
  | 'DefectPropagation'
  | 'InterviewLoopRail'
  | 'ScreenMinuteBudget'
  | 'IsolationDrillPicker'
  | 'CancellationLeakTimeline'
  | 'DesignStepCoverage'
  | 'PrepRoutePicker';

export type IconKey =
  | 'shield'
  | 'lock'
  | 'bolt'
  | 'list'
  | 'arrowUp'
  | 'bug'
  | 'tests'
  | 'build'
  | 'wiring'
  | 'logic'
  | 'copy'
  | 'image'
  | 'race'
  | 'file'
  | 'folder'
  | 'terminal'
  | 'gear'
  | 'brain'
  | 'branch'
  | 'search'
  | 'searchX'
  | 'sparkle'
  | 'check'
  | 'arrow';

export interface LeadBlock {
  kind: BlockKind.Lead;
  html: string;
  small?: boolean;
}

export interface PillItem {
  label: string;
  icon?: IconKey;
  strong?: boolean;
  arrowBefore?: boolean;
}
export interface PillsBlock {
  kind: BlockKind.Pills;
  items: PillItem[];
}

export interface CardItem {
  title: string;
  body: string;
  step?: string;
  icon?: IconKey;
}
export interface CardsBlock {
  kind: BlockKind.Cards;
  cols: 2 | 3;
  items: CardItem[];
}

export interface CodeBlock {
  kind: BlockKind.Code;
  label?: string;
  labelIcon?: IconKey;
  tone?: 'good' | 'bad' | 'neutral';
  lines: string[];
  caption?: string;
}

export interface ChecklistItem {
  title: string;
  note?: string;
}
export interface ChecklistBlock {
  kind: BlockKind.Checklist;
  items: ChecklistItem[];
  columns?: 1 | 2;
}

export interface StatItem {
  big: string;
  label: string;
}
export interface StatsBlock {
  kind: BlockKind.Stats;
  items: StatItem[];
}

export interface QuoteBlock {
  kind: BlockKind.Quote;
  html: string;
}

export interface FigureBlock {
  kind: BlockKind.Figure;
  figure: FigureKey;
}

export type LeafBlock =
  | LeadBlock
  | PillsBlock
  | CardsBlock
  | CodeBlock
  | ChecklistBlock
  | StatsBlock
  | QuoteBlock
  | FigureBlock;

export interface ColumnsBlock {
  kind: BlockKind.Columns;
  variant?: 'even' | 'wide';
  cols: LeafBlock[][];
}

export type Block = LeafBlock | ColumnsBlock;

export interface Slide {
  n: number;
  kicker: string;
  titleHtml: string;
  layout: SlideLayout;
  blocks: Block[];
  transcript: string;
}
