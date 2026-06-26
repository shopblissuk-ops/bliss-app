import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PINK = "#C9908A";
const DARK = "#1a1a1a";
const LIGHT = "#fff5f3";
const GREY = "#f7f7f7";

const GOALS = [
  { id: "hair", label: "Hair Growth", icon: "✨", desc: "thicker, stronger, longer hair" },
  { id: "skin", label: "Skin Glow", icon: "🌟", desc: "clearer, brighter, smoother skin" },
  { id: "nails", label: "Strong Nails", icon: "💅", desc: "harder, longer, healthier nails" },
  { id: "all", label: "All Three", icon: "🌸", desc: "full transformation" },
];

const TIPS = {
  hair: ["biotin 5000μg is the dose used in clinical hair growth studies.", "zinc deficiency is one of the most common causes of hair loss in women.", "results usually show at weeks 5-6. stick with it.", "a 2 minute scalp massage daily amplifies your results.","hair growth happens in cycles — consistent intake supports the growth phase."],
  skin: ["vitamin c is essential for collagen synthesis — your skin uses it every day.", "vitamin a promotes cell turnover, keeping skin fresh and clear.", "vitamin e protects skin cells from oxidative stress.", "collagen production declines with age — these vitamins help maintain it.", "hydration amplifies every skin ingredient. aim for 2L daily."],
  nails: ["biotin directly supports keratin production — what nails are made of.", "zinc regulates proteins that build nail structure.", "nails usually show results first, around weeks 3-4.", "white spots on nails can indicate zinc deficiency — you're addressing this.", "nail growth is about 3mm per month. by day 30 you'll see a clear new line."],
  all: ["biotin, zinc, and vitamins a, c, d and e all work synergistically.", "consistency is everything. same time every day.", "results compound — don't judge before week 4.", "you're getting 6 key nutrients in 2 gummies.", "your body prioritises internal organs first — visible results follow."],
};

const WATER_GOAL = 8;

