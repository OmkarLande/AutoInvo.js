/**
 * Configuration options for generating a PDF from HTML.
 */
export interface PdfOptions {
    /**
     * Paper format. If set, takes priority over width or height options.
     * @default 'A4'
     */
    format?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5' | string;

    /**
     * Whether to print in landscape orientation.
     * @default false
     */
    landscape?: boolean;

    /**
     * Print background graphics.
     * @default true
     */
    printBackground?: boolean;

    /**
     * Paper margins, default is none.
     */
    margins?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };

    /**
     * Maximum time in milliseconds to wait for the page to render.
     * @default 30000
     */
    timeout?: number;

    /**
     * PDF metadata.
     */
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
    };
}
