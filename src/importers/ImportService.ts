import { IDataImporter } from './contracts/IDataImporter.js';
import { ImportResult } from './models/ImportResult.js';
import { ImportOptions } from './models/ImportOptions.js';
import { ImportError } from './exceptions/ImportError.js';

/**
 * Service to orchestrate the import process.
 * Responsible for input validation and delegating to the provided importer engine.
 */
export class ImportService {
    constructor(private readonly importer: IDataImporter) {}

    /**
     * Imports data using the underlying importer engine.
     * 
     * @param source - The source data as a Buffer or string.
     * @param options - Configuration options for the import.
     * @returns A promise resolving to the ImportResult.
     * @throws {ImportError} If the source is invalid or the underlying engine throws an error.
     */
    public async importData(source: Buffer | string, options?: ImportOptions): Promise<ImportResult> {
        if (source === null || source === undefined) {
            throw new ImportError('Source cannot be null or undefined');
        }

        if (typeof source === 'string' && source.trim() === '') {
            throw new ImportError('Source string cannot be empty');
        }

        if (Buffer.isBuffer(source) && source.length === 0) {
            throw new ImportError('Source buffer cannot be empty');
        }

        if (typeof source !== 'string' && !Buffer.isBuffer(source)) {
            throw new ImportError('Source must be a string or Buffer');
        }

        try {
            return await this.importer.parse(source, options);
        } catch (error) {
            if (error instanceof ImportError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new ImportError(`An error occurred during import: ${message}`, error);
        }
    }
}
