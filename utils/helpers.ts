export function trimPhone(phone: string) {
  if (!phone.startsWith("+")) {
    phone = "+" + phone;
  }

  return phone.replace(/\s/, "");
}
