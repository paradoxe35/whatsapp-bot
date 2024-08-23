import fs from "fs";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrCode from "qrcode-terminal";
import qrImage from "qr-image";
import { ChatScheduler } from "./src/scheduler";
import { ContactsFactory } from "./src/contacts-factory";
import { ChatContactsFactory } from "./src/chat-contacts-factory";
import { KeyVSchedulerStore } from "./src/scheduler-store";
import { ChatMessage } from "./src/chat-message";
import type { ChatContact } from "./src/chat-contact";
import { trimPhone } from "./utils/helpers";
import { sendAlert } from "./utils/telegram";
import type { Contact } from "./src/contact";

export default class Application {
  private whatsappClient: Client;
  private chatMessage?: ChatMessage;
  private contacts: Contact[] = [];

  constructor() {
    this.contacts = ContactsFactory.create();

    this.whatsappClient = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    this.whatsappClient.on("ready", async () => {
      console.log("Client Ready!");

      this.ready();
    });
  }

  private async ready() {
    const chats = await this.whatsappClient.getChats();

    // Get contacts and chats that correspond to the contacts in json file
    const chatContacts = await ChatContactsFactory.create(chats, this.contacts);

    if (!chatContacts.length) {
      throw new Error("Contacts empty or couldn't found the contacts file");
    }

    // Instantiate Chat Message
    this.chatMessage = new ChatMessage();

    const keyVStore = new KeyVSchedulerStore();
    // Schedule send messages to contacts json weekly
    const scheduler = new ChatScheduler(
      process.env.TIMEZONE || "Africa/Kigali",
      keyVStore
    );

    // Schedule the sendGreetingMessage to the contacts
    chatContacts.forEach((chatContact) => {
      // Listen to scheduled task execution
      scheduler.schedule(chatContact, (date) => {
        this.sendGreetingMessage(chatContact, date);

        console.log("Scheduled chat contact Executed....", date);
      });
    });

    // Listen on incoming messages in case of auto reply
    this.whatsappClient.on("message", async (message) => {
      const wContact = await message.getContact();

      chatContacts.forEach(async (chatContact) => {
        if (
          trimPhone(chatContact.contact.phone) === trimPhone(wContact.number)
        ) {
          // if has the autoReplay Enable, then reply
          if (chatContact.contact.autoReply) {
            this.sendReplyMessage(chatContact, message.body);
          }

          // Reschedule the greeting date
          scheduler.plan(chatContact);
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
    this.whatsappClient.on("auth_failure", (err) => {
      // Telegram alert
      sendAlert(`auth_failure: ${err}`);
    });

    let pairingCodeRequested = false;
    this.whatsappClient.on("qr", async (qr) => {
      // Generate QR Code Image and  Save the QR Code Image (png format)
      qrImage
        .image(qr, { type: "png" })
        .pipe(fs.createWriteStream("files/qrcode.png"));

      // Send to telegram Notification
      sendAlert(`QR Code Scan request: ${qr}`);

      // Print the qr code on the terminal
      qrCode.generate(qr, { small: true });

      // Pairing code
      const pairingCodeEnabled = false;
      const myPhoneNumber = process.env.MY_PHONE_NUMBER;

      if (pairingCodeEnabled && !pairingCodeRequested && myPhoneNumber) {
        const pairingCode = await this.whatsappClient.requestPairingCode(
          myPhoneNumber
        );

        console.log("Pairing code enabled, code: " + pairingCode);
        pairingCodeRequested = true;
      }
    });

    this.whatsappClient.initialize();
  }
}
