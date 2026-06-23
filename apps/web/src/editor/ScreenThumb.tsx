import { ElementRenderer } from './ElementRenderer';
import type { ScreenWithElements } from '../api/client';

const THUMB_W = 108;
const THUMB_MAXH = 84;

export function ScreenThumb({
  screen,
  active,
  onSelect,
  onDelete,
  onDragStart,
  onDropBefore,
}: {
  screen: ScreenWithElements;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDropBefore: () => void;
}) {
  const scale = Math.min(THUMB_W / screen.width, THUMB_MAXH / screen.height);
  const w = Math.max(20, Math.round(screen.width * scale));
  const h = Math.max(20, Math.round(screen.height * scale));

  return (
    <div
      className={`thumb ${active ? 'active' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDropBefore();
      }}
      onClick={onSelect}
      title={screen.name}
    >
      <div className="thumb-frame" style={{ width: w, height: h }}>
        <div
          style={{
            width: screen.width,
            height: screen.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: 0,
            background: '#fff',
            pointerEvents: 'none',
          }}
        >
          {(screen.elements ?? []).map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
              }}
            >
              <ElementRenderer el={el} />
            </div>
          ))}
        </div>
      </div>
      <div className="thumb-name">
        <span className="thumb-label">{screen.name}</span>
        <span
          className="thumb-del"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="화면 삭제"
        >
          ✕
        </span>
      </div>
    </div>
  );
}
