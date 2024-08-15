import "dotenv/config";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth } from "whatsapp-web.js";

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("ready", () => {
  console.log("Client is ready!");

  client.getChats().then(async (chats) => {
    const contact = await chats[0].getContact();

    console.log(contact.number);
  });
});

client.on("message_create", (message) => {
  //   console.log(message.body);
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.initialize();
