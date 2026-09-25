"use strict";

const socialLinks = [
  { id: "twitch", name: "Twitch", url: "https://twitch.tv/l33tdev" },
  { id: "youtube", name: "YouTube", url: "https://youtube.com/@l33tdev" },
];

const streamSchedule = {
  day: "Friday",
  weekday: 5,
  hour: 19,
  minute: 0,
  timeZone: "America/New_York",
  timeZoneLabel: "ET",
};

const easternFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: streamSchedule.timeZone,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function easternParts(date) {
  return Object.fromEntries(easternFormatter.formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, Number(part.value)]));
}

function timeLabel(includeMinutes = false) {
  const { hour, minute } = streamSchedule;
  const minutes = includeMinutes || minute ? `:${String(minute).padStart(2, "0")}` : "";
  return `${hour % 12 || 12}${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

function easternToDate(year, month, day) {
  const { hour, minute } = streamSchedule;
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = wallTime;
  // Resolve the offset on the event date, including a DST change before Friday.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = easternParts(new Date(timestamp));
    const represented = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    const adjustment = wallTime - represented;
    timestamp += adjustment;
    if (!adjustment) break;
  }
  return new Date(timestamp);
}

function getStreamStatus(now = new Date()) {
  const local = easternParts(now);
  const calendarDate = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const dayOffset = (streamSchedule.weekday - calendarDate.getUTCDay() + 7) % 7;
  const beforeStart = local.hour * 60 + local.minute < streamSchedule.hour * 60 + streamSchedule.minute;
  const daysUntilStart = dayOffset || (beforeStart ? 0 : 7);
  calendarDate.setUTCDate(calendarDate.getUTCDate() + daysUntilStart);
  const nextStart = easternToDate(calendarDate.getUTCFullYear(), calendarDate.getUTCMonth() + 1, calendarDate.getUTCDate());
  const time = `${timeLabel()} ${streamSchedule.timeZoneLabel}`;

  let label = `Next stream ${streamSchedule.day} at ${time}`;
  let state = "upcoming";
  if (dayOffset === 1) label = `Tomorrow at ${time}`;
  if (dayOffset === 0) {
    label = beforeStart ? `Tonight at ${time}` : `Tonight's session / scheduled for ${time}`;
    state = beforeStart ? "tonight" : "scheduled";
  }
  return { label, state, nextStart };
}

function calendarEvent(now = new Date()) {
  const next = easternParts(getStreamStatus(now).nextStart);
  const pad = (value) => String(value).padStart(2, "0");
  const start = `${next.year}${pad(next.month)}${pad(next.day)}T${pad(next.hour)}${pad(next.minute)}00`;
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dayCodes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//l33t.dev//Friday stream//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VTIMEZONE",
    `TZID:${streamSchedule.timeZone}`, "BEGIN:DAYLIGHT", "DTSTART:20070311T020000",
    "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400", "TZNAME:EDT",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "DTSTART:20071104T020000", "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500", "TZNAME:EST", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD", "END:VTIMEZONE", "BEGIN:VEVENT",
    "UID:weekly-stream@l33t.dev", `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${streamSchedule.timeZone}:${start}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${dayCodes[streamSchedule.weekday]}`,
    "SUMMARY:l33t.dev with Phil", "URL:https://l33t.dev/",
    `DESCRIPTION:Games and development with Phil.\\n${socialLinks[0].url}\\n`,
    ` ${socialLinks[1].url}`, "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}

function initializePage() {
  for (const platform of socialLinks) {
    document.querySelectorAll(`[data-platform="${platform.id}"]`).forEach((link) => {
      link.href = platform.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }

  const updateText = (selector, text) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.textContent !== text) element.textContent = text;
    });
  };
  const updateSchedule = () => {
    const { label, state, nextStart } = getStreamStatus();
    updateText("[data-stream-status]", label);
    updateText("[data-weekly-schedule]", `${streamSchedule.day}s / ${timeLabel()} ${streamSchedule.timeZoneLabel}`);
    updateText("[data-schedule-frequency]", `Every ${streamSchedule.day}`);
    updateText("[data-schedule-time]", timeLabel(true).split(" ")[0]);
    updateText("[data-schedule-period]", timeLabel(true).split(" ")[1]);
    document.querySelectorAll("[data-stream-dot]").forEach((dot) => { dot.dataset.streamState = state; });
    const nextDate = new Intl.DateTimeFormat("en-US", {
      timeZone: streamSchedule.timeZone, weekday: "short", month: "short", day: "numeric",
    }).format(nextStart);
    updateText("[data-next-session]", `Next scheduled start: ${nextDate}`);
    const localTime = new Intl.DateTimeFormat(undefined, {
      weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short",
    }).format(nextStart);
    updateText("[data-local-time]", `Your time: ${localTime}`);
  };

  updateSchedule();
  window.setInterval(() => { if (!document.hidden) updateSchedule(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) updateSchedule(); });
}

if (typeof document !== "undefined") initializePage();
if (typeof module !== "undefined" && module.exports) {
  module.exports = { streamSchedule, socialLinks, getStreamStatus, calendarEvent };
}
