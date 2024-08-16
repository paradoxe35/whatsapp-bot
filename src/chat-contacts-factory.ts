import type { Chat } from "whatsapp-web.js";
import type { Contact } from "./contact";
import { trimPhone } from "../utils/helpers";
import type { ChatContact } from "./chat-contact";

export class ChatContactsFactory {
  static async create(chats: Chat[], contacts: Contact[]) {
    const newChats: ChatContact[] = [];

    for (const chat of chats) {
      // To limit getContact request calls, filter only contact that are similar
      const contact = contacts.find((contact) => {
        return (
          trimPhone(chat.name) === contact.phone || contact.name === chat.name
        );
      });

      if (!contact) continue;

      // Request for chat contact
      const wContact = await chat.getContact();

      if (trimPhone(wContact.number) === trimPhone(contact.phone)) {
        newChats.push({
          chat: chat,
          contact: contact,
        });
      }
    }

    return newChats;
  }
}
