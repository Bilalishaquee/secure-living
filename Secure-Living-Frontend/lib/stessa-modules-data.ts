export const stessaKpis = {
  portfolioValue: 28450000,
  monthlyRent: 742000,
  netCashFlow: 318400,
  occupancyRate: 93,
  pendingRepairs: 5,
  openLeases: 18,
};

export const incomeStatementRows = [
  { label: "Gross Rental Income", amount: 742000 },
  { label: "Vacancy Loss", amount: -52000 },
  { label: "Maintenance", amount: -113000 },
  { label: "Management Fees", amount: -64000 },
  { label: "Utilities", amount: -29800 },
  { label: "Net Operating Income", amount: 483200 },
];

export const rentRollRows = [
  { unit: "A-101", tenant: "Sarah K.", status: "Paid", dueDate: "2026-04-05", amount: 85000 },
  { unit: "A-102", tenant: "Brian M.", status: "Pending", dueDate: "2026-04-05", amount: 78000 },
  { unit: "C-205", tenant: "Fatima A.", status: "Overdue", dueDate: "2026-04-03", amount: 92000 },
];

export const screeningQueue = [
  { id: "scr-1", applicant: "Mercy N.", unit: "B-303", score: 742, status: "Review" },
  { id: "scr-2", applicant: "Peter O.", unit: "Shop-G2", score: 688, status: "Pending docs" },
  { id: "scr-3", applicant: "Amina R.", unit: "A-109", score: 771, status: "Approved" },
];

export const investmentDeals = [
  { id: "d1", title: "Westlands Duplex", city: "Nairobi", capRate: "8.4%", ask: 23500000 },
  { id: "d2", title: "Syokimau Rentals Block", city: "Machakos", capRate: "9.1%", ask: 31000000 },
  { id: "d3", title: "Nyali 6-Unit Apartments", city: "Mombasa", capRate: "7.8%", ask: 44200000 },
];

