// Parses "1h 30m", "90m", "1h", "3600s" → seconds
export function parseTimeToSeconds(input: string): number | null {
  const str = input.trim().toLowerCase();

  // Already seconds e.g. "3600s"
  const secOnly = str.match(/^(\d+)s$/);
  if (secOnly) return parseInt(secOnly[1]);

  // e.g. "1h 30m" or "1h30m"
  const hm = str.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
  if (hm && (hm[1] || hm[2])) {
    const hours = parseInt(hm[1] ?? '0');
    const mins = parseInt(hm[2] ?? '0');
    if (!isNaN(hours) && !isNaN(mins)) {
      return hours * 3600 + mins * 60;
    }
  }

  // Plain number = minutes e.g. "90"
  const plain = str.match(/^(\d+)$/);
  if (plain) return parseInt(plain[1]) * 60;

  return null;
}

// Formats seconds → "1h 30m"
// Add minutes to "HH:MM" string → "HH:MM"
export function addSecondsToTime(time: string, seconds: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMins = h * 60 + m + Math.floor(seconds / 60);
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Formats seconds → "1h 30m"
export function secondsToHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}