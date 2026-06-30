import { ImportRow } from './ImportRow.js';

export interface ImportResult {
    readonly headers: readonly string[];
    readonly rows: readonly ImportRow[];
    readonly rowCount: number;
    readonly sourceType: 'csv' | 'xlsx';
}
