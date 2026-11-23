export const initialsOf = (name = "") =>
    name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  
  export const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString([], { dateStyle: "medium" }) : "-";
  
  export const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "-";