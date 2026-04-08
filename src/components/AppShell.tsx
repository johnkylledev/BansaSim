import { Link, NavLink } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import logoImg from '../assets/logo.png';
import betterGovImg from '../assets/BetterGov_Icon-Primary.svg';

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'text-sm font-medium px-4 py-2 rounded-full transition-all duration-200',
          isActive ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('theme', 'light');
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50/50 font-sans text-slate-900">
      <div className="bg-amber-100/50 text-amber-800 text-[13px] font-semibold py-2 px-4 text-center border-b border-amber-200/50 uppercase tracking-wide">
        Disclaimer: This app is an educational simulator and not an official forecast. Do not use for real-world policy decisions.
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img src={logoImg} alt="BansaSim logo" className="h-10 w-10 rounded-xl object-contain shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-blue-900">BansaSim</span>
          </Link>
          <nav className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 p-1.5 shadow-sm overflow-x-auto shrink hide-scrollbar">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/results" label="Results" />
            <NavItem to="/references" label="References" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-8 py-8 min-h-[calc(100vh-140px)]">{children}</main>
      
      <footer className="border-t border-slate-200/80 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-4">
            <span className="text-sm font-medium text-slate-500">A project by John Kylle Pantorilla with the idea and support of BetterGovPH</span>
            <div className="flex items-center gap-6">
              <a href="https://bansa-sim.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <img src={logoImg} alt="BansaSim Logo" className="h-16 object-contain" />
              </a>
              <div className="h-10 w-px bg-slate-200"></div>
              <a href="https://bettergov.ph/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <img src={betterGovImg} alt="BetterGovPH Logo" className="h-16 object-contain" />
              </a>
            </div>
          </div>
          <div className="text-sm text-slate-500 text-center md:text-right max-w-md">
            Empowering Filipinos through data-driven governance and civic technology.
          </div>
        </div>
      </footer>
    </div>
  );
}
