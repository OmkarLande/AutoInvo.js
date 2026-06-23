/**
 * Exception thrown when PDF generation fails.
 */
export class PdfGenerationException extends Error {
    /**
     * The original error that caused the exception, if any.
     */
    public readonly originalError?: unknown;

    constructor(message: string, originalError?: unknown) {
        super(message);
        this.name = 'PdfGenerationException';
        this.originalError = originalError;

        // Ensure prototype chain is maintained when extending Error in TS/JS
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
