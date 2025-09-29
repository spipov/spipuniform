import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, decimal, unique, index, foreignKey, jsonb, date } from "drizzle-orm/pg-core";

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
	crestFileId: uuid("crest_file_id"),
	isActive: boolean("is_active").default(false),
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
	foreignKey({
		columns: [table.crestFileId],
		foreignColumns: [files.id],
		name: "schools_crest_file_id_files_id_fk"
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
  	imageFileId: uuid("image_file_id"),
  	sortOrder: integer("sort_order").default(0),
  	isActive: boolean("is_active").default(true),
  	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
  }, (table) => [
  	index("product_categories_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
  	index("product_categories_sort_idx").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
  	unique("product_categories_slug_unique").on(table.slug),
  	foreignKey({
  		columns: [table.imageFileId],
  		foreignColumns: [files.id],
  		name: "product_categories_image_file_id_files_id_fk"
  	}).onDelete("set null"),
  ]);

export const productTypes = pgTable("product_types", {
  	id: uuid().defaultRandom().primaryKey().notNull(),
  	categoryId: uuid("category_id").notNull(),
  	name: text().notNull(),
  	slug: text().notNull(),
  	description: text(),
  	imageFileId: uuid("image_file_id"),
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
  	foreignKey({
  		columns: [table.imageFileId],
  		foreignColumns: [files.id],
  		name: "product_types_image_file_id_files_id_fk"
  	}).onDelete("set null"),
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

export const requestImages = pgTable("request_images", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  requestId: uuid("request_id").notNull(),
  fileId: uuid("file_id").notNull(),
  altText: text("alt_text"),
  order: integer().default(0),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  index("request_images_request_idx").using("btree", table.requestId.asc().nullsLast().op("uuid_ops")),
  index("request_images_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
  foreignKey({
    columns: [table.requestId],
    foreignColumns: [requests.id],
    name: "request_images_request_id_requests_id_fk"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.fileId],
    foreignColumns: [files.id],
    name: "request_images_file_id_files_id_fk"
  }).onDelete("cascade"),
]);

export const requests = pgTable("requests", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  productTypeId: uuid("product_type_id").notNull(),
  schoolId: uuid("school_id"),
  attributes: jsonb(),
  conditionPreference: text("condition_preference"),
  description: text(),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }).$type<number>(),
  localityId: uuid("locality_id").notNull(),
  status: requestStatus().default('open'),
  hasSchoolCrest: boolean("has_school_crest").default(false),
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

// User favorites for individual listings
export const userFavorites = pgTable("user_favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	listingId: uuid("listing_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_favorites_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("user_favorites_listing_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("user_favorites_created_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamp_ops")),
	unique("user_favorites_user_listing_unique").on(table.userId, table.listingId),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "user_favorites_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.listingId],
		foreignColumns: [listings.id],
		name: "user_favorites_listing_id_listings_id_fk"
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

// School Owners/Managers (for school stock management)
export const schoolOwners = pgTable("school_owners", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	schoolId: uuid("school_id").notNull(),
	role: text().default('owner'), // 'owner', 'manager', 'parent'
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("school_owners_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("school_owners_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	unique("school_owners_user_school_unique").on(table.userId, table.schoolId),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "school_owners_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "school_owners_school_id_schools_id_fk"
	}).onDelete("cascade"),
]);

// School Stock Listings (separate from regular user listings)
export const schoolStock = pgTable("school_stock", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	managedByUserId: text("managed_by_user_id").notNull(), // School owner who manages this stock
	productTypeId: uuid("product_type_id").notNull(),
	title: text().notNull(),
	description: text(),
	categoryId: uuid("category_id").notNull(),
	attributes: jsonb(),
	conditionId: uuid("condition_id").notNull(),
	quantity: integer().default(1),
	price: decimal({ precision: 10, scale: 2 }),
	isFree: boolean("is_free").default(false),
	hasSchoolCrest: boolean("has_school_crest").default(false),
	status: text().default('active'), // 'active', 'sold', 'removed'
	viewCount: integer("view_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("school_stock_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("school_stock_manager_idx").using("btree", table.managedByUserId.asc().nullsLast().op("text_ops")),
	index("school_stock_product_type_idx").using("btree", table.productTypeId.asc().nullsLast().op("uuid_ops")),
	index("school_stock_category_idx").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("school_stock_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "school_stock_school_id_schools_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.managedByUserId],
		foreignColumns: [user.id],
		name: "school_stock_managed_by_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.productTypeId],
		foreignColumns: [productTypes.id],
		name: "school_stock_product_type_id_product_types_id_fk"
	}),
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [productCategories.id],
		name: "school_stock_category_id_product_categories_id_fk"
	}),
	foreignKey({
		columns: [table.conditionId],
		foreignColumns: [conditions.id],
		name: "school_stock_condition_id_conditions_id_fk"
	}),
]);

