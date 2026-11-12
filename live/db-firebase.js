// Firestore adapter. Every page talks to the database only through the functions below.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, collection, getDoc, getDocs, setDoc, updateDoc, onSnapshot,
  query, where, writeBatch, serverTimestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js?v=20261112-sound4";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const SERVER_TIME = "__server_time__";
const ms = v => (v && typeof v.toMillis === "function") ? v.toMillis() : (typeof v === "number" ? v : null);
const fix = data => {
  const out = { ...data };
  for (const k of ["openedAt", "joinedAt", "at", "createdAt"]) if (k in out) out[k] = ms(out[k]) ?? Date.now();
  return out;
};
const withServerTime = patch => {
  const out = {};
  for (const [k, v] of Object.entries(patch)) out[k] = v === SERVER_TIME ? serverTimestamp() : v;
  return out;
};

// ---------- auth ----------
let readyResolve; const authReady = new Promise(r => (readyResolve = r));
onAuthStateChanged(auth, u => readyResolve(u));

/** Player identity: anonymous sign-in (kept per browser, so a refresh is the same player). */
export async function init() {
  await authReady;
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser.uid;
}
export function onAdmin(cb) {
  return onAuthStateChanged(auth, async u => {
    if (!u || u.isAnonymous) return cb(null);
    try {
      await getDoc(doc(db, "admin", "questions"));
      if (auth.currentUser?.uid === u.uid) cb({ email: u.email, uid: u.uid });
    } catch (e) { cb(null, e); }
  });
}
export async function adminSignIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) await signInWithRedirect(auth, provider);
    else throw e;
  }
}
export const adminSignOut = () => signOut(auth);

// ---------- reads ----------
export function watchConfig(cb) {
  return onSnapshot(doc(db, "config", "current"), s => cb(s.exists() ? s.data() : null), e => cb(null, e));
}
export function watchGame(gid, cb) {
  return onSnapshot(doc(db, "games", gid), s => cb(s.exists() ? fix(s.data()) : null), e => cb(null, e));
}
export function watchPlayers(gid, cb) {
  return onSnapshot(collection(db, "games", gid, "players"),
    s => cb(s.docs.map(d => ({ id: d.id, ...fix(d.data()) }))), e => cb([], e));
}
export function watchPlayer(gid, uid, cb) {
  return onSnapshot(doc(db, "games", gid, "players", uid), s => cb(s.exists() ? { id: uid, ...fix(s.data()) } : null), e => cb(null, e));
}
export function watchAnswerCount(gid, qn, cb) {
  return onSnapshot(query(collection(db, "games", gid, "answers"), where("q", "==", qn)), s => cb(s.size), () => cb(0));
}
export async function getAnswers(gid, qn) {
  const s = await getDocs(query(collection(db, "games", gid, "answers"), where("q", "==", qn)));
  return s.docs.map(d => fix(d.data()));
}

// ---------- player writes ----------
export async function join(gid, name) {
  const uid = auth.currentUser.uid;
  await setDoc(doc(db, "games", gid, "players", uid), { name, joinedAt: serverTimestamp(), alive: true });
}
export async function answer(gid, qn, choice) {
  const uid = auth.currentUser.uid;
  await setDoc(doc(db, "games", gid, "answers", `${qn}_${uid}`), { uid, q: qn, choice, at: serverTimestamp() });
}
export async function getMyAnswer(gid, qn) {
  const s = await getDoc(doc(db, "games", gid, "answers", `${qn}_${auth.currentUser.uid}`));
  return s.exists() ? fix(s.data()) : null;
}

// ---------- admin writes ----------
export async function newGame(base) {
  const gid = "g" + Date.now().toString(36);
  await setDoc(doc(db, "games", gid), withServerTime({ ...base, createdAt: SERVER_TIME }));
  await setDoc(doc(db, "config", "current"), { gameId: gid });
  return gid;
}
export const patchGame = (gid, patch) => updateDoc(doc(db, "games", gid), withServerTime(patch));
export async function updatePlayers(gid, list) {
  for (let i = 0; i < list.length; i += 400) {
    const b = writeBatch(db);
    list.slice(i, i + 400).forEach(({ id, patch }) => b.update(doc(db, "games", gid, "players", id), patch));
    await b.commit();
  }
}
export async function loadQuestions() {
  const s = await getDoc(doc(db, "admin", "questions"));
  return s.exists() ? s.data().list : null;
}
export const saveQuestions = list => setDoc(doc(db, "admin", "questions"), { list });
// the running game's private state (its question list with answers), readable by organizers only
export async function loadState() { const s = await getDoc(doc(db, "admin", "state")); return s.exists() ? s.data() : null; }
export const saveState = st => setDoc(doc(db, "admin", "state"), st);

export async function getPlayers(gid) {
  const s = await getDocs(collection(db, "games", gid, "players"));
  return s.docs.map(d => ({ id: d.id, ...fix(d.data()) }));
}
/** Close submissions before reading results; a second screen can resume interrupted settlement. */
export async function claimReveal(gid, qn) {
  const ref = doc(db, "games", gid);
  return runTransaction(db, async tx => {
    const s = await tx.get(ref);
    if (!s.exists() || !["question", "settling"].includes(s.data().phase) || s.data().qn !== qn) return null;
    if (s.data().phase === "question") tx.update(ref, { phase: "settling", acceptingAnswers: false });
    return fix(s.data());
  });
}

// Commit the eliminations and public result together, exactly once for this question.
export async function finishReveal(gid, qn, players, result) {
  const ref = doc(db, "games", gid);
  return runTransaction(db, async tx => {
    const s = await tx.get(ref);
    if (!s.exists() || s.data().phase !== "settling" || s.data().qn !== qn) return false;
    players.forEach(({ id, patch }) => tx.update(doc(db, "games", gid, "players", id), patch));
    tx.update(ref, { ...result, acceptingAnswers: false });
    return true;
  });
}
