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
