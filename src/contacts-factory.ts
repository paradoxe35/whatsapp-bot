import fs from "fs/promises";
import { Contact } from "./contact";

export class ContactsFactory {
  static async create() {
    const file = await fs.readFile("files/contacts.json");
    const json = JSON.parse(file.toString("utf8"));

    if (Array.isArray(json) === false) {
      throw new Error("The contact json file must array type");
    }

    return json.map((item) => Contact.fromJson(item));
  }
}
