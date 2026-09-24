import { Fragment, type ReactNode } from 'react';

/**
 * Renders the tiny markdown subset used for notes: **bold**, *italic* and "- " bullet lines.
 * Builds React elements directly (no HTML injection), so user notes can't execute markup.
 */
export function renderInline(text: string): ReactNode[] {
    const parts: ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        parts.push(
            m[1] !== undefined ? (
                <strong key={m.index}>{m[1]}</strong>
            ) : (
                <em key={m.index}>{m[2]}</em>
            ),
        );
        last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

export function RichText({ text }: { text: string }) {
    const blocks: ReactNode[] = [];
    let bullets: string[] = [];
    const flush = () => {
        if (bullets.length) {
            blocks.push(
                <ul key={`ul-${blocks.length}`} className="ml-5 list-disc">
                    {bullets.map((b, i) => (
                        <li key={i}>{renderInline(b)}</li>
                    ))}
                </ul>,
            );
            bullets = [];
        }
    };
    text.split('\n').forEach((line, i) => {
        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        if (bullet) {
            bullets.push(bullet[1]);
        } else {
            flush();
            blocks.push(line.trim() ? <p key={i}>{renderInline(line)}</p> : <Fragment key={i} />);
        }
    });
    flush();
    return <div className="space-y-1 text-sm leading-relaxed">{blocks}</div>;
}
