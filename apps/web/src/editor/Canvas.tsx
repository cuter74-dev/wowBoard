import { Rnd } from 'react-rnd';
import { PALETTE } from '@wowboard/shared';
import { useEditor } from './store';
import { ElementRenderer } from './ElementRenderer';
import { DND_MIME } from './Palette';

export function Canvas() {
  const screen = useEditor((s) => s.activeScreen());
  const selectedId = useEditor((s) => s.selectedId);
  const select = useEditor((s) => s.select);
  const addElement = useEditor((s) => s.addElement);
  const patchGeom = useEditor((s) => s.patchElementGeom);

  if (!screen) {
    return <div className="canvas-area"><div className="centered">화면을 추가하세요</div></div>;
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // must match effectAllowed or drop is rejected
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type =
      e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData('text/plain');
    const item = PALETTE.find((p) => p.type === type);
    if (!item) return;
    const frame = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - frame.left - item.defaultWidth / 2;
    const y = e.clientY - frame.top - item.defaultHeight / 2;
    addElement(item, Math.max(0, x), Math.max(0, y));
  };

  return (
    <div className="canvas-area" onMouseDown={() => select(null)}>
      <div
        className="screen-frame"
        style={{ width: screen.width, height: screen.height }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {screen.elements.map((el) => (
          <Rnd
            key={el.id}
            className={selectedId === el.id ? 'el-selected' : undefined}
            style={{ zIndex: el.zIndex }}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            bounds="parent"
            onMouseDown={(e) => {
              e.stopPropagation();
              select(el.id);
            }}
            onDragStop={(_e, d) => patchGeom(el.id, { x: Math.round(d.x), y: Math.round(d.y) })}
            onResizeStop={(_e, _dir, ref, _delta, pos) =>
              patchGeom(el.id, {
                width: ref.offsetWidth,
                height: ref.offsetHeight,
                x: Math.round(pos.x),
                y: Math.round(pos.y),
              })
            }
          >
            {/* Content is non-interactive so the whole element is a drag surface
                (inner buttons/inputs/selects must not capture the pointer). */}
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
              <ElementRenderer el={el} />
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}
