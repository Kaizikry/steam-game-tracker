import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMe } from '../hooks/useApi';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMemo, useState } from 'react';
import { GameDetailModal } from './GameDetailModal';
import { Modal } from './Modal';
import { Toaster } from './Toaster';

const nav = [
    { to: '/', label: 'Home', icon: '⌂', key: 'h' },
    { to: '/games', label: 'Games', icon: '▥', key: 'g' },
    { to: '/stats', label: 'Stats', icon: '📊', key: 's' },
    { to: '/settings', label: 'Settings', icon: '⚙', key: ',' },
];

export function Layout() {
    const { data: me } = useMe();
    const navigate = useNavigate();
    const [help, setHelp] = useState(false);

    const shortcuts = useMemo(
        () => ({
            ...Object.fromEntries(nav.map((n) => [n.key, () => navigate(n.to)])),
            '?': () => setHelp(true),
        }),
        [navigate],
    );
    useKeyboardShortcuts(shortcuts);

    const link = ({ isActive }: { isActive: boolean }) =>
        `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-200 dark:hover:bg-steam-700'}`;

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-sky-600 focus:px-3 focus:py-2 focus:text-white"
            >
                Skip to content
            </a>
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-steam-800/90">
                <div className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-3">
                    <NavLink to="/" className="flex items-center gap-2 font-bold">
                        <img src="/favicon.svg" alt="" className="size-7" /> Steam Tracker
                    </NavLink>
                    <nav className="hidden gap-1 md:flex" aria-label="Main">
                        {nav.map((n) => (
                            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={link}>
                                {n.label}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-3">
                        <button
                            className="muted hidden text-sm hover:underline sm:block"
                            onClick={() => setHelp(true)}
                            aria-label="Keyboard shortcuts"
                        >
                            ⌨ ?
                        </button>
                        {me?.profileImage && (
                            <img src={me.profileImage} alt="" className="size-8 rounded-full" />
                        )}
                        <span className="max-w-40 truncate text-sm font-medium">
                            {me?.displayName ?? 'Guest'}
                        </span>
                    </div>
                </div>
            </header>

            <main id="main" className="mx-auto max-w-screen-2xl px-4 py-6">
                <Outlet />
            </main>

            <nav
                className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-800 dark:bg-steam-800/95"
                aria-label="Main"
            >
                {nav.map((n) => (
                    <NavLink
                        key={n.to}
                        to={n.to}
                        end={n.to === '/'}
                        className={({ isActive }) =>
                            `flex flex-col items-center py-2 text-xs ${isActive ? 'text-sky-600 dark:text-sky-400' : 'muted'}`
                        }
                    >
                        <span aria-hidden="true" className="text-lg leading-none">
                            {n.icon}
                        </span>
                        {n.label}
                    </NavLink>
                ))}
            </nav>

            <GameDetailModal />
            <Toaster />
            {help && (
                <Modal title="Keyboard shortcuts" onClose={() => setHelp(false)}>
                    <div className="space-y-3 p-5">
                        <h2 className="text-lg font-bold">Keyboard shortcuts</h2>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                            {[
                                ['h / g / s / ,', 'Home / Games / Stats / Settings'],
                                ['/', 'Focus search (Games)'],
                                ['v', 'Cycle board / grid / list view'],
                                ['Shift + click', 'Select a game card'],
                                ['Esc', 'Close dialog, clear selection'],
                                ['1 – 4', 'Set status in the game dialog'],
                                ['Ctrl/⌘ + Enter', 'Save notes'],
                                ['Space, arrows', 'Pick up and move a focused card on the board'],
                                ['?', 'This help'],
                            ].map(([k, d]) => (
                                <div key={k} className="contents">
                                    <dt>
                                        <kbd className="rounded border border-slate-300 px-1.5 py-0.5 text-xs dark:border-slate-600">
                                            {k}
                                        </kbd>
                                    </dt>
                                    <dd>{d}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="text-right">
                            <button className="btn-secondary" onClick={() => setHelp(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
