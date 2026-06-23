// import * as fs from 'fs';
// import * as path from 'path';
import { describe, it, expect, afterAll } from 'vitest';
import { AutoInvo } from '../src/index.js';
import { PdfGenerationException } from '../src/pdf/exceptions/PdfGenerationException.js';
import { BrowserManager } from '../src/pdf/browser/BrowserManager.js';

describe('AutoInvo PDF Generation Engine', () => {
    it('should generate a valid PDF buffer from HTML', async () => {
        const autoinvo = new AutoInvo();
        const html = '<h1>Hello World</h1><p>Invoice Test</p>';
        
        const buffer = await autoinvo.generatePdf(html);
        // fs.writeFileSync(path.join(__dirname, 'visual-check.pdf'), buffer);

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        
        // PDF headers usually start with %PDF-
        const header = buffer.toString('utf-8', 0, 5);
        expect(header).toBe('%PDF-');
    }, 30000);

    it('should throw exception for empty HTML', async () => {
        const autoinvo = new AutoInvo();
        
        await expect(autoinvo.generatePdf('   ')).rejects.toThrow(PdfGenerationException);
    });

    // Cleanup after tests
    afterAll(async () => {
        await BrowserManager.closeBrowser();
    });
});
