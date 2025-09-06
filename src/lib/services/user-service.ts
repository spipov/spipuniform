import type { CreateUserInput, UpdateUserInput, UserSearchInput } from "@/schemas/user-management";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  emailVerified?: boolean;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class UserService {
  private static baseUrl = "/api/users";

  static async getUsers(params?: UserSearchInput): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${UserService.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch users");
    }

    const data = await response.json();
    
    // Transform users to handle Better Auth user table format
    const transformedUsers = data.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      banExpires: user.banExpires ? new Date(user.banExpires) : null,
    }));

    return {
      ...data,
      users: transformedUsers,
    };
  }

  static async getUser(userId: string): Promise<{ user: User }> {
    const response = await fetch(`${UserService.baseUrl}/${userId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user");
    }

    return response.json();
  }

  static async createUser(userData: CreateUserInput): Promise<{ user: User }> {
    const response = await fetch(UserService.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create user");
    }

    return response.json();
  }

  static async updateUser(userId: string, userData: UpdateUserInput): Promise<{ user: User }> {
    const response = await fetch(`${UserService.baseUrl}/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update user");
    }

    return response.json();
  }

  static async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await fetch(`${UserService.baseUrl}/${userId}`, {
      method: "DELETE",
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user");
    }

    return response.json();
  }

  static async banUser(
    userId: string,
    banReason: string,
    banExpires?: Date
  ): Promise<{ user: User }> {
    return UserService.updateUser(userId, {
      banned: true,
      banReason,
      banExpires,
    });
  }

  static async unbanUser(userId: string): Promise<{ user: User }> {
    return UserService.updateUser(userId, {
      banned: false,
      banReason: null,
      banExpires: null,
    });
  }
}
