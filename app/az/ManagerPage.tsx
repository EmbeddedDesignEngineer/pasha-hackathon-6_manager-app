"use client";

import { useState, useEffect, useRef, CSSProperties, FC } from "react";
import {
    Package, SprayCan, Scan, Truck, Clock, MapPin, Bell,
    Search, Eye, UserCheck, AlertTriangle, Users,
    Thermometer, Activity, Plus, CheckCircle2, Circle,
    X, Zap, BarChart3, ClipboardList, User, Coffee,
    LucideIcon,
} from "lucide-react";

const F = "var(--font-heading), system-ui, sans-serif";

// ─── TYPES ───
type Priority = "critical" | "high" | "medium" | "low";
type Source = "cv" | "fixed" | "manager";
type EmployeeStatus = "busy" | "idle" | "break";
type TabId = "activity" | "tasks" | "alerts" | "overview";
type AlertType = "temperature" | "crowd" | "stockout" | "expiry" | "spill" | "security";

interface PriorityColor {
    bg: string;
    fg: string;
    dt: string;
}

interface StatusMeta {
    c: string;
    bg: string;
    l: string;
}

interface Employee {
    id: string;
    nm: string;
    rl: string;
    st: EmployeeStatus;
    av: string;
    tsk: string | null;
    pri: Priority | null;
    dn: number;
}

interface Task {
    id: string;
    tl: string;
    pr: Priority;
    sr: Source;
    lc: string;
    tm: string;
    em: string;
}

interface Alert {
    id: string;
    tp: AlertType;
    tl: string;
    sv: Priority;
    ag: string;
    dt: string;
}

interface FilterOption {
    k: string;
    l: string;
    i?: LucideIcon;
}

interface TabDef {
    id: TabId;
    lb: string;
    ic: LucideIcon;
}

// ─── PALETTE ───
const C = {
    bg: "#f1f6f2", surface: "#ffffff", surfDim: "#f7faf8",
    brd: "rgba(0,70,28,0.07)", brdM: "rgba(0,70,28,0.12)",
    g800: "#005c2e", g700: "#00843D", g600: "#009e49", g500: "#1ab05e",
    g400: "#4ec97f", g200: "#a8e6c3", g100: "#dbf2e6", g50: "#f0faf4",
    tx: "#0b1f13", txS: "#436b52", txM: "#7a9985",
    red: "#dc3545", amber: "#e8910c", blue: "#1a7bdb",
} as const;

const PRI: Record<Priority, PriorityColor> = {
    critical: { bg: "#fef2f2", fg: "#dc2626", dt: "#dc2626" },
    high:     { bg: "#fff7ed", fg: "#ea580c", dt: "#ea580c" },
    medium:   { bg: "#fefce8", fg: "#ca8a04", dt: "#ca8a04" },
    low:      { bg: "#f0fdf4", fg: "#16a34a", dt: "#16a34a" },
};

const PRI_AZ: Record<Priority, string> = {
    critical: "Kritik",
    high: "Yüksək",
    medium: "Orta",
    low: "Aşağı",
};

const ST: Record<EmployeeStatus, StatusMeta> = {
    busy:  { c: C.red,  bg: "rgba(220,53,69,.08)", l: "İşdə" },
    idle:  { c: C.g600, bg: "rgba(0,158,73,.08)",  l: "Boş" },
    break: { c: C.blue, bg: "rgba(26,123,219,.08)", l: "Fasilə" },
};

const SI: Record<Source, LucideIcon> = { cv: Eye, fixed: Clock, manager: UserCheck };
const SL: Record<Source, string> = { cv: "AI Görmə", fixed: "Rutin", manager: "Menecer" };

const AI_I: Record<string, LucideIcon> = {
    temperature: Thermometer,
    crowd: Users,
    stockout: Package,
    expiry: Clock,
    spill: AlertTriangle,
    security: Eye,
};

const PO: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const LOGO = "https://www.bravosupermarket.az/site/templates/img/newLogo.png";

// ─── DATA (AZ) ───
const EMP: Employee[] = [
    { id: "e1", nm: "Əli Həsənov",    rl: "Mərtəbə rəhbəri",  st: "busy",  av: "ƏH", tsk: "Süd soyuducusu B3 doldur",       pri: "critical", dn: 7 },
    { id: "e2", nm: "Leyla Quliyeva",  rl: "Anbar əməkdaşı",   st: "idle",  av: "LQ", tsk: null,                              pri: null,       dn: 4 },
    { id: "e3", nm: "Rəşad Məmmədov",  rl: "Anbar əməkdaşı",   st: "busy",  av: "RM", tsk: "Quba Broyler çatdırılmasını qəbul et", pri: "high", dn: 5 },
    { id: "e4", nm: "Nigar Əliyeva",   rl: "Kassa rəhbəri",    st: "break", av: "NƏ", tsk: null,                              pri: null,       dn: 3 },
    { id: "e5", nm: "Tural Babayev",   rl: "Təmizlik işçisi",   st: "busy",  av: "TB", tsk: "Delikates piştaxtasını təmizlə",  pri: "high",     dn: 6 },
    { id: "e6", nm: "Günel Hüseynova", rl: "Anbar əməkdaşı",   st: "idle",  av: "GH", tsk: null,                              pri: null,       dn: 2 },
];

