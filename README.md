# l33t.dev

Phil's games and development stream. Plain HTML, CSS, and JavaScript, hosted on GitHub Pages with the existing `CNAME`.

## Content and Schedule

- Update channel URLs in `socialLinks` in `app.js`. HTML links also contain working URLs for visitors without JavaScript; keep those fallbacks in sync when changing channels.
- Streams are Fridays at 7 PM Eastern. `streamSchedule` in `app.js` drives the status badge, next date, and visitor-local time. Also update the static Friday copy and metadata in `index.html` when changing the schedule.
- Eastern time uses `America/New_York`, so 7 PM stays 7 PM through daylight saving changes. The badge refreshes every 30 seconds and when a hidden tab becomes visible.
- The badge describes the schedule, not verified live status. Friday evening says the session was scheduled for 7 PM; it does not claim the channel is live.
- The calendar link serves `assets/friday-stream.ics`, a recurring Friday event that also works without JavaScript. After a schedule change, regenerate it with `node -e 'require("node:fs").writeFileSync("assets/friday-stream.ics", require("./app.js").calendarEvent())'`.

## Preview and Checks

Open `index.html` directly, or run `python3 -m http.server 4173 --bind 127.0.0.1` and visit `http://127.0.0.1:4173`.

Run `node --check app.js` and `node --test tests/schedule.test.cjs`. There is no build or dependency installation step.

## Assets

The original generated console illustration remains in `assets/l33t-systems-console.png`. The page uses the smaller `assets/control-room.webp`; the PNG is retained for social previews. Barlow Condensed and Manrope load through Google Fonts with system fallbacks. There are no analytics, API keys, embeds, or backend services.
