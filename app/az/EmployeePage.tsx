"use client";

import { useState, useEffect, useRef, FC } from "react";
import {
    Package, Clock, MapPin, Play, CheckCheck, Coffee, Eye,
    UserCheck, Pause, RotateCcw, CheckCircle2, Zap,
    ClipboardList, User, AlertTriangle, LucideIcon,
} from "lucide-react";

const ff = "var(--font-body), system-ui, sans-serif";
const fh = "var(--font-heading), sans-serif";

const LOGO = "https://www.bravosupermarket.az/site/templates/img/newLogo.png";

// ─── TYPES ───
type Priority = "critical" | "high" | "medium" | "low";
type Source = "cv" | "fixed" | "manager";
type TaskStatus = "current" | "queued";
type TabId = "queue" | "break" | "done" | "profile";

interface PriorityColor {
    bg: string;
    fg: string;
    d: string;
}

interface TaskItem {
    id: string;
    tl: string;
    pr: Priority;
    sr: Source;
    lc: string;
    tm: string;
    st: TaskStatus;
}

interface DoneItem {
    id: string;
    tl: string;
    at: string;
}

interface TabDef {
    id: TabId;
    lb: string;
    ic: LucideIcon;
}

// ─── PALETTE ───
const C = {
    bg: "#f1f6f2", sf: "#ffffff", sfD: "#f7faf8",
    b: "rgba(0,70,28,0.07)", bM: "rgba(0,70,28,0.12)",
    g8: "#005c2e", g7: "#00843D", g6: "#009e49", g5: "#1ab05e",
    g4: "#4ec97f", g2: "#a8e6c3", g1: "#dbf2e6", g0: "#f0faf4",
    tx: "#0b1f13", ts: "#436b52", tm: "#7a9985",
    rd: "#dc3545", am: "#e8910c", bl: "#1a7bdb",
} as const;

const P: Record<Priority, PriorityColor> = {
    critical: { bg: "#fef2f2", fg: "#dc2626", d: "#dc2626" },
    high:     { bg: "#fff7ed", fg: "#ea580c", d: "#ea580c" },
    medium:   { bg: "#fefce8", fg: "#ca8a04", d: "#ca8a04" },
    low:      { bg: "#f0fdf4", fg: "#16a34a", d: "#16a34a" },
};

const PL: Record<Priority, string> = {
    critical: "Təcili",
    high: "Yüksək",
    medium: "Orta",
    low: "Aşağı",
};

const SI: Record<Source, LucideIcon> = { cv: Eye, fixed: Clock, manager: UserCheck };
const SL: Record<Source, string> = { cv: "AI Görmə", fixed: "Rutin", manager: "Menecer" };

// ─── DATA ───
const initTasks = (): TaskItem[] => [
    { id: "t1",  tl: "Kassa 3-ü aç",       pr: "critical", sr: "cv",      lc: "Rəf B3",       tm: "09:30", st: "current" },
    { id: "t20", tl: "Təzə meyvə-tərəvəz göndərisini al",  pr: "high",     sr: "fixed",   lc: "Yükləmə yeri", tm: "08:00", st: "queued" },
    { id: "t3",  tl: "Soyuq zəncir temperaturunu yoxla",    pr: "critical", sr: "fixed",   lc: "Soyuq anbar",  tm: "08:00", st: "queued" },
    { id: "t2",  tl: "Meyvə-tərəvəz spreylərini təmizlə",  pr: "high",     sr: "manager", lc: "Tərəvəz",      tm: "10:00", st: "queued" },
    { id: "t21", tl: "Çəki bölməsi — müştəriyə kömək et", pr: "critical", sr: "cv",     lc: "Bütün rəflər", tm: "09:00", st: "queued" }
];

const initDone = (): DoneItem[] => [
    { id: "t4",  tl: "Səhər çörək göndərisini qəbul et", at: "06:28" },
    { id: "t10", tl: "Azərçay rəfini doldur",             at: "08:25" },
];

const BREAK_S = 5 * 60;
const R = 62;
const CIRC = 2 * Math.PI * R;

