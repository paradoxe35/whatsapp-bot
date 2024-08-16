import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { Scheduler } from "./src/scheduler";
import { ContactsFactory } from "./src/contacts-factory";
import { ChatContactsFactory } from "./src/chat-contacts-factory";

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

    const scheduler = new Scheduler(process.env.TIMEZONE || "Africa/Kigali");

    // Run Cron
    scheduler.cron();
  }

  initialize() {
    this.whatsappClient.on("qr", (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.whatsappClient.initialize();
  }
}
