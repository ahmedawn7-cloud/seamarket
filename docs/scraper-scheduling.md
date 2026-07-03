# Scraper Scheduling Documentation

This document explains how to set up automated local and cloud scheduling for the Scraper Bot.

## Local Execution: Windows Task Scheduler

When running the project locally, you can use Windows Task Scheduler to automate the scraping process.
The local scheduler script (`scripts/run-due-scrapers.ts`) works by checking the `scraper_schedules` database table to see if any scraper is "due". **It does not scrape every hour; it only scrapes if a schedule is due.**

### Setup Instructions
1. Open **Windows Task Scheduler** (`taskschd.msc`).
2. Click **Create Task** (not Basic Task).
3. **General Tab:** 
   - Name: `ProfitPilot Scraper Runner`
   - Select "Run whether user is logged on or not".
4. **Triggers Tab:**
   - Click "New..."
   - Begin the task: "On a schedule"
   - Select "Daily" and set the start time.
   - Check "Repeat task every:" and select **1 hour**.
   - Duration: "Indefinitely".
5. **Actions Tab:**
   - Click "New..."
   - Action: "Start a program"
   - Program/script: `npm.cmd` (or the full path to your Node.js npm executable, usually `C:\Program Files\nodejs\npm.cmd`).
   - Add arguments: `run scrape:due`
   - Start in: The full path to your `seamarket` project directory (e.g., `C:\Users\awnfx\seamarket`).
6. Save the task and enter your Windows credentials if prompted.

Now, Windows will automatically trigger the script every hour to evaluate if any defined schedules from the Ops Dashboard need to run!

## Cloud Execution: Vercel Cron

When you deploy to production on Vercel, you do not need Windows Task Scheduler. Instead, Vercel can automatically hit the protected Cron endpoint.

1. Create a `vercel.json` file in the root of your project:
```json
{
  "crons": [
    {
      "path": "/api/cron/run-due-scrapers",
      "schedule": "0 * * * *"
    }
  ]
}
```
2. In your Vercel Project Settings, add the Environment Variable: `CRON_SECRET=your_secure_random_string`.
3. Vercel will automatically hit `/api/cron/run-due-scrapers` every hour at the top of the hour. 
4. The API endpoint verifies the `CRON_SECRET`, queries the Supabase database for any due schedules, and executes them silently in the background!
