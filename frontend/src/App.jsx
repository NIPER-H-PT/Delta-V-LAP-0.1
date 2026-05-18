import { useState, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

// ─── IMPORTING YOUR CUSTOM COMPONENTS ───
import PartialDayBadge from "./components/PartialDayBadge";
import { detectPartialDay } from "./utils/partialDayUtils";

const API_BASE = "http://localhost:8080/api";
const PALETTE = ["#00f0ff","#f59e0b","#10b981","#ef4444","#a78bfa","#fb923c","#34d399","#f472b6"];
const LIGHT_PALETTE = ["#2563eb","#d97706","#059669","#dc2626","#7c3aed","#ea580c","#16a34a","#db2777"];

const Tip = ({active, payload, label, isDark}) => {
  if(!active || !payload?.length) return null;
  const bg = isDark ? "rgba(4, 10, 20, 0.95)" : "rgba(255, 255, 255, 0.95)";
  const border = isDark ? "rgba(0, 240, 255, 0.3)" : "rgba(37, 99, 235, 0.3)";
  const textMuted = isDark ? "#8aaac8" : "#475569";
  const shadow = isDark ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.1)";

  return(
    <div style={{background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px", fontSize: 11, backdropFilter: "blur(12px)", boxShadow: shadow}}>
      <div style={{color: textMuted, marginBottom: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, paddingBottom: 4}}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{color: p.color || (isDark ? "#00f0ff" : "#2563eb"), fontFamily: "'Fira Code', monospace", margin: "4px 0", display: "flex", gap: 12, justifyContent: "space-between"}}>
        <span>{p.name}:</span> <b style={{fontSize: 12, color: isDark ? "#fff" : "#000"}}>{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</b>
      </div>)}
    </div>
  );
};

