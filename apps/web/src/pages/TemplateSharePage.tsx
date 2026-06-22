import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { ElementInput } from '@wowboard/shared';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ElementRenderer } from '../editor/ElementRenderer';
import { Brand } from '../components/Brand';

interface Shared {
  name: string;
  width: number;
  height: number;
  elements: ElementInput[];
}

export function TemplateSharePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tpl, setTpl] = useState<Shared | null>(null);
  const [error, setError] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getSharedTemplate(token).then(setTpl).catch(() => setError(true));
  }, [token]);

  const onImport = async () => {
    if (!token) return;
    setImporting(true);
    try {
      await api.importTemplate(token);
      window.alert('내 템플릿으로 가져왔습니다. 에디터의 "템플릿으로 화면 추가"에서 사용하세요.');
      navigate('/');
    } catch (e) {
      window.alert('가져오기 실패: ' + (e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  if (error) return <div className="centered">공유된 템플릿을 찾을 수 없습니다.</div>;
  if (!tpl) return <div className="centered">불러오는 중…</div>;

  return (
    <div className="editor">
      <div className="topbar">
        <Brand />
        <span style={{ fontWeight: 600 }}>공유 템플릿: {tpl.name}</span>
        <div className="right">
          {loading ? null : user ? (
            <button className="btn primary small" onClick={onImport} disabled={importing}>
              {importing ? '가져오는 중…' : '내 템플릿으로 가져오기'}
            </button>
          ) : (
            <Link className="btn primary small" to="/login">
              로그인하고 가져오기
            </Link>
          )}
        </div>
      </div>

      <div className="canvas-area">
        <div className="screen-frame" style={{ width: tpl.width, height: tpl.height }}>
          {tpl.elements.map((el, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
              }}
            >
              <ElementRenderer el={{ ...el, id: String(i) }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