// School Stock Images
export const schoolStockImages = pgTable("school_stock_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolStockId: uuid("school_stock_id").notNull(),
	fileId: uuid("file_id").notNull(),
	altText: text("alt_text"),
	order: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("school_stock_images_stock_idx").using("btree", table.schoolStockId.asc().nullsLast().op("uuid_ops")),
	index("school_stock_images_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
		columns: [table.schoolStockId],
		foreignColumns: [schoolStock.id],
		name: "school_stock_images_school_stock_id_school_stock_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.fileId],
		foreignColumns: [files.id],
		name: "school_stock_images_file_id_files_id_fk"
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
	// Contact preferences
	preferredContactMethod: text("preferred_contact_method"), // 'phone', 'email', 'app'
	availability: text(), // "Weekday evenings, weekends"
	specificArea: text("specific_area"), // More specific location within locality
	// Profile preferences
	preferredBrands: jsonb("preferred_brands"), // Array of preferred brands
	preferredConditions: jsonb("preferred_conditions"), // Array of condition IDs
	notificationPreferences: jsonb("notification_preferences"), // Email/app notification settings
	// Trust and verification
	verificationStatus: text("verification_status").default('unverified'), // 'unverified', 'email_verified', 'phone_verified', 'fully_verified'
	totalRating: decimal("total_rating", { precision: 3, scale: 2 }).default('0'),
	ratingCount: integer("rating_count").default(0),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_profiles_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("user_profiles_school_idx").using("btree", table.primarySchoolId.asc().nullsLast().op("uuid_ops")),
	index("user_profiles_locality_idx").using("btree", table.localityId.asc().nullsLast().op("uuid_ops")),
	index("user_profiles_verification_idx").using("btree", table.verificationStatus.asc().nullsLast().op("text_ops")),
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

// Children/Family member details for parents
export const familyMembers = pgTable("family_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userProfileId: uuid("user_profile_id").notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name"),
	dateOfBirth: date("date_of_birth"),
	schoolId: uuid("school_id"),
	schoolYear: text("school_year"), // "Junior Infants", "Year 1", etc.
	// Size information
	currentSizes: jsonb("current_sizes"), // {"shirt": "Age 7-8", "trousers": "Age 8", "shoes": "UK 2"}
	growthNotes: text("growth_notes"), // "Growing fast, may need bigger soon"
	// Privacy
	showInProfile: boolean("show_in_profile").default(true),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("family_members_profile_idx").using("btree", table.userProfileId.asc().nullsLast().op("uuid_ops")),
	index("family_members_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.userProfileId],
		foreignColumns: [userProfiles.id],
		name: "family_members_user_profile_id_user_profiles_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.schoolId],
		foreignColumns: [schools.id],
		name: "family_members_school_id_schools_id_fk"
	}).onDelete("set null"),
]);

// Enhanced shop profiles with detailed business information
export const shopProfiles = pgTable("shop_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shopId: uuid("shop_id").notNull(),
	// Business details
	businessRegistrationNumber: text("business_registration_number"),
	vatNumber: text("vat_number"),
	openingHours: jsonb("opening_hours"), // {"monday": "9:00-17:00", ...}
	serviceAreas: jsonb("service_areas"), // Array of locality IDs they serve
	specialties: jsonb("specialties"), // Array of what they specialize in
	// Contact and social
	socialMedia: jsonb("social_media"), // {"facebook": "url", "instagram": "url"}
	deliveryOptions: jsonb("delivery_options"), // {"pickup": true, "delivery": true, "radius": "10km"}
	paymentMethods: jsonb("payment_methods"), // ["cash", "card", "bank_transfer"]
	// Performance metrics
	responseTime: integer("response_time"), // Average response time in hours
	completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).default('0'), // Percentage of completed transactions
	customerRating: decimal("customer_rating", { precision: 3, scale: 2 }).default('0'),
	totalReviews: integer("total_reviews").default(0),
	// Business verification
	verificationDocuments: jsonb("verification_documents"), // File IDs of verification docs
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verifiedBy: text("verified_by"), // Admin user ID who verified
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("shop_profiles_shop_idx").using("btree", table.shopId.asc().nullsLast().op("uuid_ops")),
	index("shop_profiles_verified_idx").using("btree", table.verifiedAt.asc().nullsLast().op("timestamp_ops")),
	unique("shop_profiles_shop_unique").on(table.shopId),
	foreignKey({
		columns: [table.shopId],
		foreignColumns: [shops.id],
		name: "shop_profiles_shop_id_shops_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.verifiedBy],
		foreignColumns: [user.id],
		name: "shop_profiles_verified_by_user_id_fk"
	}).onDelete("set null"),
]);

