import { getMalaysiaHolidayCalendar } from "./seasonal-calendar";
import { SeasonalEvent } from "./seasonal-types";

export function getUpcomingEvents(monthsAhead: number = 3): SeasonalEvent[] {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  const calendar = getMalaysiaHolidayCalendar(currentYear);
  
  return calendar.filter(event => {
    let monthsAway = event.month - currentMonth;
    if (monthsAway < 0) {
      monthsAway += 12;
    }
    return monthsAway <= monthsAhead;
  }).sort((a, b) => {
    let aAway = a.month - currentMonth;
    if (aAway < 0) aAway += 12;
    let bAway = b.month - currentMonth;
    if (bAway < 0) bAway += 12;
    return aAway - bAway;
  });
}

export function getCurrentMonthEvents(): SeasonalEvent[] {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const calendar = getMalaysiaHolidayCalendar(currentYear);
  return calendar.filter(event => event.month === currentMonth);
}
