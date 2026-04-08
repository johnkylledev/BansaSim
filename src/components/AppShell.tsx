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
          'text-sm px-3 py-1.5 rounded-full transition-all duration-200',
          isActive ? 'bg-[#0b2a6f] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
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
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-white via-[#f8fbff] to-white">
      <div className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img src={logoImg} alt="BansaSim logo" className="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-contain" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#0b2a6f]">BansaSim</span>
          </Link>
          <div className="flex items-center gap-1 rounded-full border bg-white/80 p-1 overflow-x-auto shrink hide-scrollbar">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/results" label="Results" />
            <NavItem to="/references" label="References" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-[1400px] px-6 py-6 min-h-[calc(100vh-140px)]">{children}</main>
      
      <footer className="border-t bg-slate-50 mt-auto">
        <div className="mx-auto max-w-[1400px] px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
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
