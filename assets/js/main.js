(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DATA = window.BEE_2026;
  const CFG = window.SITE_CONFIG;

  function tex(src, display = true) {
    const span = document.createElement("span");
    span.className = "math";
    try { katex.render(src, span, { displayMode: display, throwOnError: false }); }
    catch (e) { span.textContent = src; }
    return span;
  }
  function renderAll(root = document) {
    $$("[data-tex]", root).forEach(el => {
      if (el.dataset.done) return;
      el.appendChild(tex(el.dataset.tex, el.dataset.inline === undefined));
      el.dataset.done = "1";
    });
  }

  /* ---- mobile menu ---- */
  const menuBtn = $(".menu-btn"), nav = $(".nav");
  if (menuBtn) menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$(".nav a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn && menuBtn.setAttribute("aria-expanded", "false"); }));

  $$("[data-year]").forEach(el => (el.textContent = CFG.nextYear));

  /* ---- registration ---- */
  const regBtn = $("#reg-btn");
  if (regBtn) {
    if (CFG.registrationUrl) {
      regBtn.href = CFG.registrationUrl;
      regBtn.textContent = "להרשמה לתחרות " + CFG.nextYear;
      regBtn.target = "_blank"; regBtn.rel = "noopener";
    } else {
      regBtn.removeAttribute("href");
      regBtn.setAttribute("aria-disabled", "true");
      regBtn.textContent = "ההרשמה תיפתח בקרוב";
    }
    const list = $("#reg-dates");
    const rows = [];
    if (CFG.qualifiers.length) CFG.qualifiers.forEach((q, i) => rows.push(["מוקדמות" + (CFG.qualifiers.length > 1 ? " · מועד " + (i + 1) : ""), `${q.date} · ${q.time} · ${q.place}`]));
    else rows.push(["שלב המוקדמות", "יפורסם בהמשך"]);
    rows.push(["הגמר", CFG.finalDate ? CFG.finalDate + (CFG.finalPlace ? " · " + CFG.finalPlace : "") : "יפורסם בהמשך"]);
    rows.push(["מי יכול להשתתף", "סטודנטים לתואר ראשון בפקולטה"]);
    list.innerHTML = rows.map(r => `<li><span>${r[0]}</span><span>${r[1]}</span></li>`).join("");
    const contact = $("#reg-contact");
    if (contact && CFG.contactEmail) {
      contact.innerHTML = `לשאלות: <a href="mailto:${CFG.contactEmail}">${CFG.contactEmail}</a>`;
      contact.hidden = false;
    }
  }

  /* ---- hero / any single reveal ---- */
  $$("[data-reveal]").forEach(btn => {
    const target = document.getElementById(btn.dataset.reveal);
    btn.addEventListener("click", () => {
      const show = target.hidden;
      target.hidden = !show;
      btn.textContent = show ? "הסתרת התשובה" : "הצגת התשובה";
      btn.setAttribute("aria-expanded", show);
    });
  });

  /* ---- problem cards ---- */
  function problemCard(p, label) {
    const el = document.createElement("article");
    el.className = "problem";
    el.innerHTML = `
      <div class="problem-top"><span class="problem-num">${label}</span></div>
      <div class="eq"></div>
      ${p.note ? `<p class="note">${p.note}</p>` : ""}
      <div class="problem-foot">
        <button class="ans-toggle" type="button" aria-expanded="false">הצגת התשובה</button>
        <div class="ans" hidden></div>
      </div>`;
    $(".eq", el).appendChild(tex(p.tex));
    $(".ans", el).appendChild(tex(p.answer, false));
    const btn = $(".ans-toggle", el), ans = $(".ans", el);
    btn.addEventListener("click", () => {
      const show = ans.hidden;
      ans.hidden = !show;
      btn.textContent = show ? "הסתרה" : "הצגת התשובה";
      btn.setAttribute("aria-expanded", show);
    });
    return el;
  }

  const qualGrid = $("#qual-grid");
  if (qualGrid) DATA.qualifying.forEach((p, i) => qualGrid.appendChild(problemCard(p, "Q" + (i + 1))));

  const finalsWrap = $("#finals-wrap");
  if (finalsWrap) DATA.finals.forEach(r => {
    const sec = document.createElement("div");
    sec.className = "round";
    sec.innerHTML = `<div class="round-head"><h3>${r.stage}</h3>
      <div class="round-meta"><b>${r.players.join(", ")}</b> · ${r.limit}</div></div>
      <div class="problems ${r.items.length === 1 ? "single" : ""}"></div>`;
    const grid = $(".problems", sec);
    r.items.forEach((p, i) => grid.appendChild(problemCard(p, r.items.length > 1 ? String(i + 1) : "★")));
    finalsWrap.appendChild(sec);
  });

  $$("[data-toggle-all]").forEach(btn => btn.addEventListener("click", () => {
    const scope = document.getElementById(btn.dataset.toggleAll);
    const anyHidden = $$(".ans", scope).some(a => a.hidden);
    $$(".problem", scope).forEach(card => {
      const a = $(".ans", card), b = $(".ans-toggle", card);
      a.hidden = !anyHidden;
      b.textContent = anyHidden ? "הסתרה" : "הצגת התשובה";
      b.setAttribute("aria-expanded", anyHidden);
    });
    btn.textContent = anyHidden ? "הסתרת כל התשובות" : "הצגת כל התשובות";
  }));

  /* ---- slides viewer ---- */
  const viewer = $("#viewer");
  if (viewer) {
    const N = +viewer.dataset.count, img = $("img", viewer), count = $(".viewer-count", viewer), thumbs = $(".thumbs", viewer);
    const src = i => `assets/img/slides/s-${String(i).padStart(2, "0")}.jpg`;
    let cur = 1;
    for (let i = 1; i <= N; i++) {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "שקופית " + i);
      b.innerHTML = `<img src="${src(i)}" alt="" loading="lazy">`;
      b.addEventListener("click", () => go(i));
      thumbs.appendChild(b);
    }
    function go(i) {
      cur = (i - 1 + N) % N + 1;
      img.src = src(cur); img.alt = "שקופית " + cur + " מתוך " + N;
      count.textContent = cur + " / " + N;
      $$("button", thumbs).forEach((b, k) => b.setAttribute("aria-current", k + 1 === cur));
      const t = $$("button", thumbs)[cur - 1];
      thumbs.scrollTo({ left: t.offsetLeft - thumbs.clientWidth / 2 + t.clientWidth / 2, behavior: "smooth" });
    }
    $("[data-prev]", viewer).addEventListener("click", () => go(cur - 1));
    $("[data-next]", viewer).addEventListener("click", () => go(cur + 1));
    viewer.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") go(cur + 1);
      if (e.key === "ArrowRight") go(cur - 1);
    });
    go(1);
  }

  /* ---- Newton / Leibniz quiz ---- */
  const quiz = $("#quiz");
  if (quiz) {
    let done = 0, right = 0;
    const score = $("#quiz-score");
    DATA.quiz.forEach(item => {
      const row = document.createElement("div");
      row.className = "quiz-row";
      row.innerHTML = `<p>${item.q}</p><div class="quiz-choices">
        <button type="button" data-v="newton">ניוטון</button>
        <button type="button" data-v="leibniz">לייבניץ</button></div>`;
      $$("button", row).forEach(b => b.addEventListener("click", () => {
        const ok = b.dataset.v === item.a;
        $$("button", row).forEach(x => { x.disabled = true; if (x.dataset.v === item.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        done++; if (ok) right++;
        score.textContent = done === DATA.quiz.length
          ? `סיימתם: ${right} מתוך ${DATA.quiz.length} תשובות נכונות.`
          : `${right} נכונות מתוך ${done}`;
      }));
      quiz.appendChild(row);
    });
  }

  /* ---- simulation ---- */
  const fmt = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  const modeBtns = $$("#sim-mode button");
  if (modeBtns.length) {
    const setMode = m => {
      modeBtns.forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === m));
      $("#sim-qual").hidden = m !== "qual";
      $("#sim-final").hidden = m !== "final";
      try { history.replaceState(null, "", "#" + m); } catch (e) {}
    };
    modeBtns.forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
    if (location.hash === "#final") setMode("final");
  }

  // qualifying: whole sheet, one clock
  const sheet = $("#qual-sheet");
  if (sheet) {
    const TOTAL = 20 * 60;
    let left = TOTAL, t = null, finished = false;
    const timerEl = $("#qual-timer"), startBtn = $("#qual-start"), endBtn = $("#qual-end"), status = $("#qual-status"), score = $("#qual-score");
    DATA.qualifying.forEach((p, i) => {
      const el = document.createElement("article");
      el.className = "problem";
      el.innerHTML = `<div class="problem-top"><span class="problem-num">Q${i + 1}</span></div>
        <div class="eq"></div>
        <div class="problem-foot" hidden>
          <div class="ans"></div>
          <label class="self-check"><input type="checkbox"> פתרתי נכון</label>
        </div>`;
      $(".eq", el).appendChild(tex(p.tex));
      $(".ans", el).appendChild(tex(p.answer, false));
      sheet.appendChild(el);
    });
    const updateScore = () => {
      const n = $$(".self-check input:checked", sheet).length;
      score.textContent = `סימנתם ${n} תשובות נכונות מתוך 20.`;
    };
    $$(".self-check input", sheet).forEach(c => c.addEventListener("change", updateScore));
    function finish(timeUp) {
      if (finished) return;
      finished = true; clearInterval(t);
      $$(".problem-foot", sheet).forEach(f => (f.hidden = false));
      endBtn.hidden = true;
      startBtn.hidden = false; startBtn.textContent = "מבחן חדש";
      const used = TOTAL - left;
      status.textContent = timeUp ? "הזמן נגמר. סמנו אילו אינטגרלים פתרתם נכון." : `סיימתם אחרי ${fmt(used)} דקות. סמנו אילו אינטגרלים פתרתם נכון.`;
      updateScore();
      sheet.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    startBtn.addEventListener("click", () => {
      if (finished) {
        finished = false;
        $$(".problem-foot", sheet).forEach(f => (f.hidden = true));
        $$(".self-check input", sheet).forEach(c => (c.checked = false));
        score.textContent = "";
      }
      left = TOTAL; timerEl.textContent = fmt(left); timerEl.classList.remove("low");
      sheet.dataset.locked = "false";
      startBtn.hidden = true; endBtn.hidden = false;
      status.textContent = "בהצלחה. כתבו את הפתרונות על דף, ובסוף בדקו מול התשובות.";
      t = setInterval(() => {
        left--;
        timerEl.textContent = fmt(Math.max(left, 0));
        if (left <= 120) timerEl.classList.add("low");
        if (left <= 0) finish(true);
      }, 1000);
    });
    endBtn.addEventListener("click", () => finish(false));
  }

  // final: one integral on the board
  const arena = $("#arena");
  if (arena) {
    const pool = [
      ...DATA.finals.flatMap(r => r.items.map(p => ({ ...p, src: r.stage, duel: /דו־קרב/.test(r.stage) }))),
      { ...DATA.poster, src: "האינטגרל מהפוסטר" }
    ];
    let left = 180, t = null, cur = null, order = [], idx = 0;
    const timerEl = $("#timer"), eq = $("#arena-eq"), note = $("#arena-note"), srcEl = $("#arena-src"), ans = $("#arena-answer"), startBtn = $("#arena-start"), showBtn = $("#arena-show");
    const shuffle = () => { order = pool.slice().sort(() => Math.random() - .5); idx = 0; };
    const stop = () => { clearInterval(t); t = null; };
    function reveal() {
      if (!cur) return;
      stop();
      ans.innerHTML = ""; ans.appendChild(tex(cur.answer));
      showBtn.disabled = true;
    }
    function next() {
      stop();
      if (idx >= order.length) shuffle();
      cur = order[idx++];
      left = cur.duel ? 300 : 180;
      eq.innerHTML = ""; eq.appendChild(tex(cur.tex));
      note.textContent = cur.note || "";
      srcEl.textContent = cur.src + " · " + (cur.duel ? "5 דקות" : "3 דקות");
      ans.innerHTML = "";
      timerEl.textContent = fmt(left); timerEl.classList.remove("low");
      startBtn.textContent = "אינטגרל הבא";
      showBtn.disabled = false;
      t = setInterval(() => {
        left--;
        timerEl.textContent = fmt(Math.max(left, 0));
        if (left <= 30) timerEl.classList.add("low");
        if (left <= 0) reveal();
      }, 1000);
    }
    startBtn.addEventListener("click", next);
    showBtn.addEventListener("click", reveal);
    shuffle();
  }

  /* ---- lightbox ---- */
  const lb = $("#lightbox");
  if (lb) {
    const lbImg = $("img", lb);
    $$(".ph-open").forEach(b => b.addEventListener("click", () => {
      const im = $("img", b);
      lbImg.src = im.src; lbImg.alt = im.alt;
      lb.showModal();
    }));
    $(".lb-close", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
  }

  renderAll();
})();
