// Lord of Flies: fly-swarm intro, solid nav on scroll, album player.
(function () {
  const $ = (id) => document.getElementById(id);
  $("year").textContent = new Date().getFullYear();

  const nav = $("nav");
  const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- intro: a swarm of flies blankets the screen, jitters, then scatters ----------
  const swarm = $("swarm");
  const FLY = `<svg viewBox="0 0 40 40" aria-hidden="true">
    <ellipse class="wing" cx="12" cy="15" rx="9" ry="5" fill="currentColor" opacity=".35" transform="rotate(-30 12 15)"/>
    <ellipse class="wing" cx="28" cy="15" rx="9" ry="5" fill="currentColor" opacity=".35" transform="rotate(30 28 15)"/>
    <ellipse cx="20" cy="22" rx="5" ry="9" fill="#0d0b0c"/>
    <circle cx="20" cy="12" r="4.5" fill="#0d0b0c"/>
    <circle cx="17.6" cy="11" r="1.8" fill="currentColor"/><circle cx="22.4" cy="11" r="1.8" fill="currentColor"/>
  </svg>`;
  const colours = ["#7fe3c8", "#ff2d8f", "#ff9d3c", "#f4ecd8"];

  function flies() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { swarm.remove(); return; }
    const w = innerWidth, h = innerHeight, cx = w / 2, cy = h / 2;
    const count = Math.min(160, Math.ceil((w * h) / 7000));
    const flights = [];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const el = document.createElement("div");
      el.className = "fly";
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.setProperty("--size", (34 + Math.random() * 60) + "px");
      el.style.setProperty("--buzz", (0.06 + Math.random() * 0.08).toFixed(2) + "s");
      el.style.setProperty("--c", colours[i % colours.length]);
      el.innerHTML = FLY;
      swarm.appendChild(el);

      // flies don't glide: zig-zag outward in a few sharp hops
      const angle = Math.atan2(y - cy, x - cx) + (Math.random() - 0.5) * 1.2;
      const dist = Math.hypot(w, h);
      const hop = (f, wob) => [Math.cos(angle) * dist * f + (Math.random() - 0.5) * wob, Math.sin(angle) * dist * f + (Math.random() - 0.5) * wob];
      const [ax, ay] = hop(0.15, 140), [bx, by] = hop(0.4, 220), [ex, ey] = hop(1, 0);
      const heading = angle * 180 / Math.PI + 90;
      const start = Math.random() * 360;

      flights.push(() => el.animate([
        { transform: `translate(0, 0) rotate(${start}deg)` },
        { transform: `translate(${ax}px, ${ay}px) rotate(${heading + 50}deg)`, offset: 0.25 },
        { transform: `translate(${bx}px, ${by}px) rotate(${heading - 40}deg)`, offset: 0.55 },
        { transform: `translate(${ex}px, ${ey}px) rotate(${heading}deg)` }
      ], { duration: 1300 + Math.random() * 900, delay: Math.random() * 700, easing: "ease-in", fill: "forwards" }).finished);
    }

    let started = false;
    const release = () => {
      if (started) return;
      started = true;
      swarm.classList.add("go");
      Promise.all(flights.map((f) => f())).then(() => swarm.remove());
    };
    swarm.addEventListener("click", release);
    setTimeout(release, 1100);
  }
  flies();

  // ---------- album player ----------
  const audio = $("pAudio");
  const player = $("player");
  const items = Array.from(document.querySelectorAll("#tracks li"));
  let pos = -1;

  function play(i) {
    if (i < 0 || i >= items.length) return;
    items.forEach((li) => li.classList.remove("playing"));
    pos = i;
    const li = items[i];
    li.classList.add("playing");
    audio.src = li.dataset.src;
    audio.play().catch(() => {});
    $("pArt").src = li.dataset.art;
    $("pTitle").textContent = li.querySelector(".t-title").textContent.replace(/\s+E$/, "");
    player.hidden = false;
    document.body.classList.add("has-player");
  }

  items.forEach((li, i) => {
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    const go = () => (pos === i ? (audio.paused ? audio.play() : audio.pause()) : play(i));
    li.addEventListener("click", go);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });

  $("playAll").addEventListener("click", () => {
    play(0);
    document.getElementById("listen").scrollIntoView({ behavior: "smooth" });
  });
  $("pPlay").addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()));
  $("pNext").addEventListener("click", () => play((pos + 1) % items.length));
  audio.addEventListener("ended", () => play(pos + 1));
  audio.addEventListener("play", () => { $("pPlay").textContent = "❚❚"; $("pPlay").setAttribute("aria-label", "Pause"); });
  audio.addEventListener("pause", () => { $("pPlay").textContent = "▶"; $("pPlay").setAttribute("aria-label", "Play"); });
  audio.addEventListener("timeupdate", () => { if (audio.duration) $("pSeek").value = (audio.currentTime / audio.duration) * 100; });
  $("pSeek").addEventListener("input", () => { if (audio.duration) audio.currentTime = ($("pSeek").value / 100) * audio.duration; });

  // play counts and loves (shows nothing if the counter can't be reached)
  if (window.FKStats) {
    FKStats.attach(items);
    FKStats.watch(audio, () => items[pos]);
  }

  // a video starting pauses the album, and vice versa
  const videos = document.querySelectorAll("video");
  videos.forEach((v) => v.addEventListener("play", () => {
    audio.pause();
    videos.forEach((o) => o !== v && o.pause());
  }));
  audio.addEventListener("play", () => videos.forEach((v) => v.pause()));

  // ---------- fan mail (goes to the inbox on the main Netlify site) ----------
  const form = $("fmForm");
  const status = $("fmStatus");
  const msg = form.elements.message;
  msg.addEventListener("input", () => { $("fmLeft").textContent = 2000 - msg.value.length; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    status.classList.remove("err");
    if (data.message.trim().length < 2) { status.classList.add("err"); status.textContent = "Write a message first."; return; }

    const btn = form.querySelector("button");
    btn.disabled = true;
    status.textContent = "Sending…";
    let res = null;
    try {
      res = await fetch("https://faricakimora.netlify.app/api/fanmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, from: "Lord of Flies" }),
      });
    } catch {}
    btn.disabled = false;

    if (res && res.ok) {
      form.reset();
      $("fmLeft").textContent = 2000;
      status.textContent = "Sent. Thank you ✶";
    } else {
      const err = res ? (await res.json().catch(() => ({}))).error : null;
      status.classList.add("err");
      status.textContent = err || "Couldn't send right now. Try again later.";
    }
  });
})();
