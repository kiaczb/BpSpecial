export function convertResult(time: number, category: string = "333"): string {
  if (time == 0) return "-";
  if (time == -1) return "DNF";
  if (time == -2) return "DNS";

  if (category === "333fm" && time < 100) {
    return time.toString();
  }

  if (category == "333mbf") {
    const missed = time % 100;
    const formattedTime = formatSeconds_mm_ss(
      parseInt(time.toString().slice(2, 7))
    ).split(".")[0];
    const point = 99 - parseInt(time.toString().slice(0, 2));
    return `${missed + point} / ${2 * missed + point} ${formattedTime}`;
  }

  let formattedTime: string;

  if (time < 6000) {
    formattedTime = (time / 100).toFixed(2);
  } else {
    formattedTime = formatSeconds_mm_ss(time / 100);
  }

  return formattedTime;
}

// Példa: FormatSeconds_mm_ss függvény (ha nincs meg)
function formatSeconds_mm_ss(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toFixed(2).padStart(5, "0")}`;
}

export const hasValidResults = (times: string[]): boolean => {
  return times.some((time) => time !== "DNS" && time !== "");
};
// src/utils.ts
// ... (egyéb meglévő függvények)

export function parseTimeToCentiseconds(timeString: string): number {
  if (!timeString) return -1;

  timeString = timeString.trim().toUpperCase();
  if (timeString === "DNF") return -1;
  if (timeString === "DNS") return -2;

  // Formátumok: "MM:SS.ss", "SS.ss", "SS"
  const parts = timeString.split(":");

  if (parts.length === 2) {
    // MM:SS.ss formátum
    const minutes = parseInt(parts[0]) || 0;
    const secondsParts = parts[1].split(".");
    const seconds = parseInt(secondsParts[0]) || 0;
    const hundredths = secondsParts[1]
      ? parseInt(secondsParts[1].padEnd(2, "0"))
      : 0;

    return minutes * 60 * 100 + seconds * 100 + hundredths;
  } else {
    // SS.ss vagy SS formátum
    const secondsParts = timeString.split(".");
    const seconds = parseInt(secondsParts[0]) || 0;
    const hundredths = secondsParts[1]
      ? parseInt(secondsParts[1].padEnd(2, "0"))
      : 0;

    return seconds * 100 + hundredths;
  }
}
