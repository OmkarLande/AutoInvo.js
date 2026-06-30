import * as xlsx from 'xlsx';
import { IDataImporter } from '../contracts/IDataImporter.js';
import { ImportResult } from '../models/ImportResult.js';
import { ImportOptions } from '../models/ImportOptions.js';
import { ImportError } from '../exceptions/ImportError.js';
import { ImportRow } from '../models/ImportRow.js';

export class XlsxImporter implements IDataImporter {
    public async parse(source: Buffer | string, options?: ImportOptions): Promise<ImportResult> {
        if (typeof source === 'string') {
            throw new ImportError('String source is not supported for XLSX import. Please provide a Buffer.');
        }

        try {
            const workbook = xlsx.read(source, { type: 'buffer' });

            let sheetName = workbook.SheetNames[0];
            
            if (options?.sheetName) {
                if (!workbook.SheetNames.includes(options.sheetName)) {
                    throw new ImportError(`Sheet named "${options.sheetName}" not found`);
                }
                sheetName = options.sheetName;
            } else if (options?.sheetIndex !== undefined) {
                if (options.sheetIndex < 0 || options.sheetIndex >= workbook.SheetNames.length) {
                    throw new ImportError(`Sheet index ${options.sheetIndex} is out of bounds`);
                }
                sheetName = workbook.SheetNames[options.sheetIndex];
            }

            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                throw new ImportError('Selected worksheet is empty or invalid');
            }

            const rawData = xlsx.utils.sheet_to_json<any[]>(worksheet, { 
                header: 1,
                defval: undefined,
                blankrows: false
            });

            if (rawData.length === 0) {
                throw new ImportError('Worksheet is empty');
            }

            const rawHeaders = rawData[0];
            if (!rawHeaders || rawHeaders.length === 0) {
                throw new ImportError('No headers found in XLSX');
            }

            const headers: string[] = [];
            const headerSet = new Set<string>();

            for (let i = 0; i < rawHeaders.length; i++) {
                const h = rawHeaders[i];
                if (h === undefined || h === null) {
                    throw new ImportError('Blank header found in XLSX');
                }
                const trimmedHeader = String(h).trim();
                if (!trimmedHeader) {
                    throw new ImportError('Blank header found in XLSX');
                }
                if (headerSet.has(trimmedHeader)) {
                    throw new ImportError(`Duplicate header found in XLSX: ${trimmedHeader}`);
                }
                headerSet.add(trimmedHeader);
                headers.push(trimmedHeader);
            }

            const rows: ImportRow[] = [];
            for (let i = 1; i < rawData.length; i++) {
                const rowArray = rawData[i];
                // skip completely empty arrays
                if (!rowArray || rowArray.length === 0) continue;
                
                const rowObject: ImportRow = {};
                for (let j = 0; j < headers.length; j++) {
                    rowObject[headers[j]] = rowArray[j];
                }
                rows.push(rowObject);
            }

            return {
                headers,
                rows,
                rowCount: rows.length,
                sourceType: 'xlsx'
            };
        } catch (error) {
            if (error instanceof ImportError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new ImportError(`XLSX Parsing Error: ${message}`, error);
        }
    }
}
