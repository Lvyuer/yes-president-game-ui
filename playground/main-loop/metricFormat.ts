const PERCENT_NATION_KEYS = new Set(['cpi', 'unemployment', 'gdp']);

export function parseNumericValue(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatResourceValue(id: string, num: number): string {
  if (id === 'dynasty_wealth') {
    return `¥ ${(num / 1e9).toFixed(1)}B`;
  }
  if (id === 'support') {
    return `${Math.round(num)}%`;
  }
  return String(Math.round(num));
}

export function formatNationValue(key: string, num: number): string {
  if (key === 'gdp') {
    const sign = num > 0 ? '+' : num < 0 ? '' : '';
    return `${sign}${num.toFixed(1)}%`;
  }
  if (PERCENT_NATION_KEYS.has(key)) {
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

export function nationMetricUsesPercent(key: string): boolean {
  return PERCENT_NATION_KEYS.has(key);
}

export function nationMetricProgress(key: string, value: number): number {
  if (key === 'gdp') {
    return Math.min(100, Math.max(0, Math.round((value + 5) * 10)));
  }
  if (key === 'cpi' || key === 'unemployment') {
    return Math.min(100, Math.max(0, Math.round(value * 10)));
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** 议题板 / 简报用：中文指标名 → GameIcon 名 */
const METRIC_LABEL_ICONS: Record<string, string> = {
  民众支持率: 'support',
  总统威望度: 'prestige',
  个人安全值: 'security',
  治安指数: 'nation',
  家族资产: 'wealth',
  'GDP 增速': 'chart',
  CPI: 'chart',
  'CPI（年化）': 'chart',
  失业率: 'chart',
  文化影响: 'chart',
  军事态势: 'nation',
  外交态势: 'nation',
};

export function iconForMetricLabel(label: string): string {
  const trimmed = label.trim();
  if (METRIC_LABEL_ICONS[trimmed]) return METRIC_LABEL_ICONS[trimmed]!;
  const matched = Object.keys(METRIC_LABEL_ICONS).find((key) => trimmed.includes(key));
  return matched ? METRIC_LABEL_ICONS[matched]! : 'chart';
}

export type MetricConsequenceChip = {
  label: string;
  arrow: string;
  icon: string;
  direction: 'up' | 'down' | 'flat';
};

/** 解析「治安指数 ↓」类后果文案为带图标的条目（允许箭头后附注）。 */
export function parseMetricConsequenceLine(line: string): MetricConsequenceChip {
  const trimmed = line.trim();
  const match = trimmed.match(/^(.*?)(?:\s*([↑↓▲▼→←↔～~]))\s*(.*)$/u);
  const labelCore = (match?.[1] ?? trimmed).trim();
  const arrowRaw = match?.[2] ?? '';

  let direction: MetricConsequenceChip['direction'] = 'flat';
  let arrow = arrowRaw;
  if (arrowRaw === '↑' || arrowRaw === '▲') {
    direction = 'up';
    arrow = '↑';
  } else if (arrowRaw === '↓' || arrowRaw === '▼') {
    direction = 'down';
    arrow = '↓';
  } else if (arrowRaw === '→' || arrowRaw === '←' || arrowRaw === '↔' || arrowRaw === '～' || arrowRaw === '~') {
    direction = 'flat';
    arrow = '→';
  }

  return {
    label: labelCore,
    arrow,
    icon: iconForMetricLabel(labelCore),
    direction,
  };
}
