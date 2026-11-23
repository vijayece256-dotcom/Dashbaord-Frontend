export const ROLES = { ADMIN: "admin", USER: "user" };

export const ADMIN_TITLE = "CEO";
export const DEFAULT_TITLE = "Team Member";

// Kept so older imports keep working
export const ROLE_LABELS = { admin: ADMIN_TITLE, user: DEFAULT_TITLE };

// The job title shown under a person's name everywhere
export const titleOf = (user) => {
  if (!user) return "";
  if (user.role === ROLES.ADMIN) return ADMIN_TITLE;
  return user.designation || DEFAULT_TITLE;
};