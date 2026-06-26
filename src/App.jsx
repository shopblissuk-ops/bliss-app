import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────
const supabase = createClient(
  "https://xlutgnwuxfnamzyuvvlo.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY // keep your anon key in env, not hardcoded
);

// ── Constants ─────────────────────────────────────────────
const ACCENT = "#C9908A";
const DARK = "#1a1a1a";
const BG = "#f7f6f5";

const INGREDIENTS = [
  { name: "Biotin", dose: "5000μg", what: "A B-vitamin that supports keratin production — the structural protein your hair and nails are built from.", why: "5000μg is a high, results-focused dose. Lower-cost gummies often use 50–100μg, which is too little to move the needle on hair strength." },
  { name: "Zinc", dose: "10mg", what: "Helps your body build and repair tissue, including the cells in hair follicles and skin.", why: "10mg covers most of your daily need. Zinc deficiency is one of the most common causes of hair shedding." },
  { name: "Vitamin C", dose: "80mg", what: "Essential for collagen synthesis, which keeps skin firm and supports the scalp.", why: "80mg meets 100% of your daily reference intake, and it helps your body absorb other nutrients too." },
  { name: "Vitamin A", dose: "800μg", what: "Supports skin cell turnover and helps glands produce sebum that keeps skin and scalp moisturised.", why: "800μg is the full daily reference — enough to support skin without tipping into excess." },
  { name: "Vitamin D", dose: "5μg", what: "Plays a role in creating new hair follicles and is linked to healthy skin barrier function.", why: "Most people in the UK are low on vitamin D, especially over winter, so topping up matters." },
  { name: "Vitamin E", dose: "12mg", what: "An antioxidant that protects skin cells from oxidative stress and supports a healthy scalp.", why: "12mg is the full daily reference intake, working alongside vitamin C for skin protection." },
];

const TIERS = [
  { pts: 50, label: "5% off", code: "GLOW5" },
  { pts: 150, label: "10% off", code: "GLOW10" },
  { pts: 300, label: "15% off", code: "GLOW15" },
  { pts: 500, label: "20% off", code: "GLOW20" },
];

const GLASS_ML = 250; // one glass = 250ml

