import type { CanvasElement } from '@wowboard/shared';

/** Pure visual renderer for a single element. Used by both editor and viewer. */
export function ElementRenderer({ el }: { el: CanvasElement }) {
  const p = el.props ?? {};
  const fill: React.CSSProperties = { width: '100%', height: '100%' };

  // Optional outline shared by all element types. `def` is the type's own
  // default border (input/dropdown/box); user props override it.
  const borderOf = (def?: string): string | undefined => {
    const w = p.borderWidth;
    if (w == null) return def; // not set → keep type default
    if (w <= 0) return 'none'; // explicitly 0 → remove border
    return `${w}px solid ${p.borderColor ?? '#d1d5db'}`;
  };

  switch (el.type) {
    case 'button':
      return (
        <button
          style={{
            ...fill,
            background: p.background ?? '#2563eb',
            color: p.color ?? '#fff',
            border: borderOf('none'),
            borderRadius: p.borderRadius ?? 6,
            fontSize: p.fontSize ?? 14,
          }}
        >
          {p.label ?? '버튼'}
        </button>
      );

    case 'text':
      return (
        <div
          style={{
            ...fill,
            color: p.color ?? '#111827',
            fontSize: p.fontSize ?? 16,
            border: borderOf(),
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {p.text ?? '텍스트'}
        </div>
      );

    case 'input':
      return (
        <input
          readOnly
          placeholder={p.placeholder ?? '입력하세요'}
          style={{
            ...fill,
            border: borderOf('1px solid #d1d5db'),
            borderRadius: p.borderRadius ?? 6,
            padding: '0 10px',
            fontSize: p.fontSize ?? 14,
            background: '#fff',
          }}
        />
      );

    case 'image':
      return typeof p.src === 'string' && p.src ? (
        <img
          src={p.src as string}
          alt=""
          draggable={false}
          style={{ ...fill, objectFit: 'cover', border: borderOf(), borderRadius: p.borderRadius ?? 0 }}
        />
      ) : (
        <div
          style={{
            ...fill,
            background: '#e5e7eb',
            border: borderOf(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: 13,
          }}
        >
          🖼 이미지
        </div>
      );

    case 'box':
      return (
        <div
          style={{
            ...fill,
            background: p.background ?? '#f3f4f6',
            border: borderOf('1px solid #e5e7eb'),
            borderRadius: p.borderRadius ?? 8,
          }}
        />
      );

    case 'checkbox':
      return (
        <label style={{ ...fill, display: 'flex', alignItems: 'center', gap: 6, fontSize: p.fontSize ?? 14, border: borderOf() }}>
          <input type="checkbox" readOnly checked={!!p.checked} />
          {p.label ?? '체크박스'}
        </label>
      );

    case 'radio':
      return (
        <label style={{ ...fill, display: 'flex', alignItems: 'center', gap: 6, fontSize: p.fontSize ?? 14, border: borderOf() }}>
          <input type="radio" readOnly checked={!!p.checked} />
          {p.label ?? '라디오'}
        </label>
      );

    case 'dropdown':
      return (
        <select
          disabled
          style={{
            ...fill,
            border: borderOf('1px solid #d1d5db'),
            borderRadius: p.borderRadius ?? 6,
            padding: '0 8px',
            fontSize: p.fontSize ?? 14,
            background: '#fff',
          }}
        >
          {(p.options ?? ['옵션']).map((o, i) => (
            <option key={i}>{o}</option>
          ))}
        </select>
      );

    case 'icon':
      return (
        <div style={{ ...fill, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.min(el.width, el.height) * 0.7, border: borderOf() }}>
          ⭐
        </div>
      );

    default:
      return null;
  }
}
