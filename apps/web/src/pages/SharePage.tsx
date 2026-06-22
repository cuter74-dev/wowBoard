import { Brand } from '../components/Brand';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ProjectDetail, ScreenWithElements } from '../api/client';
import { api } from '../api/client';
import { ElementRenderer } from '../editor/ElementRenderer';

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getShared(token)
      .then((p) => {
        setProject(p);
        setActiveId(p.screens?.[0]?.id ?? null);
      })
      .catch(() => setError(true));
  }, [token]);

  if (error) return <div className="centered">공유된 프로젝트를 찾을 수 없습니다.</div>;
  if (!project) return <div className="centered">불러오는 중…</div>;

  const screens = (project.screens ?? []) as ScreenWithElements[];
  const active = screens.find((s) => s.id === activeId);

  return (
    <div className="editor">
      <div className="topbar">
        <Brand />
        <span style={{ fontWeight: 600 }}>{project.title} (읽기 전용)</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>공유 보기</span>
      </div>

      <div className="canvas-area">
        {active && (
          <div
            className="screen-frame"
            style={{ width: active.width, height: active.height }}
          >
            {active.elements.map((el) => (
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
        )}
      </div>

      <div className="tabs">
        {screens.map((s) => (
          <button
            key={s.id}
            className={`tab ${s.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}
