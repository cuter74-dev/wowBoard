import {
  ELEMENT_TYPES,
  DEFAULT_SCREEN,
  type AiRawOutput,
  type ElementInput,
  type ElementType,
  type ElementProps,
} from '@wowboard/shared';

const TYPE_SET = new Set<string>(ELEMENT_TYPES);
const STRING_KEYS = ['label', 'placeholder', 'text', 'color', 'background', 'borderColor', 'iconName', 'src'];
const NUMBER_KEYS = ['fontSize', 'borderRadius', 'borderWidth'];
const MAX_ELEMENTS = 80;

function int(v: unknown, fallback = 0): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function sanitizeProps(raw: unknown): ElementProps {
  const out: ElementProps = {};
  if (!raw || typeof raw !== 'object') return out;
  const p = raw as Record<string, unknown>;
  for (const k of STRING_KEYS) {
    if (typeof p[k] === 'string') out[k] = (p[k] as string).slice(0, 500);
  }
  for (const k of NUMBER_KEYS) {
    if (p[k] !== undefined && Number.isFinite(Number(p[k]))) out[k] = int(p[k]);
  }
  if (typeof p.checked === 'boolean') out.checked = p.checked;
  if (Array.isArray(p.options)) {
    out.options = p.options.filter((o) => typeof o === 'string').slice(0, 20) as string[];
  }
  return out;
}

export interface SanitizedScreen {
  width: number;
  height: number;
  elements: ElementInput[];
}

/** Validate + clamp raw AI output into safe element inputs within the screen. */
export function sanitize(raw: AiRawOutput, fallbackScreen?: { width?: number; height?: number }): SanitizedScreen {
  const width = clamp(int(raw?.screen?.width ?? fallbackScreen?.width ?? DEFAULT_SCREEN.width), 50, 4000);
  const height = clamp(int(raw?.screen?.height ?? fallbackScreen?.height ?? DEFAULT_SCREEN.height), 50, 6000);

  const list = Array.isArray(raw?.elements) ? raw.elements.slice(0, MAX_ELEMENTS) : [];

  // First pass: raw integer geometry (no clamping yet).
  const raws = list.map((el) => ({
    type: (TYPE_SET.has(el?.type) ? el.type : 'box') as ElementType,
    x: int(el?.x, 0),
    y: int(el?.y, 0),
    w: Math.max(1, int(el?.width, 100)),
    h: Math.max(1, int(el?.height, 40)),
    props: sanitizeProps(el?.props),
  }));

  // If the whole layout overflows the frame (AI often uses screenshot-scale
  // coordinates), scale every element down by one uniform factor so the
  // composition keeps its proportions and fits — instead of clipping each.
  const maxRight = Math.max(1, ...raws.map((r) => r.x + r.w));
  const maxBottom = Math.max(1, ...raws.map((r) => r.y + r.h));
  const scale = Math.min(1, width / maxRight, height / maxBottom);

  const elements: ElementInput[] = raws.map((r, i) => {
    const w = clamp(Math.round(r.w * scale), 1, width);
    const h = clamp(Math.round(r.h * scale), 1, height);
    const x = clamp(Math.round(r.x * scale), 0, Math.max(0, width - w));
    const y = clamp(Math.round(r.y * scale), 0, Math.max(0, height - h));
    return { type: r.type, x, y, width: w, height: h, zIndex: i + 1, props: r.props };
  });

  return { width, height, elements };
}
