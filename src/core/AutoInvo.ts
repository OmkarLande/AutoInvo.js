import { IPdfEngine } from '../pdf/contracts/IPdfEngine.js';
import { PdfOptions } from '../pdf/models/PdfOptions.js';
import { PuppeteerPdfEngine } from '../pdf/engines/PuppeteerPdfEngine.js';
import { PdfService } from '../pdf/PdfService.js';

/**
 * Main orchestration facade for the AutoInvo library.
 * Provides a clean API for consumers while hiding internal implementations.
 */
export class AutoInvo {
    private readonly pdfService: PdfService;

    /**
     * Initializes a new instance of AutoInvo.
     * 
     * @param pdfEngine - Optional PDF engine. Defaults to PuppeteerPdfEngine.
     */
    constructor(pdfEngine?: IPdfEngine) {
        const engine = pdfEngine ?? new PuppeteerPdfEngine();
        this.pdfService = new PdfService(engine);
    }

    /**
     * Generates a PDF Buffer from an HTML string.
     * 
     * @param html - The HTML string to convert.
     * @param options - Configuration options for the PDF.
     * @returns A promise resolving to a Node.js Buffer with the PDF data.
     */
    public async generatePdf(html: string, options?: PdfOptions): Promise<Buffer> {
        return this.pdfService.generate(html, options);
    }
}
