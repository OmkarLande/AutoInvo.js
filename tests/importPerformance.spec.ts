import { describe, it, expect } from 'vitest';
import { AutoInvo } from '../src/core/AutoInvo.js';

describe('Data Import Performance', () => {
    it('successfully imports 10,000 rows in reasonable time', async () => {
        const autoinvo = new AutoInvo();
        
        let csv = 'ID,Name,Value,Date\n';
        for (let i = 0; i < 10000; i++) {
            csv += `${i},Name_${i},${i * 10.5},2025-01-01\n`;
        }

        const start = performance.now();
        const result = await autoinvo.importCsv(csv);
        const end = performance.now();
        const duration = end - start;

        expect(result.rowCount).toBe(10000);
        expect(result.sourceType).toBe('csv');
        expect(result.headers).toEqual(['ID', 'Name', 'Value', 'Date']);
        
        // Ensure parsing 10,000 rows happens in under 2 seconds (usually takes < 100ms)
        expect(duration).toBeLessThan(2000); 
    });
});
