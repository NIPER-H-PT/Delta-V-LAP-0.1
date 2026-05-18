/**
 * PartialDayBadge.jsx
 * Drop into your src/components/ folder.
 *
 * Renders a compact warning badge + expandable tooltip when a day's
 * recording is incomplete. Styled to match ΔV-LAP's dark glassmorphism theme.
 *
 * Usage (in your day-tab or metrics header):
 *
 *   import { detectPartialDay } from "../utils/partialDayUtils";
 *   import PartialDayBadge from "../components/PartialDayBadge";
 *
 *   const partialInfo = detectPartialDay(selectedDayHourly, lightS, lightE);
 *   {partialInfo.isPartial && <PartialDayBadge message={partialInfo.message} hoursRecorded={partialInfo.hoursRecorded} />}
 */

import { useState } from "react";

export default function PartialDayBadge({ message, hoursRecorded }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.wrapper}>
      {/* Pill badge — always visible */}
      <button
        style={styles.badge}
        onClick={() => setOpen(o => !o)}
        title="Click for details"
        aria-expanded={open}
      >
        <span style={styles.icon}>⚠</span>
        <span style={styles.badgeText}>Partial · {hoursRecorded}h</span>
      </button>

      {/* Expanded tooltip */}
      {open && (
        <div style={styles.tooltip} role="tooltip">
          <p style={styles.tooltipText}>{message}</p>
          <button style={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    marginLeft: "10px",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 180, 0, 0.45)",
    background: "rgba(255, 160, 0, 0.12)",
    backdropFilter: "blur(8px)",
    color: "#FFB300",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "background 0.2s",
    outline: "none",
  },
  icon: {
    fontSize: "12px",
    lineHeight: 1,
  },
  badgeText: {
    textTransform: "uppercase",
  },
  tooltip: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: "50%",
    transform: "translateX(-50%)",
    width: "320px",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 180, 0, 0.3)",
    background: "rgba(18, 22, 36, 0.92)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
    zIndex: 100,
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  tooltipText: {
    margin: 0,
    flex: 1,
    color: "rgba(255, 220, 130, 0.95)",
    fontSize: "12px",
    lineHeight: "1.6",
    fontWeight: "400",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    cursor: "pointer",
    fontSize: "13px",
    padding: "0",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "1px",
  },
};
