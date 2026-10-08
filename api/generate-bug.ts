import type { IncomingMessage, ServerResponse } from 'node:http';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, string>;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (data: unknown) => void;
}

/** Best-effort per-instance rate limit: requests per client IP per minute. */
const RATE_LIMIT_PER_MIN = 8;
const RATE_WINDOW_MS = 60_000;
const recentRequests = new Map<string, number[]>();

export function isRateLimited(clientId: string, now = Date.now()): boolean {
  const windowStart = now - RATE_WINDOW_MS;
  const hits = (recentRequests.get(clientId) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  recentRequests.set(clientId, hits);
  // Keep the map from growing without bound on long-lived instances
  if (recentRequests.size > 5_000) recentRequests.clear();
  return hits.length > RATE_LIMIT_PER_MIN;
}

/** Validates the untrusted request body into the two parameters the prompt accepts. */
export function parseGenerateRequest(raw: unknown): { language: 'python' | 'javascript'; difficulty: 1 | 2 | 3 } {
  let body: unknown = raw;
  if (typeof raw === 'string') {
    try {
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }
  const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const language = data.language === 'javascript' ? 'javascript' : 'python';
  const difficulty = data.difficulty === 2 || data.difficulty === 3 ? data.difficulty : 1;
  return { language, difficulty };
}

const MODEL_NAME_RE = /^[a-z0-9.-]{1,64}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientId =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (isRateLimited(clientId)) {
    return res.status(429).json({ fallback: true, reason: 'Too many requests. Try again in a minute.' });
  }

  const apiKey = process.env.LLM_API_KEY;
  const configuredModel = process.env.LLM_MODEL || 'gemini-1.5-flash';
  // The model name is interpolated into the request URL, so only allow plain identifiers
  const model = MODEL_NAME_RE.test(configuredModel) ? configuredModel : 'gemini-1.5-flash';

  const { language, difficulty } = parseGenerateRequest(req.body);
  const audience =
    difficulty === 1
      ? 'beginners who are new to debugging'
      : difficulty === 2
        ? 'learners with some debugging experience'
        : 'experienced developers who want a subtle, tricky bug';

  if (!apiKey || apiKey === 'your-api-key-here') {
    // Graceful fallback signal when no key is configured
    return res.status(200).json({
      fallback: true,
      reason: 'No LLM_API_KEY set on server; using curated fallback.',
    });
  }

  const prompt = `You are a coding instructor creating a bug hunt challenge for ${audience} learning ${language}.
Create a short buggy program (5 to 10 lines) with EXACTLY ONE bug.
The code lines must each be under 55 characters long.
Return ONLY valid JSON matching this structure:
{
  "id": "ai-${language}-${Date.now()}",
  "title": "Short creative title",
  "language": "${language}",
  "category": "logic_error",
  "difficulty": ${difficulty},
  "concept": "Core topic being taught",
  "brief": "What the program is supposed to accomplish",
  "buggyCode": "code with exactly one bug",
  "bugLineNumber": 3,
  "expectedOutput": "correct output string",
  "actualOutput": "error or buggy output",
  "options": [
    { "id": "opt-a", "codeReplacement": "fixed code line", "explanation": "why this is correct" },
    { "id": "opt-b", "codeReplacement": "distractor line 1", "explanation": "why this is wrong" },
    { "id": "opt-c", "codeReplacement": "distractor line 2", "explanation": "why this is wrong" },
    { "id": "opt-d", "codeReplacement": "distractor line 3", "explanation": "why this is wrong" }
  ],
  "correctOptionId": "opt-a",
  "hints": [
    "Tier 1: Where to look",
    "Tier 2: Why it behaves unexpectedly",
    "Tier 3: Concrete fix strategy"
  ],
  "explanation": "Post-mortem explanation",
  "creature": {
    "id": "c-ai-creature",
    "name": "CreativeBugName",
    "species": "Glitch Species",
    "rarity": "rare",
    "description": "Fun creature personality lore",
    "avatarEmoji": "👾"
  }
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 11000); // 11s timeout

    // Key travels in a header, never in the URL (URLs end up in logs)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(200).json({
        fallback: true,
        reason: `Gemini API responded with status ${response.status}`,
      });
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(200).json({ fallback: true, reason: 'Empty candidate text from Gemini' });
    }

    const parsedPuzzle: unknown = JSON.parse(candidateText);
    if (!parsedPuzzle || typeof parsedPuzzle !== 'object' || Array.isArray(parsedPuzzle)) {
      return res.status(200).json({ fallback: true, reason: 'Malformed puzzle from model' });
    }
    // Full schema validation happens client-side in validatePuzzle() before anything renders
    return res.status(200).json({
      fallback: false,
      puzzle: parsedPuzzle,
    });
  } catch {
    // Don't echo internal error details to the client
    return res.status(200).json({
      fallback: true,
      reason: 'AI generation failed; using curated fallback.',
    });
  }
}
