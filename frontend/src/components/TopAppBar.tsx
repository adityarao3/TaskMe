import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopAppBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-40"
      style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.03), inset 0 2px 4px rgba(255,255,255,0.8)' }}>
      <div className="flex items-center gap-3">
        <div className="clay-input flex items-center gap-2 px-4 py-2.5 min-w-[260px]">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground">search</span>
          <span className="text-sm text-muted-foreground/60">Search...</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="clay-card-sm px-4 py-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-[11px] font-bold text-secondary-foreground">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">{user.name}</span>
          </div>
        )}
        <button className="clay-btn-ghost w-9 h-9 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground">settings</span>
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="clay-btn-ghost w-9 h-9 flex items-center justify-center" title="Log out">
          <span className="material-symbols-outlined text-[20px] text-muted-foreground">logout</span>
        </button>
      </div>
    </header>
  );
}
