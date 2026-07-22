export function parseNumericValue(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatResourceValue(id: string, num: number): string {
  if (id === 'wealth') {
    return `¥ ${(num / 1e9).toFixed(1)}B`;
  }
  if (id === 'support') {
    return `${Math.round(num)}%`;
  }
  return String(Math.round(num));
}

export function formatNationValue(key: string, num: number): string {
  if (key === 'cpi') {
    return `${num.toFixed(1)}%`;
  }
  return String(Math.round(num));
}

export function formatDelta(delta: number, isPercent = false): string {
  if (delta === 0) return '持平';
  const arrow = delta > 0 ? '▲' : '▼';
  const magnitude = Math.abs(delta);
  const suffix = isPercent ? '%' : '';
  return `${arrow} ${magnitude}${suffix} / 期`;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function interpolateResourceValue(
  id: string,
  fromValue: string,
  toValue: string,
  progress: number,
): string {
  const from = parseNumericValue(fromValue);
  const to = parseNumericValue(toValue);
  const current = from + (to - from) * progress;
  return formatResourceValue(id, current);
}
