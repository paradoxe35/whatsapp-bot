import Keyv from "keyv";
import KeyvSqlite from "@keyv/sqlite";

export interface SchedulerStore {
  getScheduledChatDate(phone: string): Promise<Date | null>;

  setScheduledChatDate(phone: string, date: Date): Promise<void>;
}

export class KeyVSchedulerStore implements SchedulerStore {
  private keyv: Keyv;

  constructor() {
    this.keyv = new Keyv({
      store: new KeyvSqlite(`sqlite://${process.cwd()}/files/database.sqlite`),
    });
  }

  async setScheduledChatDate(phone: string, date: Date): Promise<void> {
    this.keyv.set(phone, date.toISOString());
  }

  async getScheduledChatDate(phone: string): Promise<Date | null> {
    const dateString = await this.keyv.get(phone);

    return dateString ? new Date(dateString) : null;
  }
}
