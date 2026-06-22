import { useEffect, useState } from 'react';
import { SCREEN_TEMPLATES, type ScreenTemplate } from '@wowboard/shared';
import { api, type UserTemplate } from '../api/client';
import { useEditor } from './store';

export function TemplatePicker() {
  const projectId = useEditor((s) => s.projectId);
  const activeScreen = useEditor((s) => s.activeScreen());
  const addScreen = useEditor((s) => s.addScreen);
  const setScreenSize = useEditor((s) => s.setScreenSize);
  const addElements = useEditor((s) => s.addElements);

  const [mine, setMine] = useState<UserTemplate[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => setMine(await api.getTemplates());
  useEffect(() => {
    void load();
  }, []);

  // Create a new screen from a template definition (built-in or user).
  const applyTemplate = async (t: {
    name: string;
    width: number;
    height: number;
    elements: ScreenTemplate['elements'];
  }) => {
    if (!projectId) return;
    const screen = await api.createScreen(projectId, t.name);
    addScreen(screen);
    if (t.width !== screen.width || t.height !== screen.height) {
      setScreenSize(screen.id, { width: t.width, height: t.height });
      await api.updateScreen(screen.id, { width: t.width, height: t.height });
    }
    if (t.elements.length) addElements(t.elements);
  };

  const saveCurrent = async () => {
    if (!activeScreen) return;
    const name = window.prompt('템플릿 이름', activeScreen.name || '내 템플릿');
    if (!name) return;
    setBusy(true);
    try {
      const elements = activeScreen.elements.map(({ id: _id, ...rest }) => rest);
      await api.createTemplate({
        name,
        width: activeScreen.width,
        height: activeScreen.height,
        elements,
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('이 템플릿을 삭제할까요?')) return;
    await api.deleteTemplate(id);
    await load();
  };

  return (
    <div className="tpl-picker">
      <h4>템플릿으로 화면 추가</h4>

      <button
        className="btn primary small"
        style={{ width: '100%', marginBottom: 10 }}
        onClick={saveCurrent}
        disabled={busy || !activeScreen}
        title="현재 화면을 내 템플릿으로 저장"
      >
        {busy ? '저장 중…' : '+ 현재 화면을 템플릿으로 저장'}
      </button>

      {mine.length > 0 && (
        <>
          <div className="tpl-group">내 템플릿</div>
          {mine.map((t) => (
            <button key={t.id} className="tpl-row" onClick={() => void applyTemplate(t)}>
              <span className="tpl-name">{t.name}</span>
              <span className="tpl-right">
                <span className="tpl-size">
                  {t.width}×{t.height}
                </span>
                <span className="tpl-del" onClick={(e) => void remove(e, t.id)} title="삭제">
                  ✕
                </span>
              </span>
            </button>
          ))}
        </>
      )}

      <div className="tpl-group">기본 템플릿</div>
      {SCREEN_TEMPLATES.map((t) => (
        <button
          key={t.id}
          className="tpl-row"
          onClick={() =>
            void applyTemplate({ name: t.label, width: t.width, height: t.height, elements: t.elements })
          }
        >
          <span className="tpl-name">{t.label}</span>
          <span className="tpl-size">
            {t.width}×{t.height}
          </span>
        </button>
      ))}
    </div>
  );
}
