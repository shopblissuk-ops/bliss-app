import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PINK = "#C9908A";
const DARK = "#2C2C2C";
const LIGHT = "#fff5f3";

const GOALS = [
  { id: "hair", label: "Hair Growth", icon: "✨", desc: "thicker, stronger, longer hair" },
  { id: "skin", label: "Skin Glow", icon: "🌟", desc: "clearer, brighter, smoother skin" },
  { id: "nails", label: "Strong Nails", icon: "💅", desc: "harder, longer, healthier nails" },
  { id: "all", label: "All Three", icon: "🌸", desc: "full hair, skin & nails transformation" },
];

const TIPS = {
  hair: [
    "biotin 5000μg is 10,000% of your daily intake — the dose used in hair growth studies.",
    "hair growth happens in cycles. consistent biotin intake supports the anagen (growth) phase.",
    "zinc deficiency is one of the most common causes of hair loss in women. you're covered.",
    "results in hair usually show at weeks 5-6. stick with it.",
    "scalp circulation matters — a 2 minute scalp massage daily can amplify your results.",
  ],
  skin: [
    "vitamin c is essential for collagen synthesis — your skin uses it every single day.",
    "vitamin a promotes cell turnover, keeping skin fresh and clear.",
    "vitamin e protects skin cells from oxidative stress that causes premature ageing.",
    "collagen production peaks in your 20s then declines — these vitamins help maintain it.",
    "hydration amplifies every skin ingredient. aim for 2L of water alongside your gummies.",
  ],
  nails: [
    "nails are made of keratin — biotin directly supports keratin production.",
    "zinc regulates the proteins that build nail structure. brittle nails are often a zinc sign.",
    "nails usually show results first, around weeks 3-4.",
    "white spots on nails can indicate zinc deficiency — you're addressing this directly.",
    "nail growth is about 3mm per month. by day 30 you should see a clear new growth line.",
  ],
  all: [
    "biotin, zinc, and vitamins a, c, d and e all work synergistically — taking them together amplifies each one.",
    "consistency is the only thing that matters. same time every day.",
    "results compound — week 2 builds on week 1. don't judge results before week 4.",
    "your body prioritises internal organs first. visible results come once internal needs are met.",
    "you're getting 6 key nutrients in 2 gummies. the convenience factor means you actually do it.",
  ],
};

const WATER_GOAL = 8;