// ── Helpers ───────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);
const ls = {
  get: (k, d) => {
    try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }
    catch { return d; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default function App() {
  // ── identity / persistence ──
  const [user, setUser] = useState(() => ls.get("bliss_user", null));
  const [installed, setInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches || ls.get("bliss_installed", false)
  );

  if (!installed) return <InstallGate onDone={() => { ls.set("bliss_installed", true); setInstalled(true); }} />;
  if (!user) return <Signup onDone={(u) => { ls.set("bliss_user", u); setUser(u); }} />;
  return <Home user={user} setUser={setUser} />;
}

// ══════════════════════════════════════════════════════════
//  INSTALL GATE
// ══════════════════════════════════════════════════════════
function InstallGate({ onDone }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const steps = isIOS
    ? ["Tap the Share button in Safari", "Scroll down and tap 'Add to Home Screen'", "Open bliss for you from your home screen"]
    : ["Tap the menu (⋮) in Chrome", "Tap 'Add to Home screen'", "Open bliss for you from your home screen"];
  return (
    <Shell>
      <div style={{ ...card, textAlign: "center", marginTop: 40 }}>
        <h1 style={{ ...serif, fontSize: 40, color: DARK, margin: "0 0 8px" }}>bliss for you</h1>
        <p style={{ color: "#888", marginBottom: 28 }}>Install the app to begin your 30-day glow journey.</p>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", textAlign: "left", marginBottom: 16 }}>
            <div style={stepDot}>{i + 1}</div>
            <span style={{ color: DARK }}>{s}</span>
          </div>
        ))}
        <button style={primaryBtn} onClick={onDone}>I've installed it</button>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════
//  SIGNUP
// ══════════════════════════════════════════════════════════
function Signup({ onDone }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [journey, setJourney] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState("");
  const [weight, setWeight] = useState("");

  const finish = async () => {
    const id = crypto.randomUUID();
    const record = {
      id, name, phone, goal,
      day_streak: 0, last_checkin: null, reward_unlocked: false,
      points: 0, weight_kg: weight ? parseFloat(weight) : null,
      results_submitted: false,
    };
    try { await supabase.from("users").insert(record); } catch (e) { console.error(e); }
    onDone({ ...record, journey });
  };

  return (
    <Shell>
      <div style={{ ...card, marginTop: 40 }}>
        <h1 style={{ ...serif, fontSize: 34, color: DARK, margin: "0 0 24px" }}>
          {step === 1 ? "Let's get you set up" : "Your glow goal"}
        </h1>
        {step === 1 ? (
          <>
            <Field label="Your name" value={name} onChange={setName} placeholder="Ella" />
            <Field label="Name your journey" value={journey} onChange={setJourney} placeholder="My glow era" />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="07…" />
            <Field label="Your weight (kg)" value={weight} onChange={setWeight} placeholder="60" type="number" />
            <button style={primaryBtn} disabled={!name || !phone} onClick={() => setStep(2)}>Continue</button>
          </>
        ) : (
          <>
            <p style={{ color: "#888", marginTop: -8, marginBottom: 18 }}>What are you here for?</p>
            {["Hair", "Skin", "Nails", "All three"].map((g) => (
              <button key={g} onClick={() => setGoal(g)}
                style={{ ...selectBtn, ...(goal === g ? selectBtnActive : {}) }}>{g}</button>
            ))}
            <button style={{ ...primaryBtn, marginTop: 20 }} disabled={!goal} onClick={finish}>Start my journey</button>
          </>
        )}
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════════
//  HOME — single scroll page
// ══════════════════════════════════════════════════════════
function Home({ user, setUser }) {
  const [streak, setStreak] = useState(user.day_streak || 0);
  const [last, setLast] = useState(user.last_checkin);
  const [points, setPoints] = useState(user.points || 0);

  // device-only today state
  const [water, setWater] = useState(() => {
    const w = ls.get("bliss_water", { date: todayStr(), glasses: 0 });
    return w.date === todayStr() ? w.glasses : 0;
  });

  const checkedToday = last === todayStr();

  // hydration goal from weight
  const weightKg = user.weight_kg || ls.get("bliss_weight", 60);
  const litresGoal = (weightKg * 0.033).toFixed(2);
  const glassesGoal = Math.max(4, Math.round((weightKg * 0.033 * 1000) / GLASS_ML));

  const patchUser = async (patch) => {
    const next = { ...user, ...patch };
    ls.set("bliss_user", next);
    setUser(next);
    try { await supabase.from("users").update(patch).eq("id", user.id); } catch (e) { console.error(e); }
  };

  const addPoints = (n) => { const np = points + n; setPoints(np); patchUser({ points: np }); return np; };

  const doCheckin = () => {
    if (checkedToday) return;
    const t = todayStr();
    const newStreak = streak + 1;
    setStreak(newStreak); setLast(t);
    let gained = 10;
    if (newStreak === 7) gained += 50;
    if (newStreak === 14) gained += 100;
    if (newStreak === 30) gained += 250;
    addPoints(gained);
    patchUser({ day_streak: newStreak, last_checkin: t });
  };

  const addGlass = () => {
    const g = Math.min(glassesGoal, water + 1);
    setWater(g);
    ls.set("bliss_water", { date: todayStr(), glasses: g });
    if (g === glassesGoal && water < glassesGoal) addPoints(5); // hit goal once/day
  };

  // ── Glow Score (0-100): streak progress 50, water 30, check-in 20 ──
  const streakPart = Math.min(1, streak / 30) * 50;
  const waterPart = Math.min(1, water / glassesGoal) * 30;
  const checkinPart = checkedToday ? 20 : 0;
  const glow = Math.round(streakPart + waterPart + checkinPart);

  const goalKey = (user.goal || "All three").toLowerCase();
  const tip = TIPS[goalKey] || TIPS["all three"];

  return (
    <Shell>
      <style>{globalCss}</style>

      <header style={{ padding: "28px 4px 8px" }}>
        <p style={{ color: "#999", margin: 0, fontSize: 14 }}>{user.journey || "Your glow journey"}</p>
        <h1 style={{ ...serif, fontSize: 30, color: DARK, margin: "2px 0 0" }}>Hi {user.name} ✨</h1>
      </header>

      {/* GLOW SCORE — hero */}
      <GlowScore glow={glow} />

      {/* STREAK */}
      <div style={card} className="fadeUp">
        <p style={cardLabel}>Day streak</p>
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <span style={{ ...serif, fontSize: 88, color: DARK, textShadow: `0 0 24px ${ACCENT}66`, lineHeight: 1 }}>{streak}</span>
        </div>
        <DotRow streak={streak} />
        <button style={{ ...primaryBtn, marginTop: 18, opacity: checkedToday ? 0.5 : 1 }}
          disabled={checkedToday} onClick={doCheckin}>
          {checkedToday ? "Checked in today ✓" : "Check in for today"}
        </button>
      </div>

      {/* POINTS */}
      <PointsCard points={points} />

      {/* WATER */}
      <WaterCard water={water} goal={glassesGoal} litres={litresGoal} onAdd={addGlass} />

      {/* STATS */}
      <StatsGrid streak={streak} water={water} goal={glassesGoal} />

      {/* TIP */}
      <div style={card} className="fadeUp">
        <p style={cardLabel}>Today's tip</p>
        <p style={{ color: DARK, lineHeight: 1.6, margin: "6px 0 0" }}>{tip}</p>
      </div>

      {/* INGREDIENT DEEP DIVE */}
      <Ingredients />

      {/* WEEKLY PHOTO PROMPT + TIMELINE */}
      <PhotoTimeline streak={streak} onPhoto={() => {}} />

      {/* GROUP CHALLENGES */}
      <GroupChallenge user={user} patchUser={patchUser} streak={streak} />

      {/* LEADERBOARD */}
      <Leaderboard meId={user.id} />

      {/* RESULTS WALL */}
      <ResultsWall user={user} streak={streak} patchUser={patchUser} onSubmitPoints={() => addPoints(25)} />

      {/* SHOP */}
      <ShopCard />

      {streak >= 27 && (
        <div style={{ ...card, background: "#fff4f2", borderColor: ACCENT }}>
          <p style={{ ...serif, fontSize: 20, color: DARK, margin: 0 }}>Running low?</p>
          <p style={{ color: "#666", margin: "6px 0 14px" }}>You're near the end of this jar. Reorder so your streak never breaks.</p>
          <a href="https://blissforyou.uk/products/hair-skin-nails-gummies-30-day-glow-complex" style={{ ...primaryBtn, display: "block", textAlign: "center", textDecoration: "none" }}>Reorder now</a>
        </div>
      )}

      <p style={{ textAlign: "center", color: "#bbb", fontSize: 12, margin: "30px 0" }}>bliss for you</p>
    </Shell>
  );
}

// ── GLOW SCORE ring ───────────────────────────────────────
function GlowScore({ glow }) {
  const R = 70, C = 2 * Math.PI * R;
  const off = C - (glow / 100) * C;
  return (
    <div style={{ ...card, textAlign: "center", paddingTop: 28 }} className="fadeUp">
      <p style={cardLabel}>Your Glow Score</p>
      <div style={{ position: "relative", width: 180, height: 180, margin: "10px auto 4px" }}>
        <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="90" cy="90" r={R} fill="none" stroke="#eee" strokeWidth="14" />
          <circle cx="90" cy="90" r={R} fill="none" stroke={ACCENT} strokeWidth="14"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off}
            style={{ transition: "stroke-dashoffset .7s ease", filter: `drop-shadow(0 0 6px ${ACCENT}88)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div>
            <div style={{ ...serif, fontSize: 56, color: DARK, lineHeight: 1, textShadow: `0 0 20px ${ACCENT}55` }}>{glow}</div>
            <div style={{ color: "#999", fontSize: 12, letterSpacing: 1 }}>OUT OF 100</div>
          </div>
        </div>
      </div>
      <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
        {glow >= 90 ? "Glowing." : glow >= 60 ? "Strong day — keep going." : glow >= 30 ? "Good start. Check in & hydrate." : "Let's build today's score."}
      </p>
    </div>
  );
}

// ── POINTS ────────────────────────────────────────────────
function PointsCard({ points }) {
  const next = TIERS.find((t) => points < t.pts);
  const reached = TIERS.filter((t) => points >= t.pts);
  const prevPts = next ? (TIERS[TIERS.indexOf(next) - 1]?.pts || 0) : 500;
  const pct = next ? Math.min(100, ((points - prevPts) / (next.pts - prevPts)) * 100) : 100;
  return (
    <div style={card} className="fadeUp">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={cardLabel}>Glow points</p>
        <span style={{ ...serif, fontSize: 28, color: ACCENT }}>{points}</span>
      </div>
      <div style={{ height: 10, background: "#eee", borderRadius: 99, overflow: "hidden", margin: "10px 0 8px" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: ACCENT, borderRadius: 99, transition: "width .5s" }} />
      </div>
      <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
        {next ? `${next.pts - points} pts to ${next.label}` : "Top tier unlocked 🎉"}
      </p>
      {reached.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {reached.map((t) => (
            <div key={t.pts} style={codeChip}>{t.label} · <b>{t.code}</b></div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WATER ─────────────────────────────────────────────────
function WaterCard({ water, goal, litres, onAdd }) {
  const fill = Math.min(100, (water / goal) * 100);
  return (
    <div style={{ ...card, background: "#f0f6fb", borderColor: "#cfe3f0", position: "relative", overflow: "hidden" }} className="fadeUp">
      <div style={{ position: "relative", zIndex: 2 }}>
        <p style={{ ...cardLabel, color: "#5a7d99" }}>Hydration · goal {litres}L</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ ...serif, fontSize: 40, color: "#2b5876" }}>{water}<span style={{ fontSize: 20, color: "#7b9bb0" }}>/{goal}</span></span>
          <button style={{ ...primaryBtn, width: "auto", padding: "10px 22px", background: "#3b7ea1" }} onClick={onAdd}>+ Glass</button>
        </div>
      </div>
      <svg viewBox="0 0 500 80" preserveAspectRatio="none"
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: 80, opacity: 0.45, transition: "transform .5s", transform: `translateY(${80 - (fill * 0.8)}px)` }}>
        <path d="M0,40 C125,10 375,70 500,40 L500,80 L0,80 Z" fill="#7fc1e3">
          <animate attributeName="d" dur="4s" repeatCount="indefinite"
            values="M0,40 C125,10 375,70 500,40 L500,80 L0,80 Z;M0,40 C125,70 375,10 500,40 L500,80 L0,80 Z;M0,40 C125,10 375,70 500,40 L500,80 L0,80 Z" />
        </path>
      </svg>
    </div>
  );
}

// ── STATS ─────────────────────────────────────────────────
function StatsGrid({ streak, water, goal }) {
  const cells = [
    ["Days done", streak],
    ["Days left", Math.max(0, 30 - streak)],
    ["Complete", `${Math.round((streak / 30) * 100)}%`],
    ["Gummies", streak * 2],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="fadeUp">
      {cells.map(([l, v]) => (
        <div key={l} style={{ ...card, margin: 0, textAlign: "center", padding: 18 }}>
          <div style={{ ...serif, fontSize: 30, color: DARK }}>{v}</div>
          <div style={{ color: "#999", fontSize: 12 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ── INGREDIENTS ───────────────────────────────────────────
function Ingredients() {
  const [open, setOpen] = useState(null);
  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>What's inside</p>
      <p style={{ color: "#999", fontSize: 13, margin: "4px 0 14px" }}>Tap any ingredient to see why the dose matters.</p>
      {INGREDIENTS.map((ing, i) => (
        <div key={ing.name} onClick={() => setOpen(open === i ? null : i)}
          style={{ border: "1px solid #efe7e6", borderRadius: 16, padding: "14px 16px", marginBottom: 10, cursor: "pointer", background: open === i ? "#fdf7f6" : "#fff", transition: "background .2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: DARK, fontWeight: 600 }}>{ing.name}</span>
            <span style={{ color: ACCENT, fontSize: 14 }}>{ing.dose} {open === i ? "▴" : "▾"}</span>
          </div>
          {open === i && (
            <div style={{ marginTop: 10 }}>
              <p style={{ color: "#555", fontSize: 14, lineHeight: 1.55, margin: "0 0 8px" }}>{ing.what}</p>
              <p style={{ color: "#888", fontSize: 13, lineHeight: 1.55, margin: 0 }}><b style={{ color: ACCENT }}>Why the dose:</b> {ing.why}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── PHOTO TIMELINE ────────────────────────────────────────
function PhotoTimeline({ streak }) {
  const [photos, setPhotos] = useState(() => ls.get("bliss_photos", [])); // [{week, data}]
  const fileRef = useRef();
  const currentWeek = Math.floor(streak / 7) + 1;
  const promptDue = streak > 0 && streak % 7 === 0 && !photos.some((p) => p.week === currentWeek);

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const next = [...photos.filter((p) => p.week !== currentWeek), { week: currentWeek, data: r.result }];
      setPhotos(next); ls.set("bliss_photos", next);
    };
    r.readAsDataURL(f);
  };

  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>Progress photos</p>
      {promptDue && (
        <div style={{ background: "#fdf2f0", border: `1px solid ${ACCENT}55`, borderRadius: 16, padding: 14, margin: "8px 0 14px" }}>
          <p style={{ ...serif, fontSize: 18, color: DARK, margin: 0 }}>Week {currentWeek} check-in 📸</p>
          <p style={{ color: "#777", fontSize: 13, margin: "4px 0 10px" }}>Capture today so you can see your glow build over time.</p>
          <button style={{ ...primaryBtn, padding: "10px 18px", width: "auto" }} onClick={() => fileRef.current?.click()}>Add this week's photo</button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={onFile} />
      {photos.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13 }}>Your weekly photos will appear here as a swipeable timeline.</p>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollSnapType: "x mandatory" }}>
          {photos.sort((a, b) => a.week - b.week).map((p) => (
            <div key={p.week} style={{ flex: "0 0 auto", scrollSnapAlign: "start", textAlign: "center" }}>
              <img src={p.data} alt={`Week ${p.week}`} style={{ width: 130, height: 170, objectFit: "cover", borderRadius: 16, border: `1px solid ${ACCENT}33` }} />
              <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>Week {p.week}</div>
            </div>
          ))}
          {!promptDue && (
            <button onClick={() => fileRef.current?.click()} style={{ flex: "0 0 auto", width: 130, height: 170, borderRadius: 16, border: `1.5px dashed ${ACCENT}66`, background: "#fff", color: ACCENT, fontSize: 30 }}>+</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── GROUP CHALLENGE ───────────────────────────────────────
function GroupChallenge({ user, patchUser, streak }) {
  const [code, setCode] = useState(user.group_code || "");
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState("");
  const [newName, setNewName] = useState("");
  const [mode, setMode] = useState(code ? "in" : "choose");

  const loadGroup = async (gc) => {
    try {
      const { data: g } = await supabase.from("groups").select("name").eq("code", gc).maybeSingle();
      setGroupName(g?.name || "Your group");
      const { data: m } = await supabase.from("users").select("name,day_streak").eq("group_code", gc);
      setMembers((m || []).sort((a, b) => b.day_streak - a.day_streak));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (code) { loadGroup(code); setMode("in"); } }, [code]);

  const create = async () => {
    const gc = Math.random().toString().slice(2, 8);
    try {
      await supabase.from("groups").insert({ code: gc, name: newName || "Glow squad" });
      await patchUser({ group_code: gc });
      setCode(gc);
    } catch (e) { console.error(e); }
  };

  const join = async () => {
    const gc = input.trim();
    if (gc.length !== 6) return;
    const { data: existing } = await supabase.from("users").select("id").eq("group_code", gc);
    if ((existing?.length || 0) >= 5) { alert("This group is full (max 5)."); return; }
    await patchUser({ group_code: gc });
    setCode(gc);
  };

  const leave = async () => { await patchUser({ group_code: null }); setCode(""); setMode("choose"); setMembers([]); };

  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>Group challenge</p>
      {mode === "in" ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 12px" }}>
            <span style={{ ...serif, fontSize: 22, color: DARK }}>{groupName}</span>
            <span style={codeChip}>Code <b>{code}</b></span>
          </div>
          {members.map((m, i) => (
            <div key={i} style={leaderRow}>
              <span style={{ color: DARK }}>{i + 1}. {m.name}{m.name === user.name ? " (you)" : ""}</span>
              <span style={{ color: ACCENT, fontWeight: 600 }}>{m.day_streak}🔥</span>
            </div>
          ))}
          <button onClick={leave} style={{ ...ghostBtn, marginTop: 12 }}>Leave group</button>
        </>
      ) : mode === "create" ? (
        <>
          <Field label="Group name" value={newName} onChange={setNewName} placeholder="Glow squad" />
          <button style={primaryBtn} onClick={create}>Create group</button>
          <button style={ghostBtn} onClick={() => setMode("choose")}>Back</button>
        </>
      ) : mode === "join" ? (
        <>
          <Field label="6-digit code" value={input} onChange={setInput} placeholder="123456" />
          <button style={primaryBtn} disabled={input.trim().length !== 6} onClick={join}>Join group</button>
          <button style={ghostBtn} onClick={() => setMode("choose")}>Back</button>
        </>
      ) : (
        <>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 14px" }}>Glow together. Up to 5 friends, shared streak leaderboard.</p>
          <button style={primaryBtn} onClick={() => setMode("create")}>Create a group</button>
          <button style={{ ...ghostBtn, marginTop: 8 }} onClick={() => setMode("join")}>Join with a code</button>
        </>
      )}
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────
function Leaderboard({ meId }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("users").select("id,name,day_streak").order("day_streak", { ascending: false }).limit(10);
        setRows(data || []);
      } catch (e) { console.error(e); }
    })();
  }, []);
  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>Community leaderboard</p>
      {rows.length === 0 ? <p style={{ color: "#aaa", fontSize: 13 }}>Loading…</p> :
        rows.map((r, i) => (
          <div key={r.id} style={leaderRow}>
            <span style={{ color: r.id === meId ? ACCENT : DARK, fontWeight: r.id === meId ? 700 : 400 }}>
              {i + 1}. {r.name || "Someone"}{r.id === meId ? " (you)" : ""}
            </span>
            <span style={{ color: ACCENT, fontWeight: 600 }}>{r.day_streak}🔥</span>
          </div>
        ))}
    </div>
  );
}

// ── RESULTS WALL ──────────────────────────────────────────
function ResultsWall({ user, streak, patchUser, onSubmitPoints }) {
  const [feed, setFeed] = useState([]);
  const [text, setText] = useState("");
  const canSubmit = streak >= 30 && !user.results_submitted;

  const load = async () => {
    try {
      const { data } = await supabase.from("results_wall").select("results_text,goal,created_at").order("created_at", { ascending: false }).limit(50);
      setFeed(data || []);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await supabase.from("results_wall").insert({ results_text: text.trim(), goal: user.goal });
      await patchUser({ results_submitted: true, results_text: text.trim() });
      onSubmitPoints();
      setText(""); load();
    } catch (e) { console.error(e); }
  };

  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>Results wall</p>
      {canSubmit && (
        <div style={{ background: "#fdf7f6", border: `1px solid ${ACCENT}44`, borderRadius: 16, padding: 14, margin: "8px 0 14px" }}>
          <p style={{ ...serif, fontSize: 18, color: DARK, margin: "0 0 8px" }}>You finished 30 days 🎉</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={140}
            placeholder="Share your result… e.g. my nails are so much stronger"
            style={{ width: "100%", border: "1px solid #e7dcdb", borderRadius: 12, padding: 12, fontFamily: "inherit", resize: "none", boxSizing: "border-box" }} rows={2} />
          <button style={{ ...primaryBtn, marginTop: 10 }} onClick={submit}>Share anonymously (+25 pts)</button>
        </div>
      )}
      {feed.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: 13 }}>Real results from the bliss community land here at day 30.</p>
      ) : (
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          {feed.map((r, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${ACCENT}`, padding: "6px 0 6px 12px", margin: "0 0 12px" }}>
              <p style={{ color: DARK, margin: 0, lineHeight: 1.5 }}>"{r.results_text}"</p>
              <span style={{ color: "#bbb", fontSize: 12 }}>Anonymous · {r.goal}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SHOP ──────────────────────────────────────────────────
function ShopCard() {
  const url = "https://blissforyou.uk/products/hair-skin-nails-gummies-30-day-glow-complex";
  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>Reorder</p>
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <a href={url} style={{ ...subCard }}>
          <div style={{ ...serif, fontSize: 24, color: DARK }}>£14.24<span style={{ fontSize: 14, color: "#999" }}>/mo</span></div>
          <div style={{ color: ACCENT, fontSize: 13 }}>Subscribe · save 25%</div>
        </a>
        <a href={url} style={{ ...subCard, background: "#fff", borderColor: "#eee" }}>
          <div style={{ ...serif, fontSize: 24, color: DARK }}>£18.99</div>
          <div style={{ color: "#999", fontSize: 13 }}>One-time</div>
        </a>
      </div>
    </div>
  );
}

// ── DOT ROW ───────────────────────────────────────────────
function DotRow({ streak }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 99, background: i < streak ? ACCENT : "#eee", boxShadow: i < streak ? `0 0 6px ${ACCENT}88` : "none" }} />
      ))}
    </div>
  );
}

