const p = (n, name, client, team, owner, status, startDate, endDate, extra = {}) => ({
  id: `PRJ-${n}`, name, client, team, owner, status, startDate, endDate, ...extra,
});

export const SEED_PROJECTS = [
  p(1042, "Dubai Client Portal", "Dubai Projects", "Software Team", "Sathish K", "hold", "2026-10-10", "2026-11-20", {
    holdReason: "Client approval pending", holdSince: "2026-11-08", expectedResolution: "2026-11-25",
  }),
  p(1043, "Mobile Application V2", "ITC", "Application Team", "Ravi Kumar", "inprogress", "2026-11-01", "2026-12-15"),
  p(1044, "Billing Automation", "Internal", "Software Team", "Meena R", "hold", "2026-10-15", "2026-11-30", {
    holdReason: "Waiting for payment gateway access", holdSince: "2026-11-14", expectedResolution: "2026-11-28",
  }),
  p(1045, "HR Platform", "Internal", "Business Team", "Arun V", "upcoming", "2026-11-20", "2026-12-31"),
  p(1046, "Client Integration", "Tata Elxsi", "Application Team", "Divya S", "inprogress", "2026-10-05", "2026-12-28"),
  p(1047, "Testing Framework", "Internal", "Testing Team", "Karthik P", "inprogress", "2026-11-12", "2026-12-10"),
  p(1048, "Business Dashboard", "Internal", "Business Team", "Nisha M", "upcoming", "2026-12-01", "2026-12-31"),
  p(1049, "Finance Management", "Internal", "Business Team", "Prakash R", "completed", "2026-10-01", "2026-10-31"),
  p(1050, "Client Onboarding", "Dubai Projects", "Business Team", "Sathish K", "inprogress", "2026-11-05", "2026-11-25"),
  p(1051, "Application Enhancements", "ITC", "Application Team", "Ravi Kumar", "completed", "2026-10-18", "2026-11-18"),
  p(1052, "Inventory System", "Acme Corp", "Software Team", "Vijay", "completed", "2026-09-10", "2026-10-20"),
  p(1053, "Website Redesign", "Baluns", "Software Team", "Vijay", "inprogress", "2026-11-02", "2026-12-05"),
];