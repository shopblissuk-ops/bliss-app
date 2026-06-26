import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PINK = "#C9908A";
const PINK2 = "#e8c4c0";
const DARK = "#1a1a1a";
const LIGHT = "#fff5f3";
const GREY = "#f7f6f5";

const GOALS = [
  { id: "hair", label: "Hair Growth", icon: "✨", desc: "thicker, stronger, longer hair" },
  { id: "skin", label: "Skin Glow", icon: "🌟", desc: "clearer, brighter, smoother skin" },
  { id: "nails", label: "Strong Nails", icon: "💅", desc: "harder, longer, healthier nails" },
  { id: "all", label: "All Three", icon: "🌸", desc: "full transformation" },
];

const TIPS = {
  hair: ["biotin 5000μg is the dose used in clinical hair growth studies.", "zinc deficiency is one of the most common causes of hair loss in women.", "results usually show at weeks 5–6. stick with it.", "a 2 minute scalp massage daily amplifies your results.", "hair growth happens in cycles — consistent intake supports the growth phase."],
  skin: ["vitamin c is essential for collagen synthesis — your skin uses it every day.", "vitamin a promotes cell turnover, keeping skin fresh and clear.", "vitamin e protects skin cells from oxidative stress.", "collagen production declines with age — these vitamins help maintain it.", "hydration amplifies every skin ingredient. aim for 2L daily."],
  nails: ["biotin directly supports keratin production — what nails are made of.", "zinc regulates proteins that build nail structure.", "nails usually show results first, around weeks 3–4.", "white spots on nails can indicate zinc deficiency — you're addressing this.", "nail growth is about 3mm per month. by day 30 you'll see a clear new line."],
  all: ["biotin, zinc, and vitamins a, c, d and e all work synergistically.", "consistency is everything. same time every day.", "results compound — don't judge before week 4.", "you're getting 6 key nutrients in 2 gummies.", "your body prioritises internal organs first — visible results follow."],
};

const WATER_GOAL = 8;

function WaveBackground({ color = PINK2, opacity = 0.18 }) {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, overflow: "hidden", pointerEvents: "none" }}>
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs>
          <style>{`
            @keyframes wave1 { 0%,100%{d:path("M0 40 Q100 20 200 40 Q300 60 400 40 L400 60 L0 60 Z")} 50%{d:path("M0 30 Q100 50 200 30 Q300 10 400 30 L400 60 L0 60 Z")} }
            @keyframes wave2 { 0%,100%{d:path("M0 50 Q100 30 200 50 Q300 70 400 50 L400 60 L0 60 Z")} 50%{d:path("M0 40 Q100 60 200 40 Q300 20 400 40 L400 60 L0 60 Z")} }
            .w1 { animation: wave1 4s ease-in-out infinite; }
            .w2 { animation: wave2 5.5s ease-in-out infinite; }
          `}</style>
        </defs>
        <path className="w1" d="M0 40 Q100 20 200 40 Q300 60 400 40 L400 60 L0 60 Z" fill={color} fillOpacity={opacity} />
        <path className="w2" d="M0 50 Q100 30 200 50 Q300 70 400 50 L400 60 L0 60 Z" fill={color} fillOpacity={opacity * 0.6} />
      </svg>
    </div>
  );
}

function GlowCard({ children, glow = false, color = PINK, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 24,
      padding: "1.5rem",
      marginBottom: 14,
      boxShadow: glow
        ? `0 0 0 1px ${color}33, 0 4px 24px ${color}22, 0 0 40px ${color}11`
        : "0 2px 16px rgba(0,0,0,0.06)",
      border: glow ? `1px solid ${color}44` : "none",
      position: "relative",
      overflow: "hidden",
      transition: "box-shadow 0.3s ease",
      ...style
    }}>
      {children}
    </div>
  );
}

