(() => {
  "use strict";

  const previews = [
    {
      kicker: "BROWSE BEAUTIFULLY",
      title: "Find your next obsession.",
      description: "Beautiful artwork, effortless discovery, and a home screen that makes you want to keep exploring."
    },
    {
      kicker: "THE DETAILS MATTER",
      title: "Every story, in focus.",
      description: "Everything you need for movie night, presented in one beautiful place."
    },
    {
      kicker: "ALL ABOUT THE STORY",
      title: "A better way to press play.",
      description: "Immersive playback keeps the picture front and center, not the controls."
    }
  ];

  const tabs = Array.from(document.querySelectorAll(".preview-tab"));
  const slides = Array.from(document.querySelectorAll(".preview-slide"));
  const title = document.getElementById("preview-title");
  const description = document.getElementById("preview-description");
  const counter = document.getElementById("preview-counter");
  const kicker = document.querySelector(".preview-caption .kicker");

  function showPreview(index) {
    if (!Number.isInteger(index) || index < 0 || index >= previews.length) return;
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    slides.forEach((slide, i) => {
      slide.hidden = i !== index;
      slide.classList.toggle("active", i === index);
    });
    const item = previews[index];
    kicker.textContent = item.kicker;
    title.textContent = item.title;
    description.textContent = item.description;
    counter.textContent = String(index + 1).padStart(2, "0") + " / 03";
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => showPreview(index));
    tab.addEventListener("keydown", event => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      showPreview(next);
      tabs[next].focus();
    });
  });
  showPreview(0);

  const cfg = window.OVRELIXA_CONFIG || {};
  const apiOrigin = String(cfg.accessApiOrigin || "https://ovrelixa-access-api.ryajohns1.workers.dev").replace(/\/$/, "");
  const form = document.getElementById("access-form");
  const input = document.getElementById("access-code");
  const unlock = document.getElementById("unlock-button");
  const status = document.getElementById("access-feedback");
  const result = document.getElementById("download-result");
  const privateDownload = document.getElementById("private-download");
  const version = document.getElementById("release-label");
  const releaseNotes = document.getElementById("release-notes");
  let activeController = null;

  function feedback(message, tone) {
    status.textContent = message;
    status.classList.remove("error", "success");
    if (tone) status.classList.add(tone);
  }

  function setBusy(value) {
    unlock.disabled = value;
    input.disabled = value;
    unlock.textContent = value ? "Verifying access…" : "Unlock download  →";
    unlock.setAttribute("aria-busy", String(value));
  }

  function clearDownload() {
    result.hidden = true;
    privateDownload.removeAttribute("href");
    releaseNotes.textContent = "";
  }

  function approvedUrl(value) {
    if (typeof value !== "string") return null;
    try {
      const parsed = new URL(value);
      if (parsed.origin !== apiOrigin || parsed.protocol !== "https:" ||
          !/^\/v1\/site\/download\/[a-f0-9]{64}$/.test(parsed.pathname) ||
          parsed.search || parsed.hash) return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (unlock.disabled) return;
    const code = input.value.toUpperCase().replace(/[\s-]/g, "");
    if (!/^[A-Z0-9]{16,64}$/.test(code)) {
      clearDownload();
      feedback("Enter the complete access code to continue.", "error");
      input.focus();
      return;
    }

    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);
    clearDownload();
    setBusy(true);
    feedback("Checking your access code…");

    try {
      const response = await fetch(apiOrigin + "/v1/site/ticket", {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal: controller.signal
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Too many attempts. Please try again in 15 minutes.");
        if (response.status === 503) throw new Error("The private download is being prepared. Try again shortly.");
        if (response.status === 400 || response.status === 403) throw new Error("That access code wasn't accepted. Check it and try again.");
        throw new Error("The access service is unavailable. Please try again.");
      }
      const payload = await response.json();
      const url = approvedUrl(payload.url);
      if (!url || !Number.isSafeInteger(payload.versionCode) ||
          typeof payload.versionName !== "string") {
        throw new Error("The download service returned an unexpected response.");
      }

      privateDownload.href = url;
      version.textContent = "Ovrelixa " + payload.versionName + " · Build " + payload.versionCode + " · Android TV / Fire TV";
      releaseNotes.textContent = typeof payload.notes === "string" ? payload.notes.slice(0, 600) : "";
      result.hidden = false;
      feedback("Access verified. Your private download is ready.", "success");
      input.value = "";
    } catch (error) {
      if (error.name === "AbortError") {
        feedback("The request timed out. Please try again.", "error");
      } else {
        feedback(error instanceof TypeError ? "Connection problem. Please try again." : error.message, "error");
      }
    } finally {
      clearTimeout(timeout);
      if (activeController === controller) activeController = null;
      setBusy(false);
    }
  });
})();