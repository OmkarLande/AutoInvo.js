import { PdfOptions } from '../models/PdfOptions.js';

/**
 * Contract defining the behavior of a PDF generation engine.
 * Implementing classes should encapsulate their respective underlying
 * drivers (e.g., Puppeteer, Playwright, PDFShift, etc.).
 */
export interface IPdfEngine {
    /**
     * Generates a PDF Buffer from the provided HTML string.
     * 
     * @param html - The HTML string to render.
     * @param options - Configuration options for the PDF.
     * @returns A promise that resolves to a Node.js Buffer containing the PDF data.
     * @throws {PdfGenerationException} If the generation process fails.
     */
    generate(html: string, options?: PdfOptions): Promise<Buffer>;
}
