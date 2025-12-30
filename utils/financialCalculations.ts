import { Grant, Expenditure, SubRecipient, Deliverable } from '../types';

export const getGrantStats = (grant: Grant, allExpenditures: Expenditure[]) => {
  const grantExpenditures = allExpenditures.filter(e => e.grantId === grant.id);
  const totalSpent = grantExpenditures.reduce((sum, e) => sum + e.amount, 0);

  // 1. Sum up all Standard deliverables
  const standardDeliverablesTotal = grant.deliverables
    .filter(d => d.type !== 'SubAward')
    .reduce((sum, d) => sum + (d.allocatedValue || 0), 0);

  // 2. Find the Sub-Award Pot (if it exists)
  const subAwardDeliverable = grant.deliverables.find(d => d.type === 'SubAward');
  const subAwardTotal = subAwardDeliverable ? (subAwardDeliverable.allocatedValue || 0) : 0;

  // Unassigned = Money not yet given to a deliverable or the sub-award pot
  const unassigned = (grant.totalAward || 0) - standardDeliverablesTotal - subAwardTotal;

  // Balance = Money not yet spent from the total award
  const balance = (grant.totalAward || 0) - totalSpent;

  return {
    totalSpent,
    balance,
    unassigned
  };
};

export const getSubRecipientStats = (sub: SubRecipient, grantId: string, allExpenditures: Expenditure[]) => {
  const subExpenditures = allExpenditures.filter(e => e.grantId === grantId && e.subRecipientId === sub.id);
  const spent = subExpenditures.reduce((sum, e) => sum + e.amount, 0);
  
  const allocatedToDeliverables = sub.deliverables.reduce((sum, d) => sum + (d.allocatedValue || 0), 0);
  
  return {
    spent,
    balance: (sub.allocatedAmount || 0) - spent,
    unassigned: (sub.allocatedAmount || 0) - allocatedToDeliverables
  };
};

export const getDeliverableStats = (del: Deliverable, allExpenditures: Expenditure[]) => {
  const delExpenditures = allExpenditures.filter(e => e.deliverableId === del.id);
  const spent = delExpenditures.reduce((sum, e) => sum + e.amount, 0);
  
  const allocatedToCategories = del.budgetCategories.reduce((sum, c) => sum + (c.allocation || 0), 0);

  return {
    spent,
    balance: (del.allocatedValue || 0) - spent,
    unassigned: (del.allocatedValue || 0) - allocatedToCategories
  };
};

export const getCategoryStats = (cId: string, dId: string, allExpenditures: Expenditure[]) => {
    const spent = allExpenditures
        .filter(e => e.categoryId === cId && e.deliverableId === dId)
        .reduce((sum, e) => sum + e.amount, 0);
    return { spent };
};

export const getSubAwardPotStats = (grant: Grant, allExpenditures: Expenditure[]) => {
    const subAwardDel = grant.deliverables.find(d => d.type === 'SubAward');
    const totalPot = subAwardDel ? (subAwardDel.allocatedValue || 0) : 0;
    
    const totalAllocatedToCommunities = grant.subRecipients.reduce((sum, s) => sum + (s.allocatedAmount || 0), 0);
    
    // Calculate total spent by ANY sub-recipient for this grant
    const totalSpentByCommunities = allExpenditures
        .filter(e => e.grantId === grant.id && e.subRecipientId)
        .reduce((sum, e) => sum + e.amount, 0);

    return {
        totalPot,
        allocated: totalAllocatedToCommunities,
        unallocated: totalPot - totalAllocatedToCommunities,
        totalSpent: totalSpentByCommunities,
        balance: totalPot - totalSpentByCommunities // How much of the pot is left (accounting for spent)
    };
};