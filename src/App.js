import { useState, useEffect, useRef } from "react";

// ─── Characters ───────────────────────────────────────────────────────────────
const CHARS = [
  {
    name: "Bürger",
    night: false,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Keine Sonderrolle",
  },
  {
    name: "Mafiosie",
    night: true,
    group: true,
    party: 1,
    detectEvil: true,
    desc: "Tötet jede Nacht gemeinsam",
  },
  {
    name: "Detektiv",
    night: true,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Erfährt Gut/Böse-Gesinnung einer Person",
  },
  {
    name: "Amor",
    night: true,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Wählt in der ersten Nacht zwei Liebende — sterben zusammen",
  },
  {
    name: "Wanderamor",
    night: true,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Erste Nacht wie Amor; folgende Nächte wie Prostituierte",
  },
  {
    name: "Prostituierte",
    night: true,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Überlebt Angriff beim Freier; stirbt wenn Freier stirbt",
  },
  {
    name: "Der Andere",
    night: true,
    group: false,
    party: 3,
    detectEvil: false,
    desc: "Solo — gewinnt wenn verbannt & geschärft. 1. Mordversuch = Schärfung",
  },
  {
    name: "Seelenretter",
    night: true,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Schützt jede Nacht eine Person vor dem Tod",
  },
  {
    name: "Triaden",
    night: true,
    group: true,
    party: 2,
    detectEvil: true,
    desc: "Eigene Fraktion — tötet jede Nacht",
  },
  {
    name: "Gärtner",
    night: false,
    group: false,
    party: 0,
    detectEvil: true,
    desc: "Gehört zum Dorf, erscheint dem Detektiv böse",
  },
  {
    name: "Scharping",
    night: false,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Überlebt ersten Nacht-Tod — stirbt erst die folgende Nacht",
  },
  {
    name: "Dimitri",
    night: true,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Stirbt nächste Nacht wenn erste Nacht niemand stirbt; wählt Schweigende",
  },
  {
    name: "Kaiser",
    night: false,
    group: false,
    party: 3,
    detectEvil: true,
    desc: "Solo — gewinnt wenn er zum Diktator gewählt wird",
  },
  {
    name: "Rufmörder",
    night: true,
    group: true,
    party: 1,
    detectEvil: true,
    desc: "Mafia + markiert eine Person für den Detektiv als böse",
  },
  {
    name: "Mathematiker",
    night: false,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Einmalige Tages-Aktion: erfährt Anzahl Böser in gewählter Gruppe",
  },
  {
    name: "Tom",
    night: false,
    group: false,
    party: 3,
    detectEvil: false,
    desc: "Solo — gewinnt & verlässt Spiel wenn Jerry stirbt",
  },
  {
    name: "Jerry",
    night: false,
    group: false,
    party: 3,
    detectEvil: false,
    desc: "Solo — gewinnt & verlässt Spiel wenn Tom stirbt",
  },
  {
    name: "Philosoph",
    night: false,
    group: false,
    party: 0,
    detectEvil: false,
    desc: "Darf niemals lügen — stirbt sonst (Spielleiter überwacht)",
  },
  {
    name: "Terrorist",
    night: true,
    group: true,
    party: 1,
    detectEvil: true,
    desc: "Mafia — kann sich tagsüber outen und sich + Ziel töten",
  },
];

// Rollen mit Stark/Schwach-Option
const STARK_CHARS = [4, 5, 7, 11, 13, 18];
const STARK_LABEL = {
  4: {
    stark: "2× gleiche Person erlaubt",
    schwach: "2× gleiche Person verboten",
  },
  5: {
    stark: "2× gleiche Person erlaubt",
    schwach: "2× gleiche Person verboten",
  },
  7: {
    stark: "2× gleiche Person schützen ok",
    schwach: "2× gleiche Person schützen verboten",
  },
  11: {
    stark: "2× gleiche Person schweigen ok",
    schwach: "2× gleiche Person schweigen verboten",
  },
  13: {
    stark: "2× gleiche Person markieren ok",
    schwach: "2× gleiche Person markieren verboten",
  },
  18: { stark: "Wacht mit Mafia auf", schwach: "Wacht nicht mit Mafia auf" },
};

const PARTY_BRIGHT = ["#4a9a6a", "#c04040", "#aa60cc", "#4a7adc"];
const PARTY_NAMES = ["Das Dorf", "Die Mafia", "Die Triaden", "Eigene Partei"];
const pb = (ri) =>
  ri === null || ri === false || ri === undefined
    ? "var(--text-muted)"
    : PARTY_BRIGHT[CHARS[ri]?.party ?? 0];
const pnm = (p) => PARTY_NAMES[p ?? 0];
const tr = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

// ─── Win Check ────────────────────────────────────────────────────────────────
// Game ends only when truly one faction remains
function checkWin(g) {
  const { roles, lovers, loversDiffParty } = g;
  const aliveRoles = roles.filter((r) => r !== null && r !== false);
  if (!aliveRoles.length) return "village";
  const v = aliveRoles.filter((ri) => CHARS[ri]?.party === 0).length;
  const m = aliveRoles.filter((ri) => CHARS[ri]?.party === 1).length;
  const t = aliveRoles.filter((ri) => CHARS[ri]?.party === 2).length;

  if (lovers && loversDiffParty) {
    const [la, lb] = lovers;
    const laAlive = roles[la] !== null && roles[la] !== false;
    const lbAlive = roles[lb] !== null && roles[lb] !== false;
    if (laAlive && lbAlive) {
      const others = roles.filter(
        (r, i) =>
          r !== null &&
          r !== false &&
          i !== la &&
          i !== lb &&
          CHARS[r]?.party !== 3,
      ).length;
      if (others === 0) return "lovers";
    }
  }
  // Strict: only end when one faction truly alone
  if (m === 0 && t === 0) return "village";
  if (v === 0 && t === 0 && m > 0) return "mafia";
  if (v === 0 && m === 0 && t > 0) return "triaden";
  return null;
}

// ─── Queue Builders ───────────────────────────────────────────────────────────
function idStep(charIdx, count) {
  const c = CHARS[charIdx];
  const label = count > 1 ? `${count}× ` : "";
  return {
    type: "id",
    charIdx,
    count,
    text: `${label}${c.name} öffnet die Augen`,
    sub: `Klicke ${count > 1 ? "alle" : "die"} Person${count > 1 ? "en" : ""} an.`,
  };
}

function buildFN(lc, strengths = {}) {
  const q = [
    {
      type: "msg",
      text: "🌙 Erste Nacht",
      sub: "Alle schließen die Augen und schlafen ein...",
    },
  ];
  const mafCount = (lc[1] || 0) + (lc[13] || 0) + (lc[18] || 0);

  if (lc[12]) {
    q.push(idStep(12, lc[12]));
    q.push({ type: "msg", text: "Kaiser schläft ein" });
  }
  // Mafia — terrorist always reveals in first night
  if (mafCount) {
    q.push({
      type: "msg",
      text: "🔴 Die Mafia öffnet die Augen",
      sub: `${mafCount} Spieler erwachen gemeinsam`,
    });
    if (lc[1]) q.push(idStep(1, lc[1]));
    if (lc[13]) q.push(idStep(13, lc[13]));
    if (lc[18]) q.push(idStep(18, lc[18]));
    q.push({
      type: "sel",
      count: 1,
      text: "Die Mafia wählt ihr Opfer",
      sub: "Wen töten sie heute Nacht?",
      effect: "kill",
    });
    q.push({ type: "msg", text: "Die Mafia schläft ein" });
  }
  if (lc[8]) {
    q.push(idStep(8, lc[8]));
    q.push({
      type: "sel",
      count: 1,
      text: "Die Triaden wählen ihr Opfer",
      sub: "Wen töten sie heute Nacht?",
      effect: "kill",
    });
    q.push({ type: "msg", text: "Triaden schlafen ein" });
  }
  for (let k = 0; k < (lc[6] || 0); k++) {
    q.push(idStep(6, 1));
    q.push({ type: "derAndereStatus" });
    q.push({ type: "msg", text: "Der Andere schläft ein" });
  }
  if (lc[13]) {
    q.push({
      type: "msg",
      text: "🎭 Rufmörder öffnet erneut die Augen",
      sub: "Er markiert eine Person für den Detektiv",
    });
    q.push({
      type: "sel",
      count: 1,
      text: "Rufmörder markiert eine Person",
      sub: "Diese Person erscheint dem Detektiv einmalig als böse.",
      effect: "rufmoerd_mark",
    });
    q.push({ type: "msg", text: "Rufmörder schläft ein" });
  }
  for (let k = 0; k < (lc[3] || 0); k++) {
    q.push(idStep(3, 1));
    q.push({
      type: "sel",
      count: 2,
      text: "Amor wählt das Liebespaar",
      sub: "Klicke zwei Personen an.",
      effect: "amor_couple",
    });
    q.push({ type: "msg", text: "Amor schläft ein" });
  }
  // Wanderamor — erste Nacht wie Amor
  for (let k = 0; k < (lc[4] || 0); k++) {
    q.push(idStep(4, 1));
    q.push({
      type: "sel",
      count: 2,
      text: "Wanderamor wählt das Liebespaar",
      sub: "Klicke zwei Personen an.",
      effect: "amor_couple",
    });
    q.push({ type: "msg", text: "Wanderamor schläft ein" });
  }
  for (let k = 0; k < (lc[5] || 0); k++) {
    q.push(idStep(5, 1));
    q.push({
      type: "sel",
      count: 1,
      text: "Prostituierte wählt Freier",
      sub: "Bei wem verbringt sie diese Nacht?",
      effect: "prost_freier",
      prostIdx: k,
    });
    q.push({ type: "msg", text: "Prostituierte schläft ein" });
  }
  for (let k = 0; k < (lc[7] || 0); k++) {
    q.push(idStep(7, 1));
    q.push({
      type: "sel",
      count: 1,
      text: "Seelenretter schützt",
      sub: "Wen schützt er heute Nacht?",
      effect: "protect",
    });
    q.push({ type: "msg", text: "Seelenretter schläft ein" });
  }
  for (let k = 0; k < (lc[2] || 0); k++) {
    q.push(idStep(2, 1));
    q.push({
      type: "sel",
      count: 1,
      text: "Der Detektiv ermittelt",
      sub: "Wessen Gesinnung will er erfahren?",
      effect: "detect",
    });
    q.push({ type: "msg", text: "Detektiv schläft ein" });
  }
  for (let k = 0; k < (lc[11] || 0); k++) {
    q.push(idStep(11, 1));
    q.push({ type: "msg", text: "Dimitri schläft ein" });
  }
  if (lc[10]) {
    q.push(idStep(10, lc[10]));
    q.push({ type: "msg", text: "Scharping schläft ein" });
  }
  if (lc[15]) q.push(idStep(15, lc[15]));
  if (lc[16]) q.push(idStep(16, lc[16]));
  if (lc[15] && lc[16]) q.push({ type: "tom_jerry_reveal" });
  if (lc[9]) {
    q.push(idStep(9, lc[9]));
    q.push({ type: "msg", text: "Gärtner schläft ein" });
  }
  if (lc[14]) {
    q.push(idStep(14, lc[14]));
    q.push({ type: "msg", text: "Mathematiker schläft ein" });
  }
  if (lc[17]) {
    q.push(idStep(17, lc[17]));
    q.push({ type: "msg", text: "Philosoph schläft ein" });
  }
  q.push({
    type: "fn_end",
    text: "🌅 Erste Nacht endet",
    sub: "Alle erwachen — Augen auf!",
  });
  return q;
}

