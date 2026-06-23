import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useEditor } from '../editor/store';
import { Palette } from '../editor/Palette';
import { ToolsPanel } from '../editor/ToolsPanel';
import { copyToClipboard } from '../util/clipboard';
import { Brand } from '../components/Brand';
import { Canvas } from '../editor/Canvas';
import { PropertiesPanel } from '../editor/PropertiesPanel';
import { Filmstrip } from '../editor/Filmstrip';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const init = useEditor((s) => s.init);
  const revision = useEditor((s) => s.revision);
  const activeScreenId = useEditor((s) => s.activeScreenId);
  const saveStatus = useEditor((s) => s.saveStatus);
  const setSaveStatus = useEditor((s) => s.setSaveStatus);
  const removeSelected = useEditor((s) => s.removeSelected);
  const copySelected = useEditor((s) => s.copySelected);
  const paste = useEditor((s) => s.paste);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);

  // Load project
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getProject(id).then((p) => {
      init(p);
      setLoading(false);
    });
  }, [id, init]);

  // Debounced autosave of the active screen's elements
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (revision === 0 || !activeScreenId) return;
    setSaveStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const screen = useEditor.getState().screens.find((s) => s.id === activeScreenId);
      if (!screen) return;
      const payload = screen.elements.map(({ id: _id, ...rest }) => rest);
      try {
        await api.putElements(activeScreenId, payload);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [revision, activeScreenId, setSaveStatus]);

  // Keyboard shortcuts: delete, copy/paste, undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'c') {
        copySelected();
      } else if (mod && e.key.toLowerCase() === 'v') {
        paste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        removeSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [removeSelected, copySelected, paste, undo, redo]);

  if (loading) return <div className="centered">에디터 불러오는 중…</div>;

  return (
    <div className="editor">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Brand />
          <TitleEditor />
        </div>
        <div className="right">
          <UndoRedo />
          <SaveBadge status={saveStatus} />
          <ShareButton />
        </div>
      </div>

      <div className="editor-body">
        <div className="left-rail">
          <Palette />
        </div>
        <Canvas />
        {rightOpen ? (
          <div className="right-rail">
            <button
              className="rail-collapse"
              onClick={() => setRightOpen(false)}
              title="오른쪽 패널 닫기"
            >
              <span>속성 · 도구</span>
              <span>▸</span>
            </button>
            <PropertiesPanel />
            <ToolsPanel />
          </div>
        ) : (
          <button
            className="rail-reopen"
            onClick={() => setRightOpen(true)}
            title="오른쪽 패널 열기"
          >
            ◂ 속성·도구
          </button>
        )}
      </div>

      <Filmstrip />
    </div>
  );
}

function TitleEditor() {
  const projectId = useEditor((s) => s.projectId);
  const title = useEditor((s) => s.title);
  const setTitle = useEditor((s) => s.setTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = async () => {
    setEditing(false);
    const next = draft.trim();
    if (!next || next === title || !projectId) {
      setDraft(title);
      return;
    }
    setTitle(next);
    await api.updateProject(projectId, { title: next }).catch(() => {});
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(title);
            setEditing(false);
          }
        }}
        style={{ fontWeight: 600, fontSize: 15, padding: '4px 8px' }}
      />
    );
  }
  return (
    <span
      style={{ fontWeight: 600, cursor: 'text' }}
      title="클릭하여 제목 수정"
      onClick={() => {
        setDraft(title);
        setEditing(true);
      }}
    >
      {title}
    </span>
  );
}

function UndoRedo() {
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  return (
    <>
      <button className="btn small" onClick={undo} disabled={!canUndo} title="실행 취소 (Ctrl+Z)">
        ↶
      </button>
      <button className="btn small" onClick={redo} disabled={!canRedo} title="다시 실행 (Ctrl+Shift+Z)">
        ↷
      </button>
    </>
  );
}

function SaveBadge({ status }: { status: string }) {
  const label =
    status === 'saving'
      ? '저장 중…'
      : status === 'saved'
        ? '저장됨'
        : status === 'error'
          ? '저장 실패'
          : '';
  return <span className={`save-status ${status}`}>{label}</span>;
}

function ShareButton() {
  const projectId = useEditor((s) => s.projectId);
  const shareToken = useEditor((s) => s.shareToken);
  const setShareToken = useEditor((s) => s.setShareToken);

  const shareUrl = shareToken ? `${window.location.origin}/share/${shareToken}` : null;

  const onShare = async () => {
    if (!projectId) return;
    if (shareToken) {
      const ok = await copyToClipboard(shareUrl!);
      window.alert((ok ? '공유 링크가 복사되었습니다:' : '공유 링크입니다:') + '\n' + shareUrl);
      return;
    }
    const res = await api.enableShare(projectId);
    setShareToken(res.shareToken);
    const url = `${window.location.origin}/share/${res.shareToken}`;
    const ok = await copyToClipboard(url);
    window.alert((ok ? '공유가 활성화되어 링크를 복사했습니다:' : '공유가 활성화되었습니다:') + '\n' + url);
  };

  const onDisable = async () => {
    if (!projectId) return;
    if (!window.confirm('공유를 중지할까요? 기존 링크는 무효화됩니다.')) return;
    await api.disableShare(projectId);
    setShareToken(null);
  };

  return (
    <>
      <button className="btn primary small" onClick={onShare}>
        {shareToken ? '링크 복사' : '공유'}
      </button>
      {shareToken && (
        <button className="btn small" onClick={onDisable}>
          공유 중지
        </button>
      )}
    </>
  );
}
