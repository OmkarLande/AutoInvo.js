import Papa from 'papaparse';
import { IDataImporter } from '../contracts/IDataImporter.js';
import { ImportResult } from '../models/ImportResult.js';
import { ImportOptions } from '../models/ImportOptions.js';
import { ImportError } from '../exceptions/ImportError.js';
import { ImportRow } from '../models/ImportRow.js';

export class CsvImporter implements IDataImporter {
    public async parse(source: Buffer | string, options?: ImportOptions): Promise<ImportResult> {
        let csvString: string;
        
        if (Buffer.isBuffer(source)) {
            const encoding = (options?.encoding === 'utf16' || options?.encoding === 'latin1') 
                ? options.encoding 
                : 'utf8';
            csvString = source.toString(encoding as BufferEncoding);
        } else {
            csvString = source;
        }

        return new Promise((resolve, reject) => {
            Papa.parse(csvString, {
                header: false,
                skipEmptyLines: true,
                delimiter: options?.delimiter,
                newline: options?.newline as "\r" | "\n" | "\r\n" | undefined,
                quoteChar: options?.quoteChar,
                escapeChar: options?.escapeChar,
                complete: (results) => {
                    try {
                        if (results.errors && results.errors.length > 0) {
                            const fatalError = results.errors.find(e => e.type !== 'FieldMismatch');
                            if (fatalError) {
                                throw new ImportError(`CSV Parsing Error: ${fatalError.message}`);
                            }
                        }

                        const data = results.data as string[][];
                        if (data.length === 0) {
                            throw new ImportError('CSV file is empty');
                        }

                        const rawHeaders = data[0];
                        if (!rawHeaders || rawHeaders.length === 0) {
                            throw new ImportError('No headers found in CSV');
                        }

                        const headers: string[] = [];
                        const headerSet = new Set<string>();

                        for (const h of rawHeaders) {
                            const trimmedHeader = h.trim();
                            if (!trimmedHeader) {
                                throw new ImportError('Blank header found in CSV');
                            }
                            if (headerSet.has(trimmedHeader)) {
                                throw new ImportError(`Duplicate header found in CSV: ${trimmedHeader}`);
                            }
                            headerSet.add(trimmedHeader);
                            headers.push(trimmedHeader);
                        }

                        const rows: ImportRow[] = [];
                        for (let i = 1; i < data.length; i++) {
                            const rowArray = data[i];
                            const rowObject: ImportRow = {};
                            
                            for (let j = 0; j < headers.length; j++) {
                                rowObject[headers[j]] = rowArray[j];
                            }
                            rows.push(rowObject);
                        }

                        resolve({
                            headers,
                            rows,
                            rowCount: rows.length,
                            sourceType: 'csv'
                        });
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error: Error) => {
                    reject(new ImportError(`CSV Parsing Error: ${error.message}`, error));
                }
            });
        });
    }
}
