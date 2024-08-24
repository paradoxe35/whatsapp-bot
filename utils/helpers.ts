export function trimPhone(phone: string) {
  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  return phone.replace(/\s/, "");
}

/**
 * Set a random time between 8:00 AM and 11:59 AM
 * @param date
 * @returns
 */
function randomizeTime(date: Date) {
  const randomHours = 8 + Math.floor(Math.random() * 4); // Random hour: 8, 9, 10, or 11 AM
  const randomMinutes = Math.floor(Math.random() * 60); // Random minute: 0 to 59

  date.setHours(randomHours);
  date.setMinutes(randomMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
}

export function getRandomDayOfNextWeek(date: Date) {
  // Ensure the input date is a Date object
  const inputDate = new Date(date);

  // Get the day of the week for the input date (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = inputDate.getDay();

  // Calculate the start of the next week (next Sunday)
  const startOfNextWeek = new Date(inputDate);
  startOfNextWeek.setDate(inputDate.getDate() + (7 - dayOfWeek));

  // Calculate the minimum date (4 days after the input date)
  const minDate = new Date(inputDate);
  minDate.setDate(inputDate.getDate() + 4);

  // Get the random day in the next week
  const randomDay = new Date(startOfNextWeek);

  const minDayOffset = Math.max(
    0,
    (minDate.getTime() - startOfNextWeek.getTime()) / (1000 * 60 * 60 * 24)
  );

  const randomOffset =
    Math.floor(Math.random() * (6 - minDayOffset + 1)) + minDayOffset;

  randomDay.setDate(startOfNextWeek.getDate() + randomOffset);

  return randomizeTime(randomDay);
}

export function getNextDayWithRandomMorningTime(date: Date) {
  // Ensure the input date is a Date object
  const inputDate = new Date(date);

  // Calculate the next day
  const nextDay = new Date(inputDate);
  nextDay.setDate(inputDate.getDate() + 1);

  return randomizeTime(nextDay);
}

export function getDateAfterFourDaysWithRandomMorningTime(date: Date) {
  // Ensure the input date is a Date object
  const inputDate = new Date(date);

  // Calculate the date four days later
  const fourthDay = new Date(inputDate);
  fourthDay.setDate(inputDate.getDate() + 4);

  return randomizeTime(fourthDay);
}
