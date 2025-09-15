import { pgTable, foreignKey, unique, text, timestamp, uuid, jsonb, boolean, index, integer, decimal, pgEnum } from "drizzle-orm/pg-core";

// Import existing tables for foreign keys
import { user } from './auth';
import { files } from './file-system';

// SpipUniform Enums
export const schoolLevel = pgEnum("school_level", ['primary', 'secondary', 'mixed']);
export const listingStatus = pgEnum("listing_status", ['active', 'pending', 'sold', 'removed']);
export const requestStatus = pgEnum("request_status", ['open', 'fulfilled', 'closed']);
export const reportStatus = pgEnum("report_status", ['open', 'reviewing', 'resolved', 'dismissed']);
export const membershipStatus = pgEnum("membership_status", ['active', 'pending', 'cancelled', 'expired']);
export const attributeInputType = pgEnum("attribute_input_type", [
  'alpha_sizes',        // Letter-based sizes: 
  'numeric_sizes',      // Number-based sizes: 
  'age_ranges',         // Age ranges: 
  'age_numeric',        // Numeric ages: 
  'shoe_sizes_uk',      // UK shoe sizes
  'shoe_sizes_eu',      // EU shoe sizes  
  'waist_inseam',       // Trouser sizing: waist x inseam format
  'neck_size',          // Shirt neck sizing in inches/cm
  'chest_size',         // Chest measurements with fit indicators
  'text_input',         // Free text input
  'color_select',       // Color options
  'gender_select',      // Gender options
  'material_select'     // Material types
]);
export const notificationType = pgEnum("notification_type", ['match_found', 'request_fulfilled', 'listing_expired', 'message_received']);

// Geographic and School Data
export const counties = pgTable("counties", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	osmId: text("osm_id"),
	boundingBox: jsonb("bounding_box"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("counties_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("counties_name_unique").on(table.name),
]);

export const localities = pgTable("localities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	countyId: uuid("county_id").notNull(),
	osmId: text("osm_id"),
	centreLat: decimal("centre_lat", { precision: 10, scale: 6 }),
	centreLng: decimal("centre_lng", { precision: 10, scale: 6 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("localities_county_idx").using("btree", table.countyId.asc().nullsLast().op("uuid_ops")),
	index("localities_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.countyId],
		foreignColumns: [counties.id],
		name: "localities_county_id_counties_id_fk"
	}).onDelete("cascade"),
]);

export const schools = pgTable("schools", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	localityId: uuid("locality_id"),
	countyId: uuid("county_id").notNull(),
	level: schoolLevel().notNull(),
	csvSourceRow: jsonb("csv_source_row"),
	externalId: text("external_id"),
	website: text(),
	phone: text(),
	email: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("schools_county_idx").using("btree", table.countyId.asc().nullsLast().op("uuid_ops")),
	index("schools_locality_idx").using("btree", table.localityId.asc().nullsLast().op("uuid_ops")),
	index("schools_level_idx").using("btree", table.level.asc().nullsLast().op("enum_ops")),
	index("schools_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.countyId],
		foreignColumns: [counties.id],
		name: "schools_county_id_counties_id_fk"
	}),
	foreignKey({
		columns: [table.localityId],
		foreignColumns: [localities.id],
		name: "schools_locality_id_localities_id_fk"
	}).onDelete("set null"),
]);

// Shop Management
export const shops = pgTable("shops", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	description: text(),
	website: text(),
	contactEmail: text("contact_email"),
	phone: text(),
	address: text(),
	localityId: uuid("locality_id"),
	membershipStatus: membershipStatus("membership_status").default('pending'),
	isVerified: boolean("is_verified").default(false),
	logoFileId: uuid("logo_file_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("shops_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("shops_locality_idx").using("btree", table.localityId.asc().nullsLast().op("uuid_ops")),
	index("shops_membership_idx").using("btree", table.membershipStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "shops_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.localityId],
		foreignColumns: [localities.id],
		name: "shops_locality_id_localities_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.logoFileId],
		foreignColumns: [files.id],
		name: "shops_logo_file_id_files_id_fk"
	}).onDelete("set null"),
]);

// Product Management System
export const productCategories = pgTable("product_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_categories_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("product_categories_sort_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("product_categories_slug_unique").on(table.slug),
]);

export const productTypes = pgTable("product_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("product_types_category_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("product_types_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("product_types_slug_unique").on(table.slug),
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [productCategories.id],
		name: "product_types_category_id_product_categories_id_fk"
	}).onDelete("cascade"),
]);

