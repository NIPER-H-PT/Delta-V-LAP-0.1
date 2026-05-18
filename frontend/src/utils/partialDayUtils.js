/**
 * partialDayUtils.js
 * Drop this file into your frontend src/utils/ folder.
 *
 * Detects whether a given day's hourly data represents a partial day
 * (i.e. recording started late or ended early), and returns a tooltip
 * message explaining why comparison with other days may be misleading.
 */

/**
 * Given the hourly array for one day (from the backend response),
 * returns an object describing whether the day is partial.
 *
 * @param {Array}  hourlyData  - The `hourly` array for a single day from the API
 * @param {number} lightS      - Light phase start hour (e.g. 7)
 * @param {number} lightE      - Light phase end hour   (e.g. 19)
 * @returns {{ isPartial: boolean, hoursRecorded: number, message: string }}
 */
export function detectPartialDay(hourlyData, lightS, lightE) {
  if (!hourlyData || hourlyData.length === 0) {
    return { isPartial: false, hoursRecorded: 0, message: "" };
  }

  // Count hours that have any data rows at all (distance OR active time recorded)
  // A true 24h day will have 24 hourly buckets; anything fewer is partial.
  const hoursRecorded = hourlyData.length;
  const isPartial = hoursRecorded < 20; // threshold: <20h = partial day

  if (!isPartial) {
    return { isPartial: false, hoursRecorded, message: "" };
  }

  // Determine which end of the day is missing
  const firstHour = parseInt(hourlyData[0]?.label?.split(", ")[1]?.split(":")[0] ?? "0", 10);
  const lastHour  = parseInt(hourlyData[hourlyData.length - 1]?.label?.split(", ")[1]?.split(":")[0] ?? "23", 10);

  const missingStart = firstHour > 0;
  const missingEnd   = lastHour < 23;

  let reason = "";
  if (missingStart && missingEnd) {
    reason = `Recording started at ${firstHour}:00 and ended at ${lastHour}:59.`;
  } else if (missingStart) {
    reason = `Recording started late at ${firstHour}:00.`;
  } else if (missingEnd) {
    reason = `Recording ended early at ${lastHour}:59.`;
  }

  // Warn specifically if the missing window overlaps with the dark (active) phase
  const darkPhaseHours = getDarkPhaseHours(lightS, lightE);
  const missingHours   = getMissingHours(firstHour, lastHour);
  const missedDarkHours = missingHours.filter(h => darkPhaseHours.includes(h));

  let activityWarning = "";
  if (missedDarkHours.length > 0) {
    activityWarning = ` ${missedDarkHours.length}h of peak activity (dark phase) not captured — distance will appear artificially low.`;
  }

  return {
    isPartial: true,
    hoursRecorded,
    message: `⚠️ Partial day (${hoursRecorded}h recorded). ${reason}${activityWarning} Avoid direct comparison with full days.`,
  };
}

/** Returns array of hours that belong to the dark (active) phase */
function getDarkPhaseHours(lightS, lightE) {
  const hours = [];
  for (let h = 0; h < 24; h++) {
    const isLight = lightS < lightE
      ? h >= lightS && h < lightE
      : h >= lightS || h < lightE;
    if (!isLight) hours.push(h);
  }
  return hours;
}

/** Returns array of hours NOT present in the recording */
function getMissingHours(firstHour, lastHour) {
  const missing = [];
  for (let h = 0; h < firstHour; h++) missing.push(h);
  for (let h = lastHour + 1; h < 24; h++) missing.push(h);
  return missing;
}
