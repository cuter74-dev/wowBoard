// ───────── Auth ─────────
export type Provider = 'NAVER' | 'KAKAO' | 'GOOGLE' | 'APPLE' | 'GUEST';

export interface User {
  id: string;
  provider: Provider;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

// ───────── Component / Element types ─────────
export type ElementType =
  | 'button'
  | 'text'
  | 'input'
  | 'image'
  | 'box'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'icon';

/** Per-type free-form properties (label, colors, placeholder, …). */
export interface ElementProps {
  label?: string;
  placeholder?: string;
  text?: string;
  color?: string;
  background?: string;
  fontSize?: number;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  checked?: boolean;
  options?: string[];
  iconName?: string;
  [key: string]: unknown;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  props: ElementProps;
}

export interface Screen {
  id: string;
  name: string;
  order: number;
  width: number;
  height: number;
  elements?: CanvasElement[];
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  shareToken: string | null;
  defaultWidth?: number;
  defaultHeight?: number;
  createdAt: string;
  updatedAt: string;
  screens?: Screen[];
}

// ───────── Palette definition (default component set) ─────────
export interface PaletteItem {
  type: ElementType;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProps: ElementProps;
}

export const PALETTE: PaletteItem[] = [
  { type: 'button', label: '버튼', defaultWidth: 120, defaultHeight: 40, defaultProps: { label: '버튼', background: '#2563eb', color: '#ffffff', borderRadius: 6 } },
  { type: 'text', label: '텍스트', defaultWidth: 160, defaultHeight: 28, defaultProps: { text: '텍스트', color: '#111827', fontSize: 16 } },
  { type: 'input', label: '입력필드', defaultWidth: 200, defaultHeight: 40, defaultProps: { placeholder: '입력하세요', borderRadius: 6, borderColor: '#d1d5db', borderWidth: 1 } },
  { type: 'image', label: '이미지', defaultWidth: 160, defaultHeight: 120, defaultProps: {} },
  { type: 'box', label: '박스', defaultWidth: 160, defaultHeight: 120, defaultProps: { background: '#f3f4f6', borderRadius: 8, borderColor: '#e5e7eb', borderWidth: 1 } },
  { type: 'checkbox', label: '체크박스', defaultWidth: 140, defaultHeight: 24, defaultProps: { label: '체크박스', checked: false } },
  { type: 'radio', label: '라디오', defaultWidth: 140, defaultHeight: 24, defaultProps: { label: '라디오', checked: false } },
  { type: 'dropdown', label: '드롭다운', defaultWidth: 200, defaultHeight: 40, defaultProps: { options: ['옵션 1', '옵션 2'], borderRadius: 6, borderColor: '#d1d5db', borderWidth: 1 } },
  { type: 'icon', label: '아이콘', defaultWidth: 48, defaultHeight: 48, defaultProps: { iconName: 'star' } },
];

// ───────── DTOs ─────────
export interface ElementInput {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  props: ElementProps;
}

export const DEFAULT_SCREEN = { width: 390, height: 844 };

// ───────── Built-in screen templates ─────────
export interface ScreenTemplate {
  id: string;
  label: string;
  width: number;
  height: number;
  elements: ElementInput[];
}

const el = (
  type: ElementType,
  x: number,
  y: number,
  width: number,
  height: number,
  props: ElementProps = {},
): ElementInput => ({ type, x, y, width, height, zIndex: 0, props });

export const SCREEN_TEMPLATES: ScreenTemplate[] = [
  { id: 'blank', label: '빈 화면', width: 390, height: 844, elements: [] },
  {
    id: 'login',
    label: '로그인',
    width: 390,
    height: 844,
    elements: [
      el('text', 20, 90, 350, 40, { text: '로그인', fontSize: 28, color: '#111827' }),
      el('input', 20, 170, 350, 46, { placeholder: '이메일', borderRadius: 8, borderColor: '#d1d5db', borderWidth: 1 }),
      el('input', 20, 228, 350, 46, { placeholder: '비밀번호', borderRadius: 8, borderColor: '#d1d5db', borderWidth: 1 }),
      el('button', 20, 298, 350, 48, { label: '로그인', background: '#2563eb', color: '#ffffff', borderRadius: 8 }),
      el('text', 20, 360, 200, 22, { text: '비밀번호를 잊으셨나요?', fontSize: 13, color: '#6b7280' }),
    ],
  },
  {
    id: 'list',
    label: '리스트',
    width: 390,
    height: 844,
    elements: [
      el('box', 0, 0, 390, 56, { background: '#2563eb', borderColor: '#2563eb', borderWidth: 0 }),
      el('text', 20, 16, 200, 24, { text: '목록', fontSize: 18, color: '#ffffff' }),
      el('box', 16, 76, 358, 60, { background: '#f3f4f6', borderRadius: 8, borderColor: '#e5e7eb', borderWidth: 1 }),
      el('text', 28, 96, 280, 22, { text: '항목 1', fontSize: 15, color: '#111827' }),
      el('box', 16, 148, 358, 60, { background: '#f3f4f6', borderRadius: 8, borderColor: '#e5e7eb', borderWidth: 1 }),
      el('text', 28, 168, 280, 22, { text: '항목 2', fontSize: 15, color: '#111827' }),
      el('box', 16, 220, 358, 60, { background: '#f3f4f6', borderRadius: 8, borderColor: '#e5e7eb', borderWidth: 1 }),
      el('text', 28, 240, 280, 22, { text: '항목 3', fontSize: 15, color: '#111827' }),
      el('box', 16, 292, 358, 60, { background: '#f3f4f6', borderRadius: 8, borderColor: '#e5e7eb', borderWidth: 1 }),
      el('text', 28, 312, 280, 22, { text: '항목 4', fontSize: 15, color: '#111827' }),
    ],
  },
  {
    id: 'profile',
    label: '프로필',
    width: 390,
    height: 844,
    elements: [
      el('image', 145, 70, 100, 100, { borderRadius: 50 }),
      el('text', 20, 184, 350, 30, { text: '홍길동', fontSize: 22, color: '#111827' }),
      el('text', 20, 220, 350, 40, { text: '소개 문구가 들어갑니다.', fontSize: 14, color: '#6b7280' }),
      el('button', 95, 276, 200, 46, { label: '팔로우', background: '#2563eb', color: '#ffffff', borderRadius: 8 }),
    ],
  },
  {
    id: 'form',
    label: '입력 폼',
    width: 390,
    height: 844,
    elements: [
      el('text', 20, 40, 350, 36, { text: '신청서', fontSize: 24, color: '#111827' }),
      el('text', 20, 100, 120, 20, { text: '이름', fontSize: 13, color: '#6b7280' }),
      el('input', 20, 122, 350, 44, { placeholder: '이름', borderRadius: 6, borderColor: '#d1d5db', borderWidth: 1 }),
      el('text', 20, 182, 120, 20, { text: '연락처', fontSize: 13, color: '#6b7280' }),
      el('input', 20, 204, 350, 44, { placeholder: '010-0000-0000', borderRadius: 6, borderColor: '#d1d5db', borderWidth: 1 }),
      el('text', 20, 264, 120, 20, { text: '분류', fontSize: 13, color: '#6b7280' }),
      el('dropdown', 20, 286, 350, 44, { options: ['선택 1', '선택 2'], borderRadius: 6, borderColor: '#d1d5db', borderWidth: 1 }),
      el('button', 20, 356, 350, 48, { label: '제출', background: '#2563eb', color: '#ffffff', borderRadius: 8 }),
    ],
  },
];

// ───────── AI integration ─────────
export type AiProviderKind = 'openai' | 'anthropic' | 'gemini' | 'local';

export const AI_PROVIDERS: { kind: AiProviderKind; label: string; needsBaseUrl: boolean }[] = [
  { kind: 'anthropic', label: 'Claude (Anthropic)', needsBaseUrl: false },
  { kind: 'openai', label: 'GPT (OpenAI)', needsBaseUrl: false },
  { kind: 'gemini', label: 'Gemini (Google)', needsBaseUrl: false },
  { kind: 'local', label: '로컬 (OpenAI 호환)', needsBaseUrl: true },
];

/** Suggested default model per provider (user-overridable in settings). */
export const AI_DEFAULT_MODEL: Record<AiProviderKind, string> = {
  anthropic: 'claude-opus-4-8',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash',
  local: 'local-model',
};

export const ELEMENT_TYPES: ElementType[] = [
  'button', 'text', 'input', 'image', 'box', 'checkbox', 'radio', 'dropdown', 'icon',
];

/**
 * JSON Schema the AI must conform to when generating a screen. Strict-compatible:
 * every object sets additionalProperties:false and lists required fields.
 * zIndex is assigned server-side by array order, so the AI does not produce it.
 */
export const AI_ELEMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['elements'],
  properties: {
    screen: {
      type: 'object',
      additionalProperties: false,
      required: ['width', 'height'],
      properties: {
        width: { type: 'integer' },
        height: { type: 'integer' },
      },
    },
    elements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'x', 'y', 'width', 'height', 'props'],
        properties: {
          type: { type: 'string', enum: ELEMENT_TYPES },
          x: { type: 'integer' },
          y: { type: 'integer' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          props: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: { type: 'string' },
              text: { type: 'string' },
              placeholder: { type: 'string' },
              color: { type: 'string' },
              background: { type: 'string' },
              fontSize: { type: 'integer' },
              borderRadius: { type: 'integer' },
              borderColor: { type: 'string' },
              borderWidth: { type: 'integer' },
              options: { type: 'array', items: { type: 'string' } },
              checked: { type: 'boolean' },
              iconName: { type: 'string' },
              src: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const;

/** Raw shape returned by a provider before server-side sanitize. */
export interface AiRawElement {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: Record<string, unknown>;
}
export interface AiRawOutput {
  screen?: { width?: number; height?: number };
  elements: AiRawElement[];
}

/** System prompt describing wowBoard's element model to the AI. */
export const AI_SYSTEM_PROMPT = `You are a UI wireframe generator for "wowBoard", a screen-planning tool similar to Kakao Oven.
You output a single screen as a flat list of absolutely-positioned elements.

Coordinate system:
- Origin (0,0) is the top-left of the screen frame. Units are pixels.
- Default screen size is ${DEFAULT_SCREEN.width}x${DEFAULT_SCREEN.height} (mobile). A target screen size is given per request — use EXACTLY that frame.
- EVERY element MUST fit inside the frame: x >= 0, y >= 0, x + width <= frame width, y + height <= frame height. Never exceed the frame. Leave small margins (~16px) from the edges.
- Size elements relative to the frame (e.g. a full-width button on a 390px frame is ~358px wide, not 1000px). Do NOT use coordinates larger than the frame.
- Every element needs integer x, y, width, height. Elements may not overlap unless intentional (e.g. a label over a box).

Allowed element "type" values and their "props":
- button   { label, background, color, borderRadius, fontSize }
- text     { text, color, fontSize }
- input    { placeholder, borderRadius, fontSize }
- image    { borderRadius }            // a placeholder image box
- box      { background, borderColor, borderWidth, borderRadius }  // container/rectangle
- checkbox { label, checked }
- radio    { label, checked }
- dropdown { options(string[]), borderRadius }
- icon     { iconName }

Rules:
- Use realistic layout: headers near the top, primary actions near the bottom, comfortable spacing.
- Colors are CSS hex strings (e.g. "#2563eb"). Omit props you don't need.
- Do NOT invent types or prop keys outside the lists above.
- Keep it concise: generate at most 30 elements. Output COMPACT JSON (no extra whitespace or newlines).
- Respond with ONLY a JSON object matching the provided schema. No prose, no markdown fences, and do not repeat or echo the schema.`;

export const AI_IMAGE_PROMPT = `Analyze the attached screenshot of an existing screen/wireframe and recreate its layout as wowBoard elements.
Map real UI controls to the closest wowBoard type (buttons→button, text fields→input, labels/headings→text, images→image, cards/containers→box, etc.).
The screenshot's pixel dimensions are usually LARGER than the target frame. Do NOT copy screenshot pixel coordinates directly — proportionally rescale every position and size so the whole layout fits inside the target frame (x + width <= frame width, y + height <= frame height). Follow the same schema and rules as above.`;
