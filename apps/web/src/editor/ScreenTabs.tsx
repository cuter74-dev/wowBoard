import { useState } from 'react';
import { api } from '../api/client';
import { useEditor } from './store';

export function ScreenTabs() {
  const screens = useEditor((s) => s.screens);
  const activeId = useEditor((s) => s.activeScreenId);
  const projectId = useEditor((s) => s.projectId);
  const setActive = useEditor((s) => s.setActiveScreen);
  const addScreen = useEditor((s) => s.addScreen);
  const removeScreen = useEditor((s) => s.removeScreen);
  const renameScreen = useEditor((s) => s.renameScreen);
  const moveScreen = useEditor((s) => s.moveScreen);

  const [dragId, setDragId] = useState<string | null>(null);

  const onAdd = async () => {
    if (!projectId) return;
    const screen = await api.createScreen(projectId);
    addScreen(screen);
  };

  const onRename = async (id: string, current: string) => {
    const name = window.prompt('화면 이름', current);
    if (!name || name === current) return;
    renameScreen(id, name);
    await api.updateScreen(id, { name });
  };

  const onDelete = async (id: string) => {
    if (screens.length <= 1) {
      window.alert('최소 한 개의 화면은 필요합니다.');
      return;
    }
    if (!window.confirm('이 화면을 삭제할까요?')) return;
    removeScreen(id);
    await api.deleteScreen(id);
  };

  const onDrop = async (overId: string) => {
    if (!dragId || dragId === overId) return;
    moveScreen(dragId, overId);
    setDragId(null);
    // Persist the new order for every screen.
    const ordered = useEditor.getState().screens;
    await Promise.all(ordered.map((s, i) => api.updateScreen(s.id, { order: i })));
  };

  return (
    <div className="tabs">
      {screens.map((s) => (
        <button
          key={s.id}
          className={`tab ${s.id === activeId ? 'active' : ''} ${dragId === s.id ? 'dragging' : ''}`}
          draggable
          onDragStart={() => setDragId(s.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => void onDrop(s.id)}
          onDragEnd={() => setDragId(null)}
          onClick={() => setActive(s.id)}
          onDoubleClick={() => onRename(s.id, s.name)}
          title="더블클릭하여 이름 변경 · 드래그하여 순서 변경"
        >
          {s.name}
          <span
            style={{ marginLeft: 8, color: 'var(--muted)' }}
            onClick={(e) => {
              e.stopPropagation();
              void onDelete(s.id);
            }}
          >
            ✕
          </span>
        </button>
      ))}
      <button className="btn small" onClick={onAdd}>
        + 화면 추가
      </button>
    </div>
  );
}
