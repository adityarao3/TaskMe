import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/projects', label: 'Projects', icon: 'folder_open' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar_today' },
];

export default function SideNavBar() {
  const location = useLocation();
  const { dark, toggle } = useTheme();

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-background flex flex-col z-50 p-5"
      style={{ boxShadow: '10px 0 20px rgba(0,0,0,0.03)' }}>
      {/* Logo */}
      <div className="mb-10 px-3 pt-2">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full clay-btn flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined fill text-secondary-foreground text-[20px]">dashboard</span>
          </div>
          <span className="text-xl font-black text-foreground tracking-tighter">TaskMe</span>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-2 flex-grow">
        {navItems.map(item => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link key={item.to} to={item.to}
              className={`px-4 py-3 flex items-center gap-3 rounded-full clay-transition ${
                isActive
                  ? 'clay-pressed text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}>
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill text-primary' : ''}`}>{item.icon}</span>
              <span className="text-[15px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Dark mode toggle */}
      <div className="mb-3 px-1">
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-full clay-btn-ghost text-muted-foreground hover:text-foreground">
          <span className="material-symbols-outlined text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
          <span className="text-[15px] font-semibold">{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* New Project CTA */}
      <div className="px-1">
        <Link to="/projects">
          <button className="w-full clay-btn py-3 px-4 font-semibold text-[15px] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>New Project
          </button>
        </Link>
      </div>
    </nav>
  );
}
