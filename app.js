const socialLinks = [
  {
    name: "Twitch",
    label: "Primary stream",
    url: "https://twitch.tv/l33tdev",
    primary: true,
    enabled: true,
  },
  {
    name: "YouTube",
    label: "Simulcast & VODs",
    url: "https://youtube.com/@l33tdev",
    enabled: true,
  },
];

const streamSchedule = {
  timezone: "America/New_York",
  timezoneLabel: "EST",
  hour: 19,
  minute: 0,
  days: [
    { index: 2, name: "Tuesday" },
    { index: 5, name: "Friday" },
  ],
};

const platformMeta = {
  Twitch: { accent: "#a970ff", short: "tw" },
  YouTube: { accent: "#ff4d67", short: "yt" },
};

function createSocialCard(link) {
  const meta = platformMeta[link.name] ?? { accent: "#7df9ff", short: link.name.slice(0, 2) };
  const element = document.createElement(link.enabled ? "a" : "article");

  element.className = `social-card${link.primary ? " social-card-primary" : ""}${
    link.enabled ? "" : " is-disabled"
  }`;
  element.style.setProperty("--card-accent", meta.accent);

  if (link.enabled) {
    element.href = link.url;
    element.target = "_blank";
    element.rel = "noreferrer";
    element.setAttribute("aria-label", `${link.name}: ${link.label}`);
  } else {
    element.setAttribute("aria-label", `${link.name}: coming soon`);
  }

  element.innerHTML = `
    <span class="social-orb" aria-hidden="true">${meta.short}</span>
    <span class="social-body">
      <strong>${link.name}</strong>
      <span>${link.label}</span>
    </span>
    <span class="social-state">${link.enabled ? "Open" : "Soon"}</span>
  `;

  return element;
}

function renderSocialLinks() {
  const socialGrid = document.querySelector("#social-links");
  const footerLinks = document.querySelector("#footer-links");
  const primaryLink = socialLinks.find((link) => link.primary && link.enabled);
  const youtubeLink = socialLinks.find((link) => link.name === "YouTube" && link.enabled);
  const primaryAction = document.querySelector("[data-primary-social]");
  const youtubeAction = document.querySelector("[data-youtube-social]");

  if (primaryLink && primaryAction) {
    primaryAction.href = primaryLink.url;
    primaryAction.target = "_blank";
    primaryAction.rel = "noreferrer";
  }

  if (youtubeLink && youtubeAction) {
    youtubeAction.href = youtubeLink.url;
    youtubeAction.target = "_blank";
    youtubeAction.rel = "noreferrer";
  }

  socialLinks.forEach((link) => socialGrid.append(createSocialCard(link)));

  socialLinks
    .filter((link) => link.enabled)
    .forEach((link) => {
      const footerLink = document.createElement("a");
      footerLink.href = link.url;
      footerLink.target = "_blank";
      footerLink.rel = "noreferrer";
      footerLink.textContent = link.name;
      footerLinks.append(footerLink);
    });
}

function getEasternNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: streamSchedule.timezone,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(
    values.weekday,
  );

  return {
    dayIndex,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function getNextStreamStatus(now = getEasternNow()) {
  const streamDay = streamSchedule.days.find((day) => day.index === now.dayIndex);
  const minutesNow = now.hour * 60 + now.minute;
  const streamMinutes = streamSchedule.hour * 60 + streamSchedule.minute;

  if (streamDay && minutesNow < streamMinutes) {
    return {
      label: `Tonight at 7 PM ${streamSchedule.timezoneLabel}`,
      state: "tonight",
    };
  }

  const nextDay = streamSchedule.days
    .map((day) => ({
      ...day,
      daysAway: (day.index - now.dayIndex + 7) % 7 || 7,
    }))
    .sort((a, b) => a.daysAway - b.daysAway)[0];

  return {
    label: `Next stream ${nextDay.name} at 7 PM ${streamSchedule.timezoneLabel}`,
    state: "upcoming",
  };
}

function getNextStreamLabel(now = getEasternNow()) {
  return getNextStreamStatus(now).label;
}

function renderStreamSchedule() {
  const status = getNextStreamStatus();
  const heroStatus = document.querySelector("[data-stream-status]");
  const scheduleLine = document.querySelector("[data-stream-schedule]");
  const statusDot = document.querySelector("[data-stream-dot]");

  if (heroStatus) {
    heroStatus.textContent = status.label;
  }

  if (scheduleLine) {
    scheduleLine.textContent = status.label;
  }

  if (statusDot) {
    statusDot.dataset.streamState = status.state;
  }
}

renderSocialLinks();
renderStreamSchedule();
