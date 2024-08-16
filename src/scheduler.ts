import cron from "node-cron";

export class Scheduler {
  constructor(private TZ: string) {}

  public cron() {
    cron.schedule(
      "* * * * *",
      () => {
        console.log("Cron 1 executed in:", new Date().toLocaleString());
      },
      {
        timezone: this.TZ,
      }
    );
  }
}
