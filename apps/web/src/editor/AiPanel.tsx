import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AI_PROVIDERS, type AiProviderKind } from '@wowboard/shared';
import { api } from '../api/client';
import { useEditor } from './store';

const SIZE_PRESETS = [
  { label: '모바일 (390×844)', width: 390, height: 844 },
  { label: '태블릿 (768×1024)', width: 768, height: 1024 },
  { label: '데스크톱 (1280×800)', width: 1280, height: 800 },
];

export function AiPanel() {
  const [providers, setProviders] = useState<AiProviderKind[]>([]);
  const [provider, setProvider] = useState<AiProviderKind | ''>('');
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const projectId = useEditor((s) => s.projectId);
  const activeScreen = useEditor((s) => s.activeScreen());
  const defaultWidth = useEditor((s) => s.defaultWidth);
  const defaultHeight = useEditor((s) => s.defaultHeight);
  const addElements = useEditor((s) => s.addElements);
  const replaceElements = useEditor((s) => s.replaceElements);
  const addScreen = useEditor((s) => s.addScreen);
  const setScreenSize = useEditor((s) => s.setScreenSize);

  // Template size options: project default first (selected by default), then presets.
  const sizeOptions = [
    { label: `프로젝트 기본 (${defaultWidth}×${defaultHeight})`, width: defaultWidth, height: defaultHeight },
    ...SIZE_PRESETS,
  ];

  useEffect(() => {
    api.getAiProviders().then((p) => {
      setProviders(p);
      setProvider((cur) => cur || p[0] || '');
    });
  }, []);

  const labelOf = (k: AiProviderKind) => AI_PROVIDERS.find((p) => p.kind === k)?.label ?? k;

  const onGenerate = async () => {
    if (!provider || !prompt.trim() || !activeScreen) return;
    setBusy(true);
    setError('');
    try {
      const current = activeScreen.elements.map(({ id: _id, ...rest }) => rest);
      const res = await api.aiGenerate(provider, prompt.trim(), {
        width: activeScreen.width,
        height: activeScreen.height,
        mode,
        current: current.length ? current : undefined,
      });
      if (mode === 'edit') replaceElements(res.elements);
      else addElements(res.elements);
      setPrompt('');
    } catch (e) {
      setError((e as Error).message || '생성 실패');
    } finally {
      setBusy(false);
    }
  };

  const onImage = async (file: File) => {
    if (!provider || !projectId) return;
    setBusy(true);
    setError('');
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] ?? '';
      const size = sizeOptions[sizeIdx];
      const res = await api.aiFromImage(provider, base64, file.type, {
        width: size.width,
        height: size.height,
      });
      // New screen = template
      const screen = await api.createScreen(projectId, 'AI 템플릿');
      addScreen(screen);
      if (res.width !== screen.width || res.height !== screen.height) {
        setScreenSize(screen.id, { width: res.width, height: res.height });
        await api.updateScreen(screen.id, { width: res.width, height: res.height });
      }
      addElements(res.elements);
    } catch (e) {
      setError((e as Error).message || '템플릿화 실패');
    } finally {
      setBusy(false);
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="ai-panel">
      <h4>AI 어시스턴트</h4>
      {providers.length === 0 ? (
        <p className="ai-hint">
          AI 제공자가 없습니다.{' '}
          <Link to="/settings">설정</Link>에서 API 키를 등록하세요.
        </p>
      ) : (
        <>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AiProviderKind)}
            className="ai-input"
          >
            {providers.map((k) => (
              <option key={k} value={k}>
                {labelOf(k)}
              </option>
            ))}
          </select>

          <div className="ai-modes">
            <button
              className={`ai-mode ${mode === 'add' ? 'active' : ''}`}
              onClick={() => setMode('add')}
              disabled={busy}
            >
              추가
            </button>
            <button
              className={`ai-mode ${mode === 'edit' ? 'active' : ''}`}
              onClick={() => setMode('edit')}
              disabled={busy}
            >
              현재 화면 수정
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'edit'
                ? '예: 로그인 버튼을 빨갛게, 입력칸 하나 더 추가'
                : '예: 이메일/비밀번호 입력과 로그인 버튼이 있는 로그인 화면'
            }
            rows={3}
            className="ai-input"
            disabled={busy}
          />
          <button
            className="btn primary small"
            style={{ width: '100%' }}
            onClick={onGenerate}
            disabled={busy || !prompt.trim()}
          >
            {busy ? '생성 중…' : mode === 'edit' ? '화면 수정' : '요소 추가'}
          </button>

          <div className="ai-divider">스크린샷 → 템플릿</div>
          <select
            value={sizeIdx}
            onChange={(e) => setSizeIdx(Number(e.target.value))}
            className="ai-input"
            disabled={busy}
          >
            {sizeOptions.map((s, i) => (
              <option key={s.label} value={i}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 12 }}
          />
          {imageFile && (
            <p className="ai-hint" style={{ color: 'var(--text)' }}>
              선택됨: {imageFile.name}
            </p>
          )}
          <button
            className="btn primary small"
            style={{ width: '100%' }}
            onClick={() => imageFile && void onImage(imageFile)}
            disabled={busy || !imageFile}
          >
            {busy ? '생성 중…' : '템플릿 생성'}
          </button>
          <p className="ai-hint">이미지를 고른 뒤 버튼을 누르면 새 화면으로 재현합니다.</p>
        </>
      )}
      {error && <p className="ai-error">{error}</p>}
    </div>
  );
}
