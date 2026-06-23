import { IPdfEngine } from './contracts/IPdfEngine.js';
import { PdfOptions } from './models/PdfOptions.js';
import { PdfGenerationException } from './exceptions/PdfGenerationException.js';

/**
 * Service responsible for orchestrating PDF generation.
 */
export class PdfService {
    constructor(private readonly engine: IPdfEngine) {}

    /**
     * Generates a PDF from the given HTML string.
     * 
     * @param html - The HTML string to convert to PDF.
     * @param options - Optional configuration for PDF generation.
     * @returns A promise that resolves to a Node.js Buffer containing the PDF data.
     * @throws {PdfGenerationException} If the HTML is empty or generation fails.
     */
    public async generate(html: string, options?: PdfOptions): Promise<Buffer> {
        if (!html.trim()) {
            throw new PdfGenerationException('HTML content cannot be empty.');
        }

        const defaultOptions: PdfOptions = {
            format: 'A4',
            landscape: false,
            printBackground: true,
            timeout: 30000,
            ...options
        };

        return this.engine.generate(html, defaultOptions);
    }
}
