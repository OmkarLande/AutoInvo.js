import { Page, PaperFormat } from 'puppeteer';
import { IPdfEngine } from '../contracts/IPdfEngine.js';
import { PdfOptions } from '../models/PdfOptions.js';
import { BrowserManager } from '../browser/BrowserManager.js';
import { PdfGenerationException } from '../exceptions/PdfGenerationException.js';

/**
 * PDF Engine implementation using Puppeteer.
 */
export class PuppeteerPdfEngine implements IPdfEngine {
    /**
     * Generates a PDF Buffer from the provided HTML string using Puppeteer.
     * 
     * @param html - The HTML string to render.
     * @param options - Configuration options for the PDF.
     * @returns A Promise resolving to a Node.js Buffer containing the PDF data.
     * @throws {PdfGenerationException} If the generation process fails.
     */
    public async generate(html: string, options?: PdfOptions): Promise<Buffer> {
        let page: Page | undefined;

        try {
            const browser = await BrowserManager.getBrowser();
            page = await browser.newPage();

            await page.setContent(html, {
                waitUntil: 'networkidle0',
                timeout: options?.timeout ?? 30000
            });

            const pdfBuffer = await page.pdf({
                format: (options?.format as PaperFormat) || 'A4',
                landscape: options?.landscape ?? false,
                printBackground: options?.printBackground ?? true,
                margin: options?.margins,
                timeout: options?.timeout ?? 30000
            });

            // Convert Uint8Array to Buffer as page.pdf returns Uint8Array in newer puppeteer versions
            return Buffer.from(pdfBuffer);
        } catch (error) {
            throw new PdfGenerationException('Failed to generate PDF using Puppeteer.', error);
        } finally {
            if (page && !page.isClosed()) {
                await page.close().catch(() => {
                    // Ignore errors during page close
                });
            }
        }
    }
}
