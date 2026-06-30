import { describe, it, expect, beforeEach } from 'vitest';
import * as xlsx from 'xlsx';
import { XlsxImporter } from '../src/importers/engines/XlsxImporter.js';
import { ImportError } from '../src/importers/exceptions/ImportError.js';

describe('XlsxImporter', () => {
    let importer: XlsxImporter;

    beforeEach(() => {
        importer = new XlsxImporter();
    });

    function createWorkbookBuffer(sheets: { name: string, data: any[][] }[]): Buffer {
        const wb = xlsx.utils.book_new();
        for (const sheet of sheets) {
            const ws = xlsx.utils.aoa_to_sheet(sheet.data);
            xlsx.utils.book_append_sheet(wb, ws, sheet.name);
        }
        return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    it('imports workbook and reads first worksheet by default', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Sheet1', data: [['Name', 'Age'], ['John', 30], ['Jane', 25]] },
            { name: 'Sheet2', data: [['Other', 'Data'], ['1', '2']] }
        ]);

        const result = await importer.parse(buffer);
        expect(result.sourceType).toBe('xlsx');
        expect(result.rowCount).toBe(2);
        expect(result.headers).toEqual(['Name', 'Age']);
        expect(result.rows[0]).toEqual({ Name: 'John', Age: 30 });
    });

    it('reads specific worksheet by index', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Sheet1', data: [['Name', 'Age'], ['John', 30]] },
            { name: 'Sheet2', data: [['Other', 'Data'], ['1', '2']] }
        ]);

        const result = await importer.parse(buffer, { sheetIndex: 1 });
        expect(result.headers).toEqual(['Other', 'Data']);
        expect(result.rows[0]).toEqual({ Other: '1', Data: '2' });
    });

    it('reads specific worksheet by name', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Sheet1', data: [['Name', 'Age'], ['John', 30]] },
            { name: 'TargetSheet', data: [['Target', 'Value'], ['Hello', 'World']] }
        ]);

        const result = await importer.parse(buffer, { sheetName: 'TargetSheet' });
        expect(result.headers).toEqual(['Target', 'Value']);
        expect(result.rows[0]).toEqual({ Target: 'Hello', Value: 'World' });
    });

    it('rejects string inputs', async () => {
        await expect(importer.parse('some string')).rejects.toThrow('String source is not supported');
    });

    it('throws ImportError on invalid workbook buffer', async () => {
        // A truncated zip signature to trigger an actual parsing error in xlsx
        const invalidBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
        await expect(importer.parse(invalidBuffer)).rejects.toThrow(ImportError);
    });

    it('throws ImportError on empty worksheet', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Empty', data: [] }
        ]);
        await expect(importer.parse(buffer)).rejects.toThrow('Worksheet is empty');
    });

    it('throws ImportError on duplicate headers', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Sheet1', data: [['Name', 'Name'], ['John', 'Doe']] }
        ]);
        await expect(importer.parse(buffer)).rejects.toThrow('Duplicate header found in XLSX: Name');
    });

    it('throws ImportError on blank headers', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Sheet1', data: [['Name', null, 'Age'], ['John', 'Doe', 30]] }
        ]);
        await expect(importer.parse(buffer)).rejects.toThrow('Blank header found in XLSX');
    });

    it('preserves values and headers correctly', async () => {
        const buffer = createWorkbookBuffer([
            { name: 'Sheet1', data: [['  Spaced Header  ', 'Value'], ['Data', 123.45]] }
        ]);
        const result = await importer.parse(buffer);
        expect(result.headers).toEqual(['Spaced Header', 'Value']);
        expect(result.rows[0]['Spaced Header']).toBe('Data');
        expect(result.rows[0]['Value']).toBe(123.45);
    });
});