const TSK: Task[] = [
    { id: "t1",  tl: "Kassa 3-ü aç",                            pr: "critical", sr: "cv",      lc: "Rəf B3",        tm: "09:30", em: "e1" },
    { id: "t21", tl: "Çəki bölməsi — müştəriyə kömək et",       pr: "critical", sr: "cv",     lc: "Bütün rəflər",  tm: "09:00", em: "e1" },
    { id: "t15", tl: "Quba Broyler çatdırılmasını qəbul et",    pr: "critical", sr: "fixed", lc: "Yükləmə yeri",  tm: "12:30", em: "e3" },
    { id: "t2",  tl: "Tərəvəz bölməsi dumanlamasını təmizlə",   pr: "high",  sr: "manager", lc: "Tərəvəz",      tm: "10:00", em: "e1" },
    { id: "t11", tl: "Delikates piştaxtasını dərindən təmizlə", pr: "high", sr: "manager", lc: "Delikates",    tm: "09:00", em: "e5" },
    { id: "t20", tl: "Təzə meyvə-tərəvəz çatdırılması",         pr: "high",     sr: "fixed",   lc: "Yükləmə yeri",  tm: "08:00", em: "e1" },
    { id: "t19", tl: "Atena pendir stendini doldur",            pr: "medium",   sr: "manager", lc: "Süd B1",        tm: "14:30", em: "e2" },
    { id: "t12", tl: "Rəf qiymət etiketlərini yoxla",           pr: "low",      sr: "fixed",   lc: "Rəf C1-C4",    tm: "15:00", em: "e6" },
];

const ALRT: Alert[] = [
    { id: "a1", tp: "crowd",       tl: "Kassada sıxlıq — 5-ci xətti açın",      sv: "critical", ag: "2 dəq", dt: "1-3 xətlərində növbə 8 nəfərdən çoxdur." },
    { id: "a2", tp: "temperature", tl: "Dondurucu 2 temperaturu -14°C-yə qalxıb", sv: "critical", ag: "5 dəq", dt: "Hədd -18°C. Kompressor problem." },
    { id: "a3", tp: "stockout",    tl: "Milla Kefir 500ml — rəf boşdur",          sv: "high",     ag: "8 dəq", dt: "Son satış 22 dəq əvvəl. Seqment B3-04." },
    { id: "a4", tp: "expiry",      tl: "12 süd məhsulunun müddəti 24 saat qalıb",  sv: "high",     ag: "12 dəq", dt: "Endirim tövsiyə olunur." },
];