function Stat({label, value, unit, sub, color, isDark}) {
  const bg = isDark ? "rgba(10, 18, 30, 0.4)" : "rgba(255, 255, 255, 0.7)";
  const border = isDark ? `${color}30` : `${color}40`;
  const shadow = isDark ? `0 4px 20px ${color}08` : `0 4px 20px ${color}15`;
  const textMuted = isDark ? "#6a8aaa" : "#64748b";
  const textSub = isDark ? "#3a5878" : "#94a3b8";

  return(
    <div style={{background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden", boxShadow: shadow, backdropFilter: "blur(10px)"}}>
      <div style={{position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)`}}/>
      <div style={{fontSize: 10, letterSpacing: "0.15em", color: textMuted, textTransform: "uppercase", marginBottom: 10, fontWeight: 600}}>{label}</div>
      <div style={{display: "flex", alignItems: "baseline", gap: 6}}>
        <span style={{fontFamily: "'Fira Code', monospace", fontSize: 28, fontWeight: 700, color, lineHeight: 1, textShadow: isDark ? `0 0 16px ${color}55` : 'none'}}>{value}</span>
        {unit && <span style={{fontSize: 12, color: textMuted, fontWeight: 500}}>{unit}</span>}
      </div>
      {sub && <div style={{fontSize: 11, color: textSub, marginTop: 8}}>{sub}</div>}
    </div>
  );
}

function WorkflowAnimation({ T, isDark }) {
  const wirePath = "M 60,60 L 360,60";
  const nodeStyle = { fill: isDark ? "rgba(8,14,25,0.72)" : "rgba(255,255,255,0.78)", stroke: T.accent };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", maxWidth: 480, margin: "0 auto 30px" }}>
      <style>{`
        @keyframes dvSpin { to { transform: rotate(360deg); } }
        @keyframes dvTail { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(14deg);  } }
        @keyframes dvBar1 { 0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1);    } }
        @keyframes dvBar2 { 0%, 100% { transform: scaleY(0.72); } 50% { transform: scaleY(0.30); } }
        @keyframes dvBar3 { 0%, 100% { transform: scaleY(1);    } 50% { transform: scaleY(0.55); } }
        .dv-spin { transform-origin: 0px 0px; animation: dvSpin 3.2s linear infinite; }
        .dv-tail { transform-origin: -9px -4px; animation: dvTail 0.9s ease-in-out infinite; }
        .dv-b1   { transform-origin: 346.5px 78px; animation: dvBar1 2.1s ease-in-out infinite; }
        .dv-b2   { transform-origin: 357.5px 78px; animation: dvBar2 2.8s ease-in-out infinite; }
        .dv-b3   { transform-origin: 368.5px 78px; animation: dvBar3 1.7s ease-in-out infinite; }
      `}</style>
      <svg viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 440, overflow: "visible" }}>
        <path d={wirePath} stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth="2" strokeLinecap="round" />
        <path d={wirePath} stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.20" />
        <circle r="4" fill={T.accent} opacity="0.95" style={{ filter: `drop-shadow(0 0 6px ${T.accent})` }}>
          <animateMotion dur="2.4s" repeatCount="indefinite" path={wirePath} calcMode="linear" />
        </circle>
        <circle r="2.5" fill={T.accent} opacity="0.38" style={{ filter: `drop-shadow(0 0 4px ${T.accent})` }}>
          <animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite" path={wirePath} calcMode="linear" />
        </circle>
        <circle cx="60" cy="60" r="46" fill="none" stroke={T.accent}>
          <animate attributeName="r" values="44;49;44" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.16;0.36;0.16" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="60" cy="60" r="40" {...nodeStyle} strokeWidth="1.2" style={{ filter: isDark ? `drop-shadow(0 0 10px ${T.accent}44)` : "none" }}/>
        <g transform="translate(60,60)">
          <g className="dv-spin">
            <circle r="27" stroke={T.accent} strokeWidth="2" opacity="0.70"/>
            {[0, 45, 90, 135].map(d => <line key={d} x1="0" y1="-27" x2="0" y2="27" stroke={T.accent} strokeWidth="1" opacity="0.40" transform={`rotate(${d})`}/>)}
            <circle r="4.5" fill={T.accent} opacity="0.85"/>
            <circle r="2" fill={isDark ? "#02060f" : "#fff"}/>
          </g>
          <g transform="translate(-3, 21)">
            <ellipse cx="0" cy="-5" rx="7.5" ry="5.5" fill={T.accent} opacity="0.82"/>
            <circle cx="6.5" cy="-9" r="5.2" fill={T.accent} opacity="0.82"/>
            <circle cx="8" cy="-14.5" r="2.8" fill={T.accent} opacity="0.58"/>
            <circle cx="8" cy="-14.5" r="1.6" fill={isDark ? "#02060f" : "#fff"} opacity="0.80"/>
            <circle cx="10" cy="-10.5" r="1.1" fill={isDark ? "#02060f" : "#fff"} opacity="0.90"/>
            <path d="M 3,-3 L 6,3 L 10,6" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.75">
              <animate attributeName="d" values="M 3,-3 L 6,3 L 10,6; M 3,-3 L 4,4 L 3,8; M 3,-3 L 6,3 L 10,6" dur="0.55s" repeatCount="indefinite" calcMode="linear"/>
            </path>
            <path d="M -3,-2 L -4,4 L -3,8" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.75">
              <animate attributeName="d" values="M -3,-2 L -4,4 L -3,8; M -3,-2 L -6,3 L -10,6; M -3,-2 L -4,4 L -3,8" dur="0.55s" repeatCount="indefinite" calcMode="linear"/>
            </path>
            <g className="dv-tail">
              <path d="M -9,-4 Q -18,-2 -22,-9 Q -24,-14 -20,-17" stroke={T.accent} strokeWidth="1.3" strokeLinecap="round" opacity="0.50"/>
            </g>
          </g>
        </g>
        <circle cx="210" cy="60" r="46" fill="none" stroke={T.accent}>
          <animate attributeName="r" values="44;49;44" dur="3.6s" begin="-1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.16;0.34;0.16" dur="3.6s" begin="-1.8s" repeatCount="indefinite"/>
        </circle>
        <circle cx="210" cy="60" r="40" {...nodeStyle} strokeWidth="1.2" style={{ filter: isDark ? `drop-shadow(0 0 10px ${T.accent}44)` : "none" }}/>
        <rect x="188" y="42" width="44" height="30" rx="3.5" stroke={T.accent} strokeWidth="1.8" opacity="0.78"/>
        <line x1="194" y1="51" x2="226" y2="51" stroke={T.accent} strokeWidth="1.2" opacity="0.32"/>
        <line x1="194" y1="57" x2="220" y2="57" stroke={T.accent} strokeWidth="1.2" opacity="0.32"/>
        <line x1="194" y1="63" x2="224" y2="63" stroke={T.accent} strokeWidth="1.2" opacity="0.32"/>
        <line x1="210" y1="72" x2="210" y2="80" stroke={T.accent} strokeWidth="1.8" opacity="0.58" strokeLinecap="round"/>
        <line x1="202" y1="80" x2="218" y2="80" stroke={T.accent} strokeWidth="1.8" opacity="0.58" strokeLinecap="round"/>
        <circle cx="360" cy="60" r="46" fill="none" stroke={T.accent}>
          <animate attributeName="r" values="44;49;44" dur="2.9s" begin="-0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.16;0.38;0.16" dur="2.9s" begin="-0.9s" repeatCount="indefinite"/>
        </circle>
        <circle cx="360" cy="60" r="40" {...nodeStyle} strokeWidth="1.2" style={{ filter: isDark ? `drop-shadow(0 0 10px ${T.accent}44)` : "none" }}/>
        <line x1="338" y1="43" x2="338" y2="78" stroke={T.accent} strokeWidth="1.5" opacity="0.42" strokeLinecap="round"/>
        <line x1="338" y1="78" x2="381" y2="78" stroke={T.accent} strokeWidth="1.5" opacity="0.42" strokeLinecap="round"/>
        <rect x="343" y="53" width="7" height="25" rx="1.5" fill={T.accent} opacity="0.62" className="dv-b1"/>
        <rect x="354" y="53" width="7" height="25" rx="1.5" fill={T.accent} opacity="0.62" className="dv-b2"/>
        <rect x="365" y="53" width="7" height="25" rx="1.5" fill={T.accent} opacity="0.62" className="dv-b3"/>
      </svg>
    </div>
  );
}

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [view, setView] = useState("upload");
  const [rawFile, setRawFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  
  const [tsCol, setTsCol] = useState("");
  const [subjCol, setSubjCol] = useState("__none__");
  const [lightS, setLightS] = useState(7);
  const [lightE, setLightE] = useState(19);
  
  const [activeSession, setActiveSession] = useState(0);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [compareSet, setCompareSet] = useState([]); 
  
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  
  const [isDark, setIsDark] = useState(true);
  const fileRef = useRef();

  const T = {
    bg: isDark ? "#02060f" : "#f8fafc",
    bgPattern1: isDark ? "#0a1930" : "#e2e8f0",
    bgPattern2: isDark ? "rgba(0, 240, 255, 0.03)" : "rgba(37, 99, 235, 0.05)",
    text: isDark ? "#d0dcea" : "#0f172a",
    textMuted: isDark ? "#6a8aaa" : "#475569",
    accent: isDark ? "#00f0ff" : "#2563eb",
    paneBg: isDark ? "rgba(8, 14, 25, 0.6)" : "rgba(255, 255, 255, 0.7)",
    border: isDark ? "rgba(0, 240, 255, 0.15)" : "rgba(37, 99, 235, 0.2)",
    cardBg: isDark ? "rgba(12, 20, 35, 0.4)" : "rgba(255, 255, 255, 0.9)",
    grid: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    palette: isDark ? PALETTE : LIGHT_PALETTE
  };

  const loadFile = (file) => {
    setRawFile(file);
    const r = new FileReader();
    r.onload = e => {
      const firstLine = e.target.result.split(/\r?\n/)[0];
      const hdrs = firstLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      setHeaders(hdrs);
      setTsCol(hdrs.find(h => /time|stamp|ts/i.test(h)) || hdrs[0]);
      setSubjCol(hdrs.find(h => /subj|id|animal/i.test(h)) || "__none__");
      setView("configure");
    };
    r.readAsText(file.slice(0, 1024)); 
  };

  const buildSession = async () => {
    setLoading(true);
    let exactStartDate = null;
    try {
      const textChunk = await rawFile.slice(0, 5000).text();
      const lines = textChunk.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length > 1) {
        const hdrs = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        const tsIdx = hdrs.indexOf(tsCol);
        if (tsIdx !== -1) {
          for (let r = 1; r < Math.min(10, lines.length); r++) {
            const row = lines[r].split(","); 
            const rawTs = row[tsIdx]?.replace(/^"|"$/g, "");
            if (rawTs) {
              const parsedDate = new Date(rawTs);
              if (!isNaN(parsedDate.getTime())) { exactStartDate = parsedDate.toISOString(); break; }
            }
          }
        }
      }
    } catch (err) {}

    const formData = new FormData();
    formData.append("file", rawFile); formData.append("tsCol", tsCol); formData.append("subjCol", subjCol); formData.append("lightS", lightS); formData.append("lightE", lightE);

    try {
      const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Analysis failed");
      const sessionData = await res.json();
      sessionData.exactStartDate = exactStartDate; 
      const newSessions = [...sessions, sessionData];
      setSessions(newSessions); setActiveSession(newSessions.length - 1); setActiveSubject(Object.keys(sessionData.subjects)[0]); setActiveDayIdx(0); setView("analyse");
    } catch (err) { alert(`Backend Error: ${err.message}`); } finally { setLoading(false); }
  };

  const toggleCompare = (sessIdx, subjectId) => {
    const key = `${sessIdx}|${subjectId}`;
    const exists = compareSet.find(c => c.key === key);
    if (exists) setCompareSet(compareSet.filter(c => c.key !== key));
    else {
      if (compareSet.length >= 6) { alert("Max 6 subjects."); return; }
      setCompareSet([...compareSet, { key, sessIdx, subjectId, color: T.palette[compareSet.length % T.palette.length] }]);
    }
  };

  const inCompare = (sIdx, sid) => !!compareSet.find(c => c.key === `${sIdx}|${sid}`);

  const removeSession = (e, idxToRemove) => {
    e.stopPropagation(); 
    const newSessions = sessions.filter((_, i) => i !== idxToRemove);

    if (newSessions.length === 0) {
      setSessions([]); setActiveSession(0); setActiveSubject(null); setCompareSet([]); setView("upload"); setRawFile(null); return;
    }

    const newCompareSet = compareSet
      .filter(c => c.sessIdx !== idxToRemove)
      .map(c => c.sessIdx > idxToRemove ? { ...c, sessIdx: c.sessIdx - 1, key: `${c.sessIdx - 1}|${c.subjectId}` } : c);
    
    setCompareSet(newCompareSet);

    if (activeSession === idxToRemove) {
      setActiveSession(0); setActiveSubject(Object.keys(newSessions[0].subjects)[0]); setActiveDayIdx(0);
    } else if (activeSession > idxToRemove) {
      setActiveSession(activeSession - 1);
    }
    setSessions(newSessions);
  };

  // ─── AI GENERATION LOGIC ───
  const generateSummary = async () => {
    setSummarizing(true); 
    setAiSummary(null);
    try {
      const payload = { 
        lightS: lightS, 
        lightE: lightE, 
        files: [] 
      };
      
      const sessionMap = {};
      
      compareSet.forEach(({ sessIdx, subjectId }) => {
        const session = sessions[sessIdx];
        if (!session) return;
        
        if (!sessionMap[sessIdx]) {
           sessionMap[sessIdx] = {
              fileName: session.fileName,
              subjects: {}
           };
        }
        
        sessionMap[sessIdx].subjects[subjectId] = {
           metrics: {
              hourly: session.subjects[subjectId].metrics.hourly
           }
        };
      });
      
      payload.files = Object.values(sessionMap);

      const res = await fetch(`${API_BASE}/summarize`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
          const errInfo = await res.json().catch(() => ({}));
          throw new Error(errInfo.detail || "Network response was not ok");
      }
      
      const data = await res.json(); 
      
      if (typeof data.summary === 'string' && (data.summary.includes("503") || data.summary.includes("429") || data.summary.includes("UNAVAILABLE"))) {
         setAiSummary("⚠️ AI Server at Capacity\n\nThe LLM is currently experiencing a high volume of global traffic and cannot generate a summary right now. This is usually temporary. Please wait a few seconds and try clicking the summarize button again.");
      } else {
         let cleanText = data.summary.replace(/^(Here is|Here's|Below is) a .*?:\s*/i, "").trim();
         setAiSummary(cleanText);
      }

    } catch (err) { 
      if (err.message.includes("503") || err.message.includes("429") || err.message.includes("UNAVAILABLE")) {
         setAiSummary("⚠️ AI Server at Capacity\n\nThe LLM is currently experiencing a high volume of global traffic and cannot generate a summary right now. This is usually temporary. Please try again in a moment.");
      } else {
         setAiSummary(`⚠️ Connection Error\n\nCould not reach the AI Engine: ${err.message}`); 
      }
    } finally { 
      setSummarizing(false); 
    }
  };

  const exportMasterCSV = () => {
    let csv = "Source_File,Subject_ID,Day,Distance_km,Active_Duration_min,Bout_Count,Mean_Speed_m_min,Peak_Speed_m_min,Light_Phase_km,Dark_Phase_km,DL_Ratio\n";
    sessions.forEach(session => {
      let maxHours = 0;
      Object.keys(session.subjects).forEach(subj => { const len = session.subjects[subj].metrics.hourly.length; if (len > maxHours) maxHours = len; });
      const targetHours = Math.ceil(maxHours / 24) * 24;
      Object.keys(session.subjects).forEach(subj => {
        const rawHourly = session.subjects[subj].metrics.hourly; const hourly = [];
        for (let i = 0; i < targetHours; i++) {
          if (i < rawHourly.length) hourly.push(rawHourly[i]);
          else hourly.push({ distanceKm: 0, activeDurMin: 0, boutCount: 0, meanSpeed: 0, isLight: (i % 24) >= lightS && (i % 24) < lightE });
        }
        for (let i = 0; i < hourly.length; i += 24) {
          const chunk = hourly.slice(i, i + 24); const day = Math.floor(i / 24) + 1;
          const dist = chunk.reduce((acc, h) => acc + h.distanceKm, 0); const actMin = chunk.reduce((acc, h) => acc + h.activeDurMin, 0); const bouts = chunk.reduce((acc, h) => acc + h.boutCount, 0);
          const lightDist = chunk.filter(h => h.isLight).reduce((acc, h) => acc + h.distanceKm, 0); const darkDist = chunk.filter(h => !h.isLight).reduce((acc, h) => acc + h.distanceKm, 0);
          const dlRatio = lightDist > 0 ? (darkDist / lightDist) : "";
          const activeSpeedSum = chunk.reduce((acc, h) => acc + (h.meanSpeed * h.activeDurMin), 0); const meanSpeed = actMin > 0 ? (activeSpeedSum / actMin) : 0;
          const peakSpeed = chunk.length > 0 ? Math.max(...chunk.map(h => h.meanSpeed)) : 0;
          csv += `${session.fileName},${subj},${day},${dist.toFixed(4)},${actMin.toFixed(2)},${bouts},${meanSpeed.toFixed(2)},${peakSpeed.toFixed(2)},${lightDist.toFixed(4)},${darkDist.toFixed(4)},${typeof dlRatio === 'number' ? dlRatio.toFixed(2) : ''}\n`;
        }
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", "DeltaV_JMP_Master.csv"); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportCircadianCSV = () => {
    let csv = "Source_File,Sensor,Study_Day,Exact_Calendar_Time,Raw_Hour,Clock_Time,Hourly_Distance_km\n";
    sessions.forEach(session => {
      let maxHours = 0;
      Object.keys(session.subjects).forEach(subj => { const len = session.subjects[subj].metrics.hourly.length; if (len > maxHours) maxHours = len; });
      const targetHours = Math.ceil(maxHours / 24) * 24; const baseDate = session.exactStartDate ? new Date(session.exactStartDate) : new Date(); baseDate.setMinutes(0, 0, 0); 
      Object.keys(session.subjects).forEach(subj => {
        const rawHourly = session.subjects[subj].metrics.hourly;
        for (let i = 0; i < targetHours; i++) {
          const distanceKm = i < rawHourly.length ? rawHourly[i].distanceKm : 0;
          const currentHourDate = new Date(baseDate.getTime() + i * 60 * 60 * 1000); const rawHour = currentHourDate.getHours();
          const ampm = rawHour >= 12 ? 'PM' : 'AM'; let clockHour = rawHour % 12; clockHour = clockHour ? clockHour : 12;
          const clockTime = `${clockHour < 10 ? '0'+clockHour : clockHour}:00 ${ampm}`;
          const year = currentHourDate.getFullYear(); const month = String(currentHourDate.getMonth() + 1).padStart(2, '0'); const day = String(currentHourDate.getDate()).padStart(2, '0');
          const exactCalendarTime = `${year}-${month}-${day} ${clockTime}`; const studyDay = Math.floor(i / 24) + 1;
          csv += `${session.fileName},${subj},${studyDay},${exactCalendarTime},${rawHour},${clockTime},${distanceKm.toFixed(4)}\n`;
        }
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", "DeltaV_Circadian_Hourly.csv"); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const curSession = sessions[activeSession];
  const curMetrics = curSession && activeSubject ? curSession.subjects[activeSubject]?.metrics : null;

  let dailyChunks = []; let currentChunkData = []; let dayStats = null; let partialDayInfo = null;
  if (curMetrics && curMetrics.hourly) {
    
    const groupedByDate = {};
    curMetrics.hourly.forEach(hourObj => {
      const dateKey = hourObj.label.split(",")[0]; 
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(hourObj);
    });
    dailyChunks = Object.values(groupedByDate);

    const safeIdx = Math.min(activeDayIdx, dailyChunks.length - 1); 
    if (safeIdx !== activeDayIdx) setActiveDayIdx(safeIdx);
    currentChunkData = dailyChunks[safeIdx] || [];
    
    partialDayInfo = detectPartialDay(currentChunkData, lightS, lightE);

    dayStats = {
      dayDist: currentChunkData.reduce((acc, h) => acc + h.distanceKm, 0),
      dayActMin: currentChunkData.reduce((acc, h) => acc + h.activeDurMin, 0),
      dayBouts: currentChunkData.reduce((acc, h) => acc + h.boutCount, 0),
      darkPercent: (() => {
        const light = currentChunkData.filter(h => h.isLight).reduce((acc, h) => acc + h.distanceKm, 0);
        const dark = currentChunkData.filter(h => !h.isLight).reduce((acc, h) => acc + h.distanceKm, 0);
        const total = light + dark; return total > 0 ? (dark / total) * 100 : 0;
      })(),
      dayMeanSpeed: currentChunkData.reduce((acc, h) => acc + h.activeDurMin, 0) > 0 ? (currentChunkData.reduce((acc, h) => acc + (h.meanSpeed * h.activeDurMin), 0) / currentChunkData.reduce((acc, h) => acc + h.activeDurMin, 0)) : 0,
      dayPeakSpeed: currentChunkData.length > 0 ? Math.max(...currentChunkData.map(h => h.meanSpeed)) : 0
    };
  }

  const S = {
    app: { minHeight: "100vh", backgroundColor: T.bg, backgroundImage: `radial-gradient(circle at 50% 0%, ${T.bgPattern1} 0%, ${T.bg} 70%), linear-gradient(0deg, ${T.bgPattern2} 1px, transparent 1px), linear-gradient(90deg, ${T.bgPattern2} 1px, transparent 1px)`, backgroundSize: "100% 100%, 40px 40px, 40px 40px", color: T.text, fontFamily: "'DM Sans', sans-serif", paddingBottom: 60, position: "relative", overflowX: "hidden", transition: "all 0.3s ease" },
    hdr: { padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 },
    wrap: { maxWidth: 1300, margin: "0 auto", padding: "80px 24px 40px 24px" },
    pane: { background: T.paneBg, border: `1px solid ${T.border}`, borderRadius: 24, padding: "32px", backdropFilter: "blur(20px)", boxShadow: `0 0 40px ${T.border.replace('0.15', '0.08').replace('0.2', '0.05')}, inset 0 0 20px ${T.border.replace('0.15', '0.02').replace('0.2', '0.01')}`, transition: "all 0.3s ease" },
    btn: (p, c = T.accent) => ({ background: p ? `linear-gradient(135deg, ${c}dd, ${isDark ? '#0088ff' : '#1d4ed8'}dd)` : (isDark ? `${c}15` : `${c}20`), color: p ? (isDark ? "#02060f" : "#ffffff") : c, border: `1px solid ${c}40`, borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)", boxShadow: p ? `0 8px 32px ${c}40, inset 0 1px 2px rgba(255,255,255,0.3)` : `0 4px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.1)`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textShadow: p ? "none" : (isDark ? `0 0 8px ${c}55` : "none") }),
    georgia: { fontFamily: "'Georgia', serif", fontWeight: "bold" },
    frostedCard: { background: T.cardBg, border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, borderRadius: 20, padding: "32px", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", justifyContent: "center", transition: "all 0.3s ease" }
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.upload-zone:hover { background: ${isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(37, 99, 235, 0.08)'} !important; border-color: ${T.accent} !important; transform: translateY(-2px); } .glass-btn:hover { transform: translateY(-2px); filter: brightness(1.15); } .glass-btn:active { transform: translateY(1px); filter: brightness(0.9); } @keyframes blinkFast { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } } @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .ai-loading-btn { background: linear-gradient(270deg, #a78bfa, #3b82f6, ${T.accent}, #a78bfa) !important; background-size: 300% 300% !important; animation: gradientShift 2s ease infinite !important; border: none !important; color: #ffffff !important; box-shadow: 0 0 20px rgba(167, 139, 250, 0.6) !important; }`}</style>
      
      <div style={{ position: "fixed", top: 120, left: 16, fontSize: 10, color: T.accent, opacity: 0.4, pointerEvents: "none", writingMode: "vertical-rl", fontFamily: "'Fira Code', monospace", letterSpacing: "0.2em" }}>SYS.STATUS // ΔV-LAP NOMINAL // PORT:8080 OK</div>

      <div style={S.hdr}>
        <div style={{ ...S.georgia, fontSize: 18, color: T.text, letterSpacing: "0.05em", textShadow: isDark ? "0 0 10px rgba(255,255,255,0.3)" : "none", transition: "color 0.3s ease" }}>
          Delta<span style={{ color: T.accent, textShadow: isDark ? `0 0 10px ${T.accent}99` : 'none', transition: "color 0.3s ease" }}>V</span> <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Fira Code'", fontWeight: "normal", letterSpacing: "0.1em" }}>[ ΔV-LAP 0.1 ]</span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div onClick={() => setIsDark(!isDark)} style={{ width: 220, height: 42, borderRadius: 30, background: isDark ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)', border: `1px solid ${isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)'}`, boxShadow: isDark ? 'inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 15px rgba(0, 240, 255, 0.05)' : 'inset 0 2px 10px rgba(0,0,0,0.05), 0 4px 15px rgba(37, 99, 235, 0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px', marginRight: 8, transition: 'all 0.4s ease' }} title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <div style={{ position: 'absolute', top: 4, left: isDark ? 106 : 4, width: 108, height: 32, borderRadius: 20, background: isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.95)', boxShadow: isDark ? '0 0 15px rgba(0, 240, 255, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)' : '0 4px 10px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)', zIndex: 1 }} />
            <div style={{ flex: 1, textAlign: 'center', zIndex: 2, fontSize: 13, fontWeight: 600, color: !isDark ? T.accent : T.textMuted, transition: 'color 0.4s ease', userSelect: 'none' }}>Light mode</div>
            <div style={{ flex: 1, textAlign: 'center', zIndex: 2, fontSize: 13, fontWeight: 600, color: isDark ? '#fff' : T.textMuted, textShadow: isDark ? '0 0 8px rgba(255,255,255,0.3)' : 'none', transition: 'color 0.4s ease', userSelect: 'none' }}>Dark mode</div>
          </div>
          {sessions.length > 0 && view !== "upload" && (
             <div style={{ display: "flex", gap: 14 }}>
               <button className="glass-btn" onClick={exportMasterCSV} style={S.btn(false, "#10b981")}>📊 Export Summary</button>
               <button className="glass-btn" onClick={exportCircadianCSV} style={S.btn(false, T.accent)}>🕒 Export Circadian</button>
             </div>
          )}
          {compareSet.length > 0 && view !== "upload" && <button className="glass-btn" onClick={() => setView("compare")} style={S.btn(true, "#f59e0b")}>Compare ({compareSet.length})</button>}
          {view !== "upload" && <button className="glass-btn" onClick={() => { setView("configure"); fileRef.current?.click() }} style={S.btn(false, "#a78bfa")}>+ Add File</button>}
          <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) loadFile(e.target.files[0]); }} />
        </div>
      </div>

      {view === "upload" && (
        <div style={{ ...S.wrap, height: "calc(100vh - 120px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...S.pane, width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, padding: "40px" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 20 }}>
              <div style={{ fontSize: 11, color: T.accent, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 12, fontWeight: 700, fontFamily: "'Fira Code', monospace" }}>[ ΔV-LAP 0.1 ]</div>
              <h1 style={{ ...S.georgia, fontSize: 38, color: T.text, lineHeight: 1.1, marginBottom: 16 }}>Locomotor Analysis<br/>Platform</h1>
              <div style={{ ...S.georgia, fontSize: 18, color: T.textMuted, fontStyle: "italic", marginBottom: 40 }}>Open Source Architecture</div>
              <WorkflowAnimation T={T} isDark={isDark} />
            </div>
            <div className="upload-zone" onClick={() => fileRef.current?.click()} style={{ ...S.frostedCard, border: `1px dashed ${T.border}`, cursor: "pointer", alignItems: "center", textAlign: "center", transition: "all 0.3s ease", minHeight: 350 }}>
              <div style={{ background: isDark ? "rgba(0, 240, 255, 0.1)" : "rgba(37, 99, 235, 0.1)", color: T.accent, padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, marginBottom: 24, border: `1px solid ${T.border}`, fontFamily: "'Fira Code', monospace" }}>v0.1</div>
              <div style={{ fontSize: 48, marginBottom: 16, color: T.accent, filter: `drop-shadow(0 0 10px ${T.accent}88)` }}>☁️</div>
              <div style={{ fontSize: 18, color: T.text, fontWeight: 500, marginBottom: 8 }}>Click or drag & drop CSV files</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Accepts continuous wheel running data</div>
            </div>
          </div>
        </div>
      )}

      {view === "configure" && rawFile && (
        <div style={{ ...S.wrap, maxWidth: 900 }}>
          {!loading ? (
            <>
              <h2 style={{ ...S.georgia, fontSize: 32, marginBottom: 28, color: T.text, textShadow: isDark ? "0 0 20px rgba(255,255,255,0.2)" : "none" }}>{rawFile.name}</h2>
              <div style={{ ...S.pane, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 20, marginBottom: 30 }}>
                {[['TIMESTAMP', tsCol, setTsCol, headers], ['SUBJECT', subjCol, setSubjCol, ['__none__', ...headers]]].map(([label, val, setVal, opts], idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginBottom: 8, letterSpacing: "0.1em" }}>{label}</div>
                    <select value={val} onChange={e => setVal(e.target.value)} style={{ width: "100%", background: isDark ? "rgba(0,0,0,0.5)" : "#fff", border: `1px solid ${T.border}`, borderRadius: 8, color: T.accent, padding: "12px", outline: "none", transition: "all 0.3s ease" }}>
                      {opts.map(h => <option key={h} value={h}>{h === '__none__' ? '— None (Auto) —' : h}</option>)}
                    </select>
                  </div>
                ))}
                {[['LIGHT START', lightS, setLightS], ['LIGHT END', lightE, setLightE]].map(([label, val, setVal], idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginBottom: 8, letterSpacing: "0.1em" }}>{label}</div>
                    <input type="number" value={val} onChange={e => setVal(+e.target.value)} style={{ width: "100%", background: isDark ? "rgba(0,0,0,0.5)" : "#fff", border: `1px solid ${T.border}`, borderRadius: 8, color: T.accent, padding: "12px", outline: "none", transition: "all 0.3s ease" }} />
                  </div>
                ))}
              </div>
              <button className="glass-btn" onClick={buildSession} style={S.btn(true)}>Extract Data →</button>
            </>
          ) : (
             <div style={{ ...S.pane, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
              <WorkflowAnimation T={T} isDark={isDark} />
              <div style={{ marginTop: 32, fontSize: 14, color: T.accent, fontFamily: "'Fira Code', monospace", letterSpacing: "0.2em", fontWeight: 700, animation: "blinkFast 1s infinite" }}>EXTRACTING KINEMATIC DATA...</div>
            </div>
          )}
        </div>
      )}

      {view === "analyse" && curMetrics && (
        <div style={S.wrap}>
          <div style={{ display: "flex", gap: 28 }}>
            <div style={{ width: 240, flexShrink: 0 }}>
              {sessions.length > 1 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Loaded Files</div>
                  {sessions.map((s, i) => (
                    <div key={i} onClick={() => { setActiveSession(i); setActiveSubject(Object.keys(s.subjects)[0]); setActiveDayIdx(0); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, marginBottom: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, background: activeSession === i ? (isDark ? "rgba(0, 240, 255, 0.1)" : "rgba(37, 99, 235, 0.1)") : "transparent", color: activeSession === i ? T.accent : T.textMuted, border: activeSession === i ? `1px solid ${T.border}` : "1px solid transparent", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}><span>📄</span><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.fileName}</span></div>
                      <button onClick={(e) => removeSession(e, i)} style={{ background: "transparent", border: activeSession === i ? `1px solid ${T.accent}` : `1px solid ${T.textMuted}55`, color: activeSession === i ? T.accent : T.textMuted, width: 24, height: 24, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer" }} title="Remove file">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Subjects</div>
              {Object.keys(curSession.subjects).map((sid) => {
                const cmp = inCompare(activeSession, sid);
                const active = sid === activeSubject;
                return (
                  <div key={sid} style={{ marginBottom: 8 }}>
                    <div onClick={() => setActiveSubject(sid)} style={{ padding: "12px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 500, background: active ? (isDark ? "rgba(0, 240, 255, 0.15)" : "rgba(37, 99, 235, 0.1)") : (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"), border: active ? `1px solid ${T.border}` : `1px solid ${T.grid}`, color: active ? T.accent : T.text, marginBottom: 6, transition: "all 0.2s" }}>{sid}</div>
                    <div onClick={() => toggleCompare(activeSession, sid)} style={{ marginLeft: 6, padding: "4px 12px", fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: "pointer", background: cmp ? "rgba(245, 158, 11, 0.15)" : "transparent", color: cmp ? "#f59e0b" : T.textMuted, border: cmp ? "1px solid rgba(245, 158, 11, 0.3)" : `1px solid ${T.grid}`, display: "inline-block" }}>{cmp ? "✓ Comparing" : "+ Compare"}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid ${T.border}`, paddingBottom: 20, marginBottom: 24, transition: "all 0.3s ease" }}>
                
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h2 style={{ ...S.georgia, fontSize: 34, margin: 0, color: T.text }}>{activeSubject}</h2>
                  {partialDayInfo?.isPartial && (
                    <PartialDayBadge 
                      message={partialDayInfo.message} 
                      hoursRecorded={partialDayInfo.hoursRecorded} 
                      isDark={isDark}
                    />
                  )}
                </div>

                {dailyChunks.length > 1 && (
                  <div style={{ display: "flex", background: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.8)", borderRadius: 10, border: `1px solid ${T.border}`, padding: "4px" }}>
                    {dailyChunks.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveDayIdx(idx)} style={{ padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: activeDayIdx === idx ? 700 : 500, cursor: "pointer", background: activeDayIdx === idx ? (isDark ? "rgba(0, 240, 255, 0.15)" : "rgba(37, 99, 235, 0.15)") : "transparent", color: activeDayIdx === idx ? T.accent : T.textMuted, transition: "all 0.2s" }}>Day {idx + 1}</button>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
                <Stat label={`Day ${activeDayIdx + 1} Distance`} value={dayStats.dayDist.toFixed(3)} unit="km" color={T.accent} isDark={isDark} />
                <Stat label="Active Duration" value={dayStats.dayActMin.toFixed(1)} unit="min" color="#10b981" isDark={isDark} />
                <Stat label="Bout Count" value={dayStats.dayBouts} unit="" color="#f59e0b" isDark={isDark} />
                <Stat label="Mean Speed" value={dayStats.dayMeanSpeed.toFixed(2)} unit="m/min" color="#a78bfa" isDark={isDark} />
                <Stat label="Peak Speed" value={dayStats.dayPeakSpeed.toFixed(2)} unit="m/min" color="#ef4444" isDark={isDark} />
                <Stat label="NOCTURNAL ALIGNMENT" value={dayStats.darkPercent.toFixed(1)} unit="%" color="#fb923c" isDark={isDark} />
              </div>
              
              <div style={S.pane}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 20, color: T.accent, letterSpacing: "0.1em" }}>24-HOUR DISTANCE PROFILE (KM)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart margin={{ top: 20, right: 20, bottom: 40, left: 0 }} data={currentChunkData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 9, fontFamily: "'Fira Code', monospace" }} interval="preserveStartEnd" minTickGap={25} axisLine={{ stroke: T.grid }} tickLine={{ stroke: T.grid }} angle={-35} textAnchor="end" dy={10} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "'Fira Code', monospace" }} axisLine={false} tickLine={false} width={40} dx={-10} />
                    <Tooltip content={<Tip isDark={isDark} />} cursor={{fill: isDark ? 'rgba(0, 240, 255, 0.05)' : 'rgba(37, 99, 235, 0.05)'}} />
                    <Bar dataKey="distanceKm" name="Distance (km)" radius={[4, 4, 0, 0]}>
                      {currentChunkData.map((h, i) => <Cell key={i} fill={h.isLight ? "rgba(245, 158, 11, 0.6)" : T.accent} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "compare" && compareSet.length > 0 && (
        <div style={S.wrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <div style={{ ...S.georgia, fontSize: 32, color: T.text, marginBottom: 6, transition: "color 0.3s ease" }}>Cross-Subject Comparison</div>
              <div style={{ fontSize: 14, color: T.textMuted, fontWeight: 400, transition: "color 0.3s ease" }}>Full continuous timeline overlay</div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <button className={`glass-btn ${summarizing ? "ai-loading-btn" : ""}`} onClick={generateSummary} disabled={summarizing} style={S.btn(true, "#a78bfa")}>
                {summarizing ? "✨ Extracting insights..." : "✨ Ask AI to Summarize"}
              </button>
              <button className="glass-btn" onClick={() => setView("analyse")} style={S.btn(false, T.textMuted)}>← Back to Dashboard</button>
            </div>
          </div>

          {/* ─── THE NEW AI MARKDOWN UI RENDERER ─── */}
          {aiSummary && (
            <div style={{ background: isDark ? "rgba(10, 8, 25, 0.8)" : "rgba(255, 255, 255, 0.9)", border: "1px solid rgba(167, 139, 250, 0.4)", borderRadius: 16, padding: "32px 36px", marginBottom: 24, boxShadow: "0 0 30px rgba(167, 139, 250, 0.15)", backdropFilter: "blur(12px)", transition: "all 0.3s ease" }}>
              <div style={{ color: T.text, fontSize: 15, lineHeight: 1.8, fontWeight: 400 }}>
                {aiSummary.split('\n').map((line, i) => (
                  <div key={i} style={{ 
                    minHeight: line.trim() === "" ? "1.2rem" : "auto", 
                    marginBottom: line.trim() === "" ? 0 : "6px" 
                  }}>
                    {line.split('**').map((part, j) => 
                      j % 2 === 1 
                        ? <strong key={j} style={{ color: isDark ? "#fff" : "#000", fontWeight: 700, letterSpacing: "0.02em" }}>{part}</strong> 
                        : part
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={S.pane}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 20, color: T.accent, letterSpacing: "0.1em" }}>OVERLAID KINEMATIC TRENDS</div>
            <ResponsiveContainer width="100%" height={450}>
              <LineChart margin={{ top: 20, right: 30, bottom: 40, left: 10 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.grid} vertical={true} />
                <XAxis dataKey="label" type="category" allowDuplicatedCategory={false} tick={{ fill: T.textMuted, fontSize: 9, fontFamily: "'Fira Code', monospace" }} interval="preserveStartEnd" minTickGap={40} axisLine={{ stroke: T.grid }} tickLine={{ stroke: T.grid }} angle={-35} textAnchor="end" dy={15} />
                <YAxis tick={{ fill: T.textMuted, fontSize: 10, fontFamily: "'Fira Code', monospace" }} axisLine={false} tickLine={false} width={50} dx={-10} />
                <Tooltip content={<Tip isDark={isDark} />} cursor={{ stroke: T.border, strokeWidth: 2 }} />
                <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: 12, color: T.textMuted, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }} />
                {compareSet.map(({ key, sessIdx, subjectId, color }) => {
                  const m = sessions[sessIdx]?.subjects[subjectId]?.metrics;
                  if (!m) return null;
                  return <Line key={key} data={m.hourly} dataKey="distanceKm" name={`${sessions[sessIdx].fileName.replace('.csv','')} - ${subjectId}`} stroke={color} strokeWidth={1.5} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: color }} type="monotone" style={{ filter: `drop-shadow(0px 2px 4px ${color}44)` }} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}