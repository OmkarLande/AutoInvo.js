import { IPdfEngine } from '../pdf/contracts/IPdfEngine.js';
import { PdfOptions } from '../pdf/models/PdfOptions.js';
import { PuppeteerPdfEngine } from '../pdf/engines/PuppeteerPdfEngine.js';
import { PdfService } from '../pdf/PdfService.js';
import { renderTemplate } from '../templates/TemplateRenderer.js';
import { ImportService } from '../importers/ImportService.js';
import { CsvImporter } from '../importers/engines/CsvImporter.js';
import { XlsxImporter } from '../importers/engines/XlsxImporter.js';
import { ImportResult } from '../importers/models/ImportResult.js';
import { ImportOptions } from '../importers/models/ImportOptions.js';

/**
 * Main orchestration facade for the AutoInvo library.
 * Provides a clean API for consumers while hiding internal implementations.
 */
export class AutoInvo {
    private readonly pdfService: PdfService;
    private readonly csvImportService: ImportService;
    private readonly xlsxImportService: ImportService;

    /**
     * Initializes a new instance of AutoInvo.
     * 
     * @param pdfEngine - Optional PDF engine. Defaults to PuppeteerPdfEngine.
     */
    constructor(pdfEngine?: IPdfEngine) {
        const engine = pdfEngine ?? new PuppeteerPdfEngine();
        this.pdfService = new PdfService(engine);
        this.csvImportService = new ImportService(new CsvImporter());
        this.xlsxImportService = new ImportService(new XlsxImporter());
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

    /**
     * Generates a PDF from a Handlebars HTML template and data.
     * 
     * @param templateHtml - The Handlebars template string.
     * @param data - The data context used to render the template.
     * @param options - Configuration options for the PDF.
     */
    public async generatePdfFromTemplate(templateHtml: string, data: Record<string, unknown>, options?: PdfOptions): Promise<Buffer> {
        const renderedHtml = renderTemplate(templateHtml, data);
        return this.pdfService.generate(renderedHtml, options);
    }

    /**
     * Imports data from a CSV file (Buffer or string).
     * 
     * @param source - The CSV file content as a Buffer or string.
     * @param options - Configuration options for the import.
     * @returns A promise resolving to an ImportResult.
     */
    public async importCsv(source: Buffer | string, options?: ImportOptions): Promise<ImportResult> {
        return this.csvImportService.importData(source, options);
    }

    /**
     * Imports data from an XLSX file (Buffer).
     * 
     * @param source - The XLSX file content as a Buffer.
     * @param options - Configuration options for the import.
     * @returns A promise resolving to an ImportResult.
     */
    public async importXlsx(source: Buffer, options?: ImportOptions): Promise<ImportResult> {
        return this.xlsxImportService.importData(source, options);
    }
}
