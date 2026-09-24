import type { Tag } from '../types';

export function TagChip({
    tag,
    onRemove,
}: {
    tag: Pick<Tag, 'name' | 'color'>;
    onRemove?: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800 dark:bg-slate-700/60 dark:text-slate-100">
            <span
                className="size-2 rounded-full"
                style={{ background: tag.color }}
                aria-hidden="true"
            />
            {tag.name}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-0.5 hover:text-red-500"
                    aria-label={`Remove tag ${tag.name}`}
                >
                    ✕
                </button>
            )}
        </span>
    );
}
