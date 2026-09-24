/** Minimal RFC 4180 CSV writer/parser (quoted fields, embedded commas, quotes and newlines). */

export function toCsv(rows: (string | number | null | undefined)[][]): string {
    return rows
        .map((row) =>
            row
                .map((cell) => {
                    const s = cell == null ? '' : String(cell);
                    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
                })
                .join(','),
        )
        .join('\r\n');
}

export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const src = text.replace(/^\uFEFF/, '');

    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (inQuotes) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }
    if (inQuotes) throw new Error('Unterminated quoted field');
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}