export const attributes = pgTable("attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productTypeId: uuid("product_type_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	inputType: attributeInputType("input_type").notNull(),
	required: boolean().default(false),
	order: integer().default(0),
	placeholder: text(),
	helpText: text("help_text"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("attributes_product_type_idx").using("btree", table.productTypeId.asc().nullsLast().op("uuid_ops")),
	index("attributes_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("attributes_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.productTypeId],
		foreignColumns: [productTypes.id],
		name: "attributes_product_type_id_product_types_id_fk"
	}).onDelete("cascade"),
]);

export const attributeValues = pgTable("attribute_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	attributeId: uuid("attribute_id").notNull(),
	value: text().notNull(),
	displayName: text("display_name").notNull(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("attribute_values_attribute_idx").using("btree", table.attributeId.asc().nullsLast().op("uuid_ops")),
	index("attribute_values_sort_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.attributeId],
		foreignColumns: [attributes.id],
		name: "attribute_values_attribute_id_attributes_id_fk"
	}).onDelete("cascade"),
]);

export const conditions = pgTable("conditions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("conditions_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	unique("conditions_name_unique").on(table.name),
]);

// Listings and Requests
export const listings = pgTable("listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	productTypeId: uuid("product_type_id").notNull(),
	title: text().notNull(),
	description: text(),
	schoolId: uuid("school_id"),
	categoryId: uuid("category_id").notNull(),
	size: text(),
	conditionId: uuid("condition_id").notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	isFree: boolean("is_free").default(false),
	localityId: uuid("locality_id").notNull(),
	status: listingStatus().default('pending'),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	expiredAt: timestamp("expired_at", { mode: 'string' }),
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("listings_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("listings_product_type_idx").using("btree", table.productTypeId.asc().nullsLast().op("uuid_ops")),
	index("listings_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("listings_category_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("listings_locality_idx").using("btree", table.localityId.asc().nullsLast().op("uuid_ops")),
	index("listings_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("listings_published_idx").using("btree", table.publishedAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "listings_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productTypeId],
		foreignColumns: [productTypes.id],
		name: "listings_product_type_id_product_types_id_fk"
	}),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "listings_school_id_schools_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [productCategories.id],
		name: "listings_category_id_product_categories_id_fk"
	}),
	foreignKey({
		columns: [table.conditionId],
		foreignColumns: [conditions.id],
		name: "listings_condition_id_conditions_id_fk"
	}),
	foreignKey({
		columns: [table.localityId],
		foreignColumns: [localities.id],
		name: "listings_locality_id_localities_id_fk"
	}),
]);

export const listingAttributeValues = pgTable("listing_attribute_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id").notNull(),
	attributeId: uuid("attribute_id").notNull(),
	attributeValueId: uuid("attribute_value_id"),
	customValue: text("custom_value"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("listing_attribute_values_listing_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("listing_attribute_values_attribute_idx").using("btree", table.attributeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.listingId],
		foreignColumns: [listings.id],
		name: "listing_attribute_values_listing_id_listings_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.attributeId],
		foreignColumns: [attributes.id],
		name: "listing_attribute_values_attribute_id_attributes_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.attributeValueId],
		foreignColumns: [attributeValues.id],
		name: "listing_attribute_values_attribute_value_id_attribute_values_id_fk"
	}).onDelete("cascade"),
]);

export const listingImages = pgTable("listing_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id").notNull(),
	fileId: uuid("file_id").notNull(),
	altText: text("alt_text"),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("listing_images_listing_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("listing_images_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.listingId],
		foreignColumns: [listings.id],
		name: "listing_images_listing_id_listings_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.fileId],
		foreignColumns: [files.id],
		name: "listing_images_file_id_files_id_fk"
	}).onDelete("cascade"),
]);

export const requests = pgTable("requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	productTypeId: uuid("product_type_id").notNull(),
	schoolId: uuid("school_id"),
	size: text(),
	conditionPreference: text("condition_preference"),
	description: text(),
	maxPrice: decimal("max_price", { precision: 10, scale: 2 }),
	localityId: uuid("locality_id").notNull(),
	status: requestStatus().default('open'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("requests_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("requests_product_type_idx").using("btree", table.productTypeId.asc().nullsLast().op("uuid_ops")),
	index("requests_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("requests_locality_idx").using("btree", table.localityId.asc().nullsLast().op("uuid_ops")),
	index("requests_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "requests_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productTypeId],
		foreignColumns: [productTypes.id],
		name: "requests_product_type_id_product_types_id_fk"
	}),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "requests_school_id_schools_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.localityId],
		foreignColumns: [localities.id],
		name: "requests_locality_id_localities_id_fk"
	}),
]);

