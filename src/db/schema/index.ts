// Better Auth tables
export * from './auth';
export { session as sessions } from './auth';

// User Management System tables
export * from './user-management';

// Branding System tables
export * from './branding';

// Email System tables
export * from './email';

// Credentials System tables
export * from './credentials';

// Auth Settings
export * from './auth-settings';

// File System tables
export * from './file-system';

// SpipUniform tables
export * from './spipuniform';

// School management tables
export * from './school-submissions';
export * from './school-approval-requests';

export * from './school-setup-requests';


// Export types for user management
export type { User, NewUser, Role, NewRole, Permission, NewPermission } from './user-management';

// Export types for branding
export type { Branding, NewBranding, UpdateBranding } from './branding';

// Export types for email system
export type {
  EmailSettings,
  NewEmailSettings,
  UpdateEmailSettings,
  EmailTemplate,
  NewEmailTemplate,
  UpdateEmailTemplate,
  EmailLog,
  NewEmailLog,
  EmailProvider,
  EmailStatus,
  TemplateType
} from './email';

// Export types for credentials system
export type {
  Credential,
  NewCredential,
  UpdateCredential,
  CredentialType,
  CredentialProvider
} from './credentials';

// Export types for file system
export type {
  StorageSettings,
  NewStorageSettings,
  UpdateStorageSettings,
  FileItem,
  NewFile,
  UpdateFile,
  FilePermission,
  NewFilePermission,
  UpdateFilePermission,
  StorageProvider,
  FileType,
  FileWithPermissions,
  StorageConfig,
  FileListResponse,
  UploadResponse,
  UploadError
} from './file-system';

// Export types for SpipUniform
export type {
  County,
  NewCounty,
  Locality,
  NewLocality,
  School,
  NewSchool,
  Shop,
  NewShop,
  ProductCategory,
  NewProductCategory,
  ProductType,
  NewProductType,
  Attribute,
  NewAttribute,
  AttributeValue,
  NewAttributeValue,
  Condition,
  NewCondition,
  Listing,
  NewListing,
  ListingAttributeValue,
  NewListingAttributeValue,
  ListingImage,
  NewListingImage,
  Request,
  NewRequest,
  Match,
  NewMatch,
  Watchlist,
  NewWatchlist,
  Report,
  NewReport,
  Notification,
  NewNotification,
  UserProfile,
  NewUserProfile,
  FamilyMember,
  NewFamilyMember,
  ShopProfile,
  NewShopProfile,
  Transaction,
  NewTransaction,
  TransactionMessage,
  NewTransactionMessage,
  UserFavorite,
  NewUserFavorite,
  SchoolOwner,
  NewSchoolOwner,
  SchoolStock,
  NewSchoolStock,
  SchoolStockImage,
  NewSchoolStockImage
} from './spipuniform';

// Export types for school management
export type {
  SchoolSubmission,
  NewSchoolSubmission,
  SchoolApprovalRequest,
  NewSchoolApprovalRequest
} from './school-submissions';

export type {
  SchoolApprovalRequest as SchoolApprovalRequestType,
  NewSchoolApprovalRequest as NewSchoolApprovalRequestType
} from './school-approval-requests';