// Transaction history for all users
export const transactions = pgTable("transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	// Core transaction details
	type: text().notNull(), // 'purchase', 'sale', 'exchange'
	status: text().notNull(), // 'pending', 'completed', 'cancelled'
	// Participants
	buyerUserId: text("buyer_user_id"),
	sellerUserId: text("seller_user_id").notNull(),
	// Item details
	listingId: uuid("listing_id"),
	requestId: uuid("request_id"),
	itemDescription: text("item_description").notNull(),
	conditionAtSale: text("condition_at_sale"),
	price: decimal({ precision: 10, scale: 2 }),
	currency: text().default('EUR'),
	// Exchange details
	exchangeMethod: text("exchange_method"), // 'pickup', 'delivery', 'postal'
	meetingLocation: text("meeting_location"),
	scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
	actualDate: timestamp("actual_date", { mode: 'string' }),
	// Communication and feedback
	buyerNotes: text("buyer_notes"),
	sellerNotes: text("seller_notes"),
	buyerRating: integer("buyer_rating"), // 1-5 stars
	sellerRating: integer("seller_rating"), // 1-5 stars
	buyerFeedback: text("buyer_feedback"),
	sellerFeedback: text("seller_feedback"),
	// System tracking
	notificationsLog: jsonb("notifications_log"), // Record of emails/notifications sent
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("transactions_buyer_idx").using("btree", table.buyerUserId.asc().nullsLast().op("text_ops")),
	index("transactions_seller_idx").using("btree", table.sellerUserId.asc().nullsLast().op("text_ops")),
	index("transactions_listing_idx").using("btree", table.listingId.asc().nullsLast().op("uuid_ops")),
	index("transactions_request_idx").using("btree", table.requestId.asc().nullsLast().op("uuid_ops")),
	index("transactions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("transactions_date_idx").using("btree", table.createdAt.desc().nullsLast().op("timestamp_ops")),
	foreignKey({
		columns: [table.buyerUserId],
		foreignColumns: [user.id],
		name: "transactions_buyer_user_id_user_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.sellerUserId],
		foreignColumns: [user.id],
		name: "transactions_seller_user_id_user_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.listingId],
		foreignColumns: [listings.id],
		name: "transactions_listing_id_listings_id_fk"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.requestId],
		foreignColumns: [requests.id],
		name: "transactions_request_id_requests_id_fk"
	}).onDelete("set null"),
]);

// Communication threads related to transactions
export const transactionMessages = pgTable("transaction_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	transactionId: uuid("transaction_id").notNull(),
	senderUserId: text("sender_user_id").notNull(),
	message: text().notNull(),
	messageType: text("message_type").default('general'), // 'general', 'location', 'schedule', 'feedback'
	isSystemMessage: boolean("is_system_message").default(false),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("transaction_messages_transaction_idx").using("btree", table.transactionId.asc().nullsLast().op("uuid_ops")),
	index("transaction_messages_sender_idx").using("btree", table.senderUserId.asc().nullsLast().op("text_ops")),
	index("transaction_messages_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
		columns: [table.transactionId],
		foreignColumns: [transactions.id],
		name: "transaction_messages_transaction_id_transactions_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.senderUserId],
		foreignColumns: [user.id],
		name: "transaction_messages_sender_user_id_user_id_fk"
	}).onDelete("cascade"),
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
export type RequestImage = typeof requestImages.$inferSelect;
export type NewRequestImage = typeof requestImages.$inferInsert;
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
export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;
export type ShopProfile = typeof shopProfiles.$inferSelect;
export type NewShopProfile = typeof shopProfiles.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionMessage = typeof transactionMessages.$inferSelect;
export type NewTransactionMessage = typeof transactionMessages.$inferInsert;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
export type SchoolOwner = typeof schoolOwners.$inferSelect;
export type NewSchoolOwner = typeof schoolOwners.$inferInsert;
export type SchoolStock = typeof schoolStock.$inferSelect;
export type NewSchoolStock = typeof schoolStock.$inferInsert;
export type SchoolStockImage = typeof schoolStockImages.$inferSelect;
export type NewSchoolStockImage = typeof schoolStockImages.$inferInsert;
