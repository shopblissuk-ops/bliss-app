import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
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

// ══════════════════════════════════════════════════════════
//  TOP LEVEL — real routes. /rewards is public, everything else
//  goes through the normal install/signup flow.
// ══════════════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/rewards" element={<AmbassadorPage standalone />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainApp() {
  const [user, setUser] = useState(() => ls.get("bliss_user", null));
  const [installed, setInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches || ls.get("bliss_installed", false)
  );
  const [page, setPage] = useState("home");

  if (!installed) return <InstallGate onDone={() => { ls.set("bliss_installed", true); setInstalled(true); }} />;
  if (!user) return <Signup onDone={(u) => { ls.set("bliss_user", u); setUser(u); }} />;
  if (page === "dog") return <DogBooking onBack={() => setPage("home")} />;
  return <Home user={user} setUser={setUser} onDog={() => setPage("dog")} />;
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
function Home({ user, setUser, onDog }) {
  const [streak, setStreak] = useState(user.day_streak || 0);
  const [last, setLast] = useState(user.last_checkin);

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

  const doCheckin = () => {
    if (checkedToday) return;
    const t = todayStr();
    const newStreak = streak + 1;
    setStreak(newStreak); setLast(t);
    patchUser({ day_streak: newStreak, last_checkin: t });
  };

  const addGlass = () => {
    const g = Math.min(glassesGoal, water + 1);
    setWater(g);
    ls.set("bliss_water", { date: todayStr(), glasses: g });
  };

  const removeGlass = () => {
    const g = Math.max(0, water - 1);
    setWater(g);
    ls.set("bliss_water", { date: todayStr(), glasses: g });
  };

  // ── Glow Score (0-100): streak progress 50, water 30, check-in 20 ──
  const streakPart = Math.min(1, streak / 30) * 50;
  const waterPart = Math.min(1, water / glassesGoal) * 30;
  const checkinPart = checkedToday ? 20 : 0;
  const glow = Math.round(streakPart + waterPart + checkinPart);

  return (
    <Shell>
      <style>{globalCss}</style>

      <header style={{ padding: "28px 4px 8px" }}>
        <p style={{ color: "#999", margin: 0, fontSize: 14 }}>{user.journey || "Your glow journey"}</p>
        <h1 style={{ ...serif, fontSize: 30, color: DARK, margin: "2px 0 0" }}>Hi {user.name} ✨</h1>
      </header>

      {/* GLOW SCORE — hero */}
      <GlowScore glow={glow} onDog={onDog} />

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

      {/* PROGRESS PHOTOS — add anytime */}
      <PhotoTimeline streak={streak} />

      {/* WATER */}
      <WaterCard water={water} goal={glassesGoal} litres={litresGoal} onAdd={addGlass} onRemove={removeGlass} />

      {/* GROUP CHALLENGES */}
      <GroupChallenge user={user} patchUser={patchUser} streak={streak} />

      {/* LEADERBOARD */}
      <Leaderboard meId={user.id} />

      {/* RESULTS WALL */}
      <ResultsWall user={user} streak={streak} patchUser={patchUser} />

      {/* SHOP */}
      <ShopCard />

      {/* AMBASSADOR PROGRAM */}
      <AmbassadorCard />

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
function GlowScore({ glow, onDog }) {
  const R = 70, C = 2 * Math.PI * R;
  const off = C - (glow / 100) * C;
  return (
    <div style={{ ...card, textAlign: "center", paddingTop: 28, position: "relative" }} className="fadeUp">
      <button onClick={onDog} aria-label="Dog sitting" style={{ position: "absolute", top: 14, right: 14, background: "#fdf2f0", border: `1px solid ${ACCENT}33`, borderRadius: 99, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>🐾</button>
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

// ── WATER ─────────────────────────────────────────────────
function WaterCard({ water, goal, litres, onAdd, onRemove }) {
  const fill = Math.min(100, (water / goal) * 100);
  return (
    <div style={{ ...card, background: "#f0f6fb", borderColor: "#cfe3f0", position: "relative", overflow: "hidden" }} className="fadeUp">
      <div style={{ position: "relative", zIndex: 2 }}>
        <p style={{ ...cardLabel, color: "#5a7d99" }}>Hydration · goal {litres}L</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ ...serif, fontSize: 40, color: "#2b5876" }}>{water}<span style={{ fontSize: 20, color: "#7b9bb0" }}>/{goal}</span></span>
          <div style={{ display: "flex", gap: 8 }}>
            <button aria-label="Remove a glass" style={{ ...primaryBtn, width: "auto", padding: "10px 16px", background: "#dceaf3", color: "#3b7ea1", opacity: water === 0 ? 0.4 : 1 }} disabled={water === 0} onClick={onRemove}>−</button>
            <button style={{ ...primaryBtn, width: "auto", padding: "10px 22px", background: "#3b7ea1" }} onClick={onAdd}>+ Glass</button>
          </div>
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

// ── HIGHLIGHTS / PROGRESS PHOTOS ──────────────────────────
function PhotoTimeline({ streak }) {
  const [photos, setPhotos] = useState(() => ls.get("bliss_photos", [])); // [{id, day, date, data}]
  const fileRef = useRef();

  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const entry = { id: crypto.randomUUID(), day: streak, date: todayStr(), data: r.result };
      const next = [...photos, entry];
      setPhotos(next); ls.set("bliss_photos", next);
    };
    r.readAsDataURL(f);
    e.target.value = ""; // allow re-selecting same file
  };

  const remove = (id) => {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next); ls.set("bliss_photos", next);
  };

  return (
    <div style={card} className="fadeUp">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={cardLabel}>Highlights</p>
        <button style={{ ...primaryBtn, width: "auto", padding: "8px 16px", fontSize: 14 }} onClick={() => fileRef.current?.click()}>+ Add</button>
      </div>
      <p style={{ color: "#999", fontSize: 13, margin: "8px 0 14px" }}>Capture your glow anytime — build a swipeable timeline of your journey.</p>
      <input ref={fileRef} type="file" accept="image/*" capture="user" hidden onChange={onFile} />
      {photos.length === 0 ? (
        <button onClick={() => fileRef.current?.click()} style={{ width: "100%", height: 150, borderRadius: 16, border: `1.5px dashed ${ACCENT}66`, background: "#fff", color: ACCENT, fontSize: 14 }}>
          Add your first highlight 📸
        </button>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollSnapType: "x mandatory" }}>
          {photos.map((p) => (
            <div key={p.id} style={{ flex: "0 0 auto", scrollSnapAlign: "start", textAlign: "center", position: "relative" }}>
              <img src={p.data} alt={`Day ${p.day}`} style={{ width: 130, height: 170, objectFit: "cover", borderRadius: 16, border: `1px solid ${ACCENT}33` }} />
              <button onClick={() => remove(p.id)} aria-label="Delete photo"
                style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 99, border: "none", background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 14, lineHeight: 1, cursor: "pointer" }}>×</button>
              <div style={{ color: "#999", fontSize: 12, marginTop: 6 }}>Day {p.day}</div>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} style={{ flex: "0 0 auto", width: 130, height: 170, borderRadius: 16, border: `1.5px dashed ${ACCENT}66`, background: "#fff", color: ACCENT, fontSize: 30 }}>+</button>
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
    const { data: existing } = await supabase.from("users").select("id,points").eq("group_code", gc);
    if ((existing?.length || 0) === 0) { alert("No group found with that code."); return; }
    if ((existing?.length || 0) >= 5) { alert("This group is full (max 5)."); return; }
    // reward each existing member +50 for the friend joining
    try {
      await Promise.all(
        (existing || []).map((m) =>
          supabase.from("users").update({ points: (m.points || 0) + 50 }).eq("id", m.id)
        )
      );
    } catch (e) { console.error(e); }
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
function ResultsWall({ user, streak, patchUser }) {
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
          <button style={{ ...primaryBtn, marginTop: 10 }} onClick={submit}>Share anonymously</button>
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

// ── AMBASSADOR TEASER CARD (on Home) ──────────────────────
function AmbassadorCard() {
  return (
    <div style={card} className="fadeUp">
      <p style={cardLabel}>Become an ambassador</p>
      <p style={{ color: "#888", fontSize: 14, margin: "8px 0 14px", lineHeight: 1.5 }}>
        Share your link, earn cash and prizes as your referrals grow.
      </p>
      <Link to="/rewards" style={{ ...primaryBtn, display: "block", textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>See rewards</Link>
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

// ══════════════════════════════════════════════════════════
//  AMBASSADOR / REWARDS PAGE — public, works at /rewards
//  without needing the app installed or an account.
// ══════════════════════════════════════════════════════════
function AmbassadorPage({ standalone }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("choice"); // choice | form | submitted
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const NEEDS_SAMPLE_URL = "https://affiliate.tiktok.com/api/v1/oec/affiliate/seller/invitation_group/share/long_url/AIza2BnjZ9d1";

  const TIERS = [
    { sales: "10 sales", label: "first milestone", reward: "£25 Bonus", icon: "💰", grad: "linear-gradient(135deg, #f3d9b1, #d9a86c)" },
    { sales: "100 sales", label: "rising star", reward: "£350 Bonus", icon: "💸", grad: "linear-gradient(135deg, #dbe4ec, #aebccb)" },
    { sales: "200 sales", label: "top performer", reward: "New Laptop", icon: "💻", grad: "linear-gradient(135deg, #ffe9a8, #f0b93f)" },
    { sales: "1,000 sales", label: "elite ambassador", reward: "iPhone + £1,500", icon: "📱", grad: "linear-gradient(135deg, #e3c6ff, #8ec8ff)" },
  ];

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const clean = username.trim().replace(/^@/, "");
    if (!clean) { setError("Enter your TikTok username"); return; }
    try {
      await supabase.from("ambassador_applicants").insert({ tiktok_username: clean });
      setMode("submitted");
    } catch (err) {
      console.error(err);
      setError("Something went wrong, try again");
    }
  };

  return (
    <Shell>
      <style>{globalCss}</style>
      <style>{ambassadorCss}</style>
      <div style={{ padding: "24px 4px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        {!standalone && (
          <button onClick={() => navigate(-1)} style={{ background: "#f5f0f0", border: "none", borderRadius: 99, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        )}
        <div>
          <p style={{ color: "#999", margin: 0, fontSize: 13 }}>bliss for you</p>
          <h1 style={{ ...serif, fontSize: 24, color: DARK, margin: 0 }}>become an ambassador</h1>
        </div>
      </div>

      <div style={card}>
        <p style={{ color: "#888", fontSize: 14, margin: "0 0 22px", lineHeight: 1.6 }}>
          Share your link, earn cash and prizes as your referrals grow. No follower minimum, no application fee.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {TIERS.map((t, i) => (
            <div key={t.sales} className="tierCard fadeUp" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="tierIcon" style={{ background: t.grad }}>
                <span className="tierIconEmoji">{t.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: DARK, margin: "0 0 2px" }}>{t.sales}</p>
                <p style={{ fontSize: 12, color: "#999", margin: 0 }}>{t.label}</p>
              </div>
              <div className="tierBadge" style={{ background: t.grad }}>
                <span className="tierShimmer" />
                <span style={{ position: "relative", zIndex: 1 }}>{t.reward}</span>
              </div>
            </div>
          ))}
        </div>

        {mode === "choice" && (
          <>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 12px", textAlign: "center" }}>
              Have you already been approved for a free TikTok sample?
            </p>
            <button style={primaryBtn} onClick={() => setMode("form")}>Yes, I have a sample approved</button>
            <button
              style={{ ...primaryBtn, marginTop: 10, background: "#fff", color: ACCENT, border: `1.5px solid ${ACCENT}55` }}
              onClick={() => window.open(NEEDS_SAMPLE_URL, "_blank")}
            >
              I need to apply for a sample first
            </button>
          </>
        )}

        {mode === "form" && (
          <form onSubmit={submit}>
            <Field label="Your TikTok username" value={username} onChange={setUsername} placeholder="@yourusername" />
            <button type="submit" style={primaryBtn}>Confirm & join</button>
            <button type="button" style={{ ...ghostBtn, marginTop: 4 }} onClick={() => setMode("choice")}>← back</button>
          </form>
        )}

        {mode === "submitted" && (
          <p style={{ color: ACCENT, fontWeight: 600, fontSize: 14, textAlign: "center" }}>
            You're in — we'll track your sales against @{username.replace(/^@/, "")}.
          </p>
        )}

        {error && <p style={{ color: "#d85a30", fontSize: 13, marginTop: 8 }}>{error}</p>}

        <p style={{ fontSize: 11, color: "#ccc", marginTop: 20, lineHeight: 1.6 }}>
          Rewards are calculated on verified, non-refunded sales made through your unique referral link only. Self-purchases and fraudulent activity void eligibility. Full terms sent on approval.
        </p>
      </div>
    </Shell>
  );
}

const ambassadorCss = `
  .tierCard {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #fff;
    border: 1px solid #f0e8e7;
    border-radius: 18px;
    padding: 12px 14px;
    position: relative;
  }
  .tierIcon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0,0,0,.14);
  }
  .tierIconEmoji {
    font-size: 20px;
    display: inline-block;
    animation: iconFloat 2.6s ease-in-out infinite;
  }
  @keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  .tierBadge {
    position: relative;
    overflow: hidden;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    color: #2C2C2C;
    white-space: nowrap;
  }
  .tierShimmer {
    position: absolute;
    top: 0; left: -60%;
    width: 50%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,.7), transparent);
    animation: shimmerSweep 2.8s ease-in-out infinite;
  }
  @keyframes shimmerSweep {
    0% { left: -60%; }
    60% { left: 130%; }
    100% { left: 130%; }
  }
`;

// ══════════════════════════════════════════════════════════
//  DOG BOOKING
// ══════════════════════════════════════════════════════════
function DogBooking({ onBack }) {
  const [step, setStep] = useState(1);
  const [dogs, setDogs] = useState(1);
  const [days, setDays] = useState(3);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", dogName: "", breed: "", date: "", notes: "" });
  const [extras, setExtras] = useState([]);
  const RATE = 30;
  const total = dogs * days * RATE;

  const toggleExtra = (e) => setExtras(ex => ex.includes(e) ? ex.filter(x => x !== e) : [...ex, e]);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const dogCard = { background: "#fff", borderRadius: 22, padding: 20, margin: "12px 0", boxShadow: "0 4px 20px rgba(0,0,0,.05)", border: "1px solid #ede8e8" };
  const dogLabel = { color: "#999", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, margin: "0 0 12px" };
  const dogInput = { width: "100%", border: "1px solid #ede8e8", borderRadius: 10, padding: "11px 13px", fontSize: 15, fontFamily: "inherit", color: DARK, background: "#fff", outline: "none", boxSizing: "border-box" };

  return (
    <Shell>
      <style>{globalCss}</style>
      <div style={{ padding: "24px 4px 8px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "#f5f0f0", border: "none", borderRadius: 99, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <div>
          <p style={{ color: "#999", margin: 0, fontSize: 13 }}>paw by bliss</p>
          <h1 style={{ ...serif, fontSize: 24, color: DARK, margin: 0 }}>dog sitting 🐾</h1>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          {[1,2,3].map(n => <div key={n} style={{ width: 7, height: 7, borderRadius: 99, background: step >= n ? ACCENT : "#eee", transition: "background .3s" }} />)}
        </div>
      </div>

      {step === 1 && (
        <>
          <div style={dogCard}>
            <p style={dogLabel}>number of dogs</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setDogs(d => Math.max(1, d - 1))} disabled={dogs <= 1}
                style={{ width: 42, height: 42, borderRadius: 99, border: "1px solid #ede8e8", background: "#fff", fontSize: 20, cursor: "pointer", opacity: dogs <= 1 ? .3 : 1 }}>−</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...serif, fontSize: 56, color: DARK, lineHeight: 1 }}>{dogs}</div>
                <div style={{ color: "#999", fontSize: 13, marginTop: 4 }}>{dogs === 1 ? "dog" : "dogs"}</div>
              </div>
              <button onClick={() => setDogs(d => Math.min(10, d + 1))} disabled={dogs >= 10}
                style={{ width: 42, height: 42, borderRadius: 99, border: "1px solid #ede8e8", background: "#fff", fontSize: 20, cursor: "pointer", opacity: dogs >= 10 ? .3 : 1 }}>+</button>
            </div>
          </div>

          <div style={dogCard}>
            <p style={dogLabel}>length of stay</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div>
                <span style={{ ...serif, fontSize: 40, color: DARK, lineHeight: 1 }}>{days}</span>
                <span style={{ color: "#999", fontSize: 14, marginLeft: 4 }}>{days === 1 ? "day" : "days"}</span>
              </div>
              <span style={{ background: "#fdf2f0", border: `1px solid ${ACCENT}33`, borderRadius: 99, padding: "5px 14px", fontSize: 13, fontWeight: 600, color: ACCENT }}>£{RATE}/day</span>
            </div>
            <input type="range" min="1" max="30" step="1" value={days} onChange={e => setDays(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: ACCENT, height: 4, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#bbb", marginTop: 6 }}>
              <span>1 day</span><span>30 days</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fdf2f0", border: `1px solid ${ACCENT}33`, borderRadius: 18, padding: "16px 20px", margin: "12px 0 20px" }}>
            <span style={{ color: "#999", fontSize: 14 }}>total</span>
            <span style={{ ...serif, fontSize: 30, color: DARK }}>£{total.toLocaleString()}</span>
          </div>

          <button style={primaryBtn} onClick={() => setStep(2)}>continue</button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={dogCard}>
            <p style={dogLabel}>about you</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input style={dogInput} placeholder="First name" value={form.firstName} onChange={e => setF("firstName", e.target.value)} />
              <input style={dogInput} placeholder="Last name" value={form.lastName} onChange={e => setF("lastName", e.target.value)} />
            </div>
            <input style={{ ...dogInput, marginBottom: 10 }} placeholder="Email" type="email" value={form.email} onChange={e => setF("email", e.target.value)} />
            <input style={dogInput} placeholder="Phone" type="tel" value={form.phone} onChange={e => setF("phone", e.target.value)} />
          </div>

          <div style={dogCard}>
            <p style={dogLabel}>about your dog</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input style={dogInput} placeholder="Dog's name" value={form.dogName} onChange={e => setF("dogName", e.target.value)} />
              <input style={dogInput} placeholder="Breed" value={form.breed} onChange={e => setF("breed", e.target.value)} />
            </div>
            <input style={{ ...dogInput, marginBottom: 10 }} placeholder="Drop-off date e.g. 10 July" value={form.date} onChange={e => setF("date", e.target.value)} />
            <textarea style={{ ...dogInput, resize: "none" }} rows={3} placeholder="Anything we should know? Allergies, favourite toys…" value={form.notes} onChange={e => setF("notes", e.target.value)} />
          </div>

          <div style={dogCard}>
            <p style={dogLabel}>extras</p>
            {["Daily photo updates", "Two walks per day", "Grooming on collection day"].map(e => (
              <div key={e} onClick={() => toggleExtra(e)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${extras.includes(e) ? ACCENT : "#ede8e8"}`, borderRadius: 12, marginBottom: 10, cursor: "pointer", background: extras.includes(e) ? "#fdf2f0" : "#fff", transition: "all .2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${extras.includes(e) ? ACCENT : "#ddd"}`, background: extras.includes(e) ? ACCENT : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {extras.includes(e) && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: DARK }}>{e}</span>
              </div>
            ))}
          </div>

          <button style={primaryBtn} onClick={() => setStep(3)}>confirm booking</button>
          <button style={ghostBtn} onClick={() => setStep(1)}>← back</button>
        </>
      )}

      {step === 3 && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: "#fdf2f0", border: `1px solid ${ACCENT}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>🐾</div>
          <h2 style={{ ...serif, fontSize: 30, color: DARK, margin: "0 0 8px" }}>you're booked</h2>
          <p style={{ color: "#999", fontSize: 14, margin: "0 0 28px", lineHeight: 1.6 }}>We'll be in touch within a couple of hours to confirm everything.</p>
          <div style={dogCard}>
            <p style={dogLabel}>summary</p>
            {[["dogs", `${dogs} ${dogs === 1 ? "dog" : "dogs"}`], ["stay", `${days} ${days === 1 ? "day" : "days"}`], ["total", `£${total.toLocaleString()}`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3eeed", fontSize: 14 }}>
                <span style={{ color: "#999" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <button style={{ ...primaryBtn, marginTop: 20 }} onClick={onBack}>back to bliss</button>
        </div>
      )}
    </Shell>
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