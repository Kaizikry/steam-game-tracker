import { BarList, MonthlyChart } from '../components/Charts';
import { GameCover } from '../components/GameCover';
import { StatCard } from '../components/StatCard';
import { statusVar } from '../components/StatusBadge';
import { useStats, useStatusLabels } from '../hooks/useApi';
import { useAppStore } from '../store/useAppStore';
import { GAME_STATUSES } from '../types';
import { formatHours } from '../utils/format';

export function StatsPage() {
    const { data: stats, isLoading } = useStats();
    const labels = useStatusLabels();
    const openGame = useAppStore((s) => s.openGame);
    if (isLoading || !stats) return <p className="muted">Loading…</p>;

    const b = stats.playtimeBuckets;
    const playtime = [
        { label: 'Never played', value: b.unplayed },
        { label: 'Under 1 h', value: b.under1 },
        { label: '1–10 h', value: b['1to10'] },
        { label: '10–50 h', value: b['10to50'] },
        { label: '50 h +', value: b.over50 },
    ].map((d) => ({ ...d, color: 'var(--status-not-started)' }));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Statistics</h1>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <StatCard label="Total games" value={stats.totalGames.toLocaleString()} />
                <StatCard label="Total hours" value={stats.totalHoursPlayed.toLocaleString()} />
                <StatCard label="Avg hours / game" value={stats.averageHoursPerGame} />
                <StatCard label="Completion rate" value={`${stats.completionRate}%`} />
                <StatCard
                    label="Avg hours to complete"
                    value={stats.averageHoursToComplete || '—'}
                    hint="Across completed games"
                />
                <StatCard
                    label="Completed this month"
                    value={stats.goal.completedThisMonth}
                    hint={
                        stats.goal.monthlyTarget ? `Goal: ${stats.goal.monthlyTarget}` : undefined
                    }
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="card space-y-4 p-4">
                    <h2 className="font-semibold">Games by status</h2>
                    <BarList
                        data={GAME_STATUSES.map((s) => ({
                            label: labels[s],
                            value: stats.gamesByStatus[s],
                            color: statusVar(s),
                        }))}
                    />
                </section>
                <section className="card space-y-4 p-4">
                    <h2 className="font-semibold">Play time distribution</h2>
                    <BarList data={playtime} />
                </section>
            </div>

            <section className="card space-y-4 p-4">
                <h2 className="font-semibold">Last 12 months</h2>
                <MonthlyChart data={stats.monthly} />
            </section>

            <section className="card p-4">
                <h2 className="mb-3 font-semibold">Most played</h2>
                {stats.mostPlayedGames.length === 0 ? (
                    <p className="muted text-sm">No play time recorded yet.</p>
                ) : (
                    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {stats.mostPlayedGames.map((g, i) => (
                            <li key={g.id}>
                                <button
                                    className="w-full text-left hover:opacity-80"
                                    onClick={() => openGame(g.id)}
                                >
                                    <GameCover
                                        src={g.coverArtUrl}
                                        title={g.title}
                                        className="rounded-lg"
                                    />
                                    <span className="mt-1 block truncate text-sm font-medium">
                                        {i + 1}. {g.title}
                                    </span>
                                    <span className="muted text-xs">
                                        {formatHours(g.hoursPlayed)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
