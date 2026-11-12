// Game rules, kept free of any database code so they can be tested on their own.

/**
 * Settle one question.
 * alive: players still in the game when the question opened [{id, name, lastMs?}]
 * answers: answer docs for this question [{uid, choice, at}]
 * Returns who is out, who stays, per-option counts, and each survivor's response time.
 */
export function settle({ alive, answers, correct, openedAt, nOpts }) {
  const aliveIds = new Set(alive.map(p => p.id));
  const byUid = new Map();
  answers.forEach(a => { if (aliveIds.has(a.uid) && !byUid.has(a.uid)) byUid.set(a.uid, a); });
  const counts = Array.from({ length: nOpts }, () => 0);
  byUid.forEach(a => { if (a.choice >= 0 && a.choice < nOpts) counts[a.choice]++; });
  const stay = [], out = [];
  alive.forEach(p => {
    const a = byUid.get(p.id);
    if (a && a.choice === correct) stay.push({ ...p, ms: Math.max(0, a.at - openedAt) });
    else out.push(a ? { ...p, ansMs: Math.max(0, a.at - openedAt) } : p);
  });
  return { stay, out, counts, answered: byUid.size };
}

/**
 * Winners, best first.
 * If someone survived: the survivors, fastest on this question first.
 * If no one survived: everyone who was still in when the question opened (they got furthest),
 * fastest on the previous question first; players with no time yet go last, in join order.
 */
export function rankWinners({ stay, alive, out = [] }) {
  if (stay.length) return stay.slice().sort((a, b) => a.ms - b.ms).map(p => ({ id: p.id, name: p.name, ms: p.ms }));
  // no one survived: if even the first question knocked everyone out, the fastest answer to it decides
  const ans = new Map(out.map(p => [p.id, p.ansMs]));
  const t = p => p.lastMs ?? ans.get(p.id) ?? Infinity;
  return alive.slice().sort((a, b) => t(a) - t(b) || (a.joinedAt ?? 0) - (b.joinedAt ?? 0))
    .map(p => ({ id: p.id, name: p.name, ms: Number.isFinite(t(p)) ? t(p) : null }));
}

export const LETTERS = ["א", "ב", "ג", "ד"];
export const fmtSec = ms => ms == null ? "" : (ms / 1000).toFixed(1) + " שנ׳";

/** Default question set: examples only, replace them in the control panel. */
export const SAMPLE_QUESTIONS = [
  { pct: 90, seconds: 10, q: "גלילאו מת באותה שנה שבה נולד...", opts: ["ניוטון", "לייבניץ", "פסקל", "הוק"], answer: 0 },
  { pct: 70, seconds: 10, q: "איזה מתמטיקאי הצטרף למשלחת של נפוליאון למצרים?", opts: ["פורייה", "לפלס", "קושי", "גאוס"], answer: 0 },
  { pct: 50, seconds: 10, q: "איזה אסטרונום איבד את אפו בדו־קרב?", opts: ["טיכו ברהה", "קפלר", "גלילאו", "קופרניקוס"], answer: 0 },
  { pct: 30, seconds: 10, q: "מה הוכח קודם: ש־e אי־רציונלי או ש־π אי־רציונלי?", opts: ["e קודם", "π קודם", "באותה שנה"], answer: 0 },
  { pct: 10, seconds: 10, q: "איזה מדען ניהל הגנה משפטית על אמו, שהואשמה בכישוף?", opts: ["קפלר", "גלילאו", "טיכו ברהה", "ניוטון"], answer: 0 },
  { pct: 5, seconds: 10, q: "מי מהבאים חי הכי מוקדם?", opts: ["פיבונאצ׳י", "עומר כיאם", "אל־ח׳וואריזמי", "ברהמגופטה"], answer: 3 },
  { pct: 1, seconds: 10, q: "כמה ילדים היו ללאונרד אוילר?", opts: ["0", "3", "7", "13"], answer: 3 },
  { reserve: true, pct: 0, seconds: 10, q: "מי השתמש לראשונה בסימן \"=\"?", opts: ["רוברט רקורד", "רנה דקארט", "לאונרד אוילר", "פרנסואה וייט"], answer: 0 },
  { reserve: true, pct: 0, seconds: 10, q: "מי השתמש לראשונה באות π ליחס בין היקף המעגל לקוטרו?", opts: ["ויליאם ג׳ונס", "לאונרד אוילר", "ארכימדס", "ניוטון"], answer: 0 }
];
