export interface AayamStyle {
  dot: string;
  chip: string;
  label: string;
  labelHi: string;
  color: string;
  bg: string;
  border: string;
  dayitvChip: string;
}

export const AAYAM_CONFIG: Record<string, AayamStyle> = {
  Yuva: {
    dot: 'bg-orange-500',
    chip: 'bg-orange-500/15 text-orange-600 border-orange-500/20',
    label: 'Yuva',
    labelHi: 'युवा',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    dayitvChip: 'bg-orange-500/15 text-orange-500',
  },
  Mahila: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-500/15 text-rose-600 border-rose-500/20',
    label: 'Mahila',
    labelHi: 'महिला',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    dayitvChip: 'bg-rose-500/15 text-rose-500',
  },
  Shodh: {
    dot: 'bg-blue-500',
    chip: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
    label: 'Shodh',
    labelHi: 'शोध',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    dayitvChip: 'bg-blue-500/15 text-blue-500',
  },
  Prachar: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
    label: 'Prachar',
    labelHi: 'प्रचार',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    dayitvChip: 'bg-emerald-500/15 text-emerald-500',
  },
  Vimarsh: {
    dot: 'bg-violet-500',
    chip: 'bg-violet-500/15 text-violet-600 border-violet-500/20',
    label: 'Vimarsh',
    labelHi: 'विमर्श',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    dayitvChip: 'bg-violet-500/15 text-violet-500',
  },
  Vibhag: {
    dot: 'bg-primary',
    chip: 'bg-primary/15 text-primary border-primary/20',
    label: 'Vibhag',
    labelHi: 'विभाग',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    dayitvChip: 'bg-primary/15 text-primary',
  },
};

export const AAYAM_LIST = ['Yuva', 'Mahila', 'Shodh', 'Prachar', 'Vimarsh'] as const;
export const AAYAM_LIST_WITH_ALL = ['All', ...AAYAM_LIST] as const;

export const AAYAM_KIND_LABEL: Record<string, string> = {
  yuva: 'Yuva',
  mahila: 'Mahila',
  shodh: 'Shodh',
  prachar: 'Prachar',
  vimarsh: 'Vimarsh',
};

export function getAayamStyle(key: string | null | undefined, fallbackKey?: string | null | undefined): AayamStyle {
  const resolved = (key ?? fallbackKey ?? '').trim();
  if (!resolved) return AAYAM_CONFIG.Yuva;
  return AAYAM_CONFIG[resolved] ?? AAYAM_CONFIG.Yuva;
}
