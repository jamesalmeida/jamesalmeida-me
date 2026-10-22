import { cronJobs } from "convex/server";
import { internal } from "./refs";

const crons = cronJobs();

// Transcripts, events and feedback are kept for 90 days.
crons.daily("purge expired analytics", { hourUTC: 9, minuteUTC: 17 }, internal.retention.purgeExpired);

export default crons;
