import cron from "node-cron";
import type { ChatContact } from "./chat-contact";
import type { SchedulerStore } from "./scheduler-store";

type Scheduling = {
  chatContact: ChatContact;
  callback: (date: string) => void;
};
export class Scheduler {
  private scheduling: Scheduling[] = [];

  constructor(private TZ: string, store: SchedulerStore) {
    this.cronExecutor = this.cronExecutor.bind(this);
  }

  public schedule(chatContact: ChatContact, callback: (date: string) => void) {
    this.scheduling.push({
      chatContact,
      callback,
    });
  }

  private cronExecutor(now: Date | "manual" | "init") {
    console.log("Cron 1 executed in:", new Date().toLocaleString());
  }

  public cron() {
    cron.schedule("* * * * *", this.cronExecutor, {
      timezone: this.TZ,
    });
  }
}
