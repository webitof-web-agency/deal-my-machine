const INDIA_OFFSET = '+05:30';
const INDIA_TIME_ZONE = 'Asia/Kolkata';

const getIndiaDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return { year: get('year'), month: get('month'), day: get('day') };
};

export const getNextDatabaseBackupAt = (now = new Date()) => {
  const { year, month, day } = getIndiaDateParts(now);
  const todayAtThree = new Date(`${year}-${month}-${day}T03:00:00${INDIA_OFFSET}`);
  if (todayAtThree.getTime() > now.getTime()) return todayAtThree;

  const nextDay = new Date(todayAtThree.getTime() + 24 * 60 * 60 * 1000);
  return nextDay;
};

export const buildDatabaseBackupFileName = (date = new Date()) => {
  const { year, month, day } = getIndiaDateParts(date);
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = timeParts.find((part) => part.type === 'hour')?.value || '00';
  const minute = timeParts.find((part) => part.type === 'minute')?.value || '00';
  return `dealmymachine-db-${year}-${month}-${day}-${hour}${minute}-IST.dump`;
};
