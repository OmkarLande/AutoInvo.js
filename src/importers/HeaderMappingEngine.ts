export type HeaderMapping = Record<string, string>;

export interface HeaderNormalizationOptions {
    customHeaderMap?: HeaderMapping;
}

const STANDARD_HEADER_ALIASES: Record<string, string[]> = {
    description: [
        'description',
        'item',
        'product',
        'service',
        'line item',
        'line description',
        'item description',
        'product description',
        'service description'
    ],
    quantity: [
        'quantity',
        'qty',
        'qnty',
        'count',
        'amount ordered'
    ],
    unitPrice: [
        'unit price',
        'unit cost',
        'price',
        'rate',
        'unitprice',
        'unitprice',
        'cost'
    ],
    amount: [
        'amount',
        'line total',
        'line amount',
        'extended amount',
        'total',
        'subtotal amount'
    ],
    subtotal: [
        'subtotal',
        'sub total',
        'sub-total'
    ],
    tax: [
        'tax',
        'tax amount',
        'vat',
        'sales tax'
    ],
    total: [
        'total due',
        'amount due',
        'invoice total',
        'grand total',
        'total amount'
    ],
    invoiceNumber: [
        'invoice number',
        'invoice #',
        'inv number',
        'invoice id',
        'invoice no'
    ],
    invoiceDate: [
        'invoice date',
        'date',
        'bill date',
        'issue date'
    ],
    dueDate: [
        'due date',
        'payment due date',
        'due'
    ],
    poNumber: [
        'po number',
        'purchase order number',
        'purchase order',
        'po#',
        'po'
    ],
    companyName: [
        'company name',
        'vendor name',
        'seller name'
    ],
    companyAddress: [
        'company address',
        'vendor address',
        'seller address',
        'business address'
    ],
    companyCityStatePostal: [
        'company city/state/postal',
        'vendor city/state/postal',
        'seller city/state/postal',
        'company city',
        'company city state postal'
    ],
    companyEmail: [
        'company email',
        'vendor email',
        'seller email'
    ],
    companyPhone: [
        'company phone',
        'vendor phone',
        'seller phone',
        'company phone number'
    ],
    billToName: [
        'bill to',
        'bill to name',
        'billed to',
        'customer',
        'customer name',
        'client',
        'client name'
    ],
    billToCompany: [
        'bill to company',
        'customer company',
        'client company'
    ],
    billToAddress: [
        'bill to address',
        'billing address',
        'customer address',
        'client address'
    ],
    billToCityStatePostal: [
        'billing city/state/postal',
        'bill to city/state/postal',
        'billing city',
        'billing postal'
    ],
    billToEmail: [
        'bill to email',
        'customer email',
        'client email',
        'billing email'
    ],
    shipToName: [
        'ship to',
        'ship to name',
        'shipping name',
        'ship to contact'
    ],
    shipToCompany: [
        'ship to company',
        'shipping company'
    ],
    shipToAddress: [
        'ship to address',
        'shipping address',
        'delivery address'
    ],
    shipToCityStatePostal: [
        'ship to city/state/postal',
        'shipping city/state/postal',
        'delivery city/state/postal'
    ]
};

const DEFAULT_ALIAS_LOOKUP = buildAliasLookup(STANDARD_HEADER_ALIASES);

function normalizeLookupKey(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[_\-\.\s]+/g, ' ')
        .replace(/[^a-z0-9 ]+/g, '')
        .trim();
}

function buildAliasLookup(definitions: Record<string, readonly string[]>): Record<string, string> {
    const lookup: Record<string, string> = {};

    for (const canonicalKey of Object.keys(definitions)) {
        const aliases = definitions[canonicalKey];

        for (const alias of aliases) {
            const normalizedAlias = normalizeLookupKey(alias);
            lookup[normalizedAlias] = canonicalKey;
        }

        const normalizedKey = normalizeLookupKey(canonicalKey);
        lookup[normalizedKey] = canonicalKey;
    }

    return lookup;
}

function buildCustomLookup(customHeaderMap?: HeaderMapping): Record<string, string> {
    const customLookup: Record<string, string> = {};
    if (!customHeaderMap) {
        return customLookup;
    }

    for (const [key, mappedValue] of Object.entries(customHeaderMap)) {
        const normalizedKey = normalizeLookupKey(key);
        if (!normalizedKey) {
            continue;
        }
        customLookup[normalizedKey] = mappedValue.trim();
    }

    return customLookup;
}

export function resolveHeaderName(rawHeader: string, customHeaderMap?: HeaderMapping): string | undefined {
    const normalizedKey = normalizeLookupKey(rawHeader);
    if (!normalizedKey) {
        return undefined;
    }

    const customLookup = buildCustomLookup(customHeaderMap);
    return customLookup[normalizedKey] ?? DEFAULT_ALIAS_LOOKUP[normalizedKey];
}

export function normalizeHeaders(rawHeaders: readonly string[], options?: HeaderNormalizationOptions): string[] {
    if (!Array.isArray(rawHeaders)) {
        throw new TypeError('Headers must be an array of strings');
    }

    const customLookup = buildCustomLookup(options?.customHeaderMap);
    const normalizedHeaders: string[] = [];
    const dedupe = new Set<string>();

    for (const header of rawHeaders) {
        if (typeof header !== 'string') {
            throw new TypeError('Header names must be strings');
        }

        const trimmedHeader = header.trim();
        if (!trimmedHeader) {
            throw new Error('Blank header found during normalization');
        }

        const lookupKey = normalizeLookupKey(trimmedHeader);
        const fixedHeader = customLookup[lookupKey] ?? DEFAULT_ALIAS_LOOKUP[lookupKey] ?? trimmedHeader;
        const normalizedDuplicateKey = fixedHeader.trim().toLowerCase();

        if (dedupe.has(normalizedDuplicateKey)) {
            throw new Error(`Duplicate header found after normalization: ${fixedHeader}`);
        }

        dedupe.add(normalizedDuplicateKey);
        normalizedHeaders.push(fixedHeader);
    }

    return normalizedHeaders;
}
