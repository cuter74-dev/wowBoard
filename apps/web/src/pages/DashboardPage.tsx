import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type ProjectListItem } from '../api/client';
import { TopBar } from '../components/TopBar';

const SIZE_PRESETS = [
  { label: '모바일 (390×844)', width: 390, height: 844 },
  { label: '태블릿 (768×1024)', width: 768, height: 1024 },
  { label: '데스크톱 (1280×800)', width: 1280, height: 800 },
];

export function DashboardPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setProjects(await api.listProjects());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!window.confirm('이 프로젝트를 삭제할까요?')) return;
    await api.deleteProject(id);
    await load();
  };

  return (
    <>
      <TopBar />
      <div className="container">
        <div className="dash-head">
          <h2 style={{ margin: 0 }}>내 프로젝트</h2>
          <button className="btn primary" onClick={() => setShowModal(true)}>
            + 새 프로젝트
          </button>
        </div>

        {loading ? (
          <div className="centered">불러오는 중…</div>
        ) : projects.length === 0 ? (
          <div className="centered" style={{ flexDirection: 'column', height: 200 }}>
            <p>아직 프로젝트가 없습니다.</p>
            <button className="btn primary" onClick={() => setShowModal(true)}>
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div className="grid">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card">
                <h3>{p.title}</h3>
                <div className="meta">
                  화면 {p._count?.screens ?? 0}개
                  <br />
                  {new Date(p.updatedAt).toLocaleDateString('ko-KR')}
                </div>
                <div className="actions">
                  <button className="btn small danger" onClick={(e) => onDelete(e, p.id)}>
                    삭제
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={async () => {
            setShowModal(false);
            await load();
          }}
        />
      )}
    </>
  );
}

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('제목 없는 프로젝트');
  const [sizeIdx, setSizeIdx] = useState(0);
  const [customW, setCustomW] = useState(390);
  const [customH, setCustomH] = useState(844);
  const [busy, setBusy] = useState(false);

  const isCustom = sizeIdx === SIZE_PRESETS.length;

  const create = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const size = isCustom
        ? { width: Math.max(50, customW), height: Math.max(50, customH) }
        : { width: SIZE_PRESETS[sizeIdx].width, height: SIZE_PRESETS[sizeIdx].height };
      await api.createProject(title.trim(), size);
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>새 프로젝트</h3>
        <div className="field">
          <label>프로젝트 이름</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
          />
        </div>
        <div className="field">
          <label>화면 크기 (이 프로젝트의 모든 화면 기본값)</label>
          <select value={sizeIdx} onChange={(e) => setSizeIdx(Number(e.target.value))}>
            {SIZE_PRESETS.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
            <option value={SIZE_PRESETS.length}>직접 입력</option>
          </select>
        </div>
        {isCustom && (
          <div className="row2">
            <div className="field">
              <label>너비</label>
              <input
                type="number"
                min={50}
                value={customW}
                onChange={(e) => setCustomW(Math.round(Number(e.target.value) || 0))}
              />
            </div>
            <div className="field">
              <label>높이</label>
              <input
                type="number"
                min={50}
                value={customH}
                onChange={(e) => setCustomH(Math.round(Number(e.target.value) || 0))}
              />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn small" onClick={onClose} disabled={busy}>
            취소
          </button>
          <button className="btn primary small" onClick={create} disabled={busy || !title.trim()}>
            {busy ? '생성 중…' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}
