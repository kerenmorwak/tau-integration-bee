// In-browser stand-in for Firestore, for rehearsals and testing (add ?mock to any live page).
// All tabs of the same browser share one store; each tab is a different player.
// It enforces the same rules as firestore.rules: join only in the lobby, one answer per question, before the deadline.
const KEY = "tau-bee-mockdb";
const bc = "BroadcastChannel" in self ? new BroadcastChannel(KEY) : null;
const listeners = new Set();
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { config: {}, games: {}, admin: {} }; } catch { return { config: {}, games: {}, admin: {} }; } };
const write = s => { localStorage.setItem(KEY, JSON.stringify(s)); bc && bc.postMessage(1); queueMicrotask(fire); };
const fire = () => listeners.forEach(f => f());
bc && (bc.onmessage = fire);
addEventListener("storage", e => { if (e.key === KEY) fire(); });
const sub = f => { listeners.add(f); f(); return () => listeners.delete(f); };

export const SERVER_TIME = "__server_time__";
const stamp = p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v === SERVER_TIME ? Date.now() : v]));
let uid = sessionStorage.getItem("mockuid");
if (!uid) { uid = "u" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("mockuid", uid); }
const fail = msg => { const e = new Error(msg); e.code = "permission-denied"; throw e; };

export async function init() { return uid; }
export function onAdmin(cb) { setTimeout(() => cb({ email: "rehearsal@mock", uid: "admin" }), 0); return () => {}; }
export async function adminSignIn() {}
export async function adminSignOut() {}

export const watchConfig = cb => sub(() => cb(read().config.current || null));
export const watchGame = (gid, cb) => sub(() => { const g = read().games[gid]; cb(g ? { ...g.data } : null); });
export const watchPlayers = (gid, cb) => sub(() => { const g = read().games[gid]; cb(g ? Object.entries(g.players).map(([id, p]) => ({ id, ...p })) : []); });
export const watchPlayer = (gid, id, cb) => sub(() => { const p = read().games[gid]?.players[id]; cb(p ? { id, ...p } : null); });
export const watchAnswerCount = (gid, qn, cb) => sub(() => { const g = read().games[gid]; cb(g ? Object.values(g.answers).filter(a => a.q === qn).length : 0); });
export async function getAnswers(gid, qn) { const g = read().games[gid]; return g ? Object.values(g.answers).filter(a => a.q === qn) : []; }

export async function join(gid, name, asUid = uid) {
  const s = read(), g = s.games[gid];
  if (!g || g.data.phase !== "lobby") fail("join closed");
  if (g.players[asUid]) fail("exists");
  if (!name || name.length > 24) fail("bad name");
  g.players[asUid] = { name, joinedAt: Date.now(), alive: true };
  write(s);
}
export async function answer(gid, qn, choice, asUid = uid) {
  const s = read(), g = s.games[gid], d = g?.data;
  const id = `${qn}_${asUid}`;
  if (!d || d.phase !== "question" || d.qn !== qn) fail("not open");
  if (!d.acceptingAnswers || Date.now() >= d.openedAt + d.seconds * 1000) fail("too late");
  if (g.answers[id]) fail("already answered");
  if (!g.players[asUid]?.alive) fail("not alive");
  g.answers[id] = { uid: asUid, q: qn, choice, at: Date.now() };
  write(s);
}

export async function newGame(base) {
  const s = read(), gid = "g" + Date.now().toString(36);
  s.games = { [gid]: { data: stamp({ ...base, createdAt: SERVER_TIME }), players: {}, answers: {} } };
  s.config.current = { gameId: gid };
  write(s); return gid;
}
export async function patchGame(gid, patch) { const s = read(); Object.assign(s.games[gid].data, stamp(patch)); write(s); }
export async function updatePlayers(gid, list) { const s = read(); list.forEach(({ id, patch }) => Object.assign(s.games[gid].players[id], patch)); write(s); }
export async function loadQuestions() { return read().admin.questions || null; }
export async function getMyAnswer(gid, qn) { return read().games[gid]?.answers[`${qn}_${uid}`] || null; }
export async function saveQuestions(list) { const s = read(); s.admin.questions = list; write(s); }
export async function loadState() { return read().admin.state || null; }
export async function saveState(st) { const s = read(); s.admin.state = st; write(s); }

// rehearsal helpers: fake players that join and answer (used by the control panel in ?mock mode)
export const mock = {
  async addBots(gid, n) {
    const s = read(), g = s.games[gid];
    for (let i = 0; i < n; i++) { const id = "bot" + Math.random().toString(36).slice(2, 9); g.players[id] = { name: "משתתף " + (Object.keys(g.players).length + 1), joinedAt: Date.now() + i, alive: true }; }
    write(s);
  },
  async botsAnswer(gid, accuracy, correct) {
    const s = read(), g = s.games[gid], d = g.data;
    Object.entries(g.players).forEach(([id, p]) => {
      if (!id.startsWith("bot") || !p.alive || g.answers[`${d.qn}_${id}`]) return;
      const right = Math.random() < accuracy;
      const choice = right ? correct : (correct + 1 + Math.floor(Math.random() * (d.opts.length - 1))) % d.opts.length;
      g.answers[`${d.qn}_${id}`] = { uid: id, q: d.qn, choice, at: d.openedAt + 1500 + Math.random() * (d.seconds - 2) * 1000 };
    });
    write(s);
  },
  reset() { localStorage.removeItem(KEY); bc && bc.postMessage(1); fire(); }
};

export async function getPlayers(gid) { const g = read().games[gid]; return g ? Object.entries(g.players).map(([id, p]) => ({ id, ...p })) : []; }
export async function claimReveal(gid, qn) {
  const s = read(), d = s.games[gid]?.data;
  if (!d || !["question", "settling"].includes(d.phase) || d.qn !== qn) return null;
  const before = { ...d }; d.phase = "settling"; d.acceptingAnswers = false; write(s); return before;
}

export async function finishReveal(gid, qn, players, result) {
  const finish = () => {
    const s = read(), g = s.games[gid];
    if (!g || g.data.phase !== "settling" || g.data.qn !== qn) return false;
    players.forEach(({ id, patch }) => Object.assign(g.players[id], patch));
    Object.assign(g.data, result, { acceptingAnswers: false });
    write(s); return true;
  };
  return navigator.locks ? navigator.locks.request(KEY + "-reveal", finish) : finish();
}
