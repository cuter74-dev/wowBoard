import { useEffect, useRef, useState } from 'react';
import type { CanvasElement, ElementType } from '@wowboard/shared';
import { api } from '../api/client';
import { useEditor } from './store';

const SIZE_PRESETS: { label: string; width: number; height: number }[] = [
  { label: '모바일', width: 390, height: 844 },
  { label: '태블릿', width: 768, height: 1024 },
  { label: '데스크톱', width: 1280, height: 800 },
];

const TEXTLIKE: Record<string, 'label' | 'text' | 'placeholder' | undefined> = {
  button: 'label',
  checkbox: 'label',
  radio: 'label',
  text: 'text',
  input: 'placeholder',
};

const HAS_BG: ElementType[] = ['button', 'box'];
const HAS_COLOR: ElementType[] = ['button', 'text'];
const HAS_RADIUS: ElementType[] = ['button', 'input', 'box', 'dropdown', 'image'];
const HAS_FONT: ElementType[] = ['button', 'text', 'input', 'checkbox', 'radio', 'dropdown'];

export function PropertiesPanel() {
  const screen = useEditor((s) => s.activeScreen());
  const selectedId = useEditor((s) => s.selectedId);
  const patchGeom = useEditor((s) => s.patchElementGeom);
  const patchProps = useEditor((s) => s.patchElementProps);
  const removeSelected = useEditor((s) => s.removeSelected);
  const bringToFront = useEditor((s) => s.bringToFront);
  const sendToBack = useEditor((s) => s.sendToBack);

  const el = screen?.elements.find((e) => e.id === selectedId);

  if (!el) {
    return <BoardPanel />;
  }

  const textKey = TEXTLIKE[el.type];

  return (
    <div className="props">
      <h4>{el.type} 속성</h4>

      <div className="row2">
        <NumField label="X" value={el.x} onChange={(v) => patchGeom(el.id, { x: v })} />
        <NumField label="Y" value={el.y} onChange={(v) => patchGeom(el.id, { y: v })} />
      </div>
      <div className="row2">
        <NumField label="너비" value={el.width} min={1} onChange={(v) => patchGeom(el.id, { width: v })} />
        <NumField label="높이" value={el.height} min={1} onChange={(v) => patchGeom(el.id, { height: v })} />
      </div>

      {textKey && (
        <TextField
          label="텍스트"
          value={(el.props[textKey] as string) ?? ''}
          onChange={(v) => patchProps(el.id, { [textKey]: v })}
        />
      )}

      {el.type === 'image' && <ImageField el={el} onChange={(src) => patchProps(el.id, { src })} />}

      {el.type === 'dropdown' && (
        <TextField
          label="옵션 (쉼표로 구분)"
          value={(el.props.options ?? []).join(', ')}
          onChange={(v) =>
            patchProps(el.id, { options: v.split(',').map((s) => s.trim()).filter(Boolean) })
          }
        />
      )}

      {HAS_COLOR.includes(el.type) && (
        <ColorField
          label="글자색"
          value={(el.props.color as string) ?? '#111827'}
          onChange={(v) => patchProps(el.id, { color: v })}
        />
      )}

      {HAS_BG.includes(el.type) && (
        <ColorField
          label="배경색"
          value={(el.props.background as string) ?? '#f3f4f6'}
          onChange={(v) => patchProps(el.id, { background: v })}
        />
      )}

      {HAS_FONT.includes(el.type) && (
        <NumField
          label="글자 크기"
          value={(el.props.fontSize as number) ?? 14}
          onChange={(v) => patchProps(el.id, { fontSize: v })}
        />
      )}

      {HAS_RADIUS.includes(el.type) && (
        <NumField
          label="모서리 둥글기"
          value={(el.props.borderRadius as number) ?? 0}
          onChange={(v) => patchProps(el.id, { borderRadius: v })}
        />
      )}

      <ColorField
        label="외곽선 색"
        value={(el.props.borderColor as string) ?? '#d1d5db'}
        onChange={(v) =>
          // Picking a color implies a visible outline: default width to 1 if unset/0.
          patchProps(el.id, {
            borderColor: v,
            ...((el.props.borderWidth as number) ? {} : { borderWidth: 1 }),
          })
        }
      />
      <NumField
        label="외곽선 두께"
        value={(el.props.borderWidth as number) ?? 0}
        min={0}
        onChange={(v) => patchProps(el.id, { borderWidth: v })}
      />

      {(el.type === 'checkbox' || el.type === 'radio') && (
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={!!el.props.checked}
              onChange={(e) => patchProps(el.id, { checked: e.target.checked })}
            />{' '}
            선택됨
          </label>
        </div>
      )}

      <div className="field" style={{ marginTop: 12 }}>
        <label>정렬</label>
        <div className="row2">
          <button className="btn small" style={{ flex: 1 }} onClick={() => bringToFront(el.id)}>
            맨 앞으로
          </button>
          <button className="btn small" style={{ flex: 1 }} onClick={() => sendToBack(el.id)}>
            맨 뒤로
          </button>
        </div>
      </div>

      <button
        className="btn danger small"
        style={{ marginTop: 4, width: '100%' }}
        onClick={removeSelected}
      >
        요소 삭제
      </button>
    </div>
  );
}

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