const styles = {
  app: { minHeight: "100vh", background: "#fff", fontFamily: "'DM Sans', sans-serif", color: DARK, maxWidth: 480, margin: "0 auto", paddingBottom: "6rem" },
  header: { padding: "1.5rem 1.5rem 1rem", borderBottom: "0.5px solid #f0e8e7", textAlign: "center" },
  logo: { fontFamily: "'Cormorant', Georgia, serif", fontSize: 26, fontWeight: 400, color: DARK, margin: 0 },
  tagline: { fontSize: 11, color: "#bbb", margin: "4px 0 0", letterSpacing: "0.05em", textTransform: "uppercase" },
  section: { padding: "1.75rem 1.5rem" },
  heading: { fontFamily: "'Cormorant', Georgia, serif", fontSize: 34, fontWeight: 400, color: DARK, margin: "0 0 0.75rem", lineHeight: 1.15 },
  sub: { fontSize: 14, color: "#999", margin: "0 0 1.5rem", lineHeight: 1.7 },
  input: { width: "100%", padding: "15px 18px", border: "0.5px solid #e8e0df", borderRadius: 12, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: DARK, outline: "none", boxSizing: "border-box", marginBottom: 12, background: "#fdfafa" },
  btn: { width: "100%", padding: "16px", background: PINK, color: "#fff", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", letterSpacing: "0.02em" },
  btnOutline: { width: "100%", padding: "16px", background: "transparent", color: PINK, border: `0.5px solid ${PINK}`, borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", marginTop: 10 },
  divider: { border: "none", borderTop: "0.5px solid #f0e8e7", margin: "1.75rem 0" },
  sectionLabel: { fontSize: 11, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.75rem" },
  card: { background: LIGHT, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: 12, border: "0.5px solid #f0e8e7" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 20 },
  day: (done, isToday, isWarning) => ({ aspectRatio: "1", borderRadius: 8, background: done ? PINK : isWarning ? "#fff0ee" : isToday ? "#f5eae9" : "#faf6f5", border: isToday ? `1.5px solid ${PINK}` : isWarning ? `1.5px solid ${PINK}` : "0.5px solid #f0e8e7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: done ? "#fff" : isWarning ? PINK : "#ddd", fontWeight: done ? 500 : 400 }),
  streak: { fontSize: 56, fontWeight: 300, color: PINK, textAlign: "center", lineHeight: 1, margin: "0.5rem 0", fontFamily: "'Cormorant', Georgia, serif" },
  error: { fontSize: 13, color: "#d07070", marginBottom: 12 },
  tabBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "0.5px solid #f0e8e7", display: "flex", flexDirection: "row", zIndex: 100 },
  tab: (active) => ({ flex: 1, padding: "10px 4px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", background: "none", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: active ? PINK : "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }),
  goalCard: (selected) => ({ border: selected ? `1.5px solid ${PINK}` : "0.5px solid #f0e8e7", borderRadius: 14, padding: "1rem", cursor: "pointer", background: selected ? LIGHT : "#fff", transition: "all 0.2s" }),
  waterBtn: (filled) => ({ width: 36, height: 36, borderRadius: "50%", background: filled ? PINK : "#f0e8e7", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "background 0.2s" }),
  reorderBanner: { background: `linear-gradient(135deg, ${PINK}, #e8b5b0)`, borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: 16, color: "#fff" },
  shopCard: { border: "0.5px solid #f0e8e7", borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  shopCardHeader: { background: LIGHT, padding: "1rem 1.25rem", borderBottom: "0.5px solid #f0e8e7" },
  shopCardBody: { padding: "1.25rem" },
  leaderRow: (isUser) => ({ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", borderRadius: 12, background: isUser ? LIGHT : "transparent", border: isUser ? `0.5px solid #f0e8e7` : "none", marginBottom: 6 }),
  shareCard: { border: "0.5px solid #f0e8e7", borderRadius: 20, overflow: "hidden", marginBottom: 16 },
};

export default function App() {
  const [screen, setScreen] = useState("welcome");
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
  const [beforeAfter, setBeforeAfter] = useState({ before: null, after: null, submitted: false });
  const [tipIndex, setTipIndex] = useState(0);
  const [shareVisible, setShareVisible] = useState(false);
  const beforeRef = useRef();
  const afterRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem("bliss_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setScreen("app");
    }
    const savedWater = localStorage.getItem("bliss_water_" + new Date().toISOString().split("T")[0]);
    if (savedWater) setWater(parseInt(savedWater));
    const savedBA = localStorage.getItem("bliss_beforeafter");
    if (savedBA) setBeforeAfter(JSON.parse(savedBA));
    setTipIndex(Math.floor(Math.random() * 5));
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from("users")
      .select("name, day_streak, goal")
      .order("day_streak", { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  }

  const today = new Date().toISOString().split("T")[0];

  function addWater() {
    const newVal = Math.min(WATER_GOAL, water + 1);
    setWater(newVal);
    localStorage.setItem("bliss_water_" + today, newVal.toString());
  }

  function removeWater() {
    const newVal = Math.max(0, water - 1);
    setWater(newVal);
    localStorage.setItem("bliss_water_" + today, newVal.toString());
  }

  async function handleSignup() {
    setError("");
    if (!name.trim()) return setError("Please enter your name");
    if (!journeyName.trim()) return setError("Please name your journey");
    if (!phone.trim() || phone.length < 10) return setError("Please enter a valid phone number");
    if (!goal) return setError("Please select your goal");
    setLoading(true);

    const { data, error: err } = await supabase
      .from("users")
      .insert([{ name: name.trim(), phone: phone.trim(), goal }])
      .select()
      .single();

    if (err) {
      setError("Something went wrong — " + err.message);
      setLoading(false);
      return;
    }

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const userData = { ...data, checkins: [], journeyName: journeyName.trim() };
    localStorage.setItem("bliss_user", JSON.stringify(userData));
    setUser(userData);
    setScreen("app");
    setLoading(false);
  }

  async function handleCheckin() {
    if (!user) return;
    if (user.last_checkin === today) {
      setMsg("Already checked in today — come back tomorrow.");
      return;
    }
    setLoading(true);
    const newStreak = (user.day_streak || 0) + 1;

    const { data, error: err } = await supabase
      .from("users")
      .update({ day_streak: newStreak, last_checkin: today })
      .eq("id", user.id)
      .select()
      .single();

    if (err) { setMsg("Something went wrong."); setLoading(false); return; }

    const checkins = [...(user.checkins || []), today];
    const updated = { ...data, checkins, journeyName: user.journeyName };
    localStorage.setItem("bliss_user", JSON.stringify(updated));
    setUser(updated);
    setCheckedIn(true);
    setMsg("");
    fetchLeaderboard();
    setLoading(false);
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

  function generateShareText() {
    return `I'm on day ${streak} of my bliss for you glow journey 🌸\n\ntrack yours free at blissforyou.uk/app`;
  }

  async function handleShare() {
    const text = generateShareText();
    if (navigator.share) {
      await navigator.share({ title: "my bliss for you journey", text });
    } else {
      navigator.clipboard.writeText(text);
      setShareVisible(true);
      setTimeout(() => setShareVisible(false), 2000);
    }
  }

  const streak = user?.day_streak || 0;
  const alreadyCheckedIn = user?.last_checkin === today;
  const isRunningLow = streak >= 27;
  const goalTips = TIPS[user?.goal || "all"];
  const firstName = user?.name?.split(" ")[0];
  const goalObj = GOALS.find(g => g.id === user?.goal);

  // WELCOME FLOW
  if (screen === "welcome") return (
    <div style={styles.app}>
      <div style={styles.header}>
        <p style={styles.logo}>bliss for you</p>
        <p style={styles.tagline}>30 day glow tracker</p>
      </div>
      <div style={styles.section}>

        {step === 1 && (
          <>
            <span style={{ display: "inline-block", background: LIGHT, border: "0.5px solid #f0e8e7", borderRadius: 999, padding: "6px 14px", fontSize: 12, color: PINK, marginBottom: "1.5rem" }}>completely free</span>
            <h1 style={styles.heading}>start your <span style={{ color: PINK }}>glow</span> journey</h1>
            <p style={styles.sub}>track your daily gummies, build your streak, and watch your transformation over 30 days.</p>
            <input style={styles.input} placeholder="your first name" value={name} onChange={e => setName(e.target.value)} />
            <input style={styles.input} placeholder="name your journey e.g. sarah's glow up" value={journeyName} onChange={e => setJourneyName(e.target.value)} />
            <input style={styles.input} placeholder="your phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} onClick={() => {
              if (!name.trim()) return setError("Please enter your name");
              if (!journeyName.trim()) return setError("Please name your journey");
              if (!phone.trim() || phone.length < 10) return setError("Please enter a valid phone number");
              setError("");
              setStep(2);
            }}>continue</button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={styles.heading}>what's your <span style={{ color: PINK }}>main goal?</span></h1>
            <p style={styles.sub}>we'll personalise your tips and tracker based on what matters most to you.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {GOALS.map(g => (
                <div key={g.id} style={styles.goalCard(goal === g.id)} onClick={() => setGoal(g.id)}>
                  <p style={{ fontSize: 24, margin: "0 0 6px" }}>{g.icon}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>{g.label}</p>
                  <p style={{ fontSize: 12, color: "#999", margin: 0 }}>{g.desc}</p>
                </div>
              ))}
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} onClick={handleSignup} disabled={loading || !goal}>
              {loading ? "one moment..." : "start my journey"}
            </button>
            <button style={styles.btnOutline} onClick={() => setStep(1)}>back</button>
          </>
        )}
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <p style={styles.logo}>bliss for you</p>
        <p style={styles.tagline}>{user?.journeyName || `hey ${firstName}`}</p>
      </div>

      {/* TRACKER TAB */}
      {tab === "tracker" && (
        <div style={styles.section}>

          {isRunningLow && (
            <div style={styles.reorderBanner}>
              <p style={{ fontSize: 11, margin: "0 0 4px", opacity: 0.8, letterSpacing: "0.05em", textTransform: "uppercase" }}>running low</p>
              <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 12px" }}>you're on day {streak} — reorder so you don't break your streak.</p>
              <button onClick={() => setTab("shop")} style={{ background: "rgba(255,255,255,0.25)", border: "0.5px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 999, padding: "10px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>reorder now →</button>
            </div>
          )}

          {goalObj && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "10px 14px", background: LIGHT, borderRadius: 10, border: "0.5px solid #f0e8e7" }}>
              <span style={{ fontSize: 18 }}>{goalObj.icon}</span>
              <span style={{ fontSize: 13, color: "#999" }}>goal: <strong style={{ color: DARK }}>{goalObj.label}</strong></span>
            </div>
          )}

          <p style={styles.sectionLabel}>current streak</p>
          <p style={styles.streak}>{streak}</p>
          <p style={{ fontSize: 13, color: "#bbb", textAlign: "center", margin: "0 0 1.5rem" }}>{streak === 1 ? "day in a row" : "days in a row"}</p>

          {alreadyCheckedIn || checkedIn ? (
            <div style={{ ...styles.card, textAlign: "center", background: "#f5faf5", border: "0.5px solid #d4ecd4" }}>
              <p style={{ fontSize: 14, color: "#7db87d", margin: "0 0 6px" }}>checked in today</p>
              <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>come back tomorrow to keep your streak</p>
            </div>
          ) : (
            <>
              <button style={styles.btn} onClick={handleCheckin} disabled={loading}>
                {loading ? "one moment..." : "I took my gummies today"}
              </button>
              {msg && <p style={{ ...styles.error, marginTop: 10 }}>{msg}</p>}
            </>
          )}

          <button onClick={handleShare} style={{ ...styles.btnOutline, marginTop: 10 }}>
            {shareVisible ? "copied to clipboard!" : "share my streak"}
          </button>

          <hr style={styles.divider} />

          <p style={styles.sectionLabel}>your 30 days</p>
          <div style={styles.grid}>
            {Array.from({ length: 30 }, (_, i) => {
              const dayNum = i + 1;
              const done = dayNum <= streak;
              const isToday = dayNum === streak + 1 && !alreadyCheckedIn;
              const isWarning = dayNum >= 27 && !done;
              return (
                <div key={i} style={styles.day(done, isToday, isWarning)}>
                  {done ? "✓" : isWarning ? "!" : dayNum}
                </div>
              );
            })}
          </div>

          <hr style={styles.divider} />

          <p style={styles.sectionLabel}>water today</p>
          <p style={{ fontSize: 13, color: "#999", margin: "0 0 12px" }}>{water}/{WATER_GOAL} glasses — hydration amplifies every ingredient</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <button key={i} style={styles.waterBtn(i < water)} onClick={i < water ? removeWater : addWater}>
                💧
              </button>
            ))}
          </div>
          {water >= WATER_GOAL && <p style={{ fontSize: 12, color: PINK, margin: "8px 0 0" }}>hydration goal hit today</p>}

          <hr style={styles.divider} />

          <p style={styles.sectionLabel}>today's tip</p>
          <div style={{ border: "0.5px solid #f0e8e7", borderRadius: 14, padding: "1rem 1.25rem", display: "flex", gap: "0.75rem" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: PINK, flexShrink: 0, marginTop: 7 }} />
            <p style={{ fontSize: 14, color: "#888", margin: 0, lineHeight: 1.6 }}>{goalTips[tipIndex]}</p>
          </div>

          <hr style={styles.divider} />

          <p style={styles.sectionLabel}>your stats</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "days done", value: streak },
              { label: "days left", value: Math.max(0, 30 - streak) },
              { label: "complete", value: Math.round((streak / 30) * 100) + "%" },
              { label: "gummies taken", value: streak * 2 },
            ].map((s, i) => (
              <div key={i} style={{ ...styles.card, textAlign: "center", marginBottom: 0 }}>
                <p style={{ fontSize: 24, fontFamily: "'Cormorant', Georgia, serif", color: PINK, margin: "0 0 4px", fontWeight: 400 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* PROGRESS TAB */}
      {tab === "progress" && (
        <div style={styles.section}>
          <h2 style={{ ...styles.heading, fontSize: 28, marginBottom: "0.5rem" }}>your transformation</h2>
          <p style={styles.sub}>document your before and after — for your eyes only, stored on your device.</p>

          <p style={styles.sectionLabel}>before & after</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {["before", "after"].map(type => (
              <div key={type} style={{ borderRadius: 14, overflow: "hidden", border: "0.5px solid #f0e8e7", aspectRatio: "3/4", background: LIGHT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                onClick={() => type === "before" ? beforeRef.current.click() : afterRef.current.click()}>
                {beforeAfter[type] ? (
                  <img src={beforeAfter[type]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={type} />
                ) : (
                  <>
                    <p style={{ fontSize: 24, margin: "0 0 6px" }}>📷</p>
                    <p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>tap to add {type}</p>
                  </>
                )}
                <input ref={type === "before" ? beforeRef : afterRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(type, e)} />
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.9)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: DARK }}>{type}</div>
              </div>
            ))}
          </div>

          <hr style={styles.divider} />

          <p style={styles.sectionLabel}>week by week</p>
          {[
            { week: "weeks 1-2", desc: "nutrients building up. no visible changes yet — it's working internally.", active: streak >= 1 },
            { week: "weeks 3-4", desc: "nails often show first. reduced hair shedding common.", active: streak >= 14 },
            { week: "weeks 5-6", desc: "skin clearer and more even. hair feels thicker at roots.", active: streak >= 28 },
            { week: "week 8+", desc: "visible hair growth, stronger nails, consistent glow. results compound.", active: streak >= 30 },
          ].map((w, i) => (
            <div key={i} style={{ ...styles.card, opacity: w.active ? 1 : 0.4, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: DARK, margin: 0 }}>{w.week}</p>
                {w.active && <span style={{ fontSize: 10, color: PINK, background: LIGHT, padding: "2px 8px", borderRadius: 999 }}>unlocked</span>}
              </div>
              <p style={{ fontSize: 13, color: "#999", margin: 0, lineHeight: 1.6 }}>{w.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {tab === "leaderboard" && (
        <div style={styles.section}>
          <h2 style={{ ...styles.heading, fontSize: 28, marginBottom: "0.5rem" }}>leaderboard</h2>
          <p style={styles.sub}>see how your streak compares to the bliss for you community.</p>

          <p style={styles.sectionLabel}>top streaks</p>
          {leaderboard.length === 0 && <p style={{ fontSize: 14, color: "#bbb" }}>loading...</p>}
          {leaderboard.map((entry, i) => {
            const isCurrentUser = entry.name === user?.name && entry.day_streak === streak;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            const entryGoal = GOALS.find(g => g.id === entry.goal);
            return (
              <div key={i} style={styles.leaderRow(isCurrentUser)}>
                <span style={{ fontSize: 16, width: 28, flexShrink: 0 }}>{medal}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: isCurrentUser ? 500 : 400, color: DARK, margin: "0 0 2px" }}>
                    {entry.name.split(" ")[0]}{isCurrentUser ? " (you)" : ""}
                  </p>
                  {entryGoal && <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{entryGoal.icon} {entryGoal.label}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 20, fontFamily: "'Cormorant', Georgia, serif", color: PINK, margin: 0, fontWeight: 400 }}>{entry.day_streak}</p>
                  <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>days</p>
                </div>
              </div>
            );
          })}

          <hr style={styles.divider} />

          <p style={styles.sectionLabel}>share your streak</p>
          <div style={styles.shareCard}>
            <div style={{ background: `linear-gradient(135deg, ${PINK}, #e8c4c0)`, padding: "2rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 20, color: "#fff", margin: "0 0 4px" }}>bliss for you</p>
              <p style={{ fontSize: 48, fontFamily: "'Cormorant', Georgia, serif", color: "#fff", margin: "0.5rem 0", fontWeight: 300 }}>{streak}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>day streak {goalObj ? `· ${goalObj.icon} ${goalObj.label}` : ""}</p>
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              <button style={styles.btn} onClick={handleShare}>
                {shareVisible ? "copied!" : "share my streak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOP TAB */}
      {tab === "shop" && (
        <div style={styles.section}>
          <h2 style={{ ...styles.heading, fontSize: 28, marginBottom: "0.5rem" }}>get your next bottle</h2>
          <p style={styles.sub}>never break your streak — order before you run out.</p>

          <div style={styles.shopCard}>
            <div style={styles.shopCardHeader}>
              <p style={{ fontSize: 11, color: PINK, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>best value</p>
              <p style={{ fontSize: 16, fontWeight: 500, color: DARK, margin: "0 0 2px" }}>monthly subscription</p>
              <p style={{ fontSize: 13, color: "#999", margin: 0 }}>never think about it again</p>
            </div>
            <div style={styles.shopCardBody}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 36, color: PINK, fontWeight: 400 }}>£14.24</span>
                <span style={{ fontSize: 13, color: "#bbb", textDecoration: "line-through" }}>£18.99</span>
                <span style={{ fontSize: 12, color: "#bbb" }}>/ month</span>
              </div>
              {["25% off every month", "free UK shipping always", "cancel anytime", "delivered before you run out"].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: PINK }} />
                  <span style={{ fontSize: 13, color: "#888" }}>{f}</span>
                </div>
              ))}
              <a href="https://blissforyou.uk" style={{ ...styles.btn, display: "block", textAlign: "center", textDecoration: "none", marginTop: 16, lineHeight: "1.5", borderRadius: 999 }}>
                subscribe on blissforyou.uk
              </a>
            </div>
          </div>

          <div style={styles.shopCard}>
            <div style={styles.shopCardHeader}>
              <p style={{ fontSize: 16, fontWeight: 500, color: DARK, margin: "0 0 2px" }}>one-time purchase</p>
            </div>
            <div style={styles.shopCardBody}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
                <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 36, color: DARK, fontWeight: 400 }}>£18.99</span>
                <span style={{ fontSize: 12, color: "#bbb" }}>/ bottle</span>
              </div>
              <a href="https://blissforyou.uk" style={{ display: "block", textAlign: "center", textDecoration: "none", background: "transparent", color: PINK, border: `0.5px solid ${PINK}`, borderRadius: 999, padding: "16px", fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                buy on blissforyou.uk
              </a>
            </div>
          </div>

          <div style={styles.card}>
            <p style={{ fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 4px" }}>also on TikTok Shop</p>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 10px" }}>find us on TikTok Shop UK</p>
            <a href="https://www.tiktok.com/shop" style={{ fontSize: 13, color: PINK, textDecoration: "none" }}>view on TikTok Shop →</a>
          </div>
        </div>
      )}

      {/* TAB BAR */}
      <div style={styles.tabBar}>
        {[
          { id: "tracker", label: "tracker", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { id: "progress", label: "progress", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { id: "leaderboard", label: "ranks", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 3 2-7L2 9h7z"/></svg> },
          { id: "shop", label: "reorder", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
        ].map(t => (
          <button key={t.id} style={styles.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
