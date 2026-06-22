import { useEffect, useState } from 'react';
import { AI_PROVIDERS, AI_DEFAULT_MODEL, type AiProviderKind } from '@wowboard/shared';
import { api, type AiCredentialInfo } from '../api/client';
import { TopBar } from '../components/TopBar';

export function SettingsPage() {
  const [creds, setCreds] = useState<AiCredentialInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setCreds(await api.getAiCredentials());
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <TopBar />
      <div className="container">
        <h2 style={{ marginTop: 0 }}>AI 연동 설정 (BYOK)</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -6 }}>
          각 제공자의 API 키를 직접 등록합니다. 키는 서버에 암호화 저장되며 화면에 다시 표시되지 않습니다.
          입력한 프롬프트와 업로드 이미지는 선택한 제공자에게 전송됩니다.
        </p>
        {loading ? (
          <div className="centered">불러오는 중…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {AI_PROVIDERS.map((p) => (
              <ProviderCard
                key={p.kind}
                kind={p.kind}
                label={p.label}
                needsBaseUrl={p.needsBaseUrl}
                info={creds.find((c) => c.provider === p.kind)}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ProviderCard({
  kind,
  label,
  needsBaseUrl,
  info,
  onChanged,
}: {
  kind: AiProviderKind;
  label: string;
  needsBaseUrl: boolean;
  info?: AiCredentialInfo;
  onChanged: () => void;
}) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(info?.baseUrl ?? '');
  const [model, setModel] = useState(info?.model ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.putAiCredential(kind, {
        apiKey: apiKey || undefined,
        baseUrl: needsBaseUrl ? baseUrl : undefined,
        model: model || undefined,
      });
      setApiKey('');
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`${label} 설정을 삭제할까요?`)) return;
    await api.deleteAiCredential(kind);
    onChanged();
  };

  return (
    <div className="card" style={{ minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{label}</h3>
        <span style={{ fontSize: 12, color: info?.hasKey || (needsBaseUrl && info?.baseUrl) ? '#047857' : 'var(--muted)' }}>
          {info?.hasKey ? '● 키 등록됨' : needsBaseUrl && info?.baseUrl ? '● 설정됨' : '○ 미설정'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)' }}>
          API 키 {info?.hasKey ? '(변경 시에만 입력)' : ''}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={kind === 'local' ? '로컬은 비워둬도 됩니다' : 'sk-...'}
            style={inputStyle}
          />
        </label>
        {needsBaseUrl && (
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>
            엔드포인트 URL
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              style={inputStyle}
            />
          </label>
        )}
        <label style={{ fontSize: 12, color: 'var(--muted)' }}>
          모델 (선택)
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={AI_DEFAULT_MODEL[kind]}
            style={inputStyle}
          />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary small" onClick={save} disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
          {(info?.hasKey || info?.baseUrl) && (
            <button className="btn danger small" onClick={remove}>
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 13,
  marginTop: 4,
};
