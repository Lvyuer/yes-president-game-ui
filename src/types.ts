export type GamePanelSize = 'large' | 'medium' | 'compact' | 'notice';

export interface GamePanelProps {
  title?: string;
  subtitle?: string;
  size?: GamePanelSize;
  framed?: boolean;
}

export interface GameFeatureButtonProps {
  icon?: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

export type GameButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

export interface GameButtonProps {
  variant?: GameButtonVariant;
  disabled?: boolean;
}

export interface GameIconButtonProps {
  icon: string;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export type GameProgressTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface GameProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  tone?: GameProgressTone;
  showThumb?: boolean;
}

export interface GameSliderProps {
  modelValue?: number;
  max?: number;
  min?: number;
  step?: number;
  label?: string;
  tone?: GameProgressTone;
  disabled?: boolean;
  showValue?: boolean;
}

export type GameNoticeTone = 'info' | 'warning' | 'danger' | 'success';

export interface GameNoticeProps {
  title: string;
  message?: string;
  tone?: GameNoticeTone;
}

export interface GameInputProps {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
  readonly?: boolean;
}

export interface GameSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface GameSelectProps {
  modelValue?: string;
  options: GameSelectOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface GameResourceItem {
  id: string;
  label: string;
  value: string | number;
  icon?: string;
}

export interface GameResourceBarProps {
  items: GameResourceItem[];
}

export interface UiAssetNineSlice {
  top: number;
  right: number;
  bottom: number;
  left: number;
  fill: boolean;
  repeat: 'stretch' | 'round';
}

export interface UiAssetManifestItem {
  id: string;
  file: string;
  type:
    | 'panel-frame'
    | 'button-frame'
    | 'texture-tile'
    | 'divider'
    | 'icon'
    | 'icon-button'
    | 'reference-only';
  sourceFile?: string;
  size: [number, number];
  alphaBBox?: [number, number, number, number];
  usage: string[];
  componentTargets: string[];
  scaling: 'nine-slice' | 'tile' | 'fixed' | 'reference-only';
  nineSlice?: UiAssetNineSlice;
  safeArea?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  minSize?: [number, number];
  forbiddenUses: string[];
  notes?: string;
}

export interface UiAssetManifest {
  version: string;
  theme: string;
  assets: UiAssetManifestItem[];
}