// ─── COMPONENT ───
export default function ManagerPage() {
    const [tab, setTab] = useState<TabId>("activity");
    const [selE, setSelE] = useState<string | null>(null);
    const [flt, setFlt] = useState<string>("all");
    const [q, setQ] = useState<string>("");
    const [now, setNow] = useState<Date | null>(null);
    const [toast, setToast] = useState<Alert | null>(null);
    const [tVis, setTVis] = useState<boolean>(false);
    const ai = useRef<number>(0);

    useEffect(() => {
        new Date();
        const i = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        const i = setInterval(() => {
            const a = ALRT[ai.current % ALRT.length];
            ai.current++;
            setToast(a);
            setTVis(true);
            setTimeout(() => setTVis(false), 3500);
            setTimeout(() => setToast(null), 4000);
        }, 18000);
        return () => clearInterval(i);
    }, []);

    const tm = now ? now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "--:--";

    const ft = TSK
        .filter((t) => flt === "all" || (flt === "critical" ? t.pr === "critical" : t.sr === flt))
        .filter((t) => !selE || t.em === selE)
        .filter((t) => !q || t.tl.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => PO[a.pr] - PO[b.pr]);

    const tabs: TabDef[] = [
        { id: "activity", lb: "Aktivlik", ic: Users },
        { id: "tasks",    lb: "Tapşırıqlar", ic: ClipboardList },
        { id: "alerts",   lb: "Xəbərdarlıq", ic: Zap },
        { id: "overview", lb: "İcmal", ic: BarChart3 },
    ];

    return (
        <div style={{ minHeight: "100vh", background: C.bg, fontFamily: F, color: C.tx, position: "relative", display: "flex", flexDirection: "column" }}>
            <style>{`
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:0}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

            {/* HEADER */}
            <div style={{ background: C.g700, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 60 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                        src={LOGO}
                        alt="Bravo"
                        style={{ height: 34, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>Menecer</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontWeight: 500, marginTop: 1 }}>Koroğlu Hiper • {tm}</div>
                    </div>
                </div>
                <div onClick={() => setTab("alerts")} style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
                    <Bell size={17} color="#fff" />
                    <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: "#ef4444", border: `2px solid ${C.g700}` }} />
                </div>
            </div>

            {/* TOAST */}
            {toast && (
                <div style={{
                    position: "absolute", top: tVis ? 60 : -80, left: 12, right: 12, zIndex: 200,
                    background: C.surface, borderRadius: 14, padding: "10px 14px",
                    border: `1px solid ${PRI[toast.sv]?.dt || C.brdM}30`,
                    boxShadow: "0 8px 28px rgba(0,30,14,.12)", transition: "top .4s cubic-bezier(.34,1.56,.64,1)",
                    display: "flex", alignItems: "center", gap: 10,
                }}>
                    {(() => { const Ic = AI_I[toast.tp] || AlertTriangle; return <div style={{ width: 30, height: 30, borderRadius: 8, background: PRI[toast.sv]?.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic size={14} color={PRI[toast.sv]?.fg} /></div>; })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.g700, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Xəbərdarlıq</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toast.tl}</div>
                    </div>
                </div>
            )}

            {/* CONTENT */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>

                {/* ─ AKTİVLİK ─ */}
                {tab === "activity" && <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                        {([
                            { v: EMP.filter((e) => e.st === "busy").length, l: "İşdə", c: C.red },
                            { v: EMP.filter((e) => e.st === "idle").length, l: "Boş", c: C.g600 },
                            { v: EMP.filter((e) => e.st === "break").length, l: "Fasilə", c: C.blue },
                        ] as const).map((s, i) => (
                            <div key={i} style={{ flex: 1, background: C.surface, borderRadius: 12, padding: "10px", border: `1px solid ${C.brd}`, textAlign: "center" }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: C.txM, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.txM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>İşçi aktivliyi</div>
                    {EMP.map((e, i) => { const m = ST[e.st]; return (
                        <div key={e.id} onClick={() => { setSelE(e.id); setTab("tasks"); }} style={{
                            background: C.surface, borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                            border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 12,
                            cursor: "pointer", animation: `fu .25s ease ${i * 0.04}s both`,
                        }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.c, flexShrink: 0, animation: e.st === "busy" ? "pu 2s infinite" : "none", boxShadow: `0 0 0 3px ${m.c}18` }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>{e.nm}</div>
                                <div style={{ fontSize: 11, color: C.txM, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.tsk || e.rl}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                {e.pri && <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: PRI[e.pri]?.bg, color: PRI[e.pri]?.fg, textTransform: "uppercase" }}>{PRI_AZ[e.pri]}</div>}
                                <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: m.bg, color: m.c, textTransform: "uppercase" }}>{m.l}</div>
                            </div>
                        </div>
                    ); })}
                </div>}

                {/* ─ TAPŞIRIQLAR ─ */}
                {tab === "tasks" && <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: C.g700 }}>
                            Tapşırıq siyahısı
                            {selE && <span style={{ fontSize: 12, fontWeight: 500, color: C.txM, marginLeft: 6 }}>
                — {EMP.find((e) => e.id === selE)?.nm}
                                <span onClick={(ev) => { ev.stopPropagation(); setSelE(null); }} style={{ marginLeft: 4, cursor: "pointer", color: C.red, fontSize: 11 }}>✕</span>
              </span>}
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.g700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={16} color="#fff" /></div>
                    </div>
                    <div style={{ background: C.surface, borderRadius: 11, padding: "8px 12px", border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Search size={14} color={C.txM} />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tapşırıq axtar…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: C.tx, width: "100%", fontFamily: F }} />
                    </div>
                    <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
                        {([
                            { k: "all", l: "Hamısı" },
                            { k: "critical", l: "Kritik" },
                            { k: "cv", l: "AI Görmə", i: Eye },
                            { k: "fixed", l: "Rutin", i: Clock },
                            { k: "manager", l: "Menecer", i: UserCheck },
                        ] as FilterOption[]).map((f) => {
                            const on = flt === f.k;
                            return <div key={f.k} onClick={() => setFlt(f.k)} style={{
                                padding: "4px 11px", borderRadius: 18, fontSize: 11, fontWeight: 600, cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap", flexShrink: 0,
                                background: on ? C.g700 : C.surface, color: on ? "#fff" : C.txS,
                                border: `1px solid ${on ? C.g700 : C.brdM}`, transition: "all .15s",
                            }}>{f.i && <f.i size={10} />}{f.l}</div>;
                        })}
                    </div>
                    {ft.map((t, i) => { const pc = PRI[t.pr]; const Ic = SI[t.sr]; const emp = EMP.find((e) => e.id === t.em); return (
                        <div key={t.id} style={{
                            background: C.surface, borderRadius: 13, padding: "11px 13px", marginBottom: 7,
                            border: `1px solid ${C.brd}`, borderLeft: `3px solid ${pc.dt}`,
                            animation: `fu .2s ease ${i * 0.025}s both`, display: "flex", alignItems: "center", gap: 10,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.tl}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: pc.bg, color: pc.fg, textTransform: "uppercase" }}>{PRI_AZ[t.pr]}</span>
                                    <span style={{ fontSize: 10, color: C.txM, display: "flex", alignItems: "center", gap: 2 }}><Ic size={9} />{SL[t.sr]}</span>
                                    <span style={{ fontSize: 10, color: C.txM, display: "flex", alignItems: "center", gap: 2 }}><MapPin size={8} />{t.lc}</span>
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                {emp && <div style={{ width: 24, height: 24, borderRadius: 7, background: C.g100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: C.g700 }}>{emp.av}</div>}
                                <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: C.g700, color: "#fff" }}>{t.tm}</div>
                            </div>
                        </div>
                    ); })}
                    {ft.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.txM, fontSize: 13 }}>Filterə uyğun tapşırıq yoxdur.</div>}
                </div>}

                {/* ─ XƏBƏRDARLIQLAR ─ */}
                {tab === "alerts" && <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.g700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Zap size={16} color={C.g600} /> AI Görmə Xəbərdarlıqları</div>
                    {ALRT.map((a, i) => { const Ic = AI_I[a.tp] || AlertTriangle; const pc = PRI[a.sv] || PRI.medium; return (
                        <div key={a.id} style={{ background: C.surface, borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.brd}`, borderLeft: `3px solid ${pc.dt}`, animation: `fu .25s ease ${i * 0.04}s both` }}>
                            <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: pc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic size={15} color={pc.fg} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{a.tl}</div>
                                    <div style={{ fontSize: 11, color: C.txM, marginTop: 3, lineHeight: 1.4 }}>{a.dt}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: pc.bg, color: pc.fg, textTransform: "uppercase" }}>{PRI_AZ[a.sv]}</span>
                                        <span style={{ fontSize: 10, color: C.txM }}>{a.ag} əvvəl</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ); })}
                </div>}

                {/* ─ İCMAL ─ */}
                {tab === "overview" && <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.g700, marginBottom: 12 }}>Mağaza icmalı</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                        {([
                            { l: "Tapşırıqlar", v: TSK.length, c: C.g700, i: ClipboardList },
                            { l: "Kritik", v: TSK.filter((t) => t.pr === "critical").length, c: C.red, i: AlertTriangle },
                            { l: "İşçilər", v: EMP.length, c: C.g600, i: Users },
                            { l: "Xəbərdarlıqlar", v: ALRT.length, c: C.amber, i: Zap },
                        ] as { l: string; v: number; c: string; i: LucideIcon }[]).map((s, i) => (
                            <div key={i} style={{ background: C.surface, borderRadius: 13, padding: "14px", border: `1px solid ${C.brd}` }}>
                                <s.i size={16} color={s.c} style={{ marginBottom: 6 }} />
                                <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: C.txM, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.txM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Komanda</div>
                    {EMP.map((e) => { const m = ST[e.st]; return (
                        <div key={e.id} style={{ background: C.surface, borderRadius: 12, padding: "10px 12px", marginBottom: 6, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.g100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.g700 }}>{e.av}</div>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{e.nm}</div><div style={{ fontSize: 10, color: C.txM }}>{e.rl}</div></div>
                            <div style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: m.bg, color: m.c, textTransform: "uppercase" }}>{m.l}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.g700, width: 20, textAlign: "center" }}>{e.dn}</div>
                        </div>
                    ); })}
                </div>}
            </div>

            {/* TAB BAR */}
            <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0, height: 60,
                background: "rgba(255,255,255,.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 100,
            }}>
                {tabs.map((t) => { const on = tab === t.id; return (
                    <div key={t.id} onClick={() => setTab(t.id)} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        padding: "6px 12px", borderRadius: 12, cursor: "pointer",
                        background: on ? C.g50 : "transparent", transition: "all .2s",
                    }}>
                        <t.ic size={19} color={on ? C.g700 : C.txM} strokeWidth={on ? 2.2 : 1.8} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: on ? C.g700 : C.txM, textTransform: "uppercase", letterSpacing: 0.3 }}>{t.lb}</span>
                    </div>
                ); })}
            </div>
        </div>
    );
}