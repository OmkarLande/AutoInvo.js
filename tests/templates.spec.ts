import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { AutoInvo } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function inlineCss(html: string, templatesDir: string) {
    // Replace <link ... href="..."> with inline <style>...</style>
    return html.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
        // Resolve relative to templatesDir
        const cssPath = path.resolve(templatesDir, href);
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

    it('template files exist and reference external CSS files', () => {
        const templatesDir = path.resolve(__dirname, '..', 'templates');
        const stylesDir = path.resolve(__dirname, '..', 'src', 'styles');

        for (const t of templates) {
            const filePath = path.join(templatesDir, t.file);
            expect(fs.existsSync(filePath)).toBe(true);

            const html = fs.readFileSync(filePath, 'utf8');
            // Check that there's a link tag referencing the expected CSS filename
            expect(html).toMatch(new RegExp(`<link[^>]*href=["'][^"']*${t.css}["'][^>]*>`, 'i'));

            // Also verify the CSS file exists in the styles directory
            const cssPath = path.join(stylesDir, t.css);
            expect(fs.existsSync(cssPath)).toBe(true);
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            expect(cssContent.length).toBeGreaterThan(0);
        }
    });

    it('should generate PDF for each template when CSS is inlined', async () => {
        const templatesDir = path.resolve(__dirname, '..', 'templates');

        const autoinvo = new AutoInvo();
        for (const t of templates) {
            const filePath = path.join(templatesDir, t.file);
            const html = fs.readFileSync(filePath, 'utf8');

            // Inline CSS so the headless browser doesn't need to resolve relative file paths
            const inlinedHtml = inlineCss(html, path.resolve(__dirname, '..'));

            const buffer = await autoinvo.generatePdf(inlinedHtml, { timeout: 20000 });
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
            expect(buffer.toString('latin1', 0, 5)).toBe('%PDF-');
        }
    }, 45000);
});
