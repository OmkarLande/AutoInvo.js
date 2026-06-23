import puppeteer, { Browser } from 'puppeteer';

/**
 * Manages a single Puppeteer Browser instance to avoid launching
 * a new browser for every PDF generation request.
 */
export class BrowserManager {
    private static browser?: Browser;

    /**
     * Gets the shared Browser instance, initializing it if necessary.
     */
    public static async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        return this.browser;
    }

    /**
     * Closes the shared Browser instance.
     * Useful for graceful shutdown of the application.
     */
    public static async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = undefined;
        }
    }
}