// ─── COMPONENT ───
export default function EmployeePage() {
    const [tab, setTab] = useState<TabId>("queue");
    const [tasks, setTasks] = useState<TaskItem[]>(initTasks);
    const [done, setDone] = useState<DoneItem[]>(initDone);
    const [fadId, setFadId] = useState<string | null>(null);
    const [now, setNow] = useState<Date | null>(null);

    const [brk, setBrk] = useState<boolean>(false);
    const [brkP, setBrkP] = useState<boolean>(false);
    const [brkR, setBrkR] = useState<number>(BREAK_S);
    const brkIv = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setNow(new Date());
        const i = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        if (brk && !brkP && brkR > 0) {
            brkIv.current = setInterval(() => {
                setBrkR((p) => {
                    if (p <= 1) {
                        clearInterval(brkIv.current!);
                        setBrk(false);
                        return BREAK_S;
                    }
                    return p - 1;
                });
            }, 1000);
        }
        return () => {
            if (brkIv.current) clearInterval(brkIv.current);
        };
    }, [brk, brkP, brkR]);

    const startB = (): void => { setBrk(true); setBrkP(false); setBrkR(BREAK_S); };
    const pauseB = (): void => setBrkP(true);
    const resumeB = (): void => setBrkP(false);
    const resetB = (): void => { setBrk(false); setBrkP(false); setBrkR(BREAK_S); };
    const fmtT = (s: number): string => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    const prog = 1 - brkR / BREAK_S;

    const cur = tasks.find((t) => t.st === "current") ?? null;
    const queued = tasks.filter((t) => t.st === "queued");

    const complete = (): void => {
        if (!cur) return;
        setFadId(cur.id);
        setTimeout(() => {
            const n = new Date();
            const ts = `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`;
            setDone((p) => [{ id: cur.id, tl: cur.tl, at: ts }, ...p]);
            setTasks((p) => {
                const rem = p.filter((t) => t.id !== cur.id);
                if (rem.length) rem[0] = { ...rem[0], st: "current" };
                return rem;
            });
            setFadId(null);
        }, 350);
    };

    const tmStr = now ? now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" }) : "--:--";
    const dtStr = now ? now.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

    const tabs_list: TabDef[] = [
        { id: "queue",   lb: "Növbə",    ic: ClipboardList },
        { id: "break",   lb: "Fasilə",   ic: Coffee },
        { id: "done",    lb: "Bitən",    ic: CheckCircle2 },
        { id: "profile", lb: "Profil",   ic: User },
    ];

    return (
        <div style={{ minHeight: "100vh", background: C.bg, fontFamily: ff, color: C.tx, position: "relative", display: "flex", flexDirection: "column" }}>
            <style>{`
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:0}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fo{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(60px)}}
        @keyframes pu{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes br{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
      `}</style>

            {/* HEADER */}
            <div style={{ background: C.g7, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 60 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={LOGO} alt="Bravo" style={{ height: 30, filter: "brightness(0) invert(1)", objectFit: "contain" }} />
                    <div>
                        <div style={{ fontFamily: fh, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>Əli Həsənov</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontWeight: 600 }}>Mərtəbə rəhbəri • Koroğlu</div>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.15)", borderRadius: 10, padding: "5px 12px" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>Aktiv</span>
                </div>
            </div>

            {/* STATS */}
            <div style={{ display: "flex", gap: 8, padding: "12px 14px" }}>
                {([
                    { v: queued.length, l: "Növbə", c: C.g7 },
                    { v: done.length, l: "Bitən", c: C.g6 },
                    // { v: tmStr, l: "Vaxt", c: C.ts },
                ] as { v: number | string; l: string; c: string }[]).map((s, i) => (
                    <div key={i} style={{ flex: 1, background: C.sf, borderRadius: 12, padding: "10px", border: `1px solid ${C.b}`, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.c, fontFamily: fh }}>{s.v}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.tm, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
                    </div>
                ))}
            </div>

            {/* CONTENT */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>

                {/* ─ NÖVBƏ ─ */}
                {tab === "queue" && <div style={{ padding: "0 14px 14px" }}>
                    {cur && <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.tm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: fh }}>Cari tapşırıq</div>
                        <div style={{
                            background: C.sf, borderRadius: 16, padding: "14px 16px", marginBottom: 14,
                            border: `2px solid ${C.g4}50`, boxShadow: `0 2px 12px ${C.g4}12`,
                            animation: fadId === cur.id ? "fo .35s ease forwards" : "fu .3s ease",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: P[cur.pr].d, animation: "pu 2s infinite", boxShadow: `0 0 0 3px ${P[cur.pr].d}20` }} />
                                <div style={{ fontSize: 15, fontWeight: 700, color: C.tx, flex: 1 }}>{cur.tl}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: P[cur.pr].bg, color: P[cur.pr].fg, textTransform: "uppercase" }}>{PL[cur.pr]}</span>
                                <span style={{ fontSize: 10, color: C.tm, display: "flex", alignItems: "center", gap: 2 }}>
                  {(() => { const I = SI[cur.sr]; return <I size={10} />; })()}{SL[cur.sr]}
                </span>
                                <span style={{ fontSize: 10, color: C.tm, display: "flex", alignItems: "center", gap: 2 }}><MapPin size={9} />{cur.lc}</span>
                                <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: C.g7, color: "#fff", marginLeft: "auto" }}>{dtStr} {cur.tm}</div>
                            </div>
                            <div onClick={complete} style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700,
                                textTransform: "uppercase", letterSpacing: 0.8, cursor: "pointer",
                                background: `linear-gradient(135deg, ${C.g6}, ${C.g7})`,
                                color: "#fff", fontFamily: fh,
                            }}>
                                <CheckCheck size={15} /> Tamamla
                            </div>
                        </div>
                    </>}

                    {queued.length > 0 && <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.tm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: fh }}>Növbəti — {queued.length}</div>
                        {queued.map((t, i) => { const pc = P[t.pr]; return (
                            <div key={t.id} style={{
                                background: C.sf, borderRadius: 13, padding: "10px 13px", marginBottom: 7,
                                border: `1px solid ${C.b}`, display: "flex", alignItems: "center", gap: 10,
                                animation: `fu .2s ease ${i * 0.04}s both`,
                            }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: pc.d, flexShrink: 0, opacity: 0.6 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.tx, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.tl}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4, background: pc.bg, color: pc.fg, textTransform: "uppercase" }}>{PL[t.pr]}</span>
                                        <span style={{ fontSize: 10, color: C.tm }}>{t.lc}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: C.g7, color: "#fff" }}>{dtStr} {t.tm}</div>
                            </div>
                        ); })}
                    </>}

                    {tasks.length === 0 && (
                        <div style={{ padding: 60, textAlign: "center" }}>
                            <CheckCircle2 size={40} color={C.g4} style={{ opacity: 0.4, marginBottom: 12 }} />
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.g7, fontFamily: fh }}>Hamısı bitdi!</div>
                            <div style={{ fontSize: 12, color: C.tm, marginTop: 4 }}>Növbədə tapşırıq yoxdur.</div>
                        </div>
                    )}
                </div>}

                {/* ─ FASİLƏ ─ */}
                {tab === "break" && <div style={{ padding: "30px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {!brk ? <>
                        <Coffee size={32} color={C.g4} style={{ marginBottom: 16, opacity: 0.6 }} />
                        <div style={{ fontFamily: fh, fontSize: 26, fontWeight: 800, color: C.tx, marginBottom: 6 }}>Fasilə vaxtı</div>
                        <div style={{ fontSize: 13, color: C.tm, marginBottom: 36, textAlign: "center" }}>Bir az dincəl. 5 dəqiqə fasilə götür.</div>
                        <div style={{
                            width: 150, height: 150, borderRadius: 32,
                            background: C.sf, border: `2px solid ${C.b}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 36, boxShadow: `0 4px 20px ${C.g4}10`,
                        }}>
                            <div style={{ fontFamily: fh, fontSize: 40, fontWeight: 900, color: C.tx }}>5:00</div>
                        </div>
                        <div onClick={startB} style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "12px 44px", borderRadius: 14, cursor: "pointer",
                            background: C.g7, color: "#fff",
                            fontSize: 14, fontWeight: 700, letterSpacing: 0.5, fontFamily: fh, textTransform: "uppercase",
                        }}><Play size={16} /> Başla</div>
                    </> : <>
                        <div style={{ fontFamily: fh, fontSize: 22, fontWeight: 800, color: C.tx, marginBottom: 6 }}>
                            {brkP ? "Dayandırıldı" : "Fasilədə"}
                        </div>
                        <div style={{ fontSize: 12, color: C.tm, marginBottom: 32 }}>
                            {brkP ? "Davam etmək üçün basın" : "Rahat ol, xəbər veriləcək"}
                        </div>
                        <div style={{ position: "relative", width: 160, height: 160, marginBottom: 36, animation: brkP ? "none" : "br 4s ease infinite" }}>
                            <svg width={160} height={160} viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r={R} fill="none" stroke={C.b} strokeWidth="6" />
                                <circle cx="80" cy="80" r={R} fill="none" stroke={C.g6} strokeWidth="6"
                                        strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - prog)}
                                        transform="rotate(-90 80 80)" style={{ transition: "stroke-dashoffset 1s linear" }} />
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ fontFamily: fh, fontSize: 42, fontWeight: 900, color: C.tx }}>{fmtT(brkR)}</div>
                                <div style={{ fontSize: 11, color: C.tm }}>qalıb</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            {brkP ? (
                                <div onClick={resumeB} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 28px", borderRadius: 12, cursor: "pointer", background: C.g7, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: fh, textTransform: "uppercase" }}><Play size={14} /> Davam</div>
                            ) : (
                                <div onClick={pauseB} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 28px", borderRadius: 12, cursor: "pointer", background: C.am, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: fh, textTransform: "uppercase" }}><Pause size={14} /> Dayandır</div>
                            )}
                            <div onClick={resetB} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 12, cursor: "pointer", background: C.sf, color: C.ts, border: `1px solid ${C.bM}`, fontSize: 13, fontWeight: 700, fontFamily: fh, textTransform: "uppercase" }}><RotateCcw size={14} /> Bitir</div>
                        </div>
                    </>}
                </div>}

                {/* ─ BİTƏN ─ */}
                {tab === "done" && <div style={{ padding: "12px 14px" }}>
                    <div style={{
                        background: `linear-gradient(135deg, ${C.g0}, ${C.g1})`, borderRadius: 16,
                        padding: "24px 20px", textAlign: "center", marginBottom: 14,
                        border: `1px solid ${C.g2}40`,
                    }}>
                        <div style={{ fontFamily: fh, fontSize: 52, fontWeight: 900, color: C.g7 }}>{done.length}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.ts }}>Bu gün tamamlanmış tapşırıqlar</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.tm, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: fh }}>Tamamlanmış</div>
                    {done.map((t, i) => (
                        <div key={t.id} style={{
                            background: C.sf, borderRadius: 13, padding: "10px 13px", marginBottom: 6,
                            border: `1px solid ${C.b}`, display: "flex", alignItems: "center", gap: 10,
                            animation: `fu .2s ease ${i * 0.04}s both`, opacity: 0.7,
                        }}>
                            <CheckCircle2 size={14} color={C.g6} />
                            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: C.ts, textDecoration: "line-through" }}>{t.tl}</div>
                            <span style={{ fontSize: 10, color: C.tm, fontWeight: 600 }}>{t.at}</span>
                        </div>
                    ))}
                    {done.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.tm, fontSize: 13 }}>Hələ tamamlanmış tapşırıq yoxdur.</div>}
                </div>}

                {/* ─ PROFİL ─ */}
                {tab === "profile" && <div style={{ padding: "20px 14px" }}>
                    <div style={{
                        background: C.sf, borderRadius: 20, padding: "28px 20px", textAlign: "center",
                        border: `1px solid ${C.b}`, marginBottom: 16,
                    }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: 20, margin: "0 auto 14px",
                            background: `linear-gradient(135deg, ${C.g6}, ${C.g7})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: fh,
                        }}>ƏH</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: C.tx, fontFamily: fh }}>Əli Həsənov</div>
                        <div style={{ fontSize: 13, color: C.tm, marginTop: 3 }}>Mərtəbə rəhbəri</div>
                        <div style={{ fontSize: 12, color: C.ts, marginTop: 2 }}>Bravo Koroğlu Hiper</div>
                        <img src={LOGO} alt="Bravo" style={{ height: 24, marginTop: 14, opacity: 0.3, objectFit: "contain" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {([
                            { l: "Tamamlanmış", v: done.length, c: C.g6, i: CheckCircle2 },
                            { l: "Növbədə", v: tasks.length, c: C.g7, i: ClipboardList },
                            { l: "Cari", v: cur ? 1 : 0, c: C.am, i: Zap },
                            { l: "Fasilədə", v: brk ? "Bəli" : "Xeyr", c: C.bl, i: Coffee },
                        ] as { l: string; v: number | string; c: string; i: LucideIcon }[]).map((s, i) => (
                            <div key={i} style={{ background: C.sf, borderRadius: 13, padding: "14px", border: `1px solid ${C.b}` }}>
                                <s.i size={16} color={s.c} style={{ marginBottom: 6 }} />
                                <div style={{ fontSize: 24, fontWeight: 800, color: s.c, fontFamily: fh }}>{s.v}</div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: C.tm, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>}
            </div>

            {/* TAB BAR */}
            <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0, height: 60,
                background: "rgba(255,255,255,.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderTop: `1px solid ${C.b}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 100,
            }}>
                {tabs_list.map((t) => { const on = tab === t.id; return (
                    <div key={t.id} onClick={() => setTab(t.id)} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        padding: "6px 12px", borderRadius: 12, cursor: "pointer",
                        background: on ? C.g0 : "transparent", transition: "all .2s",
                    }}>
                        <t.ic size={18} color={on ? C.g7 : C.tm} strokeWidth={on ? 2.2 : 1.8} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: on ? C.g7 : C.tm, textTransform: "uppercase", letterSpacing: 0.3, fontFamily: fh }}>{t.lb}</span>
                    </div>
                ); })}
            </div>
        </div>
    );
}