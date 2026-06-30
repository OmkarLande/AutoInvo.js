import { describe, it, expect } from 'vitest';
import * as xlsx from 'xlsx';
import { AutoInvo } from '../src/core/AutoInvo.js';
import { ImportError } from '../src/importers/exceptions/ImportError.js';

describe('AutoInvo Data Import Integration', () => {
    const autoinvo = new AutoInvo();

    it('successfully imports CSV via AutoInvo facade', async () => {
        const csv = `ID,Name\n1,John`;
        const result = await autoinvo.importCsv(csv);
        
        expect(result.sourceType).toBe('csv');
        expect(result.rowCount).toBe(1);
        expect(result.headers).toEqual(['ID', 'Name']);
        expect(result.rows[0]).toEqual({ ID: '1', Name: 'John' });
    });

    it('successfully imports XLSX via AutoInvo facade', async () => {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet([['ID', 'Name'], [2, 'Jane']]);
        xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const result = await autoinvo.importXlsx(buffer);
        
        expect(result.sourceType).toBe('xlsx');
        expect(result.rowCount).toBe(1);
        expect(result.headers).toEqual(['ID', 'Name']);
        expect(result.rows[0]).toEqual({ ID: 2, Name: 'Jane' });
    });

    it('rejects invalid inputs correctly', async () => {
        // @ts-expect-error Testing invalid inputs
        await expect(autoinvo.importCsv(null)).rejects.toThrow(ImportError);
        
        // @ts-expect-error Testing invalid inputs
        await expect(autoinvo.importCsv(undefined)).rejects.toThrow(ImportError);
        
        // @ts-expect-error Testing invalid inputs
        await expect(autoinvo.importCsv({})).rejects.toThrow(ImportError);
        
        // @ts-expect-error Testing invalid inputs
        await expect(autoinvo.importCsv([])).rejects.toThrow(ImportError);
        
        // @ts-expect-error Testing invalid inputs
        await expect(autoinvo.importCsv(123)).rejects.toThrow(ImportError);
        
        // @ts-expect-error Testing invalid inputs
        await expect(autoinvo.importCsv(true)).rejects.toThrow(ImportError);
    });
});
