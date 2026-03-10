import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const IST = 'Asia/Kolkata';

export function getTodayISTRange() {
  const now = new Date();

  // convert current UTC time → IST
  const istNow = toZonedTime(now, IST);

  const startIST = startOfDay(istNow);
  const endIST = endOfDay(istNow);

  // convert back to UTC for DB query
  return {
    startUtc: fromZonedTime(startIST, IST),
    endUtc: fromZonedTime(endIST, IST),
  };
}

// i need a function where i input date from and date to in IST and it gives me the date from and date to in UTC
export function convertISTRangeToUTC(dateFrom: Date, dateTo: Date) {
  const startIST = toZonedTime(dateFrom, IST);
  const endIST = toZonedTime(dateTo, IST);

  return {
    startUtc: fromZonedTime(startIST, IST),
    endUtc: fromZonedTime(endIST, IST),
  };
}
