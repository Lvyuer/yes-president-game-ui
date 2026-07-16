import actionIcon from '@/assets/themes/default/icons/action.svg';
import chartIcon from '@/assets/themes/default/icons/chart.svg';
import closeIcon from '@/assets/themes/default/icons/close.svg';
import documentIcon from '@/assets/themes/default/icons/document.svg';
import playIcon from '@/assets/themes/default/icons/play.svg';

const iconMap: Record<string, string> = {
  action: actionIcon,
  document: documentIcon,
  chart: chartIcon,
  play: playIcon,
  close: closeIcon,
};

export function resolveGameIcon(name?: string): string | undefined {
  if (!name) return undefined;
  return iconMap[name] ?? name;
}

export const gameIconNames = Object.keys(iconMap);
