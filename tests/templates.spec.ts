import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { AutoInvo } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function inlineCss(html: string, templatesDir: string) {
    return html.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
        const cssPath = path.resolve(templatesDir, href.replace(/^\//, ''));
        if (fs.existsSync(cssPath)) {
            const css = fs.readFileSync(cssPath, 'utf8');
            return `<style>\n${css}\n</style>`;
        }
        return match;
    });
}

describe('Invoice Templates', () => {
    const templates = [
        { name: 'minimal', file: 'invoice-minimal.html', css: 'invoice-minimal.css' },
        { name: 'modern', file: 'invoice-modern.html', css: 'invoice-modern.css' },
        { name: 'corporate', file: 'invoice-corporate.html', css: 'invoice-corporate.css' },
    ];

    const sampleData = {
        company: {
            name: 'Alpha Solutions',
            address: '456 Market Street',
            cityStatePostal: 'Austin, TX 78701',
            email: 'hello@alphasolutions.com',
            phone: '(512) 555-0199',
            website: 'www.alphasolutions.com',
            tagline: 'Business Consulting & Modern IT Solutions',
            headquarters: 'Corporate Headquarters: 456 Market Street, Austin, TX 78701',
            fax: '(512) 555-0102',
        },
        invoice: {
            number: 'INV-2026-000321',
            date: 'June 25, 2026',
            dueDate: 'July 25, 2026',
            poNumber: 'PO-2026-4321',
            poReference: 'PO-2026-4321',
            paymentMethod: 'Bank Transfer',
            status: 'DUE',
            clientReference: 'CORP-ALPHA-2026',
            purchaseOrder: 'PO-2026-4321',
        },
        billTo: {
            name: 'Maya Patel',
            company: 'Sunrise Tech',
            address: '1200 Mission Street',
            cityStatePostal: 'San Francisco, CA 94103',
            email: 'maya.patel@sunrisetech.com',
            jobTitle: 'VP Operations',
            taxId: '12-3456789',
            country: 'United States of America',
        },
        shipTo: {
            name: 'Maya Patel',
            company: 'Sunrise Tech',
            address: '1200 Mission Street',
            cityStatePostal: 'San Francisco, CA 94103',
            department: 'Receiving Department',
            country: 'United States of America',
        },
    };

    it('template files exist and reference external CSS files', () => {
        const templatesDir = path.resolve(__dirname, '..', 'templates');
        const stylesDir = path.resolve(__dirname, '..', 'src', 'styles');

        for (const t of templates) {
            const filePath = path.join(templatesDir, t.file);
            expect(fs.existsSync(filePath)).toBe(true);

            const html = fs.readFileSync(filePath, 'utf8');
            expect(html).toMatch(new RegExp(`<link[^>]*href=["'][^"']*${t.css}["'][^>]*>`, 'i'));

            const cssPath = path.join(stylesDir, t.css);
            expect(fs.existsSync(cssPath)).toBe(true);
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            expect(cssContent.length).toBeGreaterThan(0);
        }
    });

    it('should generate PDF for each template with CSS inlined', async () => {
        const templatesDir = path.resolve(__dirname, '..', 'templates');
        const autoinvo = new AutoInvo();

        for (const t of templates) {
            const filePath = path.join(templatesDir, t.file);
            const html = fs.readFileSync(filePath, 'utf8');
            const inlinedHtml = inlineCss(html, path.resolve(__dirname, '..'));

            const buffer = await autoinvo.generatePdf(inlinedHtml, { timeout: 20000 });
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
        }
    }, 45000);

    it('should render Handlebars variables and generate a PDF from a template', async () => {
        const templatesDir = path.resolve(__dirname, '..', 'templates');
        const filePath = path.join(templatesDir, 'invoice-minimal.html');
        const templateHtml = fs.readFileSync(filePath, 'utf8');
        const inlinedTemplateHtml = inlineCss(templateHtml, path.resolve(__dirname, '..'));

        const autoinvo = new AutoInvo();
        const buffer = await autoinvo.generatePdfFromTemplate(inlinedTemplateHtml, sampleData, { timeout: 20000 });

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
    }, 45000);
});
