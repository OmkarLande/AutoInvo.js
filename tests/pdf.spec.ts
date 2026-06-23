import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, afterAll } from 'vitest';
import { AutoInvo } from '../src/index.js';
import { PdfGenerationException } from '../src/pdf/exceptions/PdfGenerationException.js';
import { BrowserManager } from '../src/pdf/browser/BrowserManager.js';

// Resolve __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parses the page count from a raw PDF buffer by counting instances of '/Type /Page'.
 */
function getPdfPageCount(buffer: Buffer): number {
    const content = buffer.toString('latin1');
    const matches = content.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : 0;
}

/**
 * Temporarily dumps the generated buffer to a tmp/ directory during local development
 * so developers can visually verify CSS print margins and font loading.
 */
function dumpPdfForVisualCheck(filename: string, buffer: Buffer): string {
    const tmpDir = path.resolve(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filePath = path.join(tmpDir, filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

describe('AutoInvo PDF Generation Engine', () => {
    it('should generate a valid PDF buffer from HTML', async () => {
        const autoinvo = new AutoInvo();
        const html = '<h1>Hello World</h1><p>Invoice Test</p>';
        
        const buffer = await autoinvo.generatePdf(html);

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

    it('should handle massive HTML strings (100+ table rows) without timeouts or buffer overflows', async () => {
        const autoinvo = new AutoInvo();
        let tableRows = '';
        for (let i = 1; i <= 120; i++) {
            tableRows += `<tr><td>Item ${i}</td><td>Detailed description for row number ${i}</td><td>$${(i * 2.5).toFixed(2)}</td></tr>`;
        }
        const html = `
            <html>
            <head>
                <style>
                    table { width: 100%; border-collapse: collapse; }
                    td, th { border: 1px solid #ddd; padding: 6px; font-family: sans-serif; }
                </style>
            </head>
            <body>
                <h1>Massive Invoice Statement</h1>
                <table>
                    <thead>
                        <tr><th>Item ID</th><th>Description</th><th>Price</th></tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        const buffer = await autoinvo.generatePdf(html);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
    }, 45000);

    it('should handle malformed/broken HTML gracefully and generate a valid PDF', async () => {
        const autoinvo = new AutoInvo();
        const malformedHtml = '<div><h1>Broken Invoice Page<span>Missing tags everywhere';
        const buffer = await autoinvo.generatePdf(malformedHtml);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
    }, 30000);

    it('should correctly render special characters without buffer corruption', async () => {
        const autoinvo = new AutoInvo();
        const html = `
            <html>
            <head><meta charset="utf-8"></head>
            <body>
                <h1>Special Characters Test</h1>
                <p>Currencies: €100, ₹500, ¥1000, $50</p>
                <p>Kanji/Cyrillic: 請求書 (Invoice) / Привет, мир (Hello, world)</p>
                <p>Emojis: 🧾 💸 🚀 🌟</p>
            </body>
            </html>
        `;
        const buffer = await autoinvo.generatePdf(html);
        
        // Use the test helper to dump the buffer to tmp/
        const filePath = dumpPdfForVisualCheck('special-characters-test.pdf', buffer);
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.statSync(filePath).size).toBeGreaterThan(0);

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
    }, 30000);

    it('should handle extremely rapid back-to-back sequential calls safely', async () => {
        const autoinvo = new AutoInvo();
        const html = '<h1>Sequential Concurrency Call</h1>';
        
        // Execute 5 generations concurrently using Promise.all to simulate extremely rapid calls
        const promises = Array.from({ length: 5 }).map((_, i) => 
            autoinvo.generatePdf(`${html} <p>Back-to-back Generation #${i + 1}</p>`)
        );
        const results = await Promise.all(promises);

        expect(results).toHaveLength(5);
        for (const buffer of results) {
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
        }
    }, 45000);

    it('should prevent memory/process leakage by successfully closing all connections when browser is closed', async () => {
        const autoinvo = new AutoInvo();
        const html = '<h1>Leak Verification</h1>';
        
        // Call the generation engine 10 times in a loop
        for (let i = 0; i < 10; i++) {
            const buffer = await autoinvo.generatePdf(html);
            expect(buffer.length).toBeGreaterThan(0);
        }

        // Get the active browser instance
        const browser = await BrowserManager.getBrowser();
        expect(browser.connected).toBe(true);

        // Terminate browser and detached websocket connections/page instances
        await BrowserManager.closeBrowser();
        
        // Assert that the browser is successfully disconnected
        expect(browser.connected).toBe(false);
    }, 60000);

    it('should enforce timeout threshold rather than hanging indefinitely on slow external assets', async () => {
        const autoinvo = new AutoInvo();
        // 10.255.255.1 is a non-routable IP that will time out on connection attempts
        const html = '<html><body><img src="http://10.255.255.1/hanging-image.jpg"></body></html>';
        
        const startTime = Date.now();
        await expect(
            autoinvo.generatePdf(html, { timeout: 1500 })
        ).rejects.toThrow(PdfGenerationException);
        
        const duration = Date.now() - startTime;
        // Verify that the timeout was enforced promptly (well under our vitest test timeout)
        expect(duration).toBeLessThan(10000);
    }, 15000);

    it('should split a multi-page HTML template into a multi-page PDF buffer', async () => {
        const autoinvo = new AutoInvo();
        const html = `
            <html>
            <head>
                <style>
                    .page {
                        page-break-after: always;
                        height: 100%;
                    }
                    .last-page {
                        page-break-after: avoid;
                    }
                </style>
            </head>
            <body>
                <div class="page">Page 1 Content</div>
                <div class="page">Page 2 Content</div>
                <div class="last-page">Page 3 Content</div>
            </body>
            </html>
        `;
        const buffer = await autoinvo.generatePdf(html);
        expect(buffer).toBeInstanceOf(Buffer);
        
        const pageCount = getPdfPageCount(buffer);
        expect(pageCount).toBe(3);
    }, 30000);

    // Cleanup after tests
    afterAll(async () => {
        await BrowserManager.closeBrowser();
    });
});