// ── small bits ────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "#888", fontSize: 13, display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", border: "1px solid #e7dcdb", borderRadius: 12, padding: 14, fontSize: 16, fontFamily: "inherit", boxSizing: "border-box" }} />
    </div>
  );
}

function Shell({ children }) {
  return <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px", minHeight: "100vh", overflowX: "hidden" }}>{children}</div>;
}

// ── TIPS ──────────────────────────────────────────────────
const TIPS = {
  hair: "Take your gummies with a meal containing healthy fat — biotin and the fat-soluble vitamins absorb better that way.",
  skin: "Vitamin C works best alongside hydration. Hit your water goal today to help collagen do its job.",
  nails: "Consistency beats intensity. The keratin-building nutrients only show on nails after a few weeks of daily use.",
  "all three": "Daily consistency is everything — set a fixed time each day for your gummies so the streak never slips.",
};

// ── styles ────────────────────────────────────────────────
const serif = { fontFamily: "'Cormorant', Georgia, serif", fontWeight: 600 };
const card = { background: "#fff", borderRadius: 26, padding: 22, margin: "14px 0", boxShadow: "0 6px 24px rgba(0,0,0,.05)", border: `1px solid ${ACCENT}22` };
const subCard = { flex: 1, textDecoration: "none", background: "#fdf7f6", border: `1px solid ${ACCENT}44`, borderRadius: 18, padding: 16, textAlign: "center" };
const cardLabel = { color: "#999", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", margin: 0, fontWeight: 600 };
const primaryBtn = { width: "100%", background: ACCENT, color: "#fff", border: "none", borderRadius: 14, padding: "15px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const ghostBtn = { width: "100%", background: "transparent", color: "#999", border: "none", padding: "10px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
const selectBtn = { width: "100%", background: "#fff", border: "1px solid #e7dcdb", borderRadius: 14, padding: 15, fontSize: 16, marginBottom: 10, cursor: "pointer", fontFamily: "inherit", color: DARK };
const selectBtnActive = { background: "#fdf2f0", borderColor: ACCENT, color: ACCENT, fontWeight: 600 };
const stepDot = { minWidth: 30, height: 30, borderRadius: 99, background: ACCENT, color: "#fff", display: "grid", placeItems: "center", fontWeight: 600 };
const leaderRow = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3eeed" };
const codeChip = { background: "#fdf2f0", color: ACCENT, fontSize: 13, padding: "5px 12px", borderRadius: 99, border: `1px solid ${ACCENT}33` };

const globalCss = `
  * { -webkit-tap-highlight-color: transparent; }
  body { margin:0; background:${BG}; font-family:'DM Sans',system-ui,sans-serif; color:${DARK}; }
  .fadeUp { animation: fadeUp .5s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
  @media (prefers-reduced-motion: reduce){ .fadeUp{animation:none} }
  textarea:focus, input:focus { outline:2px solid ${ACCENT}55; }
`;
