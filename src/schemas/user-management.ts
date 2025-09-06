import * as v from "valibot";

// User schemas
export const createUserSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, "Name is required"),
    v.maxLength(100, "Name must be less than 100 characters")
  ),
  email: v.pipe(v.string(), v.email("Invalid email address")),
  password: v.optional(
    v.pipe(v.string(), v.minLength(8, "Password must be at least 8 characters"))
  ),
  role: v.optional(v.string(), "user"),
  image: v.optional(v.pipe(v.string(), v.url("Invalid image URL"))),
});

export const updateUserSchema = v.object({
  name: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, "Name is required"),
      v.maxLength(100, "Name must be less than 100 characters")
    )
  ),
  email: v.optional(v.pipe(v.string(), v.email("Invalid email address"))),
  role: v.optional(v.string()),
  image: v.optional(v.pipe(v.string(), v.url("Invalid image URL"))),
  banned: v.optional(v.boolean()),
  banReason: v.optional(
    v.pipe(v.string(), v.maxLength(500, "Ban reason must be less than 500 characters"))
  ),
  banExpires: v.optional(v.date()),
});

export const changePasswordSchema = v.pipe(
  v.object({
    currentPassword: v.pipe(v.string(), v.minLength(1, "Current password is required")),
    newPassword: v.pipe(v.string(), v.minLength(8, "New password must be at least 8 characters")),
    confirmPassword: v.pipe(v.string(), v.minLength(1, "Please confirm your password")),
  }),
  v.forward(
    v.partialCheck(
      [["newPassword"], ["confirmPassword"]],
      (input) => input.newPassword === input.confirmPassword,
      "Passwords don't match"
    ),
    ["confirmPassword"]
  )
);

// Role schemas
export const createRoleSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, "Role name is required"),
    v.maxLength(50, "Role name must be less than 50 characters")
  ),
  permissions: v.object({
    manageUsers: v.optional(v.boolean(), false),
    manageRoles: v.optional(v.boolean(), false),
    viewUsers: v.optional(v.boolean(), false),
    viewRoles: v.optional(v.boolean(), false),
    banUsers: v.optional(v.boolean(), false),
    deleteUsers: v.optional(v.boolean(), false),
    assignRoles: v.optional(v.boolean(), false),
    // Dashboard & Routes
    viewDashboard: v.optional(v.boolean(), true),
    viewDashboardSettings: v.optional(v.boolean(), false),
    viewBranding: v.optional(v.boolean(), false),
    viewEmail: v.optional(v.boolean(), false),
    viewStorageSettings: v.optional(v.boolean(), false),
    viewFileManager: v.optional(v.boolean(), false),
    viewUserManagement: v.optional(v.boolean(), false),
    viewUserManagementUsers: v.optional(v.boolean(), false),
    viewUserManagementRoles: v.optional(v.boolean(), false),
    viewUserManagementPermissions: v.optional(v.boolean(), false),
    viewDashboardAnalytics: v.optional(v.boolean(), false),
    viewDashboardReports: v.optional(v.boolean(), false),
  }),
  color: v.pipe(v.string(), v.regex(/^#[0-9A-F]{6}$/i, "Invalid color format")),
});

export const updateRoleSchema = v.object({
  name: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, "Role name is required"),
      v.maxLength(50, "Role name must be less than 50 characters")
    )
  ),
  permissions: v.optional(
    v.object({
      manageUsers: v.optional(v.boolean()),
      manageRoles: v.optional(v.boolean()),
      viewUsers: v.optional(v.boolean()),
      viewRoles: v.optional(v.boolean()),
      banUsers: v.optional(v.boolean()),
      deleteUsers: v.optional(v.boolean()),
      assignRoles: v.optional(v.boolean()),
      // Dashboard & Routes
      viewDashboard: v.optional(v.boolean()),
      viewDashboardSettings: v.optional(v.boolean()),
      viewBranding: v.optional(v.boolean()),
      viewEmail: v.optional(v.boolean()),
      viewStorageSettings: v.optional(v.boolean()),
      viewFileManager: v.optional(v.boolean()),
      viewUserManagement: v.optional(v.boolean()),
      viewUserManagementUsers: v.optional(v.boolean()),
      viewUserManagementRoles: v.optional(v.boolean()),
      viewUserManagementPermissions: v.optional(v.boolean()),
      viewDashboardAnalytics: v.optional(v.boolean()),
      viewDashboardReports: v.optional(v.boolean()),
    })
  ),
  color: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-F]{6}$/i, "Invalid color format"))),
});

// Search and pagination schemas
export const userSearchSchema = v.object({
  search: v.optional(v.string()),
  role: v.optional(v.string()),
  banned: v.optional(v.boolean()),
  emailVerified: v.optional(v.boolean()),
  moderation: v.optional(v.picklist(["pending", "banned", "active"])),
  page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 10),
  sortBy: v.optional(v.picklist(["name", "email", "createdAt", "updatedAt"]), "createdAt"),
  sortOrder: v.optional(v.picklist(["asc", "desc"]), "desc"),
});

export const roleSearchSchema = v.object({
  search: v.optional(v.string()),
  page: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 10),
  sortBy: v.optional(v.picklist(["name", "createdAt", "updatedAt"]), "createdAt"),
  sortOrder: v.optional(v.picklist(["asc", "desc"]), "desc"),
});

// Permission assignment schema
export const assignRoleSchema = v.object({
  userId: v.pipe(v.string(), v.uuid("Invalid user ID")),
  roleId: v.pipe(v.string(), v.uuid("Invalid role ID")),
});

// Type exports
export type CreateUserInput = v.InferInput<typeof createUserSchema>;
export type UpdateUserInput = v.InferInput<typeof updateUserSchema>;
export type ChangePasswordInput = v.InferInput<typeof changePasswordSchema>;
export type CreateRoleInput = v.InferInput<typeof createRoleSchema>;
export type UpdateRoleInput = v.InferInput<typeof updateRoleSchema>;
export type UserSearchInput = v.InferInput<typeof userSearchSchema>;
export type RoleSearchInput = v.InferInput<typeof roleSearchSchema>;
export type AssignRoleInput = v.InferInput<typeof assignRoleSchema>;

// Permission type
export type Permission = {
  manageUsers: boolean;
  manageRoles: boolean;
  viewUsers: boolean;
  viewRoles: boolean;
  banUsers: boolean;
  deleteUsers: boolean;
  assignRoles: boolean;
  // Dashboard & Routes
  viewDashboard: boolean;
  viewDashboardSettings: boolean;
  viewBranding: boolean;
  viewEmail: boolean;
  viewStorageSettings: boolean;
  viewFileManager: boolean;
  viewUserManagement: boolean;
  viewUserManagementUsers: boolean;
  viewUserManagementRoles: boolean;
  viewUserManagementPermissions: boolean;
  viewDashboardAnalytics: boolean;
  viewDashboardReports: boolean;
};
