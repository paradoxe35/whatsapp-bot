import cron from "node-cron";
import type { ChatContact } from "./chat-contact";
import type { SchedulerStore } from "./scheduler-store";
import { getRandomDayOfNextWeek, trimPhone } from "../utils/helpers";
import { Queue } from "../utils/queue";

type Scheduling = {
  chatContact: ChatContact;
  callback: (executedAt: Date) => void;
  datetime: Date;
};

export class Scheduler {
  private queue: Queue;
  private scheduling: Map<string, Scheduling> = new Map();

  constructor(private TZ: string, private store: SchedulerStore) {
    this.queue = new Queue(1);
    this.cronExecutor = this.cronExecutor.bind(this);
  }

  public async schedule(
    chatContact: ChatContact,
    callback: (executedAt: Date) => void
  ) {
    const phone = trimPhone(chatContact.contact.phone);

    // get scheduled date
    let datetime = await this.store.getScheduledChatDate(phone);

    if (!datetime) {
      datetime = await this.plan(chatContact);
    }

    this.scheduling.set(phone, {
      chatContact,
      callback,
      datetime,
    });
  }

  public cron() {
    // Just make sure the only on execution run at a time
    const cb = () => this.queue.task(this.cronExecutor);

    cron.schedule("* * * * *", cb, { timezone: this.TZ });
  }

  private async plan(
    chatContact: ChatContact,
    lastDatetime?: Date | null
  ): Promise<Date> {
    const phone = trimPhone(chatContact.contact.phone);

    if (!lastDatetime) {
      lastDatetime = new Date();
    }

    // ensures that the random day returned is within the next week
    // and is at least four days after the passed date.
    const nextScheduleDate = getRandomDayOfNextWeek(lastDatetime);

    // Store the scheduled date in case of sys restart
    this.store.setScheduledChatDate(phone, nextScheduleDate);

    const scheduled = this.scheduling.get(phone);

    // Update scheduling
    if (scheduled) {
      this.scheduling.set(phone, {
        ...scheduled,
        datetime: nextScheduleDate,
      });
    }

    return nextScheduleDate;
  }

  private cronExecutor() {
    const now = new Date();

    for (let value of this.scheduling.values()) {
      // If now is greater than the execution plan date
      // The change replan the next execution to the future date and execute
      if (now >= value.datetime) {
        this.plan(value.chatContact, value.datetime);

        value.callback(now);
      }
    }
  }
}
