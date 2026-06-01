import { Link, useLocation } from 'react-router-dom';
import './GlobalNav.css';

/**
 * 固定右上角：玄机问卜印章 + 卜卦史链接。
 * 在 / 路径下保留印章纯展示形态（不可点击，避免与首页重复）。
 */
export default function GlobalNav() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isHistory = location.pathname === '/history';

  return (
    <div className="global-nav">
      {isHome ? (
        <span className="global-seal">玄机问卜</span>
      ) : (
        <Link to="/" className="global-seal" aria-label="返回首页">
          玄机问卜
        </Link>
      )}

      {!isHistory && (
        <Link to="/history" className="global-history-link" aria-label="卜卦史">
          卜卦史
        </Link>
      )}
    </div>
  );
}
