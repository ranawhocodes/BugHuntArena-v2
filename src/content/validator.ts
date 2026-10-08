import type { BugPuzzle } from './types';
import { MAX_CODE_LINE_LENGTH } from '../engine/constants';

const VALID_CATEGORIES = new Set([
  'off_by_one',
  'type_error',
  'syntax_error',
  'variable_scope',
  'infinite_loop',
  'null_undefined',
  'logic_error',
  'string_indexing',
  'array_mutation',
  'comparison_error',
]);

const VALID_RARITIES = new Set(['common', 'rare', 'epic', 'legendary']);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Pure validator function for BugWug puzzles.
 * Checks all constraints specified in the design doc.
 */
export function validatePuzzle(puzzle: BugPuzzle): ValidationResult {
  const errors: string[] = [];

  if (!puzzle.id || typeof puzzle.id !== 'string' || !/^[a-z0-9-]+$/.test(puzzle.id)) {
    errors.push(`Invalid puzzle ID: "${puzzle.id}". Must be kebab-case.`);
  }

  if (!puzzle.title || puzzle.title.trim().length === 0) {
    errors.push('Puzzle title cannot be empty.');
  }

  if (puzzle.language !== 'python' && puzzle.language !== 'javascript') {
    errors.push(`Invalid language: "${puzzle.language}". Must be python or javascript.`);
  }

  if (!VALID_CATEGORIES.has(puzzle.category)) {
    errors.push(`Invalid category: "${puzzle.category}".`);
  }

  if (![1, 2, 3].includes(puzzle.difficulty)) {
    errors.push(`Invalid difficulty: ${puzzle.difficulty}. Must be 1, 2, or 3.`);
  }

  if (!puzzle.brief || puzzle.brief.trim().length === 0) {
    errors.push('Puzzle brief cannot be empty.');
  }

  const lines = puzzle.buggyCode.split('\n');
  if (lines.length < 3) {
    errors.push(`Buggy code must have at least 3 lines (found ${lines.length}).`);
  }

  lines.forEach((line, index) => {
    if (line.length > MAX_CODE_LINE_LENGTH) {
      errors.push(
        `Line ${index + 1} exceeds max length of ${MAX_CODE_LINE_LENGTH} chars (is ${line.length} chars).`,
      );
    }
  });

  if (puzzle.bugLineNumber < 1 || puzzle.bugLineNumber > lines.length) {
    errors.push(
      `Bug line number ${puzzle.bugLineNumber} is out of bounds (1..${lines.length}).`,
    );
  }

  if (!Array.isArray(puzzle.options) || puzzle.options.length !== 4) {
    errors.push('Puzzle must have exactly 4 options.');
  } else {
    const ids = new Set<string>();
    puzzle.options.forEach((opt, idx) => {
      if (!opt.id) errors.push(`Option ${idx + 1} missing id.`);
      if (ids.has(opt.id)) errors.push(`Duplicate option id: "${opt.id}".`);
      ids.add(opt.id);
      if (!opt.codeReplacement || opt.codeReplacement.trim().length === 0) {
        errors.push(`Option ${opt.id} codeReplacement is empty.`);
      }
    });

    if (!ids.has(puzzle.correctOptionId)) {
      errors.push(
        `correctOptionId "${puzzle.correctOptionId}" not found in options list.`,
      );
    }
  }

  if (!Array.isArray(puzzle.hints) || puzzle.hints.length !== 3) {
    errors.push('Puzzle must provide exactly 3 hints.');
  } else {
    puzzle.hints.forEach((hint, idx) => {
      if (!hint || hint.trim().length === 0) {
        errors.push(`Hint ${idx + 1} is empty.`);
      }
    });
  }

  if (!puzzle.creature || !puzzle.creature.name) {
    errors.push('Puzzle must have a named creature.');
  } else {
    if (!VALID_RARITIES.has(puzzle.creature.rarity)) {
      errors.push(`Invalid creature rarity: "${puzzle.creature.rarity}".`);
    }
    if (!puzzle.creature.avatarEmoji) {
      errors.push('Creature must have an avatar emoji.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
