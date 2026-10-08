/**
 * BugWug — Content Types & Schemas
 * Strict TypeScript models for puzzles, options, categories, and bug creatures.
 */

export type Language = 'python' | 'javascript';

export type BugCategory =
  | 'off_by_one'
  | 'type_error'
  | 'syntax_error'
  | 'variable_scope'
  | 'infinite_loop'
  | 'null_undefined'
  | 'logic_error'
  | 'string_indexing'
  | 'array_mutation'
  | 'comparison_error';

export type Difficulty = 1 | 2 | 3; // 1 = Easy, 2 = Medium, 3 = Hard

export interface FixOption {
  id: string; // e.g. 'opt-a', 'opt-b', 'opt-c', 'opt-d'
  codeReplacement: string; // The single replacement line
  explanation: string; // Pedagogical explanation of this option
}

export type CreatureRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BugCreature {
  id: string;
  name: string; // e.g. "Sliceworm", "Indexo", "Nullbite"
  species: string;
  rarity: CreatureRarity;
  description: string;
  avatarEmoji: string;
}

export interface BugPuzzle {
  id: string; // Unique slug: e.g. 'py-01-off-by-one'
  title: string;
  language: Language;
  category: BugCategory;
  difficulty: Difficulty;
  concept: string; // Short topic e.g. "List slicing & index boundaries"
  brief: string; // What the function or snippet is supposed to accomplish
  buggyCode: string; // Raw code string (lines <= 60 chars)
  bugLineNumber: number; // 1-indexed target line
  expectedOutput: string; // Expected terminal output
  actualOutput: string; // Actual broken terminal output / traceback
  options: [FixOption, FixOption, FixOption, FixOption]; // Exactly 4 options
  correctOptionId: string; // ID of the winning fix
  hints: [string, string, string]; // 3 escalating hints: Direction -> Diagnosis -> Strategy
  explanation: string; // Detailed post-mortem explanation
  creature: BugCreature; // Bug creature captured on success
}
