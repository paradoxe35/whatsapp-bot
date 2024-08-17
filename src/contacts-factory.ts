import fs from "fs";
import { Contact } from "./contact";

export class ContactsFactory {
  /**
   * Read contacts from file synchronously
   * @returns
   */
  static create() {
    const file = fs.readFileSync("files/contacts.json");
    const json = JSON.parse(file.toString("utf8"));

    if (Array.isArray(json) === false) {
      throw new Error("The contact json file must array type");
    }

    return json.map((item) => Contact.fromJson(item));
  }
}