function buildN(lc, strengths = {}) {
  const q = [{ type: "msg", text: "🌙 Nacht", sub: "Das Dorf schläft ein..." }];
  // Terrorist stark = wakes with mafia, schwach = doesn't
  const terrJoinsMafia = lc[18] && strengths[18] !== "schwach";
  const mafCount =
    (lc[1] || 0) + (lc[13] || 0) + (terrJoinsMafia ? lc[18] || 0 : 0);
  if (mafCount) {
    q.push({ type: "msg", text: "Die Mafia öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Die Mafia wählt ihr Opfer",
      sub: "Wen töten sie?",
      effect: "kill",
    });
    q.push({ type: "msg", text: "Die Mafia schläft ein" });
  }
  if (lc[8]) {
    q.push({ type: "msg", text: "Die Triaden öffnen die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Die Triaden wählen ihr Opfer",
      sub: "Wen töten sie?",
      effect: "kill",
    });
    q.push({ type: "msg", text: "Triaden schlafen ein" });
  }
  if (lc[13]) {
    q.push({ type: "msg", text: "Rufmörder öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Rufmörder markiert",
      sub: "Person erscheint Detektiv als böse.",
      effect: "rufmoerd_mark",
    });
    q.push({ type: "msg", text: "Rufmörder schläft ein" });
  }
  if (lc[5]) {
    q.push({ type: "msg", text: "Prostituierte öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Prostituierte wählt Freier",
      effect: "prost_freier",
    });
    q.push({ type: "msg", text: "Prostituierte schläft ein" });
  }
  // Wanderamor — folgende Nächte wie Prostituierte
  if (lc[4]) {
    q.push({ type: "msg", text: "Wanderamor öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Wanderamor wählt Freier",
      sub: "Bei wem verbringt sie diese Nacht?",
      effect: "wanderamor_freier",
    });
    q.push({ type: "msg", text: "Wanderamor schläft ein" });
  }
  if (lc[7]) {
    q.push({ type: "msg", text: "Seelenretter öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Seelenretter schützt",
      effect: "protect",
    });
    q.push({ type: "msg", text: "Seelenretter schläft ein" });
  }
  if (lc[11]) {
    q.push({ type: "msg", text: "Dimitri öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Dimitri wählt Schweigende",
      sub: "Diese Person muss morgen schweigen.",
      effect: "dimitri_silence",
    });
    q.push({ type: "msg", text: "Dimitri schläft ein" });
  }
  if (lc[2]) {
    q.push({ type: "msg", text: "Detektiv öffnet die Augen" });
    q.push({
      type: "sel",
      count: 1,
      text: "Der Detektiv ermittelt",
      effect: "detect",
    });
    q.push({ type: "msg", text: "Detektiv schläft ein" });
  }
  if (lc[6]) {
    q.push({ type: "msg", text: "Der Andere öffnet die Augen" });
    q.push({ type: "derAndereStatus" });
    q.push({ type: "msg", text: "Der Andere schläft ein" });
  }
  q.push({
    type: "night_end",
    text: "🌅 Der Morgen graut",
    sub: "Das Dorf erwacht...",
  });
  return q;
}

function buildD(isFirst, dict, timer) {
  const q = [{ type: "deaths", isFirstDay: isFirst }];
  if (isFirst && dict)
    q.push({
      type: "sel",
      count: 1,
      text: "Wählt euren Diktator",
      sub: "Diese Person entscheidet täglich über die Verbannung.",
      effect: "dictator",
    });
  if (timer > 0)
    q.push({
      type: "timer",
      seconds: timer,
      text: "Das Dorf berät sich",
      sub: "Diskutiert — wer ist verdächtig?",
    });
  q.push({
    type: "sel",
    count: 1,
    text: dict ? "Der Diktator entscheidet" : "Das Dorf stimmt ab",
    sub: "Wähle die Person, die verbannt wird.",
    effect: "vote",
  });
  return q;
}

// ─── SetupCircle ──────────────────────────────────────────────────────────────
function SetupCircle({ n, names, onSet }) {
  const [editing, setEditing] = useState(null);
  const [val, setVal] = useState("");
  if (!n) return null;
  const s = Math.max(260, Math.min(500, n * 44));
  const cx = s / 2,
    cy = s / 2,
    r = s / 2 - 50;
  const sr = Math.max(19, Math.min(30, r * 0.38));
  const commit = () => {
    if (editing != null) {
      onSet(editing, val.trim());
      setEditing(null);
    }
  };
  return (
    <div>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="2,9"
        />
        {Array.from({ length: n }).map((_, i) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = cx + r * Math.cos(a),
            y = cy + r * Math.sin(a);
          const nm = names[i] || "";
          const isEd = editing === i;
          return (
            <g
              key={i}
              onClick={() => {
                setEditing(i);
                setVal(names[i] || "");
              }}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={x}
                cy={y}
                r={sr}
                fill={isEd ? "var(--gold-dim)" : "var(--bg3)"}
                stroke={nm || isEd ? "var(--gold)" : "var(--border2)"}
                strokeWidth={nm || isEd ? 1.5 : 1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={nm ? "var(--gold)" : "var(--text-faint)"}
                fontSize={Math.max(9, sr * 0.5)}
                fontFamily="Cinzel,serif"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {nm ? tr(nm, 6) : i + 1}
              </text>
            </g>
          );
        })}
      </svg>
      {editing != null && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: ".78rem",
              color: "var(--text-muted)",
              fontFamily: "Cinzel,serif",
            }}
          >
            Platz {editing + 1}:
          </span>
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(null);
            }}
            placeholder="Name..."
            style={{
              background: "var(--bg)",
              border: "1px solid var(--gold)",
              color: "var(--text)",
              padding: "5px 9px",
              fontFamily: "EB Garamond,serif",
              fontSize: "1rem",
              borderRadius: 2,
              outline: "none",
              width: 130,
            }}
          />
          <button
            onClick={commit}
            style={{
              background: "transparent",
              border: "1px solid var(--gold)",
              color: "var(--gold)",
              padding: "5px 12px",
              cursor: "pointer",
              fontFamily: "Cinzel,serif",
              fontSize: ".7rem",
              borderRadius: 2,
            }}
          >
            ✓
          </button>
          <button
            onClick={() => {
              onSet(editing, "");
              setEditing(null);
            }}
            style={{
              background: "transparent",
              border: "1px solid var(--border2)",
              color: "var(--text-muted)",
              padding: "5px 12px",
              cursor: "pointer",
              borderRadius: 2,
            }}
          >
            ✗
          </button>
        </div>
      )}
      <p
        style={{
          textAlign: "center",
          color: "var(--text-faint)",
          fontSize: ".75rem",
          marginTop: 8,
          fontStyle: "italic",
        }}
      >
        Klicke auf einen Sitz, um einen Namen zu vergeben
      </p>
    </div>
  );
}

