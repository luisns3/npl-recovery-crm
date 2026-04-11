export type MilestoneCategory = 'none' | 'early' | 'mid' | 'advanced';

export const MILESTONE_STYLES: Record<MilestoneCategory, { badge: string; dot: string; label: string }> = {
  none:     { badge: 'bg-slate-100 text-slate-500',    dot: 'bg-slate-400',    label: 'Sin proceso jud.' },
  early:    { badge: 'bg-sky-50 text-sky-700',         dot: 'bg-sky-500',      label: 'Fase inicial'     },
  mid:      { badge: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-500',    label: 'Fase intermedia'  },
  advanced: { badge: 'bg-red-50 text-red-700',         dot: 'bg-red-500',      label: 'Fase avanzada'    },
};

/**
 * Categorises a Spanish mortgage foreclosure milestone by keyword.
 *
 * Early  – claim filed, court admitted, debtor notified, payment demand
 * Mid    – attachment registered, appraisal, auction scheduled, edictos
 * Advanced – auction convened/imminent, award, eviction, possession
 */
export function getMilestoneCategory(
  legalStatus: string | null | undefined,
  milestone: string | null | undefined,
): MilestoneCategory {
  if (legalStatus !== 'judicial') return 'none';
  if (!milestone) return 'early'; // judicial but phase not recorded yet

  const m = milestone.toLowerCase();

  if (/subasta|adjudic|lanzam|posesi|entrega|toma de posesi/.test(m)) return 'advanced';
  if (/embargo|anotac|tasac|señalam|señaló|edicto|certific|perit|publicac/.test(m)) return 'mid';
  // demanda, admisión, notificación, requerimiento, auto despachando, ejecución iniciada…
  return 'early';
}
