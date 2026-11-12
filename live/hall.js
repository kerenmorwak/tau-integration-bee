// Lev hall seat map on a canvas: amphitheatre rows with a centre aisle, stage with three boards.
// hall.update(players) maps players (in join order) to seats; seats light up, and go dark in a wave when players are out.
export class Hall {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.rows = 10; this.seats = [];
    for (let r = 0; r < this.rows; r++) {
      const n = Math.round(8 + r * 1.35);
      for (let i = 0; i < n * 2; i++) {
        const side = i < n ? -1 : 1, k = i < n ? n - 1 - i : i - n;
        this.seats.push({ r, side, k, n, st: "empty", t: 0, pid: null });
      }
    }
    // fill order: a fixed shuffle, so people spread over the hall and reloads look the same
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    this.order = this.seats.map((_, i) => i).sort((a, b) => (this.seats[a].r - this.seats[b].r) * 0.15 + (rnd() - .5));
    this.byPid = new Map();
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    new ResizeObserver(() => this.size()).observe(canvas);
    this.size(); requestAnimationFrame(t => this.draw(t));
  }
  get capacity() { return this.seats.length; }
  size() {
    const b = this.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    this.W = b.width; this.H = b.height; this.cv.width = this.W * dpr; this.cv.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { W, H } = this, cx = W / 2, cy = H * .97, span = 1.25, gap = .06;
    this.seats.forEach(s => {
      const f = s.r / (this.rows - 1), Rx = W * (.2 + f * .27), Ry = H * (.2 + f * .7);
      const a = gap + (s.k + .5) / s.n * (span - gap);
      s.x = cx + s.side * Math.sin(a) * Rx; s.y = cy - Math.cos(a) * Ry - H * .06;
      s.rot = -s.side * Math.atan2(Math.cos(a) * Rx, Math.sin(a) * Ry) + s.side * Math.PI / 2;
      s.sz = Math.max(7, (W / 58) * (1 - f * .3));
    });
  }
  /** players: [{id, joinedAt, alive}] */
  update(players) {
    const now = performance.now();
    const sorted = players.slice().sort((a, b) => (a.joinedAt ?? 0) - (b.joinedAt ?? 0) || (a.id < b.id ? -1 : 1));
    const goingOut = [];
    sorted.forEach((p, i) => {
      if (i >= this.order.length) return;
      const s = this.seats[this.order[i]];
      const want = p.alive ? "lit" : "out";
      if (s.pid !== p.id) { s.pid = p.id; s.st = want; s.t = this.first ? now : -1e9; return; }
      if (s.st !== want) { if (want === "out") goingOut.push(s); else { s.st = "lit"; s.t = now; } }
    });
    // empty the seats of players that left (new game)
    for (let i = sorted.length; i < this.order.length; i++) { const s = this.seats[this.order[i]]; if (s.pid) { s.pid = null; s.st = "empty"; } }
    goingOut.sort((a, b) => a.x - b.x).forEach((s, i) => { s.st = "out"; s.t = now + (this.reduce ? 0 : i * (1400 / Math.max(1, goingOut.length))); });
    this.first = true;
  }
  rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  draw(now) {
    const c = this.ctx, { W, H } = this;
    c.clearRect(0, 0, W, H);
    const sw = W * .42, sh = H * .09, sx = (W - sw) / 2, sy = H - sh;
    c.globalAlpha = 1; c.shadowBlur = 0;
    c.fillStyle = "#17191c"; this.rr(sx, sy, sw, sh + 20, 10); c.fill();
    for (let b = 0; b < 3; b++) {
      c.fillStyle = "#9a7650"; this.rr(sx + sw * (.08 + b * .29), sy + sh * .2, sw * .26, sh * .34, 3); c.fill();
      c.fillStyle = "#e9eae6"; this.rr(sx + sw * (.08 + b * .29) + 3, sy + sh * .2 + 3, sw * .26 - 6, sh * .34 - 6, 2); c.fill();
    }
    const g = c.createRadialGradient(W / 2, sy + sh * .78, 2, W / 2, sy + sh * .78, sh * 1.1);
    g.addColorStop(0, "rgba(246,199,68,.45)"); g.addColorStop(1, "rgba(246,199,68,0)");
    c.fillStyle = g; c.beginPath(); c.arc(W / 2, sy + sh * .78, sh * 1.1, 0, 7); c.fill();
    for (const s of this.seats) {
      const t = Math.min(1, Math.max(0, (now - s.t) / 450));
      c.save(); c.translate(s.x, s.y); c.rotate(s.rot);
      const w = s.sz, h = s.sz * .8;
      if (s.st === "empty") {
        c.fillStyle = "#9a7650"; c.globalAlpha = .38; this.rr(-w / 2, -h / 2, w, h * .38, 2); c.fill();
        c.fillStyle = "#a8442f"; c.globalAlpha = .3; this.rr(-w / 2, -h / 2 + h * .42, w, h * .58, 2); c.fill();
      } else if (s.st === "lit") {
        c.shadowColor = "rgba(246,199,68,.9)"; c.shadowBlur = 6 + 10 * (1 - t);
        c.fillStyle = "#f6c744"; c.globalAlpha = .55 + .45 * t; this.rr(-w / 2, -h / 2, w, h, 3); c.fill();
      } else {
        if (now < s.t) { // waiting for its turn in the wave: still lit
          c.shadowColor = "rgba(246,199,68,.9)"; c.shadowBlur = 6; c.fillStyle = "#f6c744"; this.rr(-w / 2, -h / 2, w, h, 3); c.fill();
        } else {
          if (t < 1) { c.fillStyle = "#e0644a"; c.globalAlpha = 1 - t; c.shadowColor = "#e0644a"; c.shadowBlur = 14; this.rr(-w / 2, -h / 2, w, h, 3); c.fill(); c.shadowBlur = 0; }
          c.globalAlpha = .9 * t; c.fillStyle = "#24272b"; this.rr(-w / 2, -h / 2, w, h, 3); c.fill();
          c.strokeStyle = "rgba(224,100,74,.35)"; c.lineWidth = 1; c.stroke();
        }
      }
      c.restore();
    }
    requestAnimationFrame(t => this.draw(t));
  }
}