function PulsingDot({ color = PINK }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 10, height: 10, marginRight: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "pulse 2s ease-in-out infinite" }} />
      <span style={{ position: "absolute", inset: 2, borderRadius: "50%", background: color }} />
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(2);opacity:0} }`}</style>
    </span>
  );
}

function InstallPage({ onInstalled }) {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const steps = isIOS
    ? ["tap the share icon ⬆️ at the bottom of Safari", "tap \"Add to Home Screen\"", "tap \"Add\""]
    : ["tap the three dots ⋮ in your browser", "tap \"Add to Home screen\"", "tap \"Add\" to confirm"];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: `linear-gradient(160deg, #f5e6e4 0%, ${PINK} 100%)`, padding: "3.5rem 1.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
        <div style={{ width: 88, height: 88, borderRadius: 24, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", margin: "0 auto 1.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, boxShadow: "0 0 0 1px rgba(255,255,255,0.3)" }}>🐻</div>
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 32, color: "#fff", margin: "0 0 6px", fontWeight: 400 }}>bliss for you</p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, letterSpacing: "0.04em" }}>30 day glow tracker · free</p>
        <WaveBackground color="#fff" opacity={0.1} />
      </div>

      <div style={{ padding: "2rem 1.25rem 3rem" }}>
        <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 30, fontWeight: 400, color: DARK, margin: "0 0 0.5rem" }}>add to your home screen</h2>
        <p style={{ fontSize: 14, color: "#999", margin: "0 0 1.75rem", lineHeight: 1.6 }}>10 seconds. no app store. completely free.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: GREY, borderRadius: 18 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: PINK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, flexShrink: 0, boxShadow: `0 0 12px ${PINK}66` }}>{i + 1}</div>
              <p style={{ fontSize: 14, color: DARK, margin: 0, lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>

        <button style={{ width: "100%", padding: "17px", background: PINK, color: "#fff", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", boxShadow: `0 4px 20px ${PINK}55` }} onClick={onInstalled}>
          I've added it — let's go →
        </button>

        <div style={{ marginTop: 24, padding: "1.25rem", background: LIGHT, borderRadius: 20, border: `1px solid ${PINK}22` }}>
          <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.9 }}>
            30 day streak tracker · personalised tips · water tracker · before & after photos · community leaderboard · reorder reminders
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("install");
  const [step, setStep] = useState(1);
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

  function handleInstalled() { localStorage.setItem("bliss_installed", "true"); setScreen("welcome"); }
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
    else { navigator.clipboard.writeText(text); setShareVisible(true); setTimeout(() => setShareVisible(false), 2500); }
  }

  const streak = user?.day_streak || 0;
  const alreadyCheckedIn = user?.last_checkin === today;
  const isRunningLow = streak >= 27;
  const goalTips = TIPS[user?.goal || "all"];
  const firstName = user?.name?.split(" ")[0];
  const goalObj = GOALS.find(g => g.id === user?.goal);
  const btn = { width: "100%", padding: "16px", background: PINK, color: "#fff", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", boxShadow: `0 4px 16px ${PINK}44` };
  const btnOut = { width: "100%", padding: "15px", background: "#fff", color: PINK, border: `1.5px solid ${PINK}`, borderRadius: 999, fontSize: 15, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", marginTop: 10 };
  const inp = { width: "100%", padding: "15px 18px", border: "none", borderRadius: 16, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: DARK, outline: "none", boxSizing: "border-box", marginBottom: 12, background: GREY, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)" };
  const label = { fontSize: 11, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 0.75rem", display: "block" };

  if (screen === "install") return <InstallPage onInstalled={handleInstalled} />;

  if (screen === "welcome") return (
    <div style={{ minHeight: "100vh", background: "#f7f6f5", fontFamily: "'DM Sans', sans-serif", color: DARK, maxWidth: 480, margin: "0 auto", boxSizing: "border-box", overflowX: "hidden", width: "100%" }}>
      <div style={{ background: `linear-gradient(160deg, #f5e6e4, ${PINK})`, padding: "2rem 1.5rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 26, color: "#fff", margin: 0, fontWeight: 400 }}>bliss for you</p>
        <WaveBackground color="#fff" opacity={0.08} />
      </div>
      <div style={{ padding: "1.75rem 1.25rem 3rem" }}>
        {step === 1 && (
          <>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 32, fontWeight: 400, color: DARK, margin: "0 0 0.5rem", lineHeight: 1.2 }}>let's start your <span style={{ color: PINK }}>glow</span></h1>
            <p style={{ fontSize: 14, color: "#999", margin: "0 0 1.5rem", lineHeight: 1.7 }}>tell us about yourself and we'll personalise your 30 day journey.</p>
            <input style={inp} placeholder="your first name" value={name} onChange={e => setName(e.target.value)} />
            <input style={inp} placeholder="name your journey — e.g. sarah's glow up" value={journeyName} onChange={e => setJourneyName(e.target.value)} />
            <input style={inp} placeholder="your phone number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            {error && <p style={{ fontSize: 13, color: "#d07070", marginBottom: 12 }}>{error}</p>}
            <button style={btn} onClick={() => {
              if (!name.trim()) return setError("Please enter your name");
              if (!journeyName.trim()) return setError("Please name your journey");
              if (!phone.trim() || phone.length < 10) return setError("Please enter a valid phone number");
              setError(""); setStep(2);
            }}>continue →</button>
          </>
        )}
        {step === 2 && (
          <>
            <h1 style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 32, fontWeight: 400, color: DARK, margin: "0 0 0.5rem", lineHeight: 1.2 }}>what's your <span style={{ color: PINK }}>main goal?</span></h1>
            <p style={{ fontSize: 14, color: "#999", margin: "0 0 1.5rem", lineHeight: 1.6 }}>we'll tailor your daily tips to what matters most.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              {GOALS.map(g => (
                <div key={g.id} onClick={() => setGoal(g.id)} style={{ border: goal === g.id ? `2px solid ${PINK}` : "2px solid transparent", borderRadius: 20, padding: "1.1rem", cursor: "pointer", background: goal === g.id ? LIGHT : "#fff", boxShadow: goal === g.id ? `0 0 0 3px ${PINK}22, 0 4px 16px ${PINK}22` : "0 2px 12px rgba(0,0,0,0.06)", transition: "all 0.15s" }}>
                  <p style={{ fontSize: 28, margin: "0 0 8px" }}>{g.icon}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>{g.label}</p>
                  <p style={{ fontSize: 12, color: "#999", margin: 0 }}>{g.desc}</p>
                </div>
              ))}
            </div>
            {error && <p style={{ fontSize: 13, color: "#d07070", marginBottom: 12 }}>{error}</p>}
            <button style={btn} onClick={handleSignup} disabled={loading || !goal}>{loading ? "one moment..." : "start my journey →"}</button>
            <button style={btnOut} onClick={() => setStep(1)}>back</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f5", fontFamily: "'DM Sans', sans-serif", color: DARK, maxWidth: 480, margin: "0 auto", paddingBottom: "2rem", boxSizing: "border-box", overflowX: "hidden", width: "100%" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .section { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: `linear-gradient(160deg, #f5e6e4, ${PINK})`, padding: "1.5rem 1.5rem 1.25rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
        <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 24, color: "#fff", margin: "0 0 2px", fontWeight: 400, position: "relative" }}>bliss for you</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: 0, letterSpacing: "0.06em", textTransform: "uppercase", position: "relative" }}>{user?.journeyName || `hey ${firstName}`}</p>
        <WaveBackground color="#fff" opacity={0.08} />
      </div>

      <div style={{ padding: "1rem" }}>

        {/* RUNNING LOW BANNER */}
        {isRunningLow && (
          <div className="section" style={{ background: `linear-gradient(135deg, ${PINK}, #e8b5b0)`, borderRadius: 22, padding: "1.25rem 1.5rem", marginBottom: 14, color: "#fff", boxShadow: `0 8px 24px ${PINK}44`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
            <p style={{ fontSize: 11, margin: "0 0 4px", opacity: 0.85, letterSpacing: "0.06em", textTransform: "uppercase" }}>day {streak} · running low</p>
            <p style={{ fontSize: 16, fontWeight: 500, margin: 0, lineHeight: 1.4 }}>time to reorder — don't break your streak.</p>
          </div>
        )}

        {/* STREAK CARD */}
        <div className="section" style={{ background: "#fff", borderRadius: 28, padding: "2rem 1.5rem 1.75rem", marginBottom: 14, textAlign: "center", boxShadow: `0 0 0 1px ${PINK}22, 0 8px 32px ${PINK}18`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, ${PINK}08 0%, transparent 70%)` }} />
          {goalObj && <p style={{ fontSize: 12, color: PINK, margin: "0 0 8px", letterSpacing: "0.04em" }}>{goalObj.icon} {goalObj.label}</p>}
          <div style={{ position: "relative" }}>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 80, fontWeight: 300, color: PINK, margin: "0 0 2px", lineHeight: 1, textShadow: `0 0 40px ${PINK}44` }}>{streak}</p>
            <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>{streak === 1 ? "day in a row" : "days in a row"}</p>
          </div>
          {/* mini 30 day dots */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: "1.25rem" }}>
            {Array.from({ length: 30 }, (_, i) => {
              const done = i + 1 <= streak;
              const isToday = i + 1 === streak + 1;
              const warn = i + 1 >= 27 && !done;
              return (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: done ? PINK : isToday ? PINK2 : warn ? "#ffd4cc" : "#f0ece9", boxShadow: done ? `0 0 6px ${PINK}66` : "none", transition: "all 0.3s" }} />
              );
            })}
          </div>
        </div>

        {/* CHECK IN */}
        <div className="section" style={{ marginBottom: 14 }}>
          {alreadyCheckedIn || checkedIn ? (
            <div style={{ background: "#f0faf0", borderRadius: 22, padding: "1.25rem 1.5rem", textAlign: "center", border: "1px solid #c8eac8" }}>
              <p style={{ fontSize: 16, color: "#4a9e4a", margin: "0 0 4px", fontWeight: 500 }}>checked in today ✓</p>
              <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>come back tomorrow</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 22, padding: "1.25rem 1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              <button style={btn} onClick={handleCheckin} disabled={loading}>{loading ? "one moment..." : "I took my gummies today ✓"}</button>
              {msg && <p style={{ fontSize: 13, color: "#d07070", margin: "10px 0 0", textAlign: "center" }}>{msg}</p>}
            </div>
          )}
        </div>

        {/* WATER CARD */}
        <div className="section" style={{ background: "#fff", borderRadius: 28, padding: "1.5rem", marginBottom: 14, position: "relative", overflow: "hidden", boxShadow: "0 2px 20px rgba(100,160,220,0.12)", border: "1px solid rgba(100,160,220,0.12)" }}>
          <span style={{ fontSize: 11, color: "#6aabdd", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 4, fontWeight: 500 }}>water today</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p style={{ fontSize: 28, fontFamily: "'Cormorant', Georgia, serif", color: "#6aabdd", margin: 0, fontWeight: 400 }}>{water}<span style={{ fontSize: 16, color: "#bbb" }}>/{WATER_GOAL}</span></p>
            {water >= WATER_GOAL && <span style={{ fontSize: 12, color: "#6aabdd", background: "rgba(106,171,221,0.1)", padding: "4px 12px", borderRadius: 999, border: "1px solid rgba(106,171,221,0.2)" }}>goal reached</span>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 60 }}>
            {Array.from({ length: WATER_GOAL }, (_, i) => (
              <button key={i} onClick={i < water ? removeWater : addWater} style={{ width: 40, height: 40, borderRadius: "50%", background: i < water ? "rgba(106,171,221,0.15)" : "#f5f5f5", border: i < water ? "1.5px solid rgba(106,171,221,0.4)" : "1.5px solid #eee", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: i < water ? "0 0 12px rgba(106,171,221,0.3)" : "none", transition: "all 0.2s" }}>💧</button>
            ))}
          </div>
          <WaveBackground color="rgba(106,171,221,0.6)" opacity={water / WATER_GOAL * 0.5 + 0.05} />
        </div>

        {/* STATS GRID */}
        <div className="section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[{ label: "days done", value: streak, color: PINK }, { label: "days left", value: Math.max(0, 30 - streak), color: "#888" }, { label: "complete", value: Math.round((streak / 30) * 100) + "%", color: PINK }, { label: "gummies taken", value: streak * 2, color: "#888" }].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 20, padding: "1.25rem", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 30, color: s.color, margin: "0 0 4px", fontWeight: 400, textShadow: s.color === PINK ? `0 0 20px ${PINK}33` : "none" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#bbb", margin: 0, letterSpacing: "0.04em" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* TODAY'S TIP */}
        <div className="section" style={{ background: "#fff", borderRadius: 24, padding: "1.5rem", marginBottom: 14, boxShadow: `0 0 0 1px ${PINK}11, 0 4px 20px ${PINK}0a`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: `${PINK}08` }} />
          <span style={{ fontSize: 11, color: PINK, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 500 }}>today's tip {goalObj ? `· ${goalObj.icon}` : ""}</span>
          <p style={{ fontSize: 15, color: "#555", margin: 0, lineHeight: 1.75 }}>{goalTips[tipIndex]}</p>
        </div>

        {/* BEFORE & AFTER */}
        <div className="section" style={{ background: "#fff", borderRadius: 24, padding: "1.5rem", marginBottom: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <span style={label}>before & after · private to you</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {["before", "after"].map(type => (
              <div key={type} onClick={() => type === "before" ? beforeRef.current.click() : afterRef.current.click()} style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "3/4", background: GREY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", border: `1.5px dashed ${PINK}33` }}>
                {beforeAfter[type] ? <img src={beforeAfter[type]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={type} /> : (<><p style={{ fontSize: 32, margin: "0 0 8px" }}>📷</p><p style={{ fontSize: 12, color: "#bbb", margin: 0 }}>add {type}</p></>)}
                <input ref={type === "before" ? beforeRef : afterRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleImageUpload(type, e)} />
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "3px 10px", fontSize: 11, color: DARK, fontWeight: 500 }}>{type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WEEK TIMELINE */}
        <div className="section" style={{ background: "#fff", borderRadius: 24, padding: "1.5rem", marginBottom: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <span style={label}>what to expect</span>
          {[
            { week: "weeks 1–2", desc: "nutrients building up. working internally.", active: streak >= 1 },
            { week: "weeks 3–4", desc: "nails often show first. reduced shedding.", active: streak >= 14 },
            { week: "weeks 5–6", desc: "skin clearer. hair thicker at roots.", active: streak >= 28 },
            { week: "week 8+", desc: "visible growth, stronger nails, glow.", active: streak >= 30 },
          ].map((w, i) => (
            <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.75rem 0", borderBottom: i < 3 ? "0.5px solid #f5f5f5" : "none", opacity: w.active ? 1 : 0.3, transition: "opacity 0.4s" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: w.active ? PINK : "#ddd", boxShadow: w.active ? `0 0 10px ${PINK}66` : "none", transition: "all 0.3s" }} />
                {i < 3 && <div style={{ width: 1, flex: 1, background: "#f0e8e7", marginTop: 4 }} />}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: DARK, margin: "0 0 3px" }}>{w.week}{w.active ? <span style={{ color: PINK, fontSize: 11, marginLeft: 8 }}>unlocked</span> : ""}</p>
                <p style={{ fontSize: 13, color: "#999", margin: 0 }}>{w.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LEADERBOARD */}
        <div className="section" style={{ background: "#fff", borderRadius: 24, padding: "1.5rem", marginBottom: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <span style={label}>community streaks</span>
          {leaderboard.map((entry, i) => {
            const isMe = entry.name === user?.name && entry.day_streak === streak;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            const eg = GOALS.find(g => g.id === entry.goal);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 0.875rem", borderRadius: 14, background: isMe ? LIGHT : "transparent", marginBottom: 4, border: isMe ? `1px solid ${PINK}22` : "none" }}>
                <span style={{ fontSize: 18, width: 26, flexShrink: 0 }}>{medal}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: isMe ? 600 : 400, color: DARK, margin: "0 0 2px" }}>{entry.name.split(" ")[0]}{isMe ? " · you" : ""}</p>
                  {eg && <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{eg.icon} {eg.label}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 24, color: PINK, margin: 0, fontWeight: 400, textShadow: `0 0 12px ${PINK}44` }}>{entry.day_streak}</p>
                  <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>days</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* SHARE */}
        <div className="section" style={{ borderRadius: 24, overflow: "hidden", marginBottom: 14, boxShadow: `0 8px 32px ${PINK}33` }}>
          <div style={{ background: `linear-gradient(135deg, ${PINK}, #e8c4c0)`, padding: "2rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 18, color: "#fff", margin: "0 0 4px", position: "relative" }}>bliss for you</p>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 56, color: "#fff", margin: "0.25rem 0", fontWeight: 300, lineHeight: 1, position: "relative", textShadow: "0 0 30px rgba(255,255,255,0.3)" }}>{streak}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, position: "relative" }}>day streak{goalObj ? ` · ${goalObj.icon} ${goalObj.label}` : ""}</p>
            <WaveBackground color="rgba(255,255,255,0.2)" opacity={0.4} />
          </div>
          <div style={{ background: "#fff", padding: "1rem 1.25rem" }}>
            <button style={btn} onClick={handleShare}>{shareVisible ? "copied to clipboard!" : "share my streak"}</button>
          </div>
        </div>

        {/* SHOP */}
        <div className="section" style={{ background: "#fff", borderRadius: 24, overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div style={{ background: `linear-gradient(135deg, #f5eae9, ${LIGHT})`, padding: "1.5rem 1.5rem 1rem" }}>
            <p style={{ fontSize: 11, color: PINK, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 6px", fontWeight: 500 }}>never run out</p>
            <p style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 26, color: DARK, margin: "0 0 4px", fontWeight: 400 }}>monthly subscription</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "'Cormorant', Georgia, serif", fontSize: 38, color: PINK, fontWeight: 400 }}>£14.24</span>
              <span style={{ fontSize: 13, color: "#bbb", textDecoration: "line-through" }}>£18.99</span>
              <span style={{ fontSize: 12, color: "#bbb" }}>/ month</span>
            </div>
          </div>
          <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
            <p style={{ fontSize: 14, color: "#777", margin: "0 0 16px", lineHeight: 1.7 }}>25% off every month. free UK shipping. cancel whenever — no commitment.</p>
            <a href="https://blissforyou.uk/products/hair-skin-nails-gummies-30-day-glow-complex" style={{ ...btn, display: "block", textAlign: "center", textDecoration: "none", lineHeight: "1.5", borderRadius: 999 }}>subscribe on blissforyou.uk</a>
            <a href="https://blissforyou.uk/products/hair-skin-nails-gummies-30-day-glow-complex" style={{ display: "block", textAlign: "center", textDecoration: "none", color: PINK, fontSize: 13, marginTop: 12, fontWeight: 500 }}>or buy once at £18.99 →</a>
          </div>
        </div>

      </div>
    </div>
  );
}
