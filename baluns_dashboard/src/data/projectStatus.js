export const PROJECT_STATUSES = [
    { id: "upcoming", title: "Upcoming", color: "var(--grey-500)", tone: "neutral" },
    { id: "inprogress", title: "In Progress", color: "var(--burgundy-300)", tone: "primary" },
    { id: "completed", title: "Completed", color: "var(--burgundy-900)", tone: "solid" },
    { id: "hold", title: "On Hold", color: "var(--burgundy-500)", tone: "outline" },
  ];
  
  export const statusById = (id) => PROJECT_STATUSES.find((s) => s.id === id) || PROJECT_STATUSES[0];