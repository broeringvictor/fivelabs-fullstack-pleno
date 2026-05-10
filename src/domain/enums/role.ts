export const Role = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  VIEWER: "VIEWER",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
