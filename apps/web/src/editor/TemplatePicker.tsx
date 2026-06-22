import { SCREEN_TEMPLATES, type ScreenTemplate } from '@wowboard/shared';
import { api } from '../api/client';
import { useEditor } from './store';

export function TemplatePicker() {
  const projectId = useEditor((s) => s.projectId);
  const addScreen = useEditor((s) => s.addScreen);
  const setScreenSize = useEditor((s) => s.setScreenSize);
  const addElements = useEditor((s) => s.addElements);

  const onTemplate = async (t: ScreenTemplate) => {
    if (!projectId) return;
    const screen = await api.createScreen(projectId, t.label);
    addScreen(screen);
    if (t.width !== screen.width || t.height !== screen.height) {
      setScreenSize(screen.id, { width: t.width, height: t.height });
      await api.updateScreen(screen.id, { width: t.width, height: t.height });
    }
    if (t.elements.length) addElements(t.elements);
  };

  return (
    <div className="tpl-picker">
      <h4>템플릿으로 화면 추가</h4>
      {SCREEN_TEMPLATES.map((t) => (
        <button key={t.id} className="tpl-row" onClick={() => void onTemplate(t)}>
          {t.label}
          <span className="tpl-size">
            {t.width}×{t.height}
          </span>
        </button>
      ))}
    </div>
  );
}
