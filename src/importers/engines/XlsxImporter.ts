import * as xlsx from 'xlsx';
import { IDataImporter } from '../contracts/IDataImporter.js';
import { ImportResult } from '../models/ImportResult.js';
import { ImportOptions } from '../models/ImportOptions.js';
import { ImportError } from '../exceptions/ImportError.js';
import { ImportRow } from '../models/ImportRow.js';
import { normalizeHeaders } from '../HeaderMappingEngine.js';

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

            let headers: string[];
            try {
                headers = normalizeHeaders(rawHeaders.map((h) => (h === undefined || h === null ? '' : String(h))), {
                    customHeaderMap: options?.customHeaderMap
                });
            } catch (error) {
                if (error instanceof Error) {
                    if (/blank header found/i.test(error.message)) {
                        throw new ImportError('Blank header found in XLSX');
                    }
                    const duplicateMatch = error.message.match(/Duplicate header found after normalization: (.+)$/i);
                    if (duplicateMatch) {
                        throw new ImportError(`Duplicate header found in XLSX: ${duplicateMatch[1]}`);
                    }
                }
                throw new ImportError(`XLSX Header Normalization Error: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error : undefined);
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
