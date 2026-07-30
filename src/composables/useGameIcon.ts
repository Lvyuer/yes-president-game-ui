import actionIcon from '@/assets/themes/default/icons/action.svg';
import chartIcon from '@/assets/themes/default/icons/chart.svg';
import closeIcon from '@/assets/themes/default/icons/close.svg';
import documentIcon from '@/assets/themes/default/icons/document.png';
import gavelIcon from '@/assets/themes/default/icons/gavel.png';
import supportIcon from '@/assets/themes/default/icons/support.png';
import nationIcon from '@/assets/themes/default/icons/nation.png';
import phoneIcon from '@/assets/themes/default/icons/phone.png';
import playIcon from '@/assets/themes/default/icons/play.svg';
import prestigeIcon from '@/assets/themes/default/icons/prestige.png';
import securityIcon from '@/assets/themes/default/icons/security.png';
import wealthIcon from '@/assets/themes/default/icons/wealth.png';

const iconMap: Record<string, string> = {
  action: actionIcon,
  chart: chartIcon,
  close: closeIcon,
  document: documentIcon,
  gavel: gavelIcon,
  support: supportIcon,
  nation: nationIcon,
  phone: phoneIcon,
  play: playIcon,
  prestige: prestigeIcon,
  personal_safety: securityIcon,
  public_order: nationIcon,
  dynasty_wealth: wealthIcon,
  security: securityIcon,
  wealth: wealthIcon,
};

export function resolveGameIcon(name?: string): string | undefined {
  if (!name) return undefined;
  return iconMap[name] ?? name;
}

export const gameIconNames = Object.keys(iconMap);