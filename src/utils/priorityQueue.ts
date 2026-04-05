import type { Case } from '../types';
import { PROBABILITY_ORDER, STRATEGY_PRIORITY } from '../types';

function daysSinceLastInteraction(c: Case): number {
  if (c.interactions.length === 0) return 9999;
  const last = c.interactions.reduce((a, b) => (a.created_at > b.created_at ? a : b));
  const diff = Date.now() - new Date(last.created_at).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function activeAlertCount(c: Case): number {
  return c.alerts.filter((a) => !a.resolved_at).length;
}

function bestProposalProbabilityRank(c: Case): number {
  const active = c.proposals.filter((p) => !p.cancelled_at);
  if (active.length === 0) return PROBABILITY_ORDER.length;
  const best = Math.min(...active.map((p) => PROBABILITY_ORDER.indexOf(p.probability)));
  return best === -1 ? PROBABILITY_ORDER.length : best;
}

function daysToAuction(c: Case): number {
  if (!c.auction_date) return 9999;
  const diff = new Date(c.auction_date).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function strategyPriorityRank(c: Case): number {
  const idx = STRATEGY_PRIORITY.indexOf(c.strategy);
  return idx === -1 ? STRATEGY_PRIORITY.length : idx;
}

export function sortByPriority(cases: Case[]): Case[] {
  return [...cases].sort((a, b) => {
    const daysDiff = daysSinceLastInteraction(b) - daysSinceLastInteraction(a);
    if (daysDiff !== 0) return daysDiff;

    const alertDiff = activeAlertCount(b) - activeAlertCount(a);
    if (alertDiff !== 0) return alertDiff;

    const probDiff = bestProposalProbabilityRank(a) - bestProposalProbabilityRank(b);
    if (probDiff !== 0) return probDiff;

    const auctionDiff = daysToAuction(a) - daysToAuction(b);
    if (auctionDiff !== 0) return auctionDiff;

    return strategyPriorityRank(a) - strategyPriorityRank(b);
  });
}

export { daysSinceLastInteraction, activeAlertCount, daysToAuction };
