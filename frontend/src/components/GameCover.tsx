import { useState } from 'react';

/** Steam header art (460x215) with a text fallback for apps that have none. */
export function GameCover({
    src,
    title,
    className = '',
    banner,
}: {
    src: string | null;
    title: string;
    className?: string;
    banner?: boolean;
}) {
    const shape = banner ? 'h-40 w-full sm:h-52' : 'aspect-[460/215]';
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div
                className={`flex ${shape} items-center justify-center bg-gradient-to-br from-steam-600 to-steam-700 p-2 text-center text-xs font-semibold text-slate-200 ${className}`}
                aria-hidden="true"
            >
                {title}
            </div>
        );
    }
    return (
        <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className={`${shape} w-full object-cover ${className}`}
        />
    );
}
