/**
 * Serializes async tasks so consecutive tasks start at least `intervalMs` apart.
 * Used to respect Steam's rate limit (~1 request/second) across the whole process.
 */
export function createThrottle(intervalMs: number) {
    let chain: Promise<unknown> = Promise.resolve();
    let lastStart = 0;

    return function throttle<T>(task: () => Promise<T>): Promise<T> {
        const run = async () => {
            const wait = lastStart + intervalMs - Date.now();
            if (wait > 0) await new Promise((r) => setTimeout(r, wait));
            lastStart = Date.now();
            return task();
        };
        const result = chain.then(run, run);
        chain = result.catch(() => undefined);
        return result;
    };
}
