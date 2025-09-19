export const convertResult = (
  resultValue: number,
  eventId?: string
): string => {
  if (resultValue === -1) return "DNF";
  if (resultValue === -2) return "DNS";
  if (resultValue === 0) return "";

  if (eventId === "333fm") {
    return resultValue.toString();
  }

  const minutes = Math.floor(resultValue / 6000);
  const seconds = Math.floor((resultValue % 6000) / 100);
  const centiseconds = resultValue % 100;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${centiseconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${seconds}.${centiseconds.toString().padStart(2, "0")}`;
};

export const hasValidResults = (times: string[]): boolean => {
  return times.some((time) => time !== "DNS" && time !== "DNF" && time !== "");
};
