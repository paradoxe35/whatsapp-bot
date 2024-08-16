import "dotenv/config";
import Application from "./application";

process.env.TZ = process.env.TIMEZONE;

const application = new Application();

application.initialize();
