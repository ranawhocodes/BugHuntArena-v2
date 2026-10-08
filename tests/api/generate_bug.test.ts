import { describe, it, expect } from 'vitest';
import { parseGenerateRequest, isRateLimited } from '../../api/generate-bug';

describe('generate-bug API input handling', () => {
  it('accepts valid parameters', () => {
    expect(parseGenerateRequest({ language: 'javascript', difficulty: 3 })).toEqual({
      language: 'javascript',
      difficulty: 3,
    });
  });

  it('parses JSON string bodies', () => {
    expect(parseGenerateRequest('{"language":"javascript","difficulty":2}')).toEqual({
      language: 'javascript',
      difficulty: 2,
    });
  });

  it('falls back to safe defaults for invalid or hostile input', () => {
    const safe = { language: 'python', difficulty: 1 };
    expect(parseGenerateRequest(undefined)).toEqual(safe);
    expect(parseGenerateRequest('not json')).toEqual(safe);
    expect(parseGenerateRequest({ language: 'rust; drop table', difficulty: 99 })).toEqual(safe);
    expect(parseGenerateRequest({ language: ['javascript'], difficulty: '3' })).toEqual(safe);
  });

  it('rate-limits a single client after 8 requests per minute', () => {
    const now = 1_000_000;
    const client = `client-${Math.random()}`;
    for (let i = 0; i < 8; i++) {
      expect(isRateLimited(client, now + i)).toBe(false);
    }
    expect(isRateLimited(client, now + 9)).toBe(true);
    // A minute later the window has rolled over
    expect(isRateLimited(client, now + 61_000)).toBe(false);
  });
});
