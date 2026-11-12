// Picks the database: the real Firestore, or the in-browser rehearsal store when the URL has ?mock
export const MOCK = new URLSearchParams(location.search).has("mock");
const db = MOCK ? await import("./db-mock.js?v=20261112-reading2") : await import("./db-firebase.js?v=20261112-reading2");
export default db;

/** Keep ?mock when building links between the live pages. */
export const link = (page, extra = "") => page + (MOCK ? "?mock" + (extra ? "&" + extra : "") : (extra ? "?" + extra : ""));
