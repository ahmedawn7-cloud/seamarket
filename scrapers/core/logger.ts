export class ScraperLogger {
  private platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  info(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.platform}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
  }

  warn(message: string, data?: any) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.platform}] ${message}`);
    if (data) console.warn(JSON.stringify(data, null, 2));
  }

  error(message: string, error?: any) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.platform}] ${message}`);
    if (error) console.error(error);
  }

  success(message: string) {
    console.log(`[${new Date().toISOString()}] [SUCCESS] [${this.platform}] ${message}`);
  }
}
