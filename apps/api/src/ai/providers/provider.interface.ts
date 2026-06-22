import type { AiRawOutput } from '@wowboard/shared';

export interface ScreenSize {
  width: number;
  height: number;
}

export interface AiGenProvider {
  generate(prompt: string, screen: ScreenSize): Promise<AiRawOutput>;
  fromImage(imageB64: string, mime: string, screen: ScreenSize): Promise<AiRawOutput>;
}

/** Tolerant JSON extraction: strips ``` fences and surrounding prose. */
export function parseJsonLoose(text: string): AiRawOutput {
  let t = (text ?? '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  if (start > 0) t = t.slice(start);
  const end = t.lastIndexOf('}');
  const whole = end > 0 ? t.slice(0, end + 1) : t;
  try {
    return JSON.parse(whole) as AiRawOutput;
  } catch (err) {
    const repaired = salvageElements(t);
    if (repaired) return repaired;
    throw err;
  }
}

/**
 * Best-effort salvage when small local models emit malformed JSON. Walks the
 * "elements" array and parses each object individually, keeping every valid
 * element up to the first corrupted/truncated one. Handles both mid-string
 * syntax errors and end-truncation.
 */
function salvageElements(t: string): AiRawOutput | null {
  const key = t.indexOf('"elements"');
  if (key < 0) return null;
  const arrStart = t.indexOf('[', key);
  if (arrStart < 0) return null;

  const elements: unknown[] = [];
  const n = t.length;
  let i = arrStart + 1;

  while (i < n) {
    while (i < n && (t[i] === ',' || /\s/.test(t[i]))) i++;
    if (i >= n || t[i] === ']') break;
    if (t[i] !== '{') break;

    // Find the matching close brace, respecting string literals/escapes.
    let depth = 0;
    let j = i;
    let inStr = false;
    let esc = false;
    for (; j < n; j++) {
      const c = t[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    if (depth !== 0) break; // truncated mid-object

    try {
      elements.push(JSON.parse(t.slice(i, j)));
    } catch {
      break; // malformed object → keep the valid ones before it
    }
    i = j;
  }

  return elements.length ? ({ elements } as AiRawOutput) : null;
}

export function schemaHint(schema: unknown): string {
  return `\n\nReturn ONLY a JSON object conforming to this JSON Schema:\n${JSON.stringify(schema)}`;
}
