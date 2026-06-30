import { describe, it, expect, beforeEach } from 'vitest';
import { CsvImporter } from '../src/importers/engines/CsvImporter.js';
import { ImportError } from '../src/importers/exceptions/ImportError.js';

describe('CsvImporter', () => {
    let importer: CsvImporter;

    beforeEach(() => {
        importer = new CsvImporter();
    });

    it('imports valid CSV', async () => {
        const csv = `Name,Age,City\nJohn,30,New York\nJane,25,London`;
        const result = await importer.parse(csv);

        expect(result.sourceType).toBe('csv');
        expect(result.rowCount).toBe(2);
        expect(result.headers).toEqual(['Name', 'Age', 'City']);
        expect(result.rows[0]).toEqual({ Name: 'John', Age: '30', City: 'New York' });
        expect(result.rows[1]).toEqual({ Name: 'Jane', Age: '25', City: 'London' });
    });

    it('imports UTF-8 / Unicode content', async () => {
        const csv = `Greeting,Emoji\nनमस्ते,😀\nこんにちは,🌟`;
        const result = await importer.parse(Buffer.from(csv, 'utf8'), { encoding: 'utf8' });

        expect(result.rowCount).toBe(2);
        expect(result.rows[0]).toEqual({ Greeting: 'नमस्ते', Emoji: '😀' });
        expect(result.rows[1]).toEqual({ Greeting: 'こんにちは', Emoji: '🌟' });
    });

    it('skips empty lines', async () => {
        const csv = `Name,Age\n\nJohn,30\n\n\nJane,25\n`;
        const result = await importer.parse(csv);

        expect(result.rowCount).toBe(2);
        expect(result.rows[0].Name).toBe('John');
        expect(result.rows[1].Name).toBe('Jane');
    });

    it('handles CRLF', async () => {
        const csv = `Name,Age\r\nJohn,30\r\nJane,25\r\n`;
        const result = await importer.parse(csv);

        expect(result.rowCount).toBe(2);
        expect(result.rows[0].Name).toBe('John');
    });

    it('handles quoted values and commas inside quoted strings', async () => {
        const csv = `Name,Description\nJohn,"Tall, dark, and handsome"\nJane,Short`;
        const result = await importer.parse(csv);

        expect(result.rowCount).toBe(2);
        expect(result.rows[0].description).toBe('Tall, dark, and handsome');
    });

    it('handles escaped quotes', async () => {
        const csv = `Name,Quote\nJohn,"He said ""Hello"""\nJane,Hi`;
        const result = await importer.parse(csv);

        expect(result.rowCount).toBe(2);
        expect(result.rows[0].Quote).toBe('He said "Hello"');
    });

    it('handles huge quoted value', async () => {
        const hugeText = 'A'.repeat(100 * 1024); // 100KB
        const csv = `Name,Description\nJohn,"${hugeText}"`;
        
        const result = await importer.parse(csv);
        expect(result.rowCount).toBe(1);
        expect(result.rows[0].description).toBe(hugeText);
    });

    it('throws ImportError on empty file', async () => {
        await expect(importer.parse('')).rejects.toThrow(ImportError);
        await expect(importer.parse('   ')).rejects.toThrow(ImportError);
    });

    it('throws ImportError on blank headers', async () => {
        const csv = `Name,,Age\nJohn,Doe,30`;
        await expect(importer.parse(csv)).rejects.toThrow('Blank header found in CSV');
    });

    it('throws ImportError on duplicate headers', async () => {
        const csv = `Name,Name,Age\nJohn,Doe,30`;
        await expect(importer.parse(csv)).rejects.toThrow('Duplicate header found in CSV: Name');
    });

    it('normalizes common header aliases', async () => {
        const csv = `Item,Qty,Unit Cost,Line Total\nWidget,2,15.00,30.00`;
        const result = await importer.parse(csv);

        expect(result.headers).toEqual(['description', 'quantity', 'unitPrice', 'amount']);
        expect(result.rows[0]).toEqual({ description: 'Widget', quantity: '2', unitPrice: '15.00', amount: '30.00' });
    });

    it('applies custom header mappings when provided', async () => {
        const csv = `Product Name,Count,Price,Amount Due\nWidget,2,15.00,30.00`;
        const result = await importer.parse(csv, {
            customHeaderMap: {
                'product name': 'description',
                'count': 'quantity',
                'price': 'unitPrice',
                'amount due': 'amount'
            }
        });

        expect(result.headers).toEqual(['description', 'quantity', 'unitPrice', 'amount']);
        expect(result.rows[0]).toEqual({ description: 'Widget', quantity: '2', unitPrice: '15.00', amount: '30.00' });
    });
});
