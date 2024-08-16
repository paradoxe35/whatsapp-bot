export function trimPhone(phone: string) {
  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  return phone.replace(/\s/, "");
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

  // Set a random time between 10 AM and 12 PM
  const randomHours = 9 + Math.floor(Math.random() * 3); // Random hour: 9, 10, or 11 AM
  const randomMinutes = Math.floor(Math.random() * 60); // Random minute: 0 to 59

  randomDay.setHours(randomHours);
  randomDay.setMinutes(randomMinutes);
  randomDay.setSeconds(0);
  randomDay.setMilliseconds(0);

  return randomDay;
}
