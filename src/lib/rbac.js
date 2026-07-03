// src/lib/rbac.js

export const ROLES = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  AUTHOR: "AUTHOR",
  VIEWER: "VIEWER",
};

// numeric hierarchy
export const ROLE_LEVEL = {
  SUPERADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  AUTHOR: 2,
  VIEWER: 1,
};

// Allow assigning roles up to and including the creator's role
export function canAssignRole(creatorRole, targetRole) {
  const c = ROLE_LEVEL[creatorRole] || 0;
  const t = ROLE_LEVEL[targetRole] || 0;
  return c >= t; // <-- allow equal or lower
}

// For deletion you may want stricter rules (optional):
export function canDeleteRole(creatorRole, targetRole) {
  const c = ROLE_LEVEL[creatorRole] || 0;
  const t = ROLE_LEVEL[targetRole] || 0;
  return c == 4 ? c >= t : c > t; // strict: creator must be higher than target
}

export function hasRole(userRole, requiredRole) {
  const u = ROLE_LEVEL[userRole] || 0;
  const r = ROLE_LEVEL[requiredRole] || 0;
  return u >= r;
}
