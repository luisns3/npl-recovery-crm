import type { Case } from '../types';

// ============================================
// Bucket IDs — full decision tree leaf nodes
// ============================================

export type BucketId =
  | '0'                                                          // Cancelled Groups
  | '1'                                                          // D&F
  | '2.1' | '2.2'                                               // Pre Pipe
  | '3.1'                                                        // Far – Insolvency
  | '3.2.1' | '3.2.2' | '3.2.3'                                // Far – Cancelled Proposal
  | '3.3.1.1' | '3.3.1.2' | '3.3.1.3'                         // Far – No Proposal – Contacted
  | '3.3.2.1' | '3.3.2.2'                                      // Far – No Proposal – Non-Contacted
  | '4.1' | '4.2' | '4.3'                                      // Close to Auction
  | '5.1' | '5.2'                                               // Auction Closed
  | '6'                                                          // Tail
  | '7';                                                         // Unsecured

// ============================================
// PM-configurable thresholds
// ============================================

export interface SegmentationConfig {
  prePipeDays: number;          // Proposal age threshold for realistic vs unrealistic pre-pipe (default 90)
  closeToAuctionDays: number;   // Days to auction to classify as "close" vs "far" (default 90)
}

export const DEFAULT_SEGMENTATION_CONFIG: SegmentationConfig = {
  prePipeDays: 90,
  closeToAuctionDays: 90,
};

// ============================================
// Bucket metadata for UI display
// ============================================

export interface BucketMeta {
  id: BucketId;
  label: string;
  parentId?: BucketId | '2' | '3' | '3.2' | '3.3' | '3.3.1' | '3.3.2' | '4' | '5';
  color: string;
  description: string;
}

// Parent category labels (not leaf nodes — used for grouping in UI)
export const PARENT_LABELS: Record<string, { label: string; color: string }> = {
  '2': { label: 'Pre Pipe',         color: 'bg-emerald-500' },
  '3': { label: 'Lejos de Subasta', color: 'bg-amber-500'   },
  '4': { label: 'Cerca de Subasta', color: 'bg-orange-500'  },
  '5': { label: 'Subasta Cerrada',  color: 'bg-teal-500'    },
};

export const BUCKET_META: Record<BucketId, BucketMeta> = {
  '0':       { id: '0',       label: 'Grupos Cancelados',           color: 'bg-slate-400',   description: 'Todos los préstamos del grupo están cancelados' },
  '1':       { id: '1',       label: 'Deals & Focus',               color: 'bg-blue-600',    description: 'Algún préstamo tiene propuesta activa en D&F' },
  '2.1':     { id: '2.1',     label: 'Pre-Pipe Realista',           color: 'bg-emerald-600', description: 'La propuesta Pre-Pipe más antigua tiene ≤90 días', parentId: '2' },
  '2.2':     { id: '2.2',     label: 'Pre-Pipe No Realista',        color: 'bg-emerald-300', description: 'La propuesta Pre-Pipe más antigua tiene >90 días', parentId: '2' },
  '3.1':     { id: '3.1',     label: 'Insolvencia',                 color: 'bg-purple-600',  description: 'La garantía se venderá por administrador concursal', parentId: '3' },
  '3.2.1':   { id: '3.2.1',   label: 'Propuesta Denegada',          color: 'bg-red-600',     description: 'Comité revisó la propuesta y fue denegada o contraoferta no aceptada', parentId: '3' },
  '3.2.2':   { id: '3.2.2',   label: 'Propuesta Desistida',         color: 'bg-red-400',     description: 'Comité aprobó la propuesta pero nunca se firmó', parentId: '3' },
  '3.2.3':   { id: '3.2.3',   label: 'Propuesta No Escalada',       color: 'bg-red-300',     description: 'Propuesta cancelada antes de llegar al comité', parentId: '3' },
  '3.3.1.1': { id: '3.3.1.1', label: 'Último CUP >70d',            color: 'bg-amber-600',   description: 'Contactado efectivamente, último CUP hace más de 70 días', parentId: '3' },
  '3.3.1.2': { id: '3.3.1.2', label: 'Último CUP ≤70d',            color: 'bg-amber-400',   description: 'Contactado efectivamente, último CUP hace 70 días o menos', parentId: '3' },
  '3.3.1.3': { id: '3.3.1.3', label: 'Contactado sin CUPs',         color: 'bg-amber-200',   description: 'Contactado pero sin ningún CUP registrado', parentId: '3' },
  '3.3.2.1': { id: '3.3.2.1', label: 'Todos Fallecidos',            color: 'bg-slate-600',   description: 'Todos los titulares del grupo son fallecidos', parentId: '3' },
  '3.3.2.2': { id: '3.3.2.2', label: 'No Contactado',               color: 'bg-slate-500',   description: 'Ningún titular ni representante legal ha sido contactado', parentId: '3' },
  '4.1':     { id: '4.1',     label: 'Revisado en Comité',          color: 'bg-orange-600',  description: 'Revisado en comité de subastas', parentId: '4' },
  '4.2':     { id: '4.2',     label: 'No Revisado – Contactado',    color: 'bg-orange-400',  description: 'Próximo a subasta, contactado efectivamente', parentId: '4' },
  '4.3':     { id: '4.3',     label: 'No Revisado – No Contactado', color: 'bg-orange-200',  description: 'Próximo a subasta, sin contacto efectivo', parentId: '4' },
  '5.1':     { id: '5.1',     label: 'Cash at Court',               color: 'bg-teal-600',    description: 'Tercero pujó sobre el precio de reserva, pendiente ingreso del tribunal', parentId: '5' },
  '5.2':     { id: '5.2',     label: 'Real Estate',                 color: 'bg-teal-300',    description: 'Sin puja ganadora → vendiendo CDR o REO', parentId: '5' },
  '6':       { id: '6',       label: 'Tail',                        color: 'bg-slate-700',   description: 'Grupo marcado como cola de cartera (horizonte +5 años)' },
  '7':       { id: '7',       label: 'No Garantizado',              color: 'bg-slate-300',   description: 'Todas las garantías subastadas, deuda pendiente sin garantía' },
};

