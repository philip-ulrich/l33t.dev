const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { getStreamStatus, calendarEvent, socialLinks } = require("../app.js");

const cases = [
  ["Tuesday points to Friday", "2026-09-22T23:00:00Z", "upcoming", "2026-09-25T23:00:00.000Z"],
  ["Thursday says tomorrow", "2026-09-24T16:00:00Z", "upcoming", "2026-09-25T23:00:00.000Z"],
  ["UTC Friday is still Thursday in Eastern time", "2026-09-25T02:00:00Z", "upcoming", "2026-09-25T23:00:00.000Z"],
  ["Friday midnight is tonight, not the following week", "2026-09-25T04:00:00Z", "tonight", "2026-09-25T23:00:00.000Z"],
  ["Just before the scheduled start", "2026-09-25T22:59:59Z", "tonight", "2026-09-25T23:00:00.000Z"],
  ["At 7 PM the badge is scheduled, not verified live", "2026-09-25T23:00:00Z", "scheduled", "2026-10-02T23:00:00.000Z"],
  ["Friday evening stays scheduled", "2026-09-26T02:00:00Z", "scheduled", "2026-10-02T23:00:00.000Z"],
  ["Saturday rolls over", "2026-09-26T04:00:00Z", "upcoming", "2026-10-02T23:00:00.000Z"],
  ["Next Friday across fall DST change", "2026-10-31T16:00:00Z", "upcoming", "2026-11-07T00:00:00.000Z"],
  ["Next Friday across spring DST change", "2027-03-13T17:00:00Z", "upcoming", "2027-03-19T23:00:00.000Z"],
  ["Year rollover", "2026-12-31T16:00:00Z", "upcoming", "2027-01-02T00:00:00.000Z"],
];

for (const [name, instant, state, nextStart] of cases) {
  test(name, () => {
    const result = getStreamStatus(new Date(instant));
    assert.equal(result.state, state);
    assert.equal(result.nextStart.toISOString(), nextStart);
    assert.match(result.label, /7 PM ET/);
    assert.doesNotMatch(result.label, /Tuesday|live now/i);
  });
}

test("Relative labels use the Eastern day", () => {
  assert.match(getStreamStatus(new Date("2026-09-25T02:00:00Z")).label, /^Tomorrow/);
  assert.match(getStreamStatus(new Date("2026-09-25T04:00:00Z")).label, /^Tonight at/);
  assert.match(getStreamStatus(new Date("2026-09-23T16:00:00Z")).label, /^Next stream Friday/);
});

test("Calendar is a weekly Friday event with Eastern DST rules and both channels", () => {
  const ics = calendarEvent(new Date("2026-09-23T12:00:00Z"));
  assert.match(ics, /DTSTART;TZID=America\/New_York:20260925T190000/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=FR\r\n/);
  assert.match(ics, /BEGIN:DAYLIGHT/);
  assert.match(ics, /BEGIN:STANDARD/);
  assert.match(ics, /DTSTAMP:20260923T120000Z/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  for (const platform of socialLinks) assert.ok(ics.replace(/\r\n /g, "").includes(platform.url));
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, `Unfolded line: ${line}`);
});

test("Published calendar and no-JavaScript channel links match the configuration", () => {
  const ics = readFileSync(join(__dirname, "../assets/friday-stream.ics"), "utf8");
  const html = readFileSync(join(__dirname, "../index.html"), "utf8");
  assert.match(ics, /DTSTART;TZID=America\/New_York:\d{8}T190000\r\n/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=FR\r\n/);
  assert.match(html, /href="assets\/friday-stream\.ics" download=/);
  for (const { url } of socialLinks) assert.ok(html.includes(`href="${url}"`));
});
