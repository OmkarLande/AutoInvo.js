import { HeaderMapping } from '../HeaderMappingEngine.js';

export interface ImportOptions {
    // CSV Options
    delimiter?: string;
    encoding?: 'utf8' | 'utf16' | 'latin1';
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    customHeaderMap?: HeaderMapping;

    // XLSX Options
    sheetIndex?: number;
    sheetName?: string;
    range?: string | number;
}
