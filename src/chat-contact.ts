import type { Chat } from "whatsapp-web.js";
import type { Contact } from "./contact";

export class ChatContact {
  constructor(public readonly chat: Chat, public readonly contact: Contact) {}
}
