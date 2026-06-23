import { useRef, useState } from 'react';
import { api } from '../api/client';
import type { ScreenWithElements } from '../api/client';
import { useEditor } from './store';
import { ScreenThumb } from './ScreenThumb';

export function Filmstrip() {
  const screens = useEditor((s) => s.screens);
  const groups = useEditor((s) => s.groups);
  const activeId = useEditor((s) => s.activeScreenId);
  const projectId = useEditor((s) => s.projectId);
  const setActive = useEditor((s) => s.setActiveScreen);
  const addScreen = useEditor((s) => s.addScreen);
  const removeScreen = useEditor((s) => s.removeScreen);
  const addGroup = useEditor((s) => s.addGroup);
  const renameGroup = useEditor((s) => s.renameGroup);
  const removeGroup = useEditor((s) => s.removeGroup);
  const moveGroup = useEditor((s) => s.moveGroup);
  const setScreenGroup = useEditor((s) => s.setScreenGroup);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dragId = useRef<string | null>(null); // screen being dragged
  const dragGroupId = useRef<string | null>(null); // group being dragged

  const screensOf = (gid: string | null): ScreenWithElements[] =>
    screens
      .filter((s) => (s.groupId ?? null) === gid)
      .sort((a, b) => a.order - b.order);

  const ungrouped = screensOf(null);
  const sections = [
    ...[...groups].sort((a, b) => a.order - b.order).map((g) => ({ id: g.id, name: g.name, screens: screensOf(g.id) })),
    ...(ungrouped.length ? [{ id: null as string | null, name: '미분류', screens: ungrouped }] : []),
  ];

  const onAddGroup = async () => {
    if (!projectId) return;
    const name = window.prompt('새 그룹 이름', `그룹 ${groups.length + 1}`);
    if (!name) return;
    addGroup(await api.createGroup(projectId, name));
  };

  const onAddScreen = async (groupId: string | null) => {
    if (!projectId) return;
    const screen = await api.createScreen(projectId, undefined, groupId);
    addScreen(screen);
  };

  const onRenameGroup = async (id: string, current: string) => {
    const name = window.prompt('그룹 이름', current);
    if (!name || name === current) return;
    renameGroup(id, name);
    await api.updateGroup(id, { name });
  };

  const onDeleteGroup = async (id: string) => {
    if (!window.confirm('이 그룹을 삭제할까요? (안의 화면은 미분류로 이동)')) return;
    removeGroup(id);
    await api.deleteGroup(id);
  };

  const onDeleteScreen = async (id: string) => {
    if (screens.length <= 1) {
      window.alert('최소 한 개의 화면은 필요합니다.');
      return;
    }
    if (!window.confirm('이 화면을 삭제할까요?')) return;
    removeScreen(id);
    await api.deleteScreen(id);
  };

  // Reorder groups: drop the dragged group at the target group's position.
  const onGroupDrop = async (overId: string | null) => {
    const id = dragGroupId.current;
    dragGroupId.current = null;
    if (!id || id === overId) return;
    moveGroup(id, overId);
    const ordered = useEditor.getState().groups;
    await Promise.all(ordered.map((g, i) => api.updateGroup(g.id, { order: i })));
  };

  // Move dragged screen into targetGroup at targetIndex, then reindex + persist.
  const applyMove = async (targetGroupId: string | null, targetIndex: number) => {
    const id = dragId.current;
    dragId.current = null;
    if (!id) return;
    const list = screensOf(targetGroupId).filter((s) => s.id !== id);
    const moved = screens.find((s) => s.id === id);
    if (!moved) return;
    list.splice(Math.max(0, Math.min(targetIndex, list.length)), 0, moved);
    list.forEach((s, i) => setScreenGroup(s.id, targetGroupId, i));
    await Promise.all(
      list.map((s, i) => api.updateScreen(s.id, { groupId: targetGroupId ?? '', order: i })),
    );
  };

  return (
    <div className="filmstrip">
      {sections.map((sec) => {
        const isCollapsed = sec.id != null && collapsed.has(sec.id);
        return (
          <div
            key={sec.id ?? 'ungrouped'}
            className="film-group"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragGroupId.current) void onGroupDrop(sec.id);
              else void applyMove(sec.id, sec.screens.length);
            }}
          >
            <div className="film-group-head">
              <span className="film-head-left">
                {sec.id != null && (
                  <span
                    className="film-drag"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      dragGroupId.current = sec.id;
                      dragId.current = null;
                    }}
                    title="드래그하여 그룹 순서 변경"
                  >
                    ⠿
                  </span>
                )}
                <button
                  className="film-collapse"
                  onClick={() =>
                    sec.id != null &&
                    setCollapsed((c) => {
                      const n = new Set(c);
                      n.has(sec.id!) ? n.delete(sec.id!) : n.add(sec.id!);
                      return n;
                    })
                  }
                >
                  {sec.id == null ? '•' : isCollapsed ? '▸' : '▾'} {sec.name}{' '}
                  <span className="film-count">({sec.screens.length})</span>
                </button>
              </span>
              <span className="film-group-actions">
                <button className="film-mini" onClick={() => void onAddScreen(sec.id)} title="이 그룹에 화면 추가">
                  + 화면
                </button>
                {sec.id != null && (
                  <>
                    <button className="film-mini" onClick={() => void onRenameGroup(sec.id!, sec.name)} title="이름 수정">
                      ✎
                    </button>
                    <button className="film-mini" onClick={() => void onDeleteGroup(sec.id!)} title="그룹 삭제">
                      ✕
                    </button>
                  </>
                )}
              </span>
            </div>

            {!isCollapsed && (
              <div className="film-row">
                {sec.screens.map((s, i) => (
                  <ScreenThumb
                    key={s.id}
                    screen={s}
                    active={s.id === activeId}
                    onSelect={() => setActive(s.id)}
                    onDelete={() => void onDeleteScreen(s.id)}
                    onDragStart={() => {
                      dragId.current = s.id;
                    }}
                    onDropBefore={() => void applyMove(sec.id, i)}
                  />
                ))}
                {sec.screens.length === 0 && (
                  <button className="film-add-empty" onClick={() => void onAddScreen(sec.id)}>
                    + 화면
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button className="film-add-group" onClick={onAddGroup}>
        + 그룹 추가
      </button>
    </div>
  );
}
