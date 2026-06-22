import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ReactNode } from 'react';

export function TopBar({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <Link to="/" className="brand">
        wowBoard
      </Link>
      <div className="right">
        {children}
        <NavLink to="/settings" className="btn small">
          설정
        </NavLink>
        {user?.avatarUrl && <img className="avatar" src={user.avatarUrl} alt="" />}
        <span style={{ fontSize: 14 }}>{user?.name ?? user?.email}</span>
        <button className="btn small" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
