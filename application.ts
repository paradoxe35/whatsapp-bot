import fs from "fs";
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import qrimage from "qr-image";
import { Scheduler } from "./src/scheduler";
import { ContactsFactory } from "./src/contacts-factory";
import { ChatContactsFactory } from "./src/chat-contacts-factory";
import { KeyVSchedulerStore } from "./src/scheduler-store";

export default class Application {
  private whatsappClient: Client;

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

    const keyVStore = new KeyVSchedulerStore();

    // Schedule text message to specified contact weekly
    const scheduler = new Scheduler(
      process.env.TIMEZONE || "Africa/Kigali",
      keyVStore
    );

    // Schedule the contacts
    chatContacts.forEach((chatContact) => {
      scheduler.schedule(chatContact, (date) => {
        console.log("Scheduled....", date);
      });
    });

    // Run Cron scheduler
    scheduler.cron();
  }

  initialize() {
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
