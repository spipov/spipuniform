import { relations } from "drizzle-orm/relations";
import { user, session, roles, users, userSessions, account, emailTemplates, emailLogs, emailSettings, files, filePermissions } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
	userSessions: many(userSessions),
	files: many(files),
	filePermissions_userId: many(filePermissions, {
		relationName: "filePermissions_userId_users_id"
	}),
	filePermissions_grantedBy: many(filePermissions, {
		relationName: "filePermissions_grantedBy_users_id"
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const emailLogsRelations = relations(emailLogs, ({one}) => ({
	emailTemplate: one(emailTemplates, {
		fields: [emailLogs.templateId],
		references: [emailTemplates.id]
	}),
	emailSetting: one(emailSettings, {
		fields: [emailLogs.settingsId],
		references: [emailSettings.id]
	}),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({many}) => ({
	emailLogs: many(emailLogs),
}));

export const emailSettingsRelations = relations(emailSettings, ({many}) => ({
	emailLogs: many(emailLogs),
}));

export const filesRelations = relations(files, ({one, many}) => ({
	file: one(files, {
		fields: [files.parentId],
		references: [files.id],
		relationName: "files_parentId_files_id"
	}),
	files: many(files, {
		relationName: "files_parentId_files_id"
	}),
	user: one(users, {
		fields: [files.ownerId],
		references: [users.id]
	}),
	filePermissions: many(filePermissions),
}));

export const filePermissionsRelations = relations(filePermissions, ({one}) => ({
	file: one(files, {
		fields: [filePermissions.fileId],
		references: [files.id]
	}),
	user_userId: one(users, {
		fields: [filePermissions.userId],
		references: [users.id],
		relationName: "filePermissions_userId_users_id"
	}),
	user_grantedBy: one(users, {
		fields: [filePermissions.grantedBy],
		references: [users.id],
		relationName: "filePermissions_grantedBy_users_id"
	}),
}));