function ImageField({
  el,
  onChange,
}: {
  el: CanvasElement;
  onChange: (src: string) => void;
}) {
  const hasImage = typeof el.props.src === 'string' && el.props.src;
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      window.alert('이미지가 너무 큽니다. 1.5MB 이하 파일을 사용하세요.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className="field">
      <label>이미지 {hasImage ? '(교체)' : '업로드'}</label>
      <input type="file" accept="image/*" onChange={onFile} />
    </div>
  );
}

function BoardPanel() {
  const screen = useEditor((s) => s.activeScreen());
  const setScreenSize = useEditor((s) => s.setScreenSize);

  if (!screen) {
    return (
      <div className="props">
        <h4>보드</h4>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>화면을 추가하세요.</p>
      </div>
    );
  }

  const apply = (size: { width?: number; height?: number }, persist: boolean) => {
    setScreenSize(screen.id, size);
    if (persist) void api.updateScreen(screen.id, size).catch(() => {});
  };

  return (
    <div className="props">
      <h4>보드 크기</h4>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: -6 }}>
        빈 곳을 클릭하면 보드 속성이 보입니다.
      </p>

      <div className="field">
        <label>프리셋</label>
        <div className="row2" style={{ flexWrap: 'wrap' }}>
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              className="btn small"
              style={{ flex: 1 }}
              onClick={() => apply({ width: p.width, height: p.height }, true)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label>너비</label>
          <NumberInput
            value={screen.width}
            min={50}
            onLive={(v) => apply({ width: v }, false)}
            onCommit={(v) => apply({ width: v }, true)}
          />
        </div>
        <div className="field">
          <label>높이</label>
          <NumberInput
            value={screen.height}
            min={50}
            onLive={(v) => apply({ height: v }, false)}
            onCommit={(v) => apply({ height: v }, true)}
          />
        </div>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 12 }}>
        현재: {screen.width} × {screen.height}
      </p>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <NumberInput value={value} min={min} onLive={onChange} onCommit={onChange} />
    </div>
  );
}

/**
 * Numeric input that lets the user clear the field entirely while typing.
 * Holds raw text locally; pushes valid numbers live, and clamps to `min`
 * (or reverts an empty/invalid field) only on blur.
 */
function NumberInput({
  value,
  min,
  onLive,
  onCommit,
}: {
  value: number;
  min?: number;
  onLive?: (v: number) => void;
  onCommit?: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const known = useRef(value);

  // Sync when the value changes from outside (preset, undo, new selection).
  useEffect(() => {
    if (value !== known.current) {
      known.current = value;
      setText(String(value));
    }
  }, [value]);

  const handleChange = (raw: string) => {
    setText(raw);
    if (raw === '' || raw === '-') return; // allow empty / partial while typing
    const n = Number(raw);
    if (Number.isFinite(n)) {
      known.current = n;
      onLive?.(Math.round(n));
    }
  };

  const handleBlur = () => {
    let n = Number(text);
    if (text.trim() === '' || !Number.isFinite(n)) n = min ?? 0;
    if (min != null && n < min) n = min;
    n = Math.round(n);
    known.current = n;
    setText(String(n));
    onCommit?.(n);
  };

  return (
    <input
      type="number"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
