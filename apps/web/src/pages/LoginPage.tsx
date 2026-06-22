import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const PROVIDERS = [
  { key: 'google', label: 'Google로 계속하기', cls: 'google' },
  { key: 'kakao', label: '카카오로 계속하기', cls: 'kakao' },
  { key: 'naver', label: '네이버로 계속하기', cls: 'naver' },
  { key: 'apple', label: 'Apple로 계속하기', cls: 'apple' },
];

export function LoginPage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [guestLoading, setGuestLoading] = useState(false);

  // After OAuth redirect lands back on "/", but if we land on /login while a
  // cookie already exists, re-check session.
  useEffect(() => {
    if (!user && !loading) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGuest = async () => {
    setGuestLoading(true);
    try {
      await api.guestLogin();
      await refresh();
      navigate('/');
    } catch {
      setGuestLoading(false);
      window.alert('게스트 입장에 실패했습니다.');
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>wowBoard</h1>
        <p>화면 기획서를 빠르게 그리는 가장 쉬운 방법</p>
        {PROVIDERS.map((p) => (
          <a key={p.key} className={`social-btn ${p.cls}`} href={api.loginUrl(p.key)}>
            {p.label}
          </a>
        ))}

        <div className="divider"><span>또는</span></div>

        <button className="social-btn guest" onClick={onGuest} disabled={guestLoading}>
          {guestLoading ? '입장 중…' : '로그인 없이 둘러보기'}
        </button>
      </div>
    </div>
  );
}
