import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Shared dayjs instance with the `utc` and `timezone` plugins loaded. All
 * timezone-aware logic (broker working hours, daily caps, etc.) must go
 * through this instance instead of importing `dayjs` directly or doing raw
 * `Date` math.
 */
export default dayjs;