// Matching and Social Features
export const matches = pgTable("matches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	listingId: uuid("listing_id").notNull(),
	requestId: uuid("request_id").notNull(),
	matchedAt: timestamp("matched_at", { mode: 'string' }).defaultNow().notNull(),
	notified: boolean().default(false),
	notifiedAt: timestamp("notified_at", { mode: 'string' }),
	contactExchanged: boolean("contact_exchanged").default(false),
	contactExchangedAt: timestamp("contact_exchanged_at", { mode: 'string' }),
}, (table) => [
	index("matches_listing_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("matches_request_idx").using("btree", table.requestId.asc().nullsLast().op("uuid_ops")),
	index("matches_matched_at_idx").using("btree", table.matchedAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
		columns: [table.listingId],
		foreignColumns: [listings.id],
		name: "matches_listing_id_listings_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.requestId],
		foreignColumns: [requests.id],
		name: "matches_request_id_requests_id_fk"
	}).onDelete("cascade"),
]);

export const watchlists = pgTable("watchlists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	entityType: text("entity_type").notNull(), // 'school', 'category', 'product_type'
	entityId: uuid("entity_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("watchlists_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("watchlists_entity_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	unique("watchlists_user_entity_unique").on(table.userId, table.entityType, table.entityId),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "watchlists_user_id_user_id_fk"
	}).onDelete("cascade"),
]);

export const reports = pgTable("reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reporterUserId: text("reporter_user_id").notNull(),
	listingId: uuid("listing_id"),
	requestId: uuid("request_id"),
	reason: text().notNull(),
	description: text(),
	status: reportStatus().default('open'),
	handledBy: text("handled_by"),
	handledAt: timestamp("handled_at", { mode: 'string' }),
	handlerNotes: text("handler_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("reports_reporter_idx").using("btree", table.reporterUserId.asc().nullsLast().op("text_ops")),
	index("reports_listing_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("reports_request_idx").using("btree", table.requestId.asc().nullsLast().op("uuid_ops")),
	index("reports_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
		columns: [table.reporterUserId],
		foreignColumns: [user.id],
		name: "reports_reporter_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.listingId],
		foreignColumns: [listings.id],
		name: "reports_listing_id_listings_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.requestId],
		foreignColumns: [requests.id],
		name: "reports_request_id_requests_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.handledBy],
		foreignColumns: [user.id],
		name: "reports_handled_by_user_id_fk"
	}).onDelete("set null"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text(),
	payload: jsonb(),
	readAt: timestamp("read_at", { mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("notifications_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	index("notifications_created_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamp_ops")),
	index("notifications_read_idx").using("btree", table.readAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "notifications_user_id_user_id_fk"
	}).onDelete("cascade"),
]);

// User Profile Extensions
export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	phone: text(),
	primarySchoolId: uuid("primary_school_id"),
	additionalSchools: jsonb("additional_schools"), // Array of school IDs
	localityId: uuid("locality_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_profiles_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("user_profiles_school_idx").using("btree", table.primarySchoolId.asc().nullsLast().op("uuid_ops")),
	index("user_profiles_locality_idx").using("btree", table.localityId.asc().nullsLast().op("uuid_ops")),
	unique("user_profiles_user_unique").on(table.userId),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "user_profiles_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.primarySchoolId],
		foreignColumns: [schools.id],
		name: "user_profiles_primary_school_id_schools_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.localityId],
		foreignColumns: [localities.id],
		name: "user_profiles_locality_id_localities_id_fk"
	}).onDelete("set null"),
]);

// Type exports
export type County = typeof counties.$inferSelect;
export type NewCounty = typeof counties.$inferInsert;
export type Locality = typeof localities.$inferSelect;
export type NewLocality = typeof localities.$inferInsert;
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;
export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
export type ProductType = typeof productTypes.$inferSelect;
export type NewProductType = typeof productTypes.$inferInsert;
export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;
export type AttributeValue = typeof attributeValues.$inferSelect;
export type NewAttributeValue = typeof attributeValues.$inferInsert;
export type Condition = typeof conditions.$inferSelect;
export type NewCondition = typeof conditions.$inferInsert;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingAttributeValue = typeof listingAttributeValues.$inferSelect;
export type NewListingAttributeValue = typeof listingAttributeValues.$inferInsert;
export type ListingImage = typeof listingImages.$inferSelect;
export type NewListingImage = typeof listingImages.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Watchlist = typeof watchlists.$inferSelect;
export type NewWatchlist = typeof watchlists.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;