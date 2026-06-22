import { Link } from 'react-router-dom';

/** Logo mark + wordmark, links to home. Used in all top bars. */
export function Brand() {
  return (
    <Link to="/" className="brand">
      <img src="/wowBoardLogo.png" className="brand-logo" alt="" />
      <span className="brand-text">
        wow<span className="brand-accent">Board</span>
      </span>
    </Link>
  );
}