// ─── CircleBoard ──────────────────────────────────────────────────────────────
function CircleBoard({
  n,
  names,
  roles,
  selected,
  excluded,
  dictSeat,
  onToggle,
  showRoles,
  lovers,
}) {
  if (!n) return null;
  const s = Math.max(280, Math.min(540, n * 44));
  const cx = s / 2,
    cy = s / 2,
    r = s / 2 - 50;
  const sr = Math.max(19, Math.min(30, r * 0.38));
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="1"
        strokeDasharray="2,9"
      />
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        const x = cx + r * Math.cos(a),
          y = cy + r * Math.sin(a);
        const ri = roles ? roles[i] : false;
        const dead = ri === null;
        const excl = excluded ? excluded.includes(i) : false;
        const sel = selected ? selected.includes(i) : false;
        const nm = names[i] || String(i + 1);
        const roleName =
          showRoles && ri !== null && ri !== false ? CHARS[ri]?.name : null;
        const pc = !dead && ri !== false && ri !== null ? pb(ri) : null;
        const isLover = lovers && (lovers[0] === i || lovers[1] === i);
        return (
          <g
            key={i}
            onClick={() => onToggle && !dead && !excl && onToggle(i)}
            style={{
              cursor: dead || excl || !onToggle ? "default" : "pointer",
            }}
          >
            {isLover && !dead && (
              <circle
                cx={x}
                cy={y}
                r={sr + 5}
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1"
                strokeDasharray="3,4"
                opacity=".45"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={sr}
              fill={sel ? "var(--gold-dim)" : "var(--bg3)"}
              stroke={
                sel
                  ? "var(--gold)"
                  : dead
                    ? "var(--border)"
                    : pc
                      ? pc + "55"
                      : "var(--border2)"
              }
              strokeWidth={sel ? 2 : pc ? 1.5 : 1}
              opacity={dead ? 0.08 : excl ? 0.22 : 1}
            />
            <text
              x={x}
              y={roleName ? y - 4 : y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={
                dead
                  ? "var(--border2)"
                  : sel
                    ? "var(--gold)"
                    : "var(--text-dim)"
              }
              fontSize={Math.max(9, Math.min(12, sr * 0.52))}
              fontFamily="Cinzel,serif"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {tr(nm, 7)}
            </text>
            {roleName && !dead && (
              <text
                x={x}
                y={y + sr * 0.56 + 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={pc || "var(--green)"}
                fontSize={Math.max(7, sr * 0.38)}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {tr(roleName, 9)}
              </text>
            )}
            {dictSeat === i && !dead && (
              <text
                x={x + sr * 0.78}
                y={y - sr * 0.7}
                fill="var(--gold)"
                fontSize={sr * 0.65}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                ⚑
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

:root {
  --bg:#0c0b0e;--bg2:#110f0d;--bg3:#0f0e0c;--border:#1a1610;--border2:#201a10;
  --text:#e0cfa8;--text-dim:#7a6a4a;--text-muted:#3d3020;--text-faint:#2a2018;
  --gold:#C9A040;--gold-dim:rgba(201,160,64,.11);--red:#8B1A1A;--red2:#a82020;
  --green:#4a9a6a;--purple:#aa60cc;--blue:#4a7adc;
  --night-bg:#0d0c14;--night-b:#1a1826;--night-g:rgba(42,36,96,.85);
  --day-bg:#100e0c;--day-b:#1c1408;--day-g:rgba(139,26,26,.45);
  --warn-bg:#1a1208;--warn-bdr:#3a2808;--watch-bg:#080c18;--watch-bdr:#0a1830;
}
@media (prefers-color-scheme:light) {
  :root {
    --bg:#f2ede0;--bg2:#e8e2d4;--bg3:#f8f3e8;--border:#c8b890;--border2:#b8a878;
    --text:#2a1e08;--text-dim:#5a4a2a;--text-muted:#8a7a56;--text-faint:#a09068;
    --gold:#8a6010;--gold-dim:rgba(138,96,16,.12);--red:#8B1A1A;--red2:#a82020;
    --green:#2a6a3a;--purple:#7a2a9a;--blue:#1a4aaa;
    --night-bg:#e8e4f2;--night-b:#b0a8d0;--night-g:rgba(80,60,150,.35);
    --day-bg:#f5ece0;--day-b:#c8a880;--day-g:rgba(139,26,26,.28);
    --warn-bg:#fff8e8;--warn-bdr:#d4b060;--watch-bg:#e8f0f8;--watch-bdr:#90b8d8;
  }
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);}
@keyframes fadeSlide{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes bounceIn{from{opacity:0;transform:scale(.78)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.ma{min-height:100vh;background:var(--bg);color:var(--text);font-family:'EB Garamond',Georgia,serif;font-size:17px;line-height:1.5;animation:fadeIn .4s ease;}
.setup{max-width:720px;margin:0 auto;padding:40px 20px 80px;}
.h1{font-family:'Cinzel Decorative',serif;font-size:2.4rem;color:var(--gold);text-align:center;letter-spacing:.04em;text-shadow:0 0 60px rgba(201,160,64,.18);margin-bottom:3px;}
.h1s{font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.4em;text-transform:uppercase;color:var(--text-faint);text-align:center;margin-bottom:36px;}
.sdots{display:flex;gap:10px;justify-content:center;margin-bottom:26px;}
.sdot{width:8px;height:8px;border-radius:50%;background:var(--border2);border:1px solid var(--border);transition:all .3s;}
.sdot.act{background:var(--gold);border-color:var(--gold);box-shadow:0 0 10px rgba(201,160,64,.28);}
.card{background:var(--bg2);border:1px solid var(--border);border-radius:3px;padding:20px;margin-bottom:12px;position:relative;animation:fadeSlide .3s ease;}
.card::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(201,160,64,.18),transparent);}
.ct{font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);opacity:.5;margin-bottom:11px;}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:5px;}
.crow{display:flex;flex-direction:column;background:var(--bg3);border:1px solid var(--border);border-radius:2px;padding:6px 9px;gap:2px;}
.crow-top{display:flex;align-items:center;width:100%;}
.cn{font-size:.8rem;flex:1;min-width:0;}
.cdesc{font-size:.6rem;color:var(--text-faint);font-style:italic;line-height:1.25;}
.csk{display:flex;align-items:center;gap:5px;margin-top:4px;}
.csk-label{font-size:.55rem;color:var(--text-faint);}
.csk-btn{font-size:.56rem;padding:2px 7px;background:transparent;border:1px solid;border-radius:2px;cursor:pointer;transition:all .18s;font-family:'Cinzel',serif;}
.csk-btn.stark{border-color:var(--gold);color:var(--gold);}
.csk-btn.schwach{border-color:var(--border2);color:var(--text-muted);}
.cnt{display:flex;align-items:center;gap:3px;flex-shrink:0;}
.cbt{width:19px;height:19px;background:transparent;border:1px solid var(--border2);color:var(--text-faint);border-radius:2px;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center;transition:all .18s;}
.cbt:hover{border-color:var(--gold);color:var(--gold);}
.cv{min-width:16px;text-align:center;font-family:'Cinzel',serif;color:var(--gold);font-size:.8rem;}
.trow{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.tlbl{font-size:.86rem;color:var(--text-dim);}
.tog{width:38px;height:20px;background:var(--border2);border:1px solid var(--border);border-radius:10px;cursor:pointer;position:relative;transition:all .25s;}
.tog.on{background:var(--red);border-color:var(--red);}
.tok{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--text-faint);transition:all .25s;}
.tog.on .tok{left:20px;background:var(--text);}
.srow{display:flex;gap:10px;justify-content:center;margin-top:6px;}
.prevbtn{background:transparent;border:1px solid var(--border2);color:var(--text-muted);padding:10px 26px;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;transition:all .22s;}
.prevbtn:hover{border-color:var(--gold);color:var(--gold);}
.startbtn{padding:10px 34px;background:var(--red);border:1px solid var(--red);color:var(--text);font-family:'Cinzel',serif;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;border-radius:2px;cursor:pointer;transition:all .28s;}
.startbtn:hover:not(:disabled){background:var(--red2);box-shadow:0 0 28px rgba(139,26,26,.28);}
.startbtn:disabled{opacity:.22;cursor:not-allowed;}
.game{display:grid;grid-template-columns:1fr 212px;min-height:100vh;max-width:1020px;margin:0 auto;padding:13px;gap:13px;}
@media(max-width:620px){.game{grid-template-columns:1fr;}}
.ghead{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid var(--border);}
.gtitle{font-family:'Cinzel Decorative',serif;font-size:1.2rem;color:var(--gold);}
.rndbdg{font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.24em;text-transform:uppercase;color:var(--text-faint);border:1px solid var(--border);padding:3px 9px;border-radius:2px;}
.gbtn{background:transparent;border:1px solid var(--border2);color:var(--text-muted);padding:5px 12px;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;transition:all .18s;}
.gbtn:hover{border-color:var(--gold);color:var(--gold);}
.main{display:flex;flex-direction:column;gap:11px;}
.stepcard{background:var(--bg2);border:1px solid var(--border);border-radius:3px;padding:20px 18px;text-align:center;position:relative;}
.stepcard.anim{animation:fadeSlide .28s ease;}
.night{background:var(--night-bg)!important;border-color:var(--night-b)!important;}
.night::after{content:'';position:absolute;top:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,var(--night-g),transparent);}
.day{background:var(--day-bg)!important;border-color:var(--day-b)!important;}
.day::after{content:'';position:absolute;top:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,var(--day-g),transparent);}
.sicon{font-size:2rem;margin-bottom:5px;display:block;}
.stitle{font-family:'Cinzel',serif;font-size:1.2rem;color:var(--gold);margin-bottom:3px;}
.ssub{color:var(--text-muted);font-style:italic;font-size:.9rem;}
.tnum{font-family:'Cinzel Decorative',serif;font-size:2.8rem;color:var(--gold);text-shadow:0 0 40px rgba(201,160,64,.22);padding:5px 0;}
.tnum.low{animation:pulse .8s infinite;color:var(--red2);}
.tbar{height:2px;background:var(--border2);border-radius:1px;margin:3px 0;overflow:hidden;}
.tfill{height:100%;background:linear-gradient(90deg,var(--red),var(--gold));transition:width 1s linear;}
.skipbtn{background:transparent;border:1px solid var(--border2);color:var(--text-muted);padding:4px 16px;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;margin-top:5px;transition:all .18s;display:inline-block;}
.skipbtn:hover{border-color:var(--gold);color:var(--gold);}
.cfwrap{display:flex;justify-content:center;padding-top:2px;}
.cfbtn{background:var(--red);border:1px solid var(--red);color:var(--text);padding:9px 38px;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;transition:all .22s;}
.cfbtn:hover:not(:disabled){background:var(--red2);box-shadow:0 0 20px rgba(139,26,26,.28);}
.cfbtn:disabled{opacity:.2;cursor:not-allowed;}
.daybtnrow{display:flex;flex-direction:column;gap:5px;margin-top:8px;}
.daybtn{background:transparent;border:1px solid var(--border2);color:var(--text-dim);padding:7px 14px;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;font-size:.64rem;letter-spacing:.09em;text-transform:uppercase;transition:all .2s;text-align:left;}
.daybtn:hover{border-color:var(--gold);color:var(--gold);}
.daybtn.used{opacity:.2;cursor:not-allowed;}
.terr-ui{display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;}
.terr-hint{color:var(--text-muted);font-style:italic;font-size:.88rem;}
.terr-target{font-family:'Cinzel',serif;font-size:.9rem;color:var(--gold);min-height:1.2em;}
.terr-btns{display:flex;gap:10px;}
.sidebar{display:flex;flex-direction:column;gap:11px;}
.sc{background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:11px;animation:fadeSlide .4s ease;}
.sct{font-family:'Cinzel',serif;font-size:.53rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text-faint);margin-bottom:7px;}
.ai{display:flex;align-items:flex-start;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border);gap:3px;transition:opacity .3s;}
.adot{width:5px;height:5px;border-radius:50%;margin-right:4px;flex-shrink:0;margin-top:6px;transition:background .3s;}
.atxt{flex:1;min-width:0;}
.aname{font-size:.76rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.arole{font-size:.63rem;font-style:italic;margin-top:1px;}
.dtag{font-family:'Cinzel',serif;font-size:.48rem;letter-spacing:.05em;text-transform:uppercase;color:var(--gold);border:1px solid var(--warn-bdr);padding:1px 3px;border-radius:2px;flex-shrink:0;align-self:center;}
.kickbtn{background:transparent;border:none;color:var(--border2);font-size:.74rem;cursor:pointer;padding:1px 2px;border-radius:2px;transition:color .18s;flex-shrink:0;line-height:1;align-self:center;}
.kickbtn:hover{color:var(--red);}
.logscroll{max-height:180px;overflow-y:auto;}
.le{font-size:.71rem;color:var(--text-faint);padding:2px 0;border-bottom:1px solid var(--border);font-style:italic;}
.le:first-child{color:var(--text-dim);}
.le0{font-size:.71rem;color:var(--border2);font-style:italic;}
.watchscroll{max-height:150px;overflow-y:auto;}
.we{font-size:.71rem;padding:3px 0;border-bottom:1px solid var(--border);display:flex;gap:5px;align-items:flex-start;}
.wtag{font-family:'Cinzel',serif;font-size:.49rem;letter-spacing:.07em;text-transform:uppercase;padding:1px 4px;border-radius:2px;flex-shrink:0;margin-top:2px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(8px);animation:fadeIn .18s ease;}
@media(prefers-color-scheme:light){.overlay{background:rgba(30,20,10,.75);}}
.rcard{background:var(--bg2);border:1px solid var(--border2);border-radius:3px;padding:36px;text-align:center;max-width:360px;width:90%;animation:bounceIn .28s cubic-bezier(.34,1.56,.64,1);}
.ri{font-size:2.8rem;margin-bottom:8px;}
.rn{font-family:'Cinzel',serif;font-size:.84rem;color:var(--text-muted);margin-bottom:2px;}
.rr{font-family:'Cinzel',serif;font-size:1.5rem;margin-bottom:3px;}
.rp{font-size:.86rem;font-style:italic;color:var(--text-muted);margin-bottom:18px;}
.rg{color:var(--green)}.re{color:var(--red2)}.rt{color:var(--purple)}.rb{color:var(--blue)}
.msel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:5px;margin:10px 0 6px;}
.msel-seat{background:var(--bg3);border:1px solid var(--border);border-radius:2px;padding:7px 4px;text-align:center;cursor:pointer;transition:all .18s;font-size:.78rem;color:var(--text-dim);}
.msel-seat:hover:not(.dead){border-color:var(--gold);color:var(--gold);}
.msel-seat.sel{border-color:var(--gold);background:var(--gold-dim);color:var(--gold);}
.msel-seat.dead{opacity:.12;cursor:not-allowed;}
.mathresult{background:var(--bg3);border:1px solid var(--border2);border-radius:2px;padding:10px;margin:8px 0;font-family:'Cinzel',serif;font-size:1.1rem;color:var(--gold);text-align:center;animation:bounceIn .25s ease;}
.win{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:40px;animation:fadeIn .5s ease;}
.wt{font-family:'Cinzel Decorative',serif;font-size:2.2rem;margin-bottom:9px;}
.wv{color:var(--green);text-shadow:0 0 50px rgba(74,154,106,.28);}
.wm{color:var(--red2);text-shadow:0 0 50px rgba(139,26,26,.38);}
.wtr{color:var(--purple);text-shadow:0 0 50px rgba(170,96,204,.32);}
.wbl{color:var(--blue);text-shadow:0 0 50px rgba(74,122,220,.3);}
.ws{font-size:.94rem;color:var(--text-muted);margin-bottom:24px;font-style:italic;}
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [setupStep, setSetupStep] = useState(0);
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(
      CHARS.map((_, i) => [i, i === 0 ? 3 : i === 1 ? 2 : i === 12 ? 1 : 0]),
    ),
  );
  const [strengthModes, setStrengthModes] = useState(() =>
    Object.fromEntries(STARK_CHARS.map((i) => [i, "stark"])),
  );
  const [seatNames, setSeatNames] = useState([]);
  const [useDictator, setUseDictator] = useState(true);
  const [timerSec, setTimerSec] = useState(30);
  const [screen, setScreen] = useState("setup");
  const [winner, setWinner] = useState(null);

  const G = useRef(null);
  const [roles, setRoles] = useState([]);
  const [dictSeat, setDictSeat] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [roundNum, setRoundNum] = useState(1);
  const [queue, setQueue] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState([]);
  const [timerVal, setTimerVal] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [watchList, setWatchList] = useState([]);
  const [mathUsed, setMathUsed] = useState(false);
  const [terrUsed, setTerrUsed] = useState(false);
  const [mathSel, setMathSel] = useState([]);
  const [mathResult, setMathResult] = useState(null);
  // Terrorist mode: use circle for target selection
  const [terrMode, setTerrMode] = useState(false);
  const timerRef = useRef(null);

  const numPlayers = Object.values(counts).reduce((s, c) => s + c, 0);
  const cur = queue[qIdx];
  const showRoles = roles.length > 0 && roles.every((r) => r !== false);

  useEffect(() => {
    setSeatNames((p) =>
      Array.from({ length: numPlayers }, (_, i) => p[i] || ""),
    );
  }, [numPlayers]);

  useEffect(() => {
    if (cur?.type === "timer") {
      setTimerVal(cur.seconds);
      setTimerRunning(true);
    }
  }, [qIdx, cur?.type, cur?.seconds]);

  useEffect(() => {
    if (!timerRunning) return;
    if (timerVal <= 0) {
      setTimerRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => setTimerVal((v) => v - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timerVal]);

  const pName = (i) => seatNames[i] || `#${i + 1}`;
  const addLog = (msg) => setGameLog((p) => [msg, ...p]);
  const addWatch = (msg, type = "warn") =>
    setWatchList((p) => [{ msg, type, id: Date.now() + Math.random() }, ...p]);
  const syncDisplay = () => {
    if (!G.current) return;
    setRoles([...G.current.roles]);
    setDictSeat(G.current.dictSeat);
  };

  const killSeat = (i, g) => {
    const ri = g.roles[i];
    if (ri === null || ri === false) return null;
    const roleName = CHARS[ri]?.name || "?";
    g.liveCounts[ri] = Math.max(0, (g.liveCounts[ri] || 1) - 1);
    g.roles[i] = null;
    return {
      seat: i,
      name: pName(i),
      roleName,
      partyIdx: CHARS[ri]?.party ?? 0,
    };
  };

  const kickPlayer = (i) => {
    const g = G.current;
    if (!g) return;
    const info = killSeat(i, g);
    if (!info) return;
    g.justDied = g.justDied.filter((x) => x !== i);
    g.protected = g.protected.filter((x) => x !== i);
    if (g.dictSeat === i) g.dictSeat = null;
    addLog(`⊘ ${pName(i)} (${info.roleName}) hat das Spiel verlassen`);
    syncDisplay();
    const w = checkWin(g);
    if (w) {
      setWinner(w);
      setScreen("over");
    }
  };

  const showDeaths = (list, afterFn) => {
    if (!list.length) {
      afterFn();
      return;
    }
    let idx = 0;
    const next = () => {
      if (idx >= list.length) {
        setOverlay(null);
        afterFn();
        return;
      }
      const d = list[idx++];
      setOverlay({ type: "death", ...d, onClose: next });
    };
    next();
  };

  const processLoverDeaths = (g, deadSeats) => {
    const extra = [];
    if (!g.lovers) return extra;
    const [la, lb] = g.lovers;
    deadSeats.forEach((s) => {
      const partner = la === s ? lb : lb === s ? la : -1;
      if (
        partner === -1 ||
        g.roles[partner] === null ||
        g.roles[partner] === false
      )
        return;
      if (deadSeats.includes(partner)) return;
      const info = killSeat(partner, g);
      if (info) {
        extra.push({ ...info, isLover: true });
        addLog(`💔 ${pName(partner)} (${info.roleName}) stirbt aus Liebe`);
      }
    });
    return extra;
  };

  // Tom/Jerry: other wins and leaves — game continues, no setScreen here
  const handleTomJerry = (g, deadInfos) => {
    let hadEvent = false;
    deadInfos.forEach((d) => {
      if (d.roleName === "Jerry") {
        const ts = g.roles.findIndex(
          (r, i) => r !== null && r !== false && CHARS[r]?.name === "Tom",
        );
        if (ts !== -1) {
          addLog(
            `🐱 ${pName(ts)} (Tom) gewinnt — Jerry ist tot! Tom verlässt das Spiel.`,
          );
          addWatch(
            `Tom (${pName(ts)}) hat gewonnen & verlässt das Spiel`,
            "watch",
          );
          killSeat(ts, g);
          hadEvent = true;
        }
      }
      if (d.roleName === "Tom") {
        const js = g.roles.findIndex(
          (r, i) => r !== null && r !== false && CHARS[r]?.name === "Jerry",
        );
        if (js !== -1) {
          addLog(
            `🐭 ${pName(js)} (Jerry) gewinnt — Tom ist tot! Jerry verlässt das Spiel.`,
          );
          addWatch(
            `Jerry (${pName(js)}) hat gewonnen & verlässt das Spiel`,
            "watch",
          );
          killSeat(js, g);
          hadEvent = true;
        }
      }
    });
    if (hadEvent) syncDisplay();
    return hadEvent;
  };

  const startGame = () => {
    const lc = Object.fromEntries(CHARS.map((_, i) => [i, counts[i] || 0]));
    const r = new Array(numPlayers).fill(false);
    G.current = {
      roles: r,
      liveCounts: lc,
      justDied: [],
      protected: [],
      dictSeat: null,
      lovers: null,
      loversDiffParty: false,
      rufmordMarked: null,
      scharpingDeathPending: undefined,
      derAndereSeat: -1,
      derAndereSharpened: false,
      dimitriSilenced: null,
      dimitriDiesNextNight: undefined,
      prostFreier: {},
      strengths: { ...strengthModes },
      // Schwach tracking — last used target per role
      lastProtect: undefined,
      lastRufmoerd: undefined,
      lastDimitriSilence: undefined,
      lastProstFreier: undefined,
      lastWanderAmorFreier: undefined,
    };
    setRoles([...r]);
    setDictSeat(null);
    setGameLog([]);
    setWatchList([]);
    setRoundNum(1);
    setWinner(null);
    setSelected([]);
    setOverlay(null);
    setMathUsed(false);
    setTerrUsed(false);
    setMathSel([]);
    setMathResult(null);
    setTerrMode(false);
    setQueue(buildFN(lc, strengthModes));
    setQIdx(0);
    setScreen("game");
  };

  const goDay = (isFirst) => {
    setQueue(buildD(isFirst, useDictator, timerSec));
    setQIdx(0);
    setSelected([]);
    setTerrMode(false);
    setTerrUsed(false);
  };

  const goNight = (extra = []) => {
    if (!G.current) return;
    const lc = Object.fromEntries(
      CHARS.map((_, i) => [i, G.current.liveCounts[i] || 0]),
    );
    setQueue([...extra, ...buildN(lc, G.current.strengths)]);
    setQIdx(0);
    setSelected([]);
    setTerrMode(false);
    setRoundNum((n) => n + 1);
  };

  const getExcluded = () => {
    if (!G.current || !cur) return [];
    const g = G.current;
    if (cur.type === "id")
      return g.roles
        .map((r, i) => (r !== false ? i : -1))
        .filter((i) => i !== -1);
    const base = g.roles
      .map((r, i) => (r === null ? i : -1))
      .filter((i) => i !== -1);
    const sw = g.strengths || {};
    const extra = [];
    if (
      cur.effect === "protect" &&
      sw[7] === "schwach" &&
      g.lastProtect !== undefined
    )
      extra.push(g.lastProtect);
    if (
      cur.effect === "rufmoerd_mark" &&
      sw[13] === "schwach" &&
      g.lastRufmoerd !== undefined
    )
      extra.push(g.lastRufmoerd);
    if (
      cur.effect === "dimitri_silence" &&
      sw[11] === "schwach" &&
      g.lastDimitriSilence !== undefined
    )
      extra.push(g.lastDimitriSilence);
    if (
      cur.effect === "prost_freier" &&
      sw[5] === "schwach" &&
      g.lastProstFreier !== undefined
    )
      extra.push(g.lastProstFreier);
    if (
      cur.effect === "wanderamor_freier" &&
      sw[4] === "schwach" &&
      g.lastWanderAmorFreier !== undefined
    )
      extra.push(g.lastWanderAmorFreier);
    return [...new Set([...base, ...extra])];
  };

  // Excluded seats for terrorist circle mode
  const getTerrExcluded = () => {
    if (!G.current) return [];
    return G.current.roles
      .map((r, i) => {
        const isTerr =
          r !== null && r !== false && CHARS[r]?.name === "Terrorist";
        return r === null || isTerr ? i : -1;
      })
      .filter((i) => i !== -1);
  };

  const canConfirm = () => {
    if (!cur || overlay || terrMode) return false;
    if (
      [
        "msg",
        "fn_end",
        "night_end",
        "derAndereStatus",
        "tom_jerry_reveal",
      ].includes(cur.type)
    )
      return true;
    if (cur.type === "deaths") return true;
    if (cur.type === "timer") return timerVal <= 0;
    return selected.length === (cur.count ?? 1);
  };

  // ── MAIN ADVANCE ───────────────────────────────────────────────────────────
  const advance = () => {
    if (!cur || !G.current || overlay || terrMode) return;
    const g = G.current;
    const s = selected[0];
    const next = () => {
      setSelected([]);
      setQIdx((i) => i + 1);
    };

    switch (cur.type) {
      case "msg":
        next();
        break;

      case "derAndereStatus":
        setOverlay({
          type: "derAndere",
          sharpened: g.derAndereSharpened,
          onClose: () => {
            setOverlay(null);
            next();
          },
        });
        break;

      case "tom_jerry_reveal": {
        const ts = g.roles.findIndex(
          (r) => r !== false && r !== null && CHARS[r]?.name === "Tom",
        );
        const js = g.roles.findIndex(
          (r) => r !== false && r !== null && CHARS[r]?.name === "Jerry",
        );
        if (ts !== -1 && js !== -1) {
          setOverlay({
            type: "tomjerry",
            tom: pName(ts),
            jerry: pName(js),
            onClose: () => {
              setOverlay(null);
              next();
            },
          });
        } else next();
        break;
      }

      case "id":
        selected.forEach((idx) => {
          g.roles[idx] = cur.charIdx;
          if (cur.charIdx === 6) g.derAndereSeat = idx;
        });
        syncDisplay();
        next();
        break;

      case "fn_end":
        g.roles.forEach((r, i) => {
          if (r === false) g.roles[i] = 0;
        });
        syncDisplay();
        goDay(true);
        break;

      case "night_end":
        goDay(false);
        break;
      case "timer":
        next();
        break;

      // ── DEATHS (morning) ─────────────────────────────────────────────────
      case "deaths": {
        let kill = [...new Set(g.justDied)].filter(
          (x) => !g.protected.includes(x),
        );

        // Prostituierte + Wanderamor via prostFreier map
        Object.entries(g.prostFreier || {}).forEach(([pStr, freierSeat]) => {
          const pSeat = parseInt(pStr);
          if (g.roles[pSeat] === null) return;
          const pHit = kill.includes(pSeat);
          const fHit = kill.includes(freierSeat);
          if (pHit) kill = kill.filter((x) => x !== pSeat);
          if (fHit && !kill.includes(pSeat)) kill.push(pSeat);
        });
        g.prostFreier = {};

        const sPending = g.scharpingDeathPending;
        if (sPending !== undefined) {
          if (g.roles[sPending] !== null && !kill.includes(sPending))
            kill.push(sPending);
          delete g.scharpingDeathPending;
        }
        kill
          .filter((x) => {
            const ri = g.roles[x];
            return (
              ri !== null &&
              ri !== false &&
              CHARS[ri]?.name === "Scharping" &&
              x !== sPending
            );
          })
          .forEach((x) => {
            kill = kill.filter((k) => k !== x);
            g.scharpingDeathPending = x;
            addWatch(
              `Scharping (${pName(x)}) überlebt — stirbt nächste Nacht!`,
              "warn",
            );
          });

        if (g.derAndereSeat !== -1 && g.roles[g.derAndereSeat] !== null) {
          const da = g.derAndereSeat;
          if (kill.includes(da)) {
            if (!g.derAndereSharpened) {
              kill = kill.filter((x) => x !== da);
              g.derAndereSharpened = true;
              addWatch(
                "Der Andere wurde getötet → ist nun GESCHÄRFT! Nächster Mordversuch tötet ihn.",
                "warn",
              );
            }
          }
        }

        if (g.dimitriDiesNextNight !== undefined) {
          const ds = g.dimitriDiesNextNight;
          if (g.roles[ds] !== null && !kill.includes(ds)) kill.push(ds);
          delete g.dimitriDiesNextNight;
        }
        if (cur.isFirstDay && kill.length === 0) {
          const dSeat = g.roles.findIndex(
            (r, i) => r !== null && r !== false && CHARS[r]?.name === "Dimitri",
          );
          if (dSeat !== -1) {
            g.dimitriDiesNextNight = dSeat;
            addWatch(
              `Niemand starb in der ersten Nacht — Dimitri (${pName(dSeat)}) stirbt nächste Nacht!`,
              "warn",
            );
          }
        }

        const deadInfos = kill.map((x) => killSeat(x, g)).filter(Boolean);
        g.justDied = [];
        syncDisplay();

        if (deadInfos.length === 0) addLog("🌤 Niemand gestorben");
        else
          deadInfos.forEach((d) =>
            addLog(`☠ ${d.name} (${d.roleName}) gestorben`),
          );

        if (g.dimitriSilenced !== null && g.roles[g.dimitriSilenced] !== null) {
          addWatch(
            `${pName(g.dimitriSilenced)} muss heute schweigen! (Dimitri-Befehl)`,
            "watch",
          );
          g.dimitriSilenced = null;
        }

        const wasDictDead =
          useDictator && g.dictSeat !== null && kill.includes(g.dictSeat);
        if (wasDictDead) g.dictSeat = null;
        syncDisplay();

        const loverDeaths = processLoverDeaths(g, kill);
        syncDisplay();
        const allDead = [...deadInfos, ...loverDeaths];
        handleTomJerry(g, allDead);

        const afterDeaths = () => {
          const w = checkWin(g);
          if (w) {
            setWinner(w);
            setScreen("over");
            return;
          }
          if (wasDictDead) {
            setQueue((prev) => {
              const n = [...prev];
              n.splice(qIdx + 1, 0, {
                type: "sel",
                count: 1,
                text: "Diktator wählt Nachfolger",
                sub: "Als letzte Amtshandlung.",
                effect: "dictator",
              });
              return n;
            });
          }
          setSelected([]);
          setQIdx((i) => i + 1);
        };
        showDeaths(allDead, afterDeaths);
        break;
      }

      // ── SELECTIONS ────────────────────────────────────────────────────────
      case "sel":
        switch (cur.effect) {
          case "kill":
            g.justDied = [...new Set([...g.justDied, s])];
            next();
            break;

          case "protect":
            g.protected = [...new Set([...g.protected, s])];
            g.lastProtect = s;
            next();
            break;

          case "prost_freier": {
            const pSeat = g.roles.findIndex(
              (r, i) =>
                r !== null &&
                r !== false &&
                CHARS[r]?.name === "Prostituierte" &&
                !(i in g.prostFreier),
            );
            if (pSeat !== -1) g.prostFreier[pSeat] = s;
            g.lastProstFreier = s;
            next();
            break;
          }

          case "wanderamor_freier": {
            const waSeat = g.roles.findIndex(
              (r, i) =>
                r !== null && r !== false && CHARS[r]?.name === "Wanderamor",
            );
            if (waSeat !== -1) g.prostFreier[waSeat] = s;
            g.lastWanderAmorFreier = s;
            next();
            break;
          }

          case "rufmoerd_mark":
            g.rufmordMarked = s;
            g.lastRufmoerd = s;
            addLog(`🎭 Rufmörder markiert ${pName(s)} für Detektiv`);
            next();
            break;

          case "amor_couple": {
            const [a, b] = [selected[0], selected[1]];
            g.lovers = [a, b];
            const pa =
              g.roles[a] !== false && g.roles[a] !== null
                ? CHARS[g.roles[a]]?.party
                : 0;
            const pb2 =
              g.roles[b] !== false && g.roles[b] !== null
                ? CHARS[g.roles[b]]?.party
                : 0;
            g.loversDiffParty = pa !== pb2;
            addLog(`💕 Liebespaar: ${pName(a)} & ${pName(b)}`);
            if (g.loversDiffParty)
              addWatch(
                `Liebespaar aus verschiedenen Fraktionen: ${pName(a)} + ${pName(b)} — gewinnen nur zusammen!`,
                "watch",
              );
            next();
            break;
          }

          case "detect": {
            const ri = g.roles[s];
            let isEvil =
              ri === false || ri === null ? false : CHARS[ri].detectEvil;
            if (g.rufmordMarked === s) {
              isEvil = true;
              g.rufmordMarked = null;
            }
            setOverlay({
              type: "detect",
              name: pName(s),
              isGood: !isEvil,
              onClose: () => {
                setOverlay(null);
                next();
              },
            });
            break;
          }

          case "dimitri_silence":
            g.dimitriSilenced = s;
            g.lastDimitriSilence = s;
            addLog(`🤐 ${pName(s)} muss morgen schweigen (Dimitri)`);
            next();
            break;

          case "dictator": {
            g.dictSeat = s;
            syncDisplay();
            addLog(`⚑ ${pName(s)} ist Diktator`);
            const ri = g.roles[s];
            if (ri !== null && ri !== false && CHARS[ri]?.name === "Kaiser") {
              setWinner("kaiser");
              setScreen("over");
              return;
            }
            next();
            break;
          }

          case "vote": {
            const ri = g.roles[s];
            const roleName =
              ri !== null && ri !== false ? CHARS[ri]?.name : "Bürger";
            const partyIdx =
              ri !== null && ri !== false ? (CHARS[ri]?.party ?? 0) : 0;
            const isDerAndereWin =
              g.derAndereSeat === s &&
              g.derAndereSharpened &&
              g.roles[s] !== null;
            const wasDic = useDictator && g.dictSeat === s;

            // Actually kill the voted player
            killSeat(s, g);
            if (wasDic) g.dictSeat = null;
            syncDisplay();
            addLog(`⚖ ${pName(s)} (${roleName}) wurde verbannt`);

            const loverDeaths = processLoverDeaths(g, [s]);
            syncDisplay();
            const allDead = [
              { seat: s, name: pName(s), roleName, partyIdx },
              ...loverDeaths,
            ];
            handleTomJerry(g, allDead);

            showDeaths(allDead, () => {
              if (isDerAndereWin) {
                setWinner("derAndere");
                setScreen("over");
                return;
              }
              const w = checkWin(g);
              if (w) {
                setWinner(w);
                setScreen("over");
                return;
              }
              const extra = [];
              if (wasDic)
                extra.push({
                  type: "sel",
                  count: 1,
                  text: `${pName(s)} bestimmt Nachfolger`,
                  sub: "Als letzte Amtshandlung.",
                  effect: "dictator",
                });
              goNight(extra);
            });
            break;
          }

          default:
            break;
        }
        break;

      default:
        next();
        break;
    }
  };

  const toggleSeat = (i) => {
    if (terrMode) {
      // Terrorist mode: single seat from circle
      const excl = getTerrExcluded();
      if (excl.includes(i)) return;
      setSelected([i]);
      return;
    }
    const excl = getExcluded();
    if (excl.includes(i)) return;
    setSelected((p) => {
      if (p.includes(i)) return p.filter((x) => x !== i);
      const max = cur?.count ?? 1;
      return p.length >= max ? [...p.slice(1), i] : [...p, i];
    });
  };

  // ── Math commit
  const commitMath = () => {
    const g = G.current;
    if (!g) return;
    const evil = mathSel.filter((i) => {
      const ri = g.roles[i];
      return ri !== null && ri !== false && CHARS[ri].detectEvil;
    }).length;
    setMathResult(evil);
    setMathUsed(true);
    addLog(
      `🧮 Mathematiker: ${evil} böse Person${evil !== 1 ? "en" : ""} in Gruppe`,
    );
  };

  // ── Terrorist commit (uses selected[0] from circle)
  const commitTerrorist = () => {
    const target = selected[0];
    const g = G.current;
    if (!g || target === undefined) return;
    const terrSeatIdx = g.roles.findIndex(
      (r, i) => r !== null && r !== false && CHARS[r]?.name === "Terrorist",
    );
    const seats = [terrSeatIdx, target].filter((x) => x !== -1);
    const infos = seats.map((x) => killSeat(x, g)).filter(Boolean);
    addLog(
      `💣 Terrorist outet sich — ${infos.map((d) => d.name).join(" & ")} sterben`,
    );
    syncDisplay();
    setTerrUsed(true);
    setTerrMode(false);
    setSelected([]);
    showDeaths(infos, () => {
      const w = checkWin(g);
      if (w) {
        setWinner(w);
        setScreen("over");
      }
    });
  };

  const getIcon = () => {
    if (!cur) return "◆";
    const t = cur.type,
      e = cur.effect;
    if (t === "timer") return "☀";
    if (t === "deaths") return "⚰";
    if (t === "fn_end" || t === "night_end") return "🌅";
    if (e === "kill") return "🔪";
    if (e === "detect") return "🔍";
    if (e === "protect") return "🛡";
    if (e === "dictator") return "⚑";
    if (e === "vote") return "⚖";
    if (e === "amor_couple") return "💕";
    if (e === "prost_freier" || e === "wanderamor_freier") return "🌹";
    if (e === "rufmoerd_mark") return "🎭";
    if (e === "dimitri_silence") return "🤐";
    if (t === "derAndereStatus") return "🌑";
    if (t === "tom_jerry_reveal") return "🐱";
    if (t === "id") return "👁";
    if (/Nacht/.test(cur.text || "")) return "🌙";
    return "◆";
  };

  const isNight =
    cur?.type === "id" ||
    (cur?.type === "sel" &&
      [
        "kill",
        "protect",
        "detect",
        "rufmoerd_mark",
        "prost_freier",
        "wanderamor_freier",
        "amor_couple",
        "dimitri_silence",
      ].includes(cur?.effect)) ||
    cur?.type === "derAndereStatus" ||
    (cur?.type === "msg" &&
      /Nacht|schlafen|öffnet|Mafia|Triaden|Rufmörder|Detektiv|Seelenretter|Prostituierte|Wanderamor|Amor|Dimitri/.test(
        cur?.text || "",
      ));

  const showGrid = cur?.type === "id" || cur?.type === "sel";
  const excl = getExcluded();
  const hasMath =
    showRoles &&
    !isNight &&
    roles.some(
      (r, i) => r !== null && r !== false && CHARS[r]?.name === "Mathematiker",
    ) &&
    !mathUsed;
  const hasTerrorist =
    showRoles &&
    !isNight &&
    roles.some(
      (r, i) => r !== null && r !== false && CHARS[r]?.name === "Terrorist",
    ) &&
    !terrUsed;

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (screen === "setup")
    return (
      <div className="ma">
        <style>{CSS}</style>
        <div className="setup">
          <h1 className="h1">Mafia</h1>
          <p className="h1s">das Gesellschaftsspiel</p>
          <div className="sdots">
            <div className={`sdot${setupStep === 0 ? " act" : ""}`} />
            <div className={`sdot${setupStep === 1 ? " act" : ""}`} />
          </div>

          {setupStep === 0 && (
            <>
              <div className="card">
                <div className="ct">
                  Rollen auswählen · {numPlayers} Spieler
                </div>
                <div className="cgrid">
                  {CHARS.map((c, i) => {
                    const col =
                      c.party === 1
                        ? "var(--red2)"
                        : c.party === 2
                          ? "var(--purple)"
                          : c.party === 3
                            ? "var(--blue)"
                            : "var(--green)";
                    const isStarkChar = STARK_CHARS.includes(i);
                    const mode = strengthModes[i] || "stark";
                    return (
                      <div key={i} className="crow">
                        <div className="crow-top">
                          <span className="cn" style={{ color: col }}>
                            {c.name}
                          </span>
                          <div className="cnt">
                            <button
                              className="cbt"
                              onClick={() =>
                                setCounts((p) => ({
                                  ...p,
                                  [i]: Math.max(0, (p[i] || 0) - 1),
                                }))
                              }
                            >
                              −
                            </button>
                            <span className="cv">{counts[i] || 0}</span>
                            <button
                              className="cbt"
                              onClick={() =>
                                setCounts((p) => ({
                                  ...p,
                                  [i]: (p[i] || 0) + 1,
                                }))
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="cdesc">{c.desc}</div>
                        {isStarkChar && (
                          <div className="csk">
                            <span className="csk-label">Stärke:</span>
                            <button
                              className={`csk-btn ${mode}`}
                              onClick={() =>
                                setStrengthModes((p) => ({
                                  ...p,
                                  [i]: p[i] === "stark" ? "schwach" : "stark",
                                }))
                              }
                            >
                              {mode === "stark" ? "⚡ Stark" : "💤 Schwach"}
                            </button>
                            <span
                              style={{
                                fontSize: ".52rem",
                                color: "var(--text-faint)",
                                flex: 1,
                              }}
                            >
                              {STARK_LABEL[i][mode]}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="card">
                <div className="ct">Einstellungen</div>
                <div className="trow">
                  <span className="tlbl">Diktator-Modus</span>
                  <div
                    className={`tog${useDictator ? " on" : ""}`}
                    onClick={() => setUseDictator((p) => !p)}
                  >
                    <div className="tok" />
                  </div>
                </div>
                <div className="trow" style={{ marginBottom: 0 }}>
                  <span className="tlbl">Diskussionszeit · {timerSec}s</span>
                  <div className="cnt">
                    <button
                      className="cbt"
                      onClick={() => setTimerSec((s) => Math.max(0, s - 15))}
                    >
                      −
                    </button>
                    <span className="cv">{timerSec}</span>
                    <button
                      className="cbt"
                      onClick={() => setTimerSec((s) => s + 15)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="srow">
                <button
                  className="startbtn"
                  disabled={numPlayers < 2}
                  onClick={() => setSetupStep(1)}
                >
                  Weiter → Sitzordnung
                </button>
              </div>
            </>
          )}

          {setupStep === 1 && (
            <>
              <div className="card">
                <div className="ct">Sitzordnung · {numPlayers} Spieler</div>
                <SetupCircle
                  n={numPlayers}
                  names={seatNames}
                  onSet={(i, v) =>
                    setSeatNames((p) => {
                      const n = [...p];
                      n[i] = v;
                      return n;
                    })
                  }
                />
              </div>
              <div className="srow">
                <button className="prevbtn" onClick={() => setSetupStep(0)}>
                  ← Zurück
                </button>
                <button className="startbtn" onClick={startGame}>
                  Spiel Beginnen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );

  // ── WIN ────────────────────────────────────────────────────────────────────
  if (screen === "over") {
    const WD = {
      village: {
        t: "Das Dorf gewinnt!",
        s: "Alle Bösen wurden vertrieben.",
        c: "wv",
      },
      mafia: {
        t: "Die Mafia gewinnt!",
        s: "Die Mafia kontrolliert das Dorf.",
        c: "wm",
      },
      triaden: {
        t: "Die Triaden gewinnen!",
        s: "Die Triaden beherrschen alles.",
        c: "wtr",
      },
      lovers: {
        t: "Das Liebespaar gewinnt!",
        s: "Sie waren die letzten — zusammen bis zum Ende.",
        c: "wv",
      },
      kaiser: {
        t: "Der Kaiser gewinnt!",
        s: "Er wurde zum Diktator gewählt.",
        c: "wbl",
      },
      derAndere: {
        t: "Der Andere gewinnt!",
        s: "Er wurde geschärft verbannt.",
        c: "wbl",
      },
    };
    const w = WD[winner] || WD.village;
    return (
      <div className="ma">
        <style>{CSS}</style>
        <div className="win">
          <div>
            <h1 className={`wt ${w.c}`}>{w.t}</h1>
            <p className="ws">{w.s}</p>
            <button
              className="cfbtn"
              onClick={() => {
                setScreen("setup");
                setSetupStep(0);
              }}
            >
              Neues Spiel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ───────────────────────────────────────────────────────────────────
  const circleExcl = terrMode ? getTerrExcluded() : showGrid ? excl : [];
  const circleToggle = terrMode || showGrid ? toggleSeat : null;

  return (
    <div className="ma">
      <style>{CSS}</style>

      {overlay?.type === "detect" && (
        <div className="overlay">
          <div className="rcard">
            <div className="ri">{overlay.isGood ? "✦" : "✖"}</div>
            <div className="rn">{overlay.name}</div>
            <div className={`rr ${overlay.isGood ? "rg" : "re"}`}>
              {overlay.isGood ? "ist gut" : "ist böse"}
            </div>
            <button className="cfbtn" onClick={overlay.onClose}>
              Verstanden
            </button>
          </div>
        </div>
      )}

      {overlay?.type === "death" && (
        <div className="overlay">
          <div className="rcard">
            <div className="ri">💀</div>
            <div className="rn">
              {overlay.name}
              {overlay.isLover ? " 💔" : ""}
            </div>
            <div
              className={`rr ${overlay.partyIdx === 1 ? "re" : overlay.partyIdx === 2 ? "rt" : overlay.partyIdx === 3 ? "rb" : "rg"}`}
            >
              {overlay.roleName}
            </div>
            <div className="rp">{pnm(overlay.partyIdx)}</div>
            <button className="cfbtn" onClick={overlay.onClose}>
              Verstanden
            </button>
          </div>
        </div>
      )}

      {overlay?.type === "derAndere" && (
        <div className="overlay">
          <div className="rcard">
            <div className="ri">🌑</div>
            <div className="rn">Der Andere</div>
            <div className={`rr ${overlay.sharpened ? "re" : "rg"}`}>
              {overlay.sharpened ? "Geschärft" : "Ungeschärft"}
            </div>
            <div className="rp" style={{ marginBottom: 18 }}>
              {overlay.sharpened
                ? "Wird er nun vom Dorf verbannt → er gewinnt. Ein weiterer Mordversuch tötet ihn."
                : "Ein Mordversuch würde ihn schärfen, nicht töten."}
            </div>
            <button className="cfbtn" onClick={overlay.onClose}>
              Verstanden
            </button>
          </div>
        </div>
      )}

      {overlay?.type === "tomjerry" && (
        <div className="overlay">
          <div className="rcard">
            <div className="ri">🐱🐭</div>
            <div
              className="stitle"
              style={{
                marginBottom: 8,
                fontFamily: "Cinzel,serif",
                fontSize: "1.2rem",
                color: "var(--gold)",
              }}
            >
              Tom & Jerry
            </div>
            <div className="rp" style={{ marginBottom: 18 }}>
              Tom:{" "}
              <strong style={{ color: "var(--blue)" }}>{overlay.tom}</strong>
              <br />
              Jerry:{" "}
              <strong style={{ color: "var(--blue)" }}>{overlay.jerry}</strong>
              <br />
              <br />
              Sie kennen sich jetzt. Jeder gewinnt und verlässt das Spiel, wenn
              der andere stirbt.
            </div>
            <button className="cfbtn" onClick={overlay.onClose}>
              Verstanden
            </button>
          </div>
        </div>
      )}

      {overlay?.type === "math" && (
        <div className="overlay">
          <div className="rcard" style={{ maxWidth: 420 }}>
            <div className="ri">🧮</div>
            <div
              className="stitle"
              style={{
                fontFamily: "Cinzel,serif",
                fontSize: "1.2rem",
                color: "var(--gold)",
                marginBottom: 4,
              }}
            >
              Mathematiker
            </div>
            <div
              className="ssub"
              style={{
                marginBottom: 10,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              Wähle beliebig viele Spieler aus
            </div>
            <div className="msel-grid">
              {Array.from({ length: numPlayers }).map((_, i) => {
                const ri = roles[i];
                const dead = ri === null;
                return (
                  <div
                    key={i}
                    className={`msel-seat${dead ? " dead" : ""}${mathSel.includes(i) ? " sel" : ""}`}
                    onClick={() => {
                      if (!dead) {
                        setMathSel((p) =>
                          p.includes(i) ? p.filter((x) => x !== i) : [...p, i],
                        );
                        setMathResult(null);
                      }
                    }}
                  >
                    {pName(i)}
                  </div>
                );
              })}
            </div>
            {mathResult !== null && (
              <div className="mathresult">
                {mathResult} böse {mathResult === 1 ? "Person" : "Personen"}
              </div>
            )}
            {mathResult === null && (
              <button
                className="cfbtn"
                style={{ marginBottom: 10 }}
                disabled={!mathSel.length}
                onClick={commitMath}
              >
                Berechnen
              </button>
            )}
            {mathResult !== null && (
              <button
                className="cfbtn"
                onClick={() => {
                  setOverlay(null);
                  setMathSel([]);
                  setMathResult(null);
                }}
              >
                Schließen
              </button>
            )}
          </div>
        </div>
      )}

      <div className="game">
        <div className="ghead">
          <div className="gtitle">Mafia</div>
          <div className="rndbdg">Runde {roundNum}</div>
          <button className="gbtn" onClick={() => setScreen("setup")}>
            ← Setup
          </button>
        </div>

        <div className="main">
          <div
            key={qIdx}
            className={`stepcard anim ${isNight ? "night" : "day"}`}
          >
            <span className="sicon">{getIcon()}</span>
            <div className="stitle">
              {terrMode ? "💣 Terrorist outet sich" : cur?.text || ""}
            </div>
            {!terrMode && cur?.sub && <div className="ssub">{cur.sub}</div>}
            {terrMode && (
              <div className="ssub">
                Wähle das Ziel im Kreis — beide sterben.
              </div>
            )}
            {cur?.type === "timer" && !terrMode && (
              <>
                <div className={`tnum${timerVal <= 5 ? " low" : ""}`}>
                  {timerVal}
                </div>
                <div className="tbar">
                  <div
                    className="tfill"
                    style={{
                      width: `${(timerVal / (cur.seconds || 1)) * 100}%`,
                    }}
                  />
                </div>
                <button
                  className="skipbtn"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerVal(0);
                  }}
                >
                  Timer überspringen
                </button>
              </>
            )}
            {!terrMode && !isNight && (hasMath || hasTerrorist) && (
              <div className="daybtnrow">
                {hasMath && (
                  <button
                    className="daybtn"
                    onClick={() => {
                      setMathSel([]);
                      setMathResult(null);
                      setOverlay({ type: "math" });
                    }}
                  >
                    🧮 Mathematiker-Aktion (einmalig)
                  </button>
                )}
                {hasTerrorist && (
                  <button
                    className="daybtn"
                    onClick={() => {
                      setTerrMode(true);
                      setSelected([]);
                    }}
                  >
                    💣 Terrorist outet sich
                  </button>
                )}
              </div>
            )}
          </div>

          <CircleBoard
            n={numPlayers}
            names={seatNames}
            roles={roles}
            selected={selected}
            excluded={circleExcl}
            dictSeat={dictSeat}
            onToggle={circleToggle}
            showRoles={showRoles}
            lovers={G.current?.lovers}
          />

          <div className="cfwrap">
            {terrMode ? (
              <div className="terr-ui">
                <div className="terr-hint">Wähle das Ziel im Kreis</div>
                <div className="terr-target">
                  {selected[0] !== undefined
                    ? `Ziel: ${pName(selected[0])}`
                    : ""}
                </div>
                <div className="terr-btns">
                  <button
                    className="prevbtn"
                    onClick={() => {
                      setTerrMode(false);
                      setSelected([]);
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    className="cfbtn"
                    disabled={selected.length === 0}
                    onClick={commitTerrorist}
                  >
                    💣 Bestätigen
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="cfbtn"
                disabled={!canConfirm()}
                onClick={advance}
              >
                Weiter
              </button>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="sc">
            <div className="sct">Spieler</div>
            {Array.from({ length: numPlayers }).map((_, i) => {
              const ri = roles[i];
              const alive = ri !== null;
              const roleName =
                showRoles && ri !== null && ri !== false
                  ? CHARS[ri]?.name
                  : null;
              const pc = alive && ri !== false ? pb(ri) : null;
              const isLover =
                G.current?.lovers &&
                (G.current.lovers[0] === i || G.current.lovers[1] === i);
              return (
                <div
                  key={i}
                  className="ai"
                  style={{ opacity: alive ? 1 : 0.14 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      minWidth: 0,
                    }}
                  >
                    <div
                      className="adot"
                      style={{
                        background: alive
                          ? pc || "var(--green)"
                          : "var(--border2)",
                      }}
                    />
                    <div className="atxt">
                      <div className="aname">
                        {pName(i)}
                        {isLover && alive ? " 💕" : ""}
                      </div>
                      {roleName && (
                        <div
                          className="arole"
                          style={{ color: pc || "var(--green)" }}
                        >
                          {roleName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      flexShrink: 0,
                    }}
                  >
                    {dictSeat === i && alive && (
                      <span className="dtag">Dikt.</span>
                    )}
                    {G.current?.dimitriSilenced === i && alive && (
                      <span style={{ fontSize: ".7rem", color: "var(--blue)" }}>
                        🤐
                      </span>
                    )}
                    {alive && (
                      <button
                        className="kickbtn"
                        title="Verlässt Spiel"
                        onClick={() => kickPlayer(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {watchList.length > 0 && (
            <div
              className="sc"
              style={{
                background: "var(--warn-bg)",
                borderColor: "var(--warn-bdr)",
              }}
            >
              <div className="sct" style={{ color: "var(--gold)", opacity: 1 }}>
                ⚠ Spielleiter Aufgaben
              </div>
              <div className="watchscroll">
                {watchList.map((w) => (
                  <div key={w.id} className="we">
                    <span
                      className="wtag"
                      style={{
                        background:
                          w.type === "warn"
                            ? "var(--warn-bdr)"
                            : "var(--watch-bdr)",
                        color:
                          w.type === "warn" ? "var(--gold)" : "var(--blue)",
                        borderColor:
                          w.type === "warn" ? "var(--gold)" : "var(--blue)",
                      }}
                    >
                      {w.type === "warn" ? "!" : "👁"}
                    </span>
                    <span
                      style={{
                        color:
                          w.type === "warn" ? "var(--text-dim)" : "var(--blue)",
                        fontSize: ".71rem",
                      }}
                    >
                      {w.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sc">
            <div className="sct">Verlauf</div>
            <div className="logscroll">
              {gameLog.length === 0 ? (
                <div className="le0">Noch nichts...</div>
              ) : (
                gameLog.map((e, i) => (
                  <div key={i} className="le">
                    {e}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
