(function () {
  "use strict";

  /* ---------------- theme toggle ---------------- */

  function initTheme() {
    const root = document.documentElement;
    const stored = localStorage.getItem("chess-journal-site-theme");
    if (stored) root.setAttribute("data-theme", stored);

    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current =
        root.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("chess-journal-site-theme", next);
    });
  }

  /* ---------------- mobile nav ---------------- */

  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open")),
    );
  }

  /* ---------------- screenshot tabs + lightbox ---------------- */

  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".tabpanel").forEach((p) => (p.hidden = true));
        const panel = document.getElementById(tab.dataset.panel);
        if (panel) panel.hidden = false;
      });
    });
  }

  function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const img = lightbox.querySelector("img");
    document.querySelectorAll(".shot img").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        img.src = thumb.src;
        img.alt = thumb.alt;
        lightbox.classList.add("open");
      });
    });
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.closest(".lightbox-close")) {
        lightbox.classList.remove("open");
        img.src = "";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        lightbox.classList.remove("open");
        img.src = "";
      }
    });
  }

  /* ---------------- play-when-visible video autoplay ---------------- */

  // Chrome (and others) will silently pause an `autoplay` video that isn't
  // actually visible in the viewport yet, which made every clip below the
  // fold start playing for a frame and then freeze on the first paint —
  // looking indistinguishable from "never started." Driving play/pause off
  // an IntersectionObserver instead means each clip reliably starts the
  // moment it scrolls into view, muted+inline so no browser blocks it.
  function initVideoAutoplay() {
    const videos = document.querySelectorAll("main video[muted]");
    if (!videos.length) return;

    if (!("IntersectionObserver" in window)) {
      videos.forEach((v) => v.play().catch(() => {}));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.35 },
    );
    videos.forEach((v) => observer.observe(v));
  }

  /* ---------------- current version (local, no external service) ---------------- */

  // Chess Journal's repository is private, so the GitHub Releases API isn't
  // reachable anonymously — version.json is written by
  // .github/workflows/pages.yml from package.json on every deploy instead,
  // same-origin, no third-party dependency.
  async function initVersion() {
    const versionEls = document.querySelectorAll("[data-latest-version]");
    if (!versionEls.length) return;
    try {
      const res = await fetch("./version.json");
      if (!res.ok) throw new Error("version.json fetch failed: " + res.status);
      const data = await res.json();
      if (data.version) {
        versionEls.forEach((el) => (el.textContent = "v" + data.version));
      }
    } catch (err) {
      console.debug("[chess-journal-site] version fetch skipped:", err.message);
    }
  }

  /* ---------------- changelog: fetch + tiny markdown-lite parser ---------------- */

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inlineMd(raw) {
    let s = escapeHtml(raw);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function parseChangelog(text) {
    const lines = text.split("\n");
    const versions = [];
    let current = null;
    let group = null;

    for (const line of lines) {
      const vMatch = line.match(/^## \[(.+?)\](?:\s*-\s*(.+))?/);
      if (vMatch) {
        current = { version: vMatch[1], date: vMatch[2] || "", groups: [] };
        versions.push(current);
        group = null;
        continue;
      }
      if (!current) continue;

      const gMatch = line.match(/^### (.+)/);
      if (gMatch) {
        group = { name: gMatch[1].trim(), items: [] };
        current.groups.push(group);
        continue;
      }

      const itemMatch = line.match(/^- (.+)/);
      if (itemMatch && group) {
        group.items.push(itemMatch[1].trim());
      }
    }

    return versions.filter((v) => v.version.toLowerCase() !== "unreleased" || v.groups.length);
  }

  function renderVersion(v) {
    const groupsHtml = v.groups
      .filter((g) => g.items.length)
      .map(
        (g) => `
          <div class="changelog-group">
            <h5>${escapeHtml(g.name)}</h5>
            <ul>${g.items.map((item) => `<li>${inlineMd(item)}</li>`).join("")}</ul>
          </div>`,
      )
      .join("");

    return `
      <article class="changelog-entry" id="v${escapeHtml(v.version)}">
        <div class="changelog-version">
          <span class="v">v${escapeHtml(v.version)}</span>
          ${v.date ? `<span class="d">${escapeHtml(v.date)}</span>` : ""}
        </div>
        ${groupsHtml}
      </article>`;
  }

  async function initChangelog() {
    const teaserEl = document.getElementById("changelog-teaser");
    const fullEl = document.getElementById("changelog-full");
    if (!teaserEl && !fullEl) return;

    try {
      const res = await fetch("./CHANGELOG.md");
      if (!res.ok) throw new Error("changelog fetch failed: " + res.status);
      const text = await res.text();
      const versions = parseChangelog(text);

      if (teaserEl) {
        const withContent = versions.filter((v) => v.groups.some((g) => g.items.length));
        teaserEl.innerHTML = withContent.slice(0, 4).map(renderVersion).join("");
      }
      if (fullEl) {
        fullEl.innerHTML = versions.map(renderVersion).join("");
      }
    } catch (err) {
      console.debug("[chess-journal-site] changelog fetch skipped:", err.message);
      const msg = `<p>Couldn't load the changelog right now — please try again shortly.</p>`;
      if (teaserEl) teaserEl.innerHTML = msg;
      if (fullEl) fullEl.innerHTML = msg;
    }
  }

  /* ---------------- init ---------------- */

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initTabs();
    initLightbox();
    initVideoAutoplay();
    initVersion();
    initChangelog();
  });
})();
