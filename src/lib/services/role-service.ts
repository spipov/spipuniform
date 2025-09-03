import type {
  CreateRoleInput,
  UpdateRoleInput,
  RoleSearchInput,
  Permission,
} from "@/schemas/user-management";

export interface Role {
  id: string;
  name: string;
  permissions: Permission;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
}

export interface RolesResponse {
  roles: Role[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class RoleService {
  private static baseUrl = "/api/roles";

  static async getRoles(params?: RoleSearchInput): Promise<RolesResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${RoleService.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch roles");
    }

    return response.json();
  }

  static async getRole(roleId: string): Promise<{ role: Role }> {
    const response = await fetch(`${RoleService.baseUrl}/${roleId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch role");
    }

    return response.json();
  }

  static async createRole(roleData: CreateRoleInput): Promise<{ role: Role }> {
    const response = await fetch(RoleService.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify(roleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create role");
    }

    return response.json();
  }

  static async updateRole(roleId: string, roleData: UpdateRoleInput): Promise<{ role: Role }> {
    const response = await fetch(`${RoleService.baseUrl}/${roleId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify(roleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update role");
    }

    return response.json();
  }

  static async deleteRole(roleId: string): Promise<{ message: string }> {
    const response = await fetch(`${RoleService.baseUrl}/${roleId}`, {
      method: "DELETE",
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete role");
    }

    return response.json();
  }

  // Helper method to get all roles for dropdowns (without pagination)
  static async getAllRoles(): Promise<Role[]> {
    const response = await RoleService.getRoles({ limit: 100 });
    return response.roles;
  }

  // Helper method to check if a permission exists
  static hasPermission(role: Role | null | undefined, permission: keyof Permission): boolean {
    return role?.permissions?.[permission] === true;
  }

  // Helper method to get permission display names
  static getPermissionDisplayName(permission: keyof Permission): string {
    const displayNames: Record<keyof Permission, string> = {
      manageUsers: "Manage Users",
      manageRoles: "Manage Roles",
      viewUsers: "View Users",
      viewRoles: "View Roles",
      banUsers: "Ban Users",
      deleteUsers: "Delete Users",
      assignRoles: "Assign Roles",
    };

    return displayNames[permission] || permission;
  }

  // Helper method to get all available permissions
  static getAllPermissions(): Array<{ key: keyof Permission; label: string }> {
    const permissions: Array<keyof Permission> = [
      "viewUsers",
      "manageUsers",
      "deleteUsers",
      "banUsers",
      "viewRoles",
      "manageRoles",
      "assignRoles",
    ];

    return permissions.map((permission) => ({
      key: permission,
      label: RoleService.getPermissionDisplayName(permission),
    }));
  }
}