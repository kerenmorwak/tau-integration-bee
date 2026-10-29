/* ============================================================
   הגדרות האתר — כאן מעדכנים את פרטי התחרות הקרובה
   ============================================================ */
window.SITE_CONFIG = {
  nextYear: 2027,
  // קישור לטופס ההרשמה (למשל Google Forms). כל עוד ריק — יוצג "ההרשמה תיפתח בקרוב".
  registrationUrl: "",
  // מועדים לתחרות הקרובה. כל עוד ריק — יוצג "יפורסם בהמשך".
  qualifiers: [
    // { date: "31.05.27", time: "15:00–17:00", place: "שרייבר 007" },
  ],
  finalDate: "",   // למשל "11.06.27 · 16:30"
  finalPlace: "",  // למשל "אולם לב"
  // כתובת ליצירת קשר. כל עוד ריק — לא תוצג.
  contactEmail: ""
};

/* ============================================================
   מאגר האינטגרלים — 2026
   ============================================================ */
window.BEE_2026 = {
  poster: {
    title: "האינטגרל מהפוסטר",
    tex: "\\int_0^{\\pi}\\cos^2\\!\\left(\\tfrac{\\pi}{2}\\cos^2\\!\\left(\\tfrac{\\pi}{2}\\cos^2 x\\right)\\right)dx",
    answer: "\\dfrac{\\pi}{2}",
    hint: "בדקו מה קורה ל־f(x)+f(π/2−x)."
  },

  qualifying: [
    { tex: "\\int \\frac{x^3-1}{x-1}\\,dx", answer: "\\frac{x^3}{3}+\\frac{x^2}{2}+x" },
    { tex: "\\int \\frac{2x\\log x + x}{x^2\\log x}\\,dx", answer: "\\log\\left(x^2\\log x\\right)" },
    { tex: "\\int_0^{2\\pi} \\sin^7 x\\,\\cos^{2026} x\\,dx", answer: "0" },
    { tex: "\\int_0^{10} \\left\\lfloor \\frac{x}{2} \\right\\rfloor dx", answer: "20" },
    { tex: "\\int_0^{1} x^4\\left(1-x^5\\right)^7 dx", answer: "\\frac{1}{40}" },
    { tex: "\\int \\frac{\\cos x-\\sin x}{\\sin x+\\cos x}\\,dx", answer: "\\log\\left|\\sin x+\\cos x\\right|" },
    { tex: "\\int \\frac{dx}{\\sqrt{x+1}-\\sqrt{x}}", answer: "\\frac{2}{3}\\left((x+1)^{3/2}+x^{3/2}\\right)" },
    { tex: "\\int \\frac{\\log(\\log x)+1}{x}\\,dx", answer: "\\log x\\cdot\\log(\\log x)" },
    { tex: "\\int_0^1 \\sqrt{\\frac{x}{1-x}}\\,dx", answer: "\\frac{\\pi}{2}" },
    { tex: "\\int_0^{\\pi} \\frac{dx}{1+\\sin x}", answer: "2" },
    { tex: "\\int_0^1 \\frac{\\log(1+x)}{x}\\,dx", answer: "\\frac{\\pi^2}{12}" },
    { tex: "\\int_{-2}^{2} x^3\\cos\\left(x^2\\right)dx", answer: "0" },
    { tex: "\\int_0^{\\pi/2} \\log(\\sin x)\\,dx", answer: "-\\frac{\\pi}{2}\\log 2" },
    { tex: "\\int \\frac{x^2+1}{x^4+1}\\,dx", answer: "\\frac{1}{\\sqrt2}\\arctan\\left(\\frac{x^2-1}{\\sqrt2\\,x}\\right)" },
    { tex: "\\int \\frac{\\cos x}{1+\\sin x}\\,dx", answer: "\\log(1+\\sin x)" },
    { tex: "\\int_0^1 \\frac{dx}{\\sqrt{x-x^2}}", answer: "\\pi" },
    { tex: "\\int \\frac{dx}{1+\\sqrt{x}}", answer: "2\\sqrt{x}-2\\log\\left(1+\\sqrt{x}\\right)" },
    { tex: "\\int_0^{\\infty} x e^{-x^2}\\,dx", answer: "\\frac{1}{2}" },
    { tex: "\\int \\frac{\\sin x+\\sin 2x}{\\cos x+\\cos 2x}\\,dx", answer: "-\\frac{2}{3}\\log\\left|\\cos\\frac{3x}{2}\\right|" },
    { tex: "\\int \\frac{\\log x}{x^2}\\,dx", answer: "-\\frac{1+\\log x}{x}" }
  ],

  finals: [
    {
      stage: "שלב הבתים · סבב 1",
      players: ["עומר ברייטל", "נדב דן תמרי", "אמיר שקד"],
      limit: "3 דקות לאינטגרל",
      items: [
        { tex: "\\int \\frac{\\arcsin x}{\\sqrt{1-x^2}}\\,dx", answer: "\\frac{\\arcsin^2 x}{2}" },
        { tex: "\\int_0^{2\\pi} \\max(\\sin x,\\cos x)\\,dx", answer: "2\\sqrt2" },
        { tex: "\\int \\frac{e^{2x}-1}{e^{2x}+1}\\,dx", answer: "\\log(\\cosh x)" }
      ]
    },
    {
      stage: "שלב הבתים · סבב 2",
      players: ["רות קוזלובסקי", "יואב נתן", "גלעד לוי"],
      limit: "3 דקות לאינטגרל",
      items: [
        { tex: "\\int \\frac{x^2}{x^6+1}\\,dx", answer: "\\frac{1}{3}\\arctan\\left(x^3\\right)" },
        { tex: "\\int_0^1 \\left\\lfloor \\frac{1}{x} \\right\\rfloor^{-1} dx", answer: "\\frac{\\pi^2}{6}-1" },
        { tex: "\\int_0^1 \\frac{\\log(1+x)}{(1+x)^2}\\,dx", answer: "\\frac{1-\\log 2}{2}" }
      ]
    },
    {
      stage: "שלב הבתים · סבב 3",
      players: ["עדן מזור", "נעם ארטשטיין", "רפאל נר"],
      limit: "3 דקות לאינטגרל",
      items: [
        { tex: "\\int \\frac{x^4+1}{x^2+1}\\,dx", answer: "\\frac{x^3}{3}-x+2\\arctan x" },
        { tex: "\\int_0^1 \\left\\lfloor -\\log x \\right\\rfloor dx", answer: "\\frac{1}{e-1}" },
        { tex: "\\int_0^{\\pi} \\left|\\sin x-\\cos x\\right| dx", answer: "2\\sqrt2" }
      ]
    },
    {
      stage: "שלב הגמר",
      players: ["עומר ברייטל", "רות קוזלובסקי", "עדן מזור"],
      limit: "3 דקות",
      items: [
        { tex: "\\int_0^{\\pi} \\frac{x\\sin x}{1+\\cos^2 x}\\,dx", answer: "\\frac{\\pi^2}{4}" }
      ]
    },
    {
      stage: "דו־קרב סופי",
      players: ["עומר ברייטל", "רות קוזלובסקי"],
      limit: "5 דקות לאינטגרל",
      items: [
        { tex: "\\int_0^1 \\frac{1-2x\\arctan x}{\\left(1+x^2\\right)^2}\\,dx", answer: "\\frac{\\pi}{8}" },
        { tex: "\\int_0^{\\infty} \\frac{\\{x\\}}{(x+1)(x+2)}\\,dx", answer: "1-\\log 2", note: "החלק השברי של x מסומן ב־{x}" },
        { tex: "\\int_0^{\\pi/2} \\left(\\sin^6 x+3\\sin^4 x\\cos^2 x\\right)dx", answer: "\\frac{\\pi}{4}" }
      ]
    }
  ],

  quiz: [
    { q: "מי נולד קודם?", a: "newton" },
    { q: "מי הכניס לשימוש את סימן האינטגרל ∫?", a: "leibniz" },
    { q: "מי חקר בתפקידו יותר ממאה חשודים בזיוף מטבעות, והפליל 28 מהם?", a: "newton" },
    { q: "מי חישב שקץ הימים לא יגיע לפני שנת 2060?", a: "newton" },
    { q: "מי ניסה לשכנע את הצרפתים לפלוש למצרים, כדי שלא יתפנו לארץ מולדתו?", a: "leibniz" },
    { q: "מי סיים דוקטורט ראשון?", a: "leibniz" }
  ]
};
