import { ImportResult } from '../models/ImportResult.js';
import { ImportOptions } from '../models/ImportOptions.js';

export interface IDataImporter {
    parse(source: Buffer | string, options?: ImportOptions): Promise<ImportResult>;
}
