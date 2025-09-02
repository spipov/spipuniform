import { pgTable, foreignKey, unique, text, timestamp, uuid, jsonb, boolean, index, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const credentialProvider = pgEnum("credential_provider", ['google', 'microsoft', 'aws', 'azure', 'sendgrid', 'mailgun', 'custom'])
export const credentialType = pgEnum("credential_type", ['oauth_google', 'oauth_microsoft', 'smtp', 'imap', 'api_key', 'webhook', 'database', 'storage'])
export const emailProvider = pgEnum("email_provider", ['smtp', 'microsoft365', 'google_workspace'])
export const emailStatus = pgEnum("email_status", ['pending', 'sent', 'failed', 'delivered', 'bounced'])
export const fileType = pgEnum("file_type", ['file', 'folder'])
export const storageProvider = pgEnum("storage_provider", ['local', 's3', 'pcloud'])
export const templateType = pgEnum("template_type", ['welcome', 'reset_password', 'verification', 'notification', 'custom'])


export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
	impersonatedBy: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	roleId: uuid("role_id"),
	color: text().default('#3B82F6'),
	bannedUntil: timestamp("banned_until", { withTimezone: true, mode: 'string' }),
	banReason: text("ban_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "users_role_id_roles_id_fk"
		}).onDelete("set null"),
	unique("users_email_unique").on(table.email),
]);

export const userSessions = pgTable("user_sessions", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	permissions: jsonb().default({}).notNull(),
	color: text().default('#6B7280').notNull(),
	isSystem: boolean("is_system").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	role: text().default('user'),
	banned: boolean().default(false),
	banReason: text(),
	banExpires: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}),
]);

export const credentials = pgTable("credentials", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	type: credentialType().notNull(),
	provider: credentialProvider().notNull(),
	clientId: text("client_id"),
	clientSecret: text("client_secret"),
	apiKey: text("api_key"),
	username: text(),
	password: text(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiry: timestamp("token_expiry", { mode: 'string' }),
	tenantId: text("tenant_id"),
	projectId: text("project_id"),
	region: text(),
	endpoint: text(),
	config: jsonb(),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("credentials_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("credentials_default_idx").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")),
	index("credentials_provider_idx").using("btree", table.provider.asc().nullsLast().op("enum_ops")),
	index("credentials_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
]);

export const emailTemplates = pgTable("email_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	type: templateType().notNull(),
	subject: text().notNull(),
	htmlContent: text("html_content").notNull(),
	textContent: text("text_content"),
	variables: jsonb(),
	useBranding: boolean("use_branding").default(true),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	description: text(),
	version: text().default('1.0.0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_templates_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("email_templates_default_idx").using("btree", table.isDefault.asc().nullsLast().op("bool_ops")),
	index("email_templates_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
]);

export const emailLogs = pgTable("email_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	toEmail: text("to_email").notNull(),
	fromEmail: text("from_email").notNull(),
	subject: text().notNull(),
	templateId: uuid("template_id"),
	templateName: text("template_name"),
	settingsId: uuid("settings_id"),
	provider: emailProvider().notNull(),
	status: emailStatus().default('pending').notNull(),
	messageId: text("message_id"),
	errorMessage: text("error_message"),
	errorCode: text("error_code"),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_logs_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("email_logs_provider_idx").using("btree", table.provider.asc().nullsLast().op("enum_ops")),
	index("email_logs_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("email_logs_template_idx").using("btree", table.templateId.asc().nullsLast().op("uuid_ops")),
	index("email_logs_to_email_idx").using("btree", table.toEmail.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [emailTemplates.id],
			name: "email_logs_template_id_email_templates_id_fk"
		}),
	foreignKey({
			columns: [table.settingsId],
			foreignColumns: [emailSettings.id],
			name: "email_logs_settings_id_email_settings_id_fk"
		}),
]);