// Canonical display order for UI rendering
export const BUCKET_ORDER: BucketId[] = [
  '1',
  '2.1', '2.2',
  '4.1', '4.2', '4.3',
  '5.1', '5.2',
  '3.1', '3.2.1', '3.2.2', '3.2.3',
  '3.3.1.1', '3.3.1.2', '3.3.1.3',
  '3.3.2.1', '3.3.2.2',
  '6',
  '7',
  '0',
];

// ============================================
// Helper functions
// ============================================

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function daysUntil(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// Bucket 0: All loans in the group are cancelled
function isFullyCancelled(c: Case): boolean {
  return c.is_fully_cancelled === true;
}

// Bucket 1: Any active proposal at Deals or Focus probability
function hasDFProposal(c: Case): boolean {
  return c.proposals.some(
    (p) => (p.probability === 'deals' || p.probability === 'focus') && !p.cancelled_at
  );
}

// Bucket 2: Any active proposal at Pre-Pipe probability (and no D&F)
function hasPrePipeProposal(c: Case): boolean {
  return c.proposals.some((p) => p.probability === 'pre_pipe' && !p.cancelled_at);
}

// 2.1 vs 2.2: driven by the OLDEST active pre-pipe proposal
function getPrePipeBucket(c: Case, prePipeDays: number): '2.1' | '2.2' {
  const active = c.proposals.filter((p) => p.probability === 'pre_pipe' && !p.cancelled_at);
  const oldest = active.reduce((a, b) => (a.created_at < b.created_at ? a : b));
  return daysSince(oldest.created_at) <= prePipeDays ? '2.1' : '2.2';
}

// Auction status for the group, derived from case-level auction fields.
// "close" = auction date set and within threshold days; "far" = judicial but no imminent auction;
// "closed" = auction has already closed.
type AuctionStatus = 'far' | 'close' | 'closed' | 'none';

function getAuctionStatus(c: Case, closeToAuctionDays: number): AuctionStatus {
  if (c.auction_closed_date) return 'closed';
  if (c.auction_date) {
    const days = daysUntil(c.auction_date);
    return days <= closeToAuctionDays ? 'close' : 'far';
  }
  if (c.legal_status === 'judicial') return 'far';
  return 'none';
}

// Bucket 3.1: Active insolvency proceeding on the case
function hasInsolvency(c: Case): boolean {
  if (!c.insolvency_proceedings?.length) return false;
  return c.insolvency_proceedings.some((ip) => ip.status === 'activo');
}

// Bucket 3.2.x: Group had at least one cancelled proposal on non-released collaterals
function hasCancelledProposal(c: Case): boolean {
  return c.proposals.some((p) => Boolean(p.cancelled_at));
}

// Priority order for cancelled proposal state: Denied (3.2.1) > Desisted (3.2.2) > Not Reviewed (3.2.3)
function getCancelledProposalBucket(c: Case): '3.2.1' | '3.2.2' | '3.2.3' {
  const cancelled = c.proposals.filter((p) => Boolean(p.cancelled_at));

  const reviewedDenied = cancelled.some(
    (p) => p.committee_reviewed === true && p.committee_approved === false
  );
  if (reviewedDenied) return '3.2.1';

  const reviewedApproved = cancelled.some(
    (p) => p.committee_reviewed === true && p.committee_approved === true
  );
  if (reviewedApproved) return '3.2.2';

  return '3.2.3';
}

// "Effectively contacted" = at least one CUP or CUN recorded at the group level
function isEffectivelyContacted(c: Case): boolean {
  return c.interactions.some(
    (i) => i.call_result === 'cup' || i.call_result === 'cun'
  );
}

// Most recent CUP interaction date
function getLastCupDate(c: Case): string | null {
  const cups = c.interactions.filter((i) => i.call_result === 'cup');
  if (cups.length === 0) return null;
  return cups.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at;
}

// 3.3.1.x: Split contacted cases by CUP recency
function getContactedBucket(c: Case): '3.3.1.1' | '3.3.1.2' | '3.3.1.3' {
  const lastCup = getLastCupDate(c);
  if (!lastCup) return '3.3.1.3';
  return daysSince(lastCup) > 70 ? '3.3.1.1' : '3.3.1.2';
}

// Sub-tree for Bucket 3 (Far from Auction)
function getFarFromAuctionBucket(c: Case): BucketId {
  if (hasInsolvency(c)) return '3.1';
  if (hasCancelledProposal(c)) return getCancelledProposalBucket(c);
  if (isEffectivelyContacted(c)) return getContactedBucket(c);
  if (c.is_all_deceased === true) return '3.3.2.1';
  return '3.3.2.2';
}

// Sub-tree for Bucket 4 (Close to Auction)
function getCloseToAuctionBucket(c: Case): '4.1' | '4.2' | '4.3' {
  if (c.committee_reviewed === true) return '4.1';
  if (isEffectivelyContacted(c)) return '4.2';
  return '4.3';
}

// Sub-tree for Bucket 5 (Auction Closed)
function getAuctionClosedBucket(c: Case): '5.1' | '5.2' {
  return c.auction_style === 'cash_at_court' ? '5.1' : '5.2';
}

// ============================================
// Main classification function
// ============================================

export function classifyGroup(
  c: Case,
  config: SegmentationConfig = DEFAULT_SEGMENTATION_CONFIG
): BucketId {
  // Bucket 0: Fully cancelled group (all loans cancelled)
  if (isFullyCancelled(c)) return '0';

  // Bucket 1: D&F — any active proposal at Deals or Focus
  if (hasDFProposal(c)) return '1';

  // Bucket 2: Pre Pipe — any active Pre-Pipe proposal (no D&F)
  if (hasPrePipeProposal(c)) return getPrePipeBucket(c, config.prePipeDays);

  // Buckets 3–5: Driven by auction status of the largest non-released collateral
  // (approximated via case-level auction fields pending per-collateral auction tracking)
  const auctionStatus = getAuctionStatus(c, config.closeToAuctionDays);
  if (auctionStatus === 'far')    return getFarFromAuctionBucket(c);
  if (auctionStatus === 'close')  return getCloseToAuctionBucket(c);
  if (auctionStatus === 'closed') return getAuctionClosedBucket(c);

  // Bucket 6: Tail — group explicitly marked as tail
  if (c.is_tail === true) return '6';

  // Bucket 7: Unsecured — all collaterals auctioned, outstanding debt remains
  return '7';
}
