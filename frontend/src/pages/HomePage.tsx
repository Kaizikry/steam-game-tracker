import { Link } from 'react-router-dom';
import { GameCover } from '../components/GameCover';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { SteamImportForm } from '../components/SteamImportForm';
import { useMe, useStats, useStatusLabels } from '../hooks/useApi';
import { useAppStore } from '../store/useAppStore';
import { formatHours, formatRelative } from '../utils/format';

function motivation(completedThisMonth: number, target: number, inProgress: number) {
    if (target > 0 && completedThisMonth >= target)
        return `Goal smashed: ${completedThisMonth} games finished this month. 🏆`;
    if (target > 0)
        return `${target - completedThisMonth} more to hit this month's goal of ${target}. You've got this.`;
    if (inProgress > 5)
        return `You have ${inProgress} games in progress. Maybe finish one before starting another?`;
    if (completedThisMonth > 0) return `${completedThisMonth} completed this month. Nice pace!`;
    return 'Pick something from your backlog and make some progress today.';
}

export function HomePage() {
    const { data: me } = useMe();
    const { data: stats } = useStats();
    const labels = useStatusLabels();
    const openGame = useAppStore((s) => s.openGame);

    if (me && me.gameCount === 0) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Welcome to Steam Tracker 🎮</h1>
                    <p className="muted">
                        Import your Steam library, then sort every game into Not Started, In
                        Progress, Completed or Abandoned.
                    </p>
                </div>
                <div className="card p-6">
                    <SteamImportForm />
                </div>
                <p className="muted text-center text-sm">
                    Have a backup?{' '}
                    <Link
                        className="text-sky-600 hover:underline dark:text-sky-400"
                        to="/settings#data"
                    >
                        Import a JSON or CSV file
                    </Link>{' '}
                    instead.
                </p>
            </div>
        );
    }

    if (!stats) return <p className="muted">Loading…</p>;

    const g = stats.goal;
    const inProgress = stats.gamesByStatus.IN_PROGRESS;
    const nextUp = stats.mostPlayedGames.filter((x) => x.status === 'IN_PROGRESS').slice(0, 3);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">
                        Welcome back{me?.displayName ? `, ${me.displayName}` : ''}
                    </h1>
                    <p className="muted">
                        {motivation(g.completedThisMonth, g.monthlyTarget, inProgress)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to="/games" className="btn-primary">
                        Open board
                    </Link>
                    <Link to="/settings#steam" className="btn-secondary">
                        Re-import
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard label="Games" value={stats.totalGames.toLocaleString()} />
                <StatCard
                    label="Hours played"
                    value={Math.round(stats.totalHoursPlayed).toLocaleString()}
                    hint={`${stats.averageHoursPerGame} h per game`}
                />
                <StatCard
                    label="Completion rate"
                    value={`${stats.completionRate}%`}
                    hint={`${stats.gamesByStatus.COMPLETED} ${labels.COMPLETED.toLowerCase()}`}
                />
                <StatCard
                    label="Completed this month"
                    value={
                        g.monthlyTarget
                            ? `${g.completedThisMonth} / ${g.monthlyTarget}`
                            : g.completedThisMonth
                    }
                    hint={
                        g.monthlyTarget ? undefined : (
                            <Link className="hover:underline" to="/settings#goals">
                                Set a monthly goal
                            </Link>
                        )
                    }
                />
                <StatCard
                    label="Streak"
                    value={`${stats.streakDays} day${stats.streakDays === 1 ? '' : 's'}`}
                    hint="Days in a row you've checked in"
                />
            </div>

            {g.monthlyTarget > 0 && (
                <div className="card space-y-2 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Monthly goal</span>
                        <span className="tabular-nums">
                            {Math.min(
                                100,
                                Math.round((g.completedThisMonth / g.monthlyTarget) * 100),
                            )}
                            %
                        </span>
                    </div>
                    <div
                        className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                        role="progressbar"
                        aria-valuenow={g.completedThisMonth}
                        aria-valuemax={g.monthlyTarget}
                        aria-label="Monthly completion goal"
                    >
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${Math.min(100, (g.completedThisMonth / g.monthlyTarget) * 100)}%`,
                                background: 'var(--status-completed)',
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="card p-4">
                    <h2 className="mb-3 font-semibold">Recent activity</h2>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {stats.recentActivity.map((a) => (
                            <li key={a.id}>
                                <button
                                    className="flex w-full items-center gap-3 py-2 text-left hover:opacity-80"
                                    onClick={() => openGame(a.id)}
                                >
                                    <GameCover
                                        src={a.coverArtUrl}
                                        title={a.title}
                                        className="w-20 shrink-0 rounded"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">
                                            {a.title}
                                        </span>
                                        <span className="muted text-xs">
                                            {formatRelative(a.statusUpdatedAt)}
                                        </span>
                                    </span>
                                    <StatusBadge status={a.status} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="card p-4">
                    <h2 className="mb-3 font-semibold">Pick up where you left off</h2>
                    {nextUp.length === 0 ? (
                        <p className="muted text-sm">
                            Nothing in progress.{' '}
                            <Link
                                className="text-sky-600 hover:underline dark:text-sky-400"
                                to="/games"
                            >
                                Pick a game from your backlog.
                            </Link>
                        </p>
                    ) : (
                        <ul className="grid gap-3 sm:grid-cols-3">
                            {nextUp.map((x) => (
                                <li key={x.id}>
                                    <button
                                        className="w-full overflow-hidden rounded-lg text-left hover:opacity-80"
                                        onClick={() => openGame(x.id)}
                                    >
                                        <GameCover
                                            src={x.coverArtUrl}
                                            title={x.title}
                                            className="rounded-lg"
                                        />
                                        <span className="mt-1 block truncate text-sm font-medium">
                                            {x.title}
                                        </span>
                                        <span className="muted text-xs">
                                            {formatHours(x.hoursPlayed)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
