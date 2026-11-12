// Organizer-side actions shared by the control panel and the projector screen.
import { settle, rankWinners } from "./game.js?v=20261112-sound4";

export const GRACE_MS = 2500; // Presentation delay only; the server's answer deadline stays unchanged.

/** Settle the open question: eliminate, record times, publish the result. Safe to call from several screens. */
export async function revealNow(db, gid, qn) {
  const game = await db.claimReveal(gid, qn);
  if (!game) return false;
  const state = await db.loadState();
  const cur = state?.current;
  if (!cur || cur.qn !== game.qn) throw new Error("לא נמצאה התשובה הנכונה לשאלה הזו.");
  const before = (await db.getPlayers(gid)).filter(p => p.alive);
  const answers = await db.getAnswers(gid, game.qn);
  const r = settle({ alive: before, answers, correct: cur.answer, openedAt: game.openedAt, nOpts: game.opts.length });
  const updates = [
    ...r.out.map(p => ({ id: p.id, patch: { alive: false, outQ: game.qn } })),
    ...r.stay.map(p => ({ id: p.id, patch: { lastMs: p.ms, lastQ: game.qn } }))
  ];
  const mainCount = state.questions.filter(q => !q.reserve).length;
  const final = r.stay.length === 0 || (!game.isReserve && game.mainIdx >= mainCount);
  const passed = { ...(game.passed || {}) };
  if (!game.isReserve) passed[game.ladderPos] = r.stay.length;
  return db.finishReveal(gid, game.qn, updates, {
    phase: "reveal", answer: cur.answer, note: cur.note || null, counts: r.counts, remaining: r.stay.length, eliminated: r.out.length,
    final, passed, winners: final ? rankWinners({ stay: r.stay, alive: before, out: r.out }).slice(0, 5) : null
  });
}

/** Calls revealNow once, GRACE_MS after the question's clock runs out. Returns a cancel function. */
export function autoReveal(db, gid, game, onError) {
  if (!["question", "settling"].includes(game?.phase) || !game.openedAt) return () => {};
  const due = game.phase === "settling" ? 3000 : game.openedAt + game.seconds * 1000 + GRACE_MS - Date.now();
  let cancelled = false, timer;
  const run = async () => {
    try { await revealNow(db, gid, game.qn); }
    catch (error) {
      (onError || console.error)(error);
      if (!cancelled) timer = setTimeout(run, 3000);
    }
  };
  timer = setTimeout(run, Math.max(0, due));
  return () => { cancelled = true; clearTimeout(timer); };
}
