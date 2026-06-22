import { PALETTE, type PaletteItem } from '@wowboard/shared';
import { useEditor } from './store';

export const DND_MIME = 'application/x-wowboard-palette';

export function Palette() {
  const addElement = useEditor((s) => s.addElement);
  const screen = useEditor((s) => s.activeScreen());

  // Click-to-add fallback: place near top-center of the active screen,
  // nudged so repeated clicks don't perfectly overlap.
  const onClickAdd = (item: PaletteItem) => {
    if (!screen) return;
    const count = screen.elements.length;
    const x = Math.max(0, Math.round((screen.width - item.defaultWidth) / 2) + (count % 5) * 12);
    const y = 40 + (count % 5) * 12;
    addElement(item, x, y);
  };

  return (
    <div className="palette">
      <h4>컴포넌트</h4>
      <p className="palette-hint">드래그하거나 클릭해서 추가</p>
      {PALETTE.map((item) => (
        <div
          key={item.type}
          className="palette-item"
          draggable
          onClick={() => onClickAdd(item)}
          onDragStart={(e) => {
            e.dataTransfer.setData(DND_MIME, item.type);
            e.dataTransfer.setData('text/plain', item.type); // fallback type
            e.dataTransfer.effectAllowed = 'copy';
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
