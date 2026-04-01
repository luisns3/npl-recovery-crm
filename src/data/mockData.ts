import type { Case } from '../types';

export const mockCases: Case[] = [
  {
    id: 'exp-001',
    reference: 'EXP-2024-001',
    stage: 'pre_contact',
    strategy: 'DPO',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2024-06-15',
    updatedAt: '2026-02-10',
    auctionDate: '2026-05-15',
    legalStatus: 'judicial',
    insolvencyStatus: null,
    parties: [
      { id: 'p1', caseId: 'exp-001', name: 'Luis Martinez Garcia', role: 'borrower' },
      { id: 'p2', caseId: 'exp-001', name: 'Maria Elena Fernandez', role: 'guarantor' },
    ],
    contacts: [
      { id: 'c1', partyId: 'p1', type: 'phone', value: '+34 612 345 678', isInvalid: false, relationshipNote: 'Borrower mobile', addedBy: 'system', addedAt: '2024-06-15' },
      { id: 'c2', partyId: 'p1', type: 'email', value: 'luis.martinez@email.com', isInvalid: false, relationshipNote: 'Personal email', addedBy: 'system', addedAt: '2024-06-15' },
      { id: 'c3', partyId: 'p2', type: 'phone', value: '+34 698 765 432', isInvalid: false, relationshipNote: 'Guarantor mobile', addedBy: 'system', addedAt: '2024-06-15' },
    ],
    loans: [
      { id: 'l1', caseId: 'exp-001', outstandingAmount: 142000, strategy: 'DPO' },
      { id: 'l2', caseId: 'exp-001', outstandingAmount: 38500, strategy: 'PDV' },
    ],
    collaterals: [
      { id: 'col1', type: 'Flat', address: 'Calle Mayor 4, 2B, Madrid 28013', sizeSqm: 85, valuation: 210000, registryData: 'Finca 1234, Tomo 5, Libro 2', cadastralRef: '9872301VK4872A0001WX', mapsUrl: 'https://maps.google.com/?q=40.4168,-3.7038' },
    ],
    loanCollaterals: [
      { loanId: 'l1', collateralId: 'col1', lienRank: 1 },
      { loanId: 'l2', collateralId: 'col1', lienRank: 2 },
    ],
    interactions: [
      { id: 'i1', caseId: 'exp-001', type: 'call', resultCode: 'no_answer', comment: 'Called borrower, no answer after 8 rings', createdBy: 'Carlos Ruiz', createdAt: '2026-02-10' },
    ],
    alerts: [
      { id: 'a1', caseId: 'exp-001', dueDate: '2026-05-15', type: 'auction_date', description: 'Auction scheduled', resolvedAt: null },
    ],
    proposals: [],
  },
  {
    id: 'exp-002',
    reference: 'EXP-2024-002',
    stage: 'negotiating',
    strategy: 'DPO',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2024-03-20',
    updatedAt: '2026-03-25',
    auctionDate: null,
    legalStatus: 'non_judicial',
    insolvencyStatus: null,
    parties: [
      { id: 'p3', caseId: 'exp-002', name: 'Ana Lopez Diaz', role: 'borrower' },
    ],
    contacts: [
      { id: 'c4', partyId: 'p3', type: 'phone', value: '+34 655 123 456', isInvalid: false, relationshipNote: 'Borrower mobile', addedBy: 'system', addedAt: '2024-03-20' },
      { id: 'c5', partyId: 'p3', type: 'phone', value: '+34 911 234 567', isInvalid: true, relationshipNote: 'Old landline - disconnected', addedBy: 'Carlos Ruiz', addedAt: '2025-01-10' },
    ],
    loans: [
      { id: 'l3', caseId: 'exp-002', outstandingAmount: 95000, strategy: 'DPO' },
    ],
    collaterals: [
      { id: 'col2', type: 'Townhouse', address: 'Calle Sevilla 12, Valencia 46001', sizeSqm: 120, valuation: 175000, registryData: 'Finca 5678, Tomo 12, Libro 8', cadastralRef: '1234567YJ2734N0001AB', mapsUrl: 'https://maps.google.com/?q=39.4699,-0.3763' },
    ],
    loanCollaterals: [
      { loanId: 'l3', collateralId: 'col2', lienRank: 1 },
    ],
    interactions: [
      { id: 'i2', caseId: 'exp-002', type: 'call', resultCode: 'will_callback', comment: 'Spoke with Ana. She is considering a DPO offer. Will call back Friday.', createdBy: 'Carlos Ruiz', createdAt: '2026-03-25' },
      { id: 'i3', caseId: 'exp-002', type: 'call', resultCode: 'no_answer', comment: 'No answer', createdBy: 'Carlos Ruiz', createdAt: '2026-03-18' },
    ],
    alerts: [
      { id: 'a2', caseId: 'exp-002', dueDate: '2026-03-28', type: 'follow_up', description: 'Follow up call - Ana callback', resolvedAt: null },
    ],
    proposals: [
      { id: 'pr1', caseId: 'exp-002', collateralId: 'col2', strategyType: 'DPO', probability: 'Focus', estimatedSigningDate: '2026-06-15', createdAt: '2026-03-25', cancelledAt: null },
      { id: 'pr2', caseId: 'exp-002', collateralId: 'col2', strategyType: 'PDV', probability: 'Cancelled', estimatedSigningDate: '2026-02-01', createdAt: '2025-12-10', cancelledAt: '2026-01-15' },
    ],
  },
  {
    id: 'exp-003',
    reference: 'EXP-2023-015',
    stage: 'contacted',
    strategy: 'PDV',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2023-09-01',
    updatedAt: '2026-01-05',
    auctionDate: '2026-07-20',
    legalStatus: 'judicial',
    insolvencyStatus: 'Pre-insolvency declared',
    parties: [
      { id: 'p4', caseId: 'exp-003', name: 'Francisco Javier Romero', role: 'borrower' },
      { id: 'p5', caseId: 'exp-003', name: 'Carmen Navarro Ruiz', role: 'co_borrower' },
    ],
    contacts: [
      { id: 'c6', partyId: 'p4', type: 'phone', value: '+34 677 890 123', isInvalid: false, relationshipNote: 'Borrower mobile', addedBy: 'system', addedAt: '2023-09-01' },
      { id: 'c7', partyId: 'p5', type: 'phone', value: '+34 644 567 890', isInvalid: false, relationshipNote: 'Co-borrower mobile', addedBy: 'system', addedAt: '2023-09-01' },
    ],
    loans: [
      { id: 'l4', caseId: 'exp-003', outstandingAmount: 230000, strategy: 'PDV' },
      { id: 'l5', caseId: 'exp-003', outstandingAmount: 45000, strategy: 'PDV' },
    ],
    collaterals: [
      { id: 'col3', type: 'Villa', address: 'Urbanizacion Las Palmeras 8, Marbella 29602', sizeSqm: 220, valuation: 380000, registryData: 'Finca 9012, Tomo 22, Libro 15', cadastralRef: '5678901MA7654B0001CD', mapsUrl: 'https://maps.google.com/?q=36.5095,-4.8868' },
      { id: 'col4', type: 'Parking', address: 'Urbanizacion Las Palmeras 8, Sotano -1, Plaza 5', sizeSqm: 15, valuation: 25000, registryData: 'Finca 9013, Tomo 22, Libro 15', cadastralRef: '5678901MA7654B0002EF', mapsUrl: 'https://maps.google.com/?q=36.5095,-4.8868' },
    ],
    loanCollaterals: [
      { loanId: 'l4', collateralId: 'col3', lienRank: 1 },
      { loanId: 'l4', collateralId: 'col4', lienRank: 1 },
      { loanId: 'l5', collateralId: 'col3', lienRank: 2 },
    ],
    interactions: [
      { id: 'i4', caseId: 'exp-003', type: 'call', resultCode: 'not_interested', comment: 'Francisco says he cannot pay. Mentioned insolvency. Very reluctant.', createdBy: 'Carlos Ruiz', createdAt: '2026-01-05' },
    ],
    alerts: [
      { id: 'a3', caseId: 'exp-003', dueDate: '2026-07-20', type: 'auction_date', description: 'Auction date', resolvedAt: null },
      { id: 'a4', caseId: 'exp-003', dueDate: '2026-04-01', type: 'legal_deadline', description: 'Insolvency filing deadline', resolvedAt: null },
    ],
    proposals: [],
  },
  {
    id: 'exp-004',
    reference: 'EXP-2024-008',
    stage: 'proposal',
    strategy: 'DPO',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2024-08-12',
    updatedAt: '2026-03-30',
    auctionDate: null,
    legalStatus: 'non_judicial',
    insolvencyStatus: null,
    parties: [
      { id: 'p6', caseId: 'exp-004', name: 'Isabel Torres Moreno', role: 'borrower' },
    ],
    contacts: [
      { id: 'c8', partyId: 'p6', type: 'phone', value: '+34 622 111 222', isInvalid: false, relationshipNote: 'Borrower mobile', addedBy: 'system', addedAt: '2024-08-12' },
      { id: 'c9', partyId: 'p6', type: 'email', value: 'i.torres@gmail.com', isInvalid: false, relationshipNote: 'Personal email', addedBy: 'Carlos Ruiz', addedAt: '2025-06-20' },
    ],
    loans: [
      { id: 'l6', caseId: 'exp-004', outstandingAmount: 78000, strategy: 'DPO' },
    ],
    collaterals: [
      { id: 'col5', type: 'Flat', address: 'Avda. Diagonal 450, 6A, Barcelona 08006', sizeSqm: 65, valuation: 195000, registryData: 'Finca 3456, Tomo 8, Libro 4', cadastralRef: '2345678DF3872C0006GH', mapsUrl: 'https://maps.google.com/?q=41.3954,2.1577' },
    ],
    loanCollaterals: [
      { loanId: 'l6', collateralId: 'col5', lienRank: 1 },
    ],
    interactions: [
      { id: 'i5', caseId: 'exp-004', type: 'call', resultCode: 'agreement', comment: 'Isabel agrees to DPO at 65% of outstanding. Will send formal proposal.', createdBy: 'Carlos Ruiz', createdAt: '2026-03-30' },
      { id: 'i6', caseId: 'exp-004', type: 'call', resultCode: 'will_callback', comment: 'Good conversation. Isabel wants to discuss with family.', createdBy: 'Carlos Ruiz', createdAt: '2026-03-20' },
    ],
    alerts: [],
    proposals: [
      { id: 'pr3', caseId: 'exp-004', collateralId: 'col5', strategyType: 'DPO', probability: 'Deals', estimatedSigningDate: '2026-04-30', createdAt: '2026-03-30', cancelledAt: null },
    ],
  },
  {
    id: 'exp-005',
    reference: 'EXP-2023-022',
    stage: 'contacted',
    strategy: 'Loan Sale',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2023-11-05',
    updatedAt: '2025-12-15',
    auctionDate: '2026-09-10',
    legalStatus: 'judicial',
    insolvencyStatus: null,
    parties: [
      { id: 'p7', caseId: 'exp-005', name: 'Pedro Sanchez Jimenez', role: 'borrower' },
      { id: 'p8', caseId: 'exp-005', name: 'Rosa Gutierrez Vega', role: 'guarantor' },
    ],
    contacts: [
      { id: 'c10', partyId: 'p7', type: 'phone', value: '+34 633 444 555', isInvalid: true, relationshipNote: 'Old number - not in service', addedBy: 'system', addedAt: '2023-11-05' },
      { id: 'c11', partyId: 'p7', type: 'phone', value: '+34 688 999 000', isInvalid: false, relationshipNote: 'New mobile - confirmed', addedBy: 'Carlos Ruiz', addedAt: '2025-10-01' },
      { id: 'c12', partyId: 'p8', type: 'phone', value: '+34 611 222 333', isInvalid: false, relationshipNote: 'Guarantor mobile', addedBy: 'system', addedAt: '2023-11-05' },
    ],
    loans: [
      { id: 'l7', caseId: 'exp-005', outstandingAmount: 310000, strategy: 'Loan Sale' },
    ],
    collaterals: [
      { id: 'col6', type: 'Commercial premises', address: 'Plaza del Ayuntamiento 3, Bajo, Sevilla 41001', sizeSqm: 150, valuation: 420000, registryData: 'Finca 7890, Tomo 30, Libro 20', cadastralRef: '3456789QA1234D0001IJ', mapsUrl: 'https://maps.google.com/?q=37.3891,-5.9845' },
    ],
    loanCollaterals: [
      { loanId: 'l7', collateralId: 'col6', lienRank: 1 },
    ],
    interactions: [
      { id: 'i7', caseId: 'exp-005', type: 'call', resultCode: 'no_answer', comment: 'Tried new number, no answer', createdBy: 'Carlos Ruiz', createdAt: '2025-12-15' },
    ],
    alerts: [
      { id: 'a5', caseId: 'exp-005', dueDate: '2026-09-10', type: 'auction_date', description: 'Auction date', resolvedAt: null },
    ],
    proposals: [
      { id: 'pr4', caseId: 'exp-005', collateralId: 'col6', strategyType: 'DPO', probability: 'Cancelled', estimatedSigningDate: '2025-06-01', createdAt: '2025-03-15', cancelledAt: '2025-05-20' },
    ],
  },
  {
    id: 'exp-006',
    reference: 'EXP-2024-011',
    stage: 'pre_contact',
    strategy: 'DPO',
    assignedTo: 'Carlos Ruiz',
    createdAt: '2024-11-01',
    updatedAt: '2024-11-01',
    auctionDate: null,
    legalStatus: 'non_judicial',
    insolvencyStatus: null,
    parties: [
      { id: 'p9', caseId: 'exp-006', name: 'Miguel Angel Herrero', role: 'borrower' },
    ],
    contacts: [
      { id: 'c13', partyId: 'p9', type: 'phone', value: '+34 699 777 888', isInvalid: false, relationshipNote: 'Borrower mobile', addedBy: 'system', addedAt: '2024-11-01' },
    ],
    loans: [
      { id: 'l8', caseId: 'exp-006', outstandingAmount: 55000, strategy: 'DPO' },
    ],
    collaterals: [
      { id: 'col7', type: 'Flat', address: 'Calle Gran Via 78, 3C, Bilbao 48011', sizeSqm: 70, valuation: 130000, registryData: 'Finca 2345, Tomo 6, Libro 3', cadastralRef: '4567890BI5678E0003KL', mapsUrl: 'https://maps.google.com/?q=43.2630,-2.9350' },
    ],
    loanCollaterals: [
      { loanId: 'l8', collateralId: 'col7', lienRank: 1 },
    ],
    interactions: [],
    alerts: [],
    proposals: [],
  },
];