export const branding = pgTable("branding", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteName: text("site_name").notNull(),
	siteDescription: text("site_description"),
	siteUrl: text("site_url"),
	logoUrl: text("logo_url"),
	logoAlt: text("logo_alt"),
	faviconUrl: text("favicon_url"),
	logoDisplayMode: text("logo_display_mode").default('logo-with-name'),
	primaryColor: text("primary_color").default('#3b82f6'),
	secondaryColor: text("secondary_color").default('#64748b'),
	accentColor: text("accent_color").default('#f59e0b'),
	backgroundColor: text("background_color").default('#ffffff'),
	textColor: text("text_color").default('#1f2937'),
	fontFamily: text("font_family").default('Inter, sans-serif'),
	headingFont: text("heading_font"),
	customFonts: jsonb("custom_fonts"),
	borderRadius: text("border_radius").default('0.5rem'),
	spacing: text().default('1rem'),
	supportEmail: text("support_email"),
	contactPhone: text("contact_phone"),
	socialLinks: jsonb("social_links"),
	customCss: text("custom_css"),
	isActive: boolean("is_active").default(true),
	version: text().default('1.0.0'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("branding_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("branding_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
]);

export const emailSettings = pgTable("email_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	provider: emailProvider().notNull(),
	isActive: boolean("is_active").default(false),
	smtpHost: text("smtp_host"),
	smtpPort: text("smtp_port"),
	smtpUser: text("smtp_user"),
	smtpPassword: text("smtp_password"),
	smtpSecure: boolean("smtp_secure").default(true),
	clientId: text("client_id"),
	clientSecret: text("client_secret"),
	tenantId: text("tenant_id"),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	tokenExpiry: timestamp("token_expiry", { mode: 'string' }),
	fromName: text("from_name").notNull(),
	fromEmail: text("from_email").notNull(),
	replyToEmail: text("reply_to_email"),
	configName: text("config_name").notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	imapHost: text("imap_host"),
	imapPort: text("imap_port"),
	imapUser: text("imap_user"),
	imapPassword: text("imap_password"),
	imapSecure: boolean("imap_secure").default(true),
}, (table) => [
	index("email_settings_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("email_settings_provider_idx").using("btree", table.provider.asc().nullsLast().op("enum_ops")),
]);

export const storageSettings = pgTable("storage_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	provider: storageProvider().notNull(),
	isActive: boolean("is_active").default(false),
	config: jsonb().default({}),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("storage_settings_active_idx").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("storage_settings_provider_idx").using("btree", table.provider.asc().nullsLast().op("enum_ops")),
]);

export const files = pgTable("files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	path: text().default('/').notNull(),
	type: fileType().notNull(),
	provider: storageProvider().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	size: bigint({ mode: "number" }).default(0),
	mimeType: text("mime_type"),
	url: text(),
	parentId: uuid("parent_id"),
	ownerId: uuid("owner_id"),
	metadata: jsonb(),
	isPublic: boolean("is_public").default(false),
	isDeleted: boolean("is_deleted").default(false),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("files_deleted_idx").using("btree", table.isDeleted.asc().nullsLast().op("bool_ops")),
	index("files_owner_idx").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("files_parent_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	index("files_path_idx").using("btree", table.path.asc().nullsLast().op("text_ops")),
	index("files_path_name_idx").using("btree", table.path.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("text_ops")),
	index("files_provider_idx").using("btree", table.provider.asc().nullsLast().op("enum_ops")),
	index("files_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "files_parent_id_files_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "files_owner_id_users_id_fk"
		}).onDelete("set null"),
]);

export const filePermissions = pgTable("file_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fileId: uuid("file_id").notNull(),
	userId: uuid("user_id"),
	canRead: boolean("can_read").default(false),
	canWrite: boolean("can_write").default(false),
	canDelete: boolean("can_delete").default(false),
	canShare: boolean("can_share").default(false),
	grantedBy: uuid("granted_by"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("file_permissions_file_idx").using("btree", table.fileId.asc().nullsLast().op("uuid_ops")),
	index("file_permissions_file_user_idx").using("btree", table.fileId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("file_permissions_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [files.id],
			name: "file_permissions_file_id_files_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "file_permissions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [users.id],
			name: "file_permissions_granted_by_users_id_fk"
		}),
]);