const card = { background: "#fff", borderRadius: 20, padding: "1.25rem 1.5rem", marginBottom: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "none" };
const pill = (active) => ({ background: active ? PINK : GREY, color: active ? "#fff" : "#999", border: "none", borderRadius: 999, padding: "8px 18px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: active ? 500 : 400 });

const s = {
  app: { minHeight: "100vh", background: "#f5f5f5", fontFamily: "'DM Sans', sans-serif", color: DARK, maxWidth: 480, margin: "0 auto", paddingBottom: "6rem" },
  header: { padding: "1.5rem 1.5rem 1rem", background: "#fff", textAlign: "center", boxShadow: "0 1px 0 #f0e8e7" },
  logo: { fontFamily: "'Cormorant', Georgia, serif", fontSize: 26, fontWeight: 400, color: DARK, margin: 0 },
  tagline: { fontSize: 11, color: "#bbb", margin: "4px 0 0", letterSpacing: "0.06em", textTransform: "uppercase" },
  section: { padding: "1.25rem 1rem" },
  heading: { fontFamily: "'Cormorant', Georgia, serif", fontSize: 34, fontWeight: 400, color: DARK, margin: "0 0 0.75rem", lineHeight: 1.15 },
  sub: { fontSize: 14, color: "#999", margin: "0 0 1.5rem", lineHeight: 1.7 },
  input: { width: "100%", padding: "15px 18px", border: "none", borderRadius: 14, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: DARK, outline: "none", boxSizing: "border-box", marginBottom: 12, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  btn: { width: "100%", padding: "17px", background: PINK, color: "#fff", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  btnOutline: { width: "100%", padding: "16px", background: "#fff", color: PINK, border: `1.5px solid ${PINK}`, borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", marginTop: 10 },
  divider: { border: "none", borderTop: "0.5px solid #efefef", margin: "1.5rem 0" },
  label: { fontSize: 11, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.75rem", display: "block" },
  card,
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 20 },
  day: (done, isToday, isWarning) => ({ aspectRatio: "1", borderRadius: 10, background: done ? PINK : isWarning ? "#fff0ee" : isToday ? LIGHT : "#fff", border: isToday ? `2px solid ${PINK}` : isWarning ? `1.5px solid ${PINK}` : "1.5px solid #f0e8e7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: done ? "#fff" : isWarning ? PINK : "#ccc", fontWeight: done ? 600 : 400, boxShadow: done ? "0 2px 8px rgba(201,144,138,0.3)" : "none" }),
  streak: { fontSize: 72, fontWeight: 300, color: PINK, textAlign: "center", lineHeight: 1, margin: "0.5rem 0", fontFamily: "'Cormorant', Georgia, serif" },
  error: { fontSize: 13, color: "#d07070", marginBottom: 12 },
  tabBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #f0eded", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" },
  tab: (a) => ({ flex: 1, padding: "10px 4px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: a ? PINK : "#bbb", letterSpacing: "0.05em", textTransform: "uppercase" }),
  goalCard: (sel) => ({ border: sel ? `2px solid ${PINK}` : "2px solid transparent", borderRadius: 18, padding: "1.1rem", cursor: "pointer", background: sel ? LIGHT : "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "all 0.15s" }),
  waterBtn: (f) => ({ width: 38, height: 38, borderRadius: "50%", background: f ? PINK : "#fff", border: f ? "none" : "1.5px solid #f0e8e7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: f ? "0 2px 8px rgba(201,144,138,0.3)" : "0 1px 4px rgba(0,0,0,0.06)" }),
};

function InstallPage({ onInstalled }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const iosSteps = [
    { n: "1", text: "tap the share icon at the bottom of Safari" },
    { n: "2", text: "tap \"Add to Home Screen\"" },
    { n: "3", text: "tap \"Add\"" },
  ];
  const androidSteps = [
    { n: "1", text: "tap the three dots in your browser" },
    { n: "2", text: "tap \"Add to Home screen\"" },
    { n: "3", text: "tap \"Add\" to confirm" },
  ];
  const steps = isIOS ? iosSteps : androidSteps;

  return (
    <div style={{ ...s.app, background: "#fff", paddingBottom: 0 }}>
      <div style={{ background: `linear-gradient(160deg, #e8c4c0 0%, ${PINK} 100%)`, padding: "3.5rem 1.5rem 2.5rem", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(255,255,255,0.25)", margin: "0 auto 1.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🐻</div>
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 30, color: "#fff", margin: "0 0 6px", fontWeight: 400 }}>bliss for you</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>30 day glow tracker · free</p>
      </div>

      <div style={{ padding: "2rem 1.25rem" }}>
        <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 28, fontWeight: 400, color: DARK, margin: "0 0 0.5rem" }}>add to your home screen</h2>
        <p style={{ fontSize: 14, color: "#999", margin: "0 0 1.75rem", lineHeight: 1.6 }}>takes 10 seconds. no app store. completely free.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: GREY, borderRadius: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: PINK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, flexShrink: 0 }}>{step.n}</div>
              <p style={{ fontSize: 14, color: DARK, margin: 0, lineHeight: 1.5 }}>{step.text}</p>
            </div>
          ))}
        </div>

        <button style={s.btn} onClick={onInstalled}>I've added it — let's go →</button>

        <div style={{ marginTop: 28, padding: "1.25rem", background: LIGHT, borderRadius: 18 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: DARK, margin: "0 0 10px" }}>what's inside</p>
          <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.8 }}>
            30 day streak tracker · daily tips for your goal · water intake tracker · before & after photos · community leaderboard · reorder reminders
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("install");
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState("tracker");
  const [name, setName] = useState("");
  const [journeyName, setJourneyName] = useState("");
  const [phone, setPhone] = useState("");
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [msg, setMsg] = useState("");
  const [water, setWater] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [beforeAfter, setBeforeAfter] = useState({ before: null, after: null });
  const [tipIndex, setTipIndex] = useState(0);
  const [shareVisible, setShareVisible] = useState(false);
  const beforeRef = useRef();
  const afterRef = useRef();

  useEffect(() => {
    const installed = localStorage.getItem("bliss_installed");
    const saved = localStorage.getItem("bliss_user");
    if (saved) { setUser(JSON.parse(saved)); setScreen("app"); }
    else if (installed) { setScreen("welcome"); }
    const savedWater = localStorage.getItem("bliss_water_" + new Date().toISOString().split("T")[0]);
    if (savedWater) setWater(parseInt(savedWater));
    const savedBA = localStorage.getItem("bliss_beforeafter");
    if (savedBA) setBeforeAfter(JSON.parse(savedBA));
    setTipIndex(Math.floor(Math.random() * 5));
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    const { data } = await supabase.from("users").select("name, day_streak, goal").order("day_streak", { ascending: false }).limit(10);
    if (data) setLeaderboard(data);
  }

  const today = new Date().toISOString().split("T")[0];

  function handleInstalled() {
    localStorage.setItem("bliss_installed", "true");
    setScreen("welcome");
  }

  function addWater() { const v = Math.min(WATER_GOAL, water + 1); setWater(v); localStorage.setItem("bliss_water_" + today, v.toString()); }
  function removeWater() { const v = Math.max(0, water - 1); setWater(v); localStorage.setItem("bliss_water_" + today, v.toString()); }

  async function handleSignup() {
    setError("");
    if (!name.trim()) return setError("Please enter your name");
    if (!journeyName.trim()) return setError("Please name your journey");
    if (!phone.trim() || phone.length < 10) return setError("Please enter a valid phone number");
    if (!goal) return setError("Please select your goal");
    setLoading(true);
    const { data, error: err } = await supabase.from("users").insert([{ name: name.trim(), phone: phone.trim(), goal }]).select().single();
    if (err) { setError("Something went wrong — " + err.message); setLoading(false); return; }
    if (Notification.permission === "default") Notification.requestPermission();
    const userData = { ...data, checkins: [], journeyName: journeyName.trim() };
    localStorage.setItem("bliss_user", JSON.stringify(userData));
    setUser(userData); setScreen("app"); setLoading(false);
  }

  async function handleCheckin() {
    if (!user || user.last_checkin === today) { setMsg("Already checked in today."); return; }
    setLoading(true);
    const newStreak = (user.day_streak || 0) + 1;
    const { data, error: err } = await supabase.from("users").update({ day_streak: newStreak, last_checkin: today }).eq("id", user.id).select().single();
    if (err) { setMsg("Something went wrong."); setLoading(false); return; }
    const updated = { ...data, checkins: [...(user.checkins || []), today], journeyName: user.journeyName };
    localStorage.setItem("bliss_user", JSON.stringify(updated));
    setUser(updated); setCheckedIn(true); setMsg(""); fetchLeaderboard(); setLoading(false);
  }

  function handleImageUpload(type, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...beforeAfter, [type]: ev.target.result };
      setBeforeAfter(updated);
      localStorage.setItem("bliss_beforeafter", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  }

  async function handleShare() {
    const text = `I'm on day ${streak} of my bliss for you glow journey 🌸\n\ntrack yours free at app.blissforyou.uk`;
    if (navigator.share) { await navigator.share({ title: "my bliss for you journey", text }); }
    else { navigator.clipboard.writeText(text); setShareVisible(true); setTimeout(() => setShareVisible(false), 2000); }
  }

  const streak = user?.day_streak || 0;
  const alreadyCheckedIn = user?.last_checkin === today;
  const isRunningLow = streak >= 27;
  const goalTips = TIPS[user?.goal || "all"];
  const firstName = user?.name?.split(" ")[0];
  const goalObj = GOALS.find(g => g.id === user?.goal);

  if (screen === "install") return <InstallPage onInstalled={handleInstalled} />;

  if (screen === "welcome") return (
    <div style={{ ...s.app, background: "#fff" }}>
      <div style={s.header}>
        <p style={s.logo}>bliss for you</p>
        <p style={s.tagline}>30 day glow tracker</p>
      </div>
      <div style={{ padding: "2rem 1.25rem" }}>
        {step === 1 && (
          <>
            <h1 style={s.heading}>let's start your <span style={{ color: PINK }}>glow</span></h1>
            <p style={s.sub}>tell us a bit about yourself and we'll personalise your journey.</p>
            <input style={s.input} placeholder="your first name" value={name} onChange={e => setName(e.target.value)} />
            <input style={s.input} placeholder="name your journey — e.g. sarah's glow up" value={journeyName} onChange={e => setJourneyName(e.target.value)} />
            <input style={s.input} placeholder="your phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            {error && <p style={s.error}>{error}</p>}
            <button style={s.btn} onClick={() => {
              if (!name.trim()) return setError("Please enter your name");
              if (!journeyName.trim()) return setError("Please name your journey");
              if (!phone.trim() || phone.length < 10) return setError("Please enter a valid phone number");
              setError(""); setStep(2);
            }}>continue</button>
          </>
        )}
        {step === 2 && (
          <>
            <h1 style={s.heading}>what's your <span style={{ color: PINK }}>main goal?</span></h1>
            <p style={s.sub}>we'll tailor your daily tips to what matters most.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {GOALS.map(g => (
                <div key={g.id} style={s.goalCard(goal === g.id)} onClick={() => setGoal(g.id)}>
                  <p style={{ fontSize: 26, margin: "0 0 8px" }}>{g.icon}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>{g.label}</p>
                  <p style={{ fontSize: 12, color: "#999", margin: 0 }}>{g.desc}</p>
                </div>
              ))}
            </div>
            {error && <p style={s.error}>{error}</p>}
            <button style={s.btn} onClick={handleSignup} disabled={loading || !goal}>{loading ? "one moment..." : "start my journey"}</button>
            <button style={s.btnOutline} onClick={() => setStep(1)}>back</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={s.app}>
      <div style={s.header}>
        <p style={s.logo}>bliss for you</p>
        <p style={s.tagline}>{user?.journeyName || `hey ${firstName}`}</p>
      </div>

      {tab === "tracker" && (
        <div style={s.section}>

          {isRunningLow && (
            <div style={{ background: `linear-gradient(135deg, ${PINK}, #e8b5b0)`, borderRadius: 20, padding: "1.25rem 1.5rem", marginBottom: 12, color: "#fff" }}>
              <p style={{ fontSize: 13, margin: "0 0 4px", opacity: 0.85 }}>you're on day {streak}</p>
              <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>time to reorder — don't break your streak.</p>
            </div>
          )}

          <div style={{ ...card, textAlign: "center", padding: "2rem 1.5rem" }}>
            {goalObj && <p style={{ fontSize: 13, color: "#bbb", margin: "0 0 4px" }}>{goalObj.icon} {goalObj.label}</p>}
            <p style={s.streak}>{streak}</p>
            <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>{streak === 1 ? "day in a row" : "days in a row"}</p>
          </div>

          {alreadyCheckedIn || checkedIn ? (
            <div style={{ ...card, textAlign: "center", background: "#f5faf5" }}>
              <p style={{ fontSize: 15, color: "#5a9e5a", margin: "0 0 4px", fontWeight: 500 }}>checked in today ✓</p>
              <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>come back tomorrow</p>
            </div>
          ) : (
            <div style={card}>
              <button style={s.btn} onClick={handleCheckin} disabled={loading}>{loading ? "one moment..." : "I took my gummies today"}</button>
              {msg && <p style={{ ...s.error, marginTop: 10, marginBottom: 0 }}>{msg}</p>}
            </div>
          )}

          <button onClick={handleShare} style={{ ...s.btnOutline, marginTop: 0, marginBottom: 12 }}>{shareVisible ? "copied to clipboard!" : "share my streak"}</button>

          <div style={card}>
            <span style={s.label}>your 30 days</span>
            <div style={s.grid}>
              {Array.from({ length: 30 }, (_, i) => {
                const dayNum = i + 1;
                const done = dayNum <= streak;
                const isToday = dayNum === streak + 1 && !alreadyCheckedIn;
                const isWarning = dayNum >= 27 && !done;
                return <div key={i} style={s.day(done, isToday, isWarning)}>{done ? "✓" : isWarning ? "!" : dayNum}</div>;
              })}
            </div>
          </div>

          <div style={card}>
            <span style={s.label}>water today — {water}/{WATER_GOAL}</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Array.from({ length: WATER_GOAL }, (_, i) => (
                <button key={i} style={s.waterBtn(i < water)} onClick={i < water ? removeWater : addWater}>💧</button>
              ))}
            </div>
            {water >= WATER_GOAL && <p style={{ fontSize: 12, color: PINK, margin: "10px 0 0" }}>hydration goal reached today</p>}
          </div>

          <div style={card}>
            <span style={s.label}>today's tip</span>
            <p style={{ fontSize: 14, color: "#777", margin: 0, lineHeight: 1.7 }}>{goalTips[tipIndex]}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ label: "days done", value: streak }, { label: "days left", value: Math.max(0, 30 - streak) }, { label: "complete", value: Math.round((streak / 30) * 100) + "%" }, { label: "gummies taken", value: streak * 2 }].map((stat, i) => (
              <div key={i} style={{ ...card, textAlign: "center", marginBottom: 0 }}>
                <p style={{ fontSize: 26, fontFamily: "'Cormorant', Georgia, serif", color: PINK, margin: "0 0 4px", fontWeight: 400 }}>{stat.value}</p>
                <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "progress" && (
        <div style={s.section}>
          <div style={card}>
            <span style={s.label}>before & after</span>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 12px" }}>stored only on your device — private to you.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["before", "after"].map(type => (
                <div key={type} style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", background: GREY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                  onClick={() => type === "before" ? beforeRef.current.click() : afterRef.current.click()}>
                  {beforeAfter[type] ? <img src={beforeAfter[type]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={type} /> : (<><p style={{ fontSize: 28, margin: "0 0 6px" }}>📷</p><p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>add {type}</p></>)}
                  <input ref={type === "before" ? beforeRef : afterRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(type, e)} />
                  <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: DARK, fontWeight: 500 }}>{type}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <span style={s.label}>what to expect</span>
            {[
              { week: "weeks 1–2", desc: "nutrients building up internally. no visible changes yet.", active: streak >= 1 },
              { week: "weeks 3–4", desc: "nails often show first. reduced hair shedding is common.", active: streak >= 14 },
              { week: "weeks 5–6", desc: "skin looks clearer. hair feels thicker at the roots.", active: streak >= 28 },
              { week: "week 8+", desc: "visible growth, stronger nails, consistent glow.", active: streak >= 30 },
            ].map((w, i) => (
              <div key={i} style={{ display: "flex", gap: "0.875rem", padding: "0.875rem 0", borderBottom: i < 3 ? "0.5px solid #f5f5f5" : "none", opacity: w.active ? 1 : 0.35 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: w.active ? PINK : "#ddd", flexShrink: 0, marginTop: 6 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>{w.week}{w.active ? " · unlocked" : ""}</p>
                  <p style={{ fontSize: 13, color: "#999", margin: 0, lineHeight: 1.5 }}>{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "leaderboard" && (
        <div style={s.section}>
          <div style={card}>
            <span style={s.label}>community streaks</span>
            {leaderboard.length === 0 && <p style={{ fontSize: 14, color: "#bbb", margin: 0 }}>loading...</p>}
            {leaderboard.map((entry, i) => {
              const isMe = entry.name === user?.name && entry.day_streak === streak;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              const eg = GOALS.find(g => g.id === entry.goal);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 0.875rem", borderRadius: 14, background: isMe ? LIGHT : "transparent", marginBottom: 6 }}>
                  <span style={{ fontSize: 18, width: 28, flexShrink: 0 }}>{medal}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: isMe ? 600 : 400, color: DARK, margin: "0 0 2px" }}>{entry.name.split(" ")[0]}{isMe ? " · you" : ""}</p>
                    {eg && <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{eg.icon} {eg.label}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 22, fontFamily: "'Cormorant', Georgia, serif", color: PINK, margin: 0, fontWeight: 400 }}>{entry.day_streak}</p>
                    <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>days</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ ...card, overflow: "hidden", padding: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${PINK}, #e8c4c0)`, padding: "2rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 18, color: "#fff", margin: "0 0 4px" }}>bliss for you</p>
              <p style={{ fontSize: 52, fontFamily: "'Cormorant', Georgia, serif", color: "#fff", margin: "0.5rem 0", fontWeight: 300, lineHeight: 1 }}>{streak}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>day streak {goalObj ? `· ${goalObj.icon} ${goalObj.label}` : ""}</p>
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              <button style={s.btn} onClick={handleShare}>{shareVisible ? "copied!" : "share my streak"}</button>
            </div>
          </div>
        </div>
      )}

      {tab === "shop" && (
        <div style={s.section}>
          <div style={{ ...card, overflow: "hidden", padding: 0 }}>
            <div style={{ background: `linear-gradient(135deg, #f5eae9, ${LIGHT})`, padding: "1.5rem 1.5rem 1rem" }}>
              <p style={{ fontSize: 11, color: PINK, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px", fontWeight: 500 }}>never run out</p>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 28, color: DARK, margin: "0 0 4px", fontWeight: 400 }}>monthly subscription</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 40, color: PINK, fontWeight: 400 }}>£14.24</span>
                <span style={{ fontSize: 13, color: "#bbb", textDecoration: "line-through" }}>£18.99</span>
                <span style={{ fontSize: 12, color: "#bbb" }}>/ month</span>
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
              <p style={{ fontSize: 14, color: "#777", margin: "0 0 16px", lineHeight: 1.7 }}>
                25% off every month. free UK shipping. cancel whenever you want — no commitment, no questions asked.
              </p>
              <a href="https://blissforyou.uk" style={{ ...s.btn, display: "block", textAlign: "center", textDecoration: "none", lineHeight: "1.5", borderRadius: 999 }}>subscribe on blissforyou.uk</a>
            </div>
          </div>

          <div style={card}>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 22, color: DARK, margin: "0 0 4px", fontWeight: 400 }}>one-time purchase</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 36, color: DARK, fontWeight: 400 }}>£18.99</span>
              <span style={{ fontSize: 12, color: "#bbb" }}>/ bottle</span>
            </div>
            <p style={{ fontSize: 14, color: "#777", margin: "0 0 16px", lineHeight: 1.6 }}>free UK shipping on every order.</p>
            <a href="https://blissforyou.uk" style={{ ...s.btnOutline, display: "block", textAlign: "center", textDecoration: "none", marginTop: 0, lineHeight: "1.5", borderRadius: 999 }}>buy on blissforyou.uk</a>
          </div>

          <div style={card}>
            <p style={{ fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 4px" }}>also on TikTok Shop</p>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 10px" }}>find us on TikTok Shop UK for exclusive creator deals.</p>
            <a href="https://www.tiktok.com/shop" style={{ fontSize: 13, color: PINK, textDecoration: "none", fontWeight: 500 }}>view on TikTok Shop →</a>
          </div>
        </div>
      )}

      <div style={s.tabBar}>
        {[
          { id: "tracker", label: "tracker", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: "progress", label: "progress", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { id: "leaderboard", label: "ranks", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 3 2-7L2 9h7z"/></svg> },
          { id: "shop", label: "shop", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
        ].map(t => (
          <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
