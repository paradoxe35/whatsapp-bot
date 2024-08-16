import fs from "fs";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import qrimage from "qr-image";
import { Scheduler } from "./src/scheduler";
import { ContactsFactory } from "./src/contacts-factory";
import { ChatContactsFactory } from "./src/chat-contacts-factory";
import { KeyVSchedulerStore } from "./src/scheduler-store";
import { ChatMessage } from "./src/chat-message";
import type { ChatContact } from "./src/chat-contact";
import { trimPhone } from "./utils/helpers";

export default class Application {
  private whatsappClient: Client;
  private chatMessage?: ChatMessage;

  constructor() {
    this.whatsappClient = new Client({
      authStrategy: new LocalAuth(),
    });

    this.whatsappClient.on("ready", async () => {
      console.log("Client Ready!");

      this.ready();
    });
  }

  private async ready() {
    const contacts = await ContactsFactory.create();
    const chats = await this.whatsappClient.getChats();

    // Get contacts and chats that correspond to the contacts in json file
    const chatContacts = await ChatContactsFactory.create(chats, contacts);

    if (!chatContacts.length) {
      throw new Error("Contacts empty or couldn't found the contacts file");
    }

    // Instantiate Chat Message
    this.chatMessage = new ChatMessage();

    const keyVStore = new KeyVSchedulerStore();
    // Schedule send messages to contacts json weekly
    const scheduler = new Scheduler(
      process.env.TIMEZONE || "Africa/Kigali",
      keyVStore
    );

    // Schedule the contacts
    chatContacts.forEach((chatContact) => {
      // Listen to scheduled task execution
      scheduler.schedule(chatContact, (date) => {
        this.sendGreetingMessage(chatContact, date);

        console.log("Scheduled chat contact Executed....", date);
      });
    });

    // Listen on incoming messages in of auto replay
    this.whatsappClient.on("message_create", async (message) => {
      const wContact = await message.getContact();

      // Loop over the working contacts and check message is who from, then reply
      chatContacts.forEach(async (c) => {
        if (
          c.contact.name === wContact.name &&
          trimPhone(c.contact.phone) === trimPhone(wContact.number) &&
          c.contact.autoReply
        ) {
          this.sendReplyMessage(c, message.body);
        }
      });
    });

    // Run Cron scheduler
    scheduler.cron();
  }

  // [app domain func]
  private async sendReplyMessage(chatContact: ChatContact, message: string) {
    const contact = chatContact.contact;
    const phone = trimPhone(contact.phone);

    const reply = await this.chatMessage!.invoke({
      sessionId: phone,
      character: contact.character,
      input: message,
    });

    chatContact.chat.sendMessage(reply);
  }

  // [app domain func]
  private async sendGreetingMessage(chatContact: ChatContact, date: Date) {
    const contact = chatContact.contact;
    const phone = trimPhone(contact.phone);

    const message = await this.chatMessage!.invoke({
      sessionId: phone,
      character: contact.character,
      input: "greeting",
      date: date,
    });

    chatContact.chat.sendMessage(message);
  }

  public initialize() {
    this.whatsappClient.on("qr", (qr) => {
      // Generate QR Code Image and  Save the QR Code Image (png format)
      qrimage
        .image(qr, { type: "png" })
        .pipe(fs.createWriteStream("files/qrcode.png"));

      // Print the qr code on the terminal
      qrcode.generate(qr, { small: true });
    });

    this.whatsappClient.initialize();
  }
}
