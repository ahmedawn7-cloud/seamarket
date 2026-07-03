import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Add stealth plugin and use defaults (all evasion techniques)
puppeteer.use(StealthPlugin());

/**
 * Initializes and returns a stealth-enabled Puppeteer browser instance.
 * Note: Adapters currently use simulated data for development, 
 * but this foundation is ready for production scraping.
 */
export async function getStealthBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      '--user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"'
    ],
  });
  return browser;
}
