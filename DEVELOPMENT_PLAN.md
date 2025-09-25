# SpipUniform Development Plan

## 🚀 **CURRENT STATUS: Phase 4.3 - Core User Pages**
**Last Completed: 4.3.1 Hierarchical Marketplace Flow ✅**
**Next Phase: 4.3.2 Browse & Search UI (Frontend)**

### 📊 **Progress Summary**
- ✅ **Phase 3.4 Complete**: Marketplace Core APIs (Listings, Requests, Matching)
- ✅ **Database Schema**: All tables created and migrated
- ✅ **API Endpoints**: Full CRUD for listings, requests, and matches
- ✅ **Frontend Components**: Favorites/wishlist system completed
- ✅ **Requests System**: Full frontend UI for creating, viewing, managing requests
- 🎯 **Next**: Complete the browse/search interface and listing management UI

---

## 📋 Development Methodology

### ✅ Checkpoint-Driven Development
**Every development phase MUST include checkpoints for testing and validation before moving to the next step.**

### 🏗️ File Organization Rules
**All code MUST be properly organized in logical folder structures - no random file placement.**

---

## 📁 File Organization Standards

### API Routes Structure
```
src/routes/api/
├── spipuniform/              # All SpipUniform APIs grouped
│   ├── counties/
│   │   └── index.ts          # GET /api/spipuniform/counties
│   ├── localities/
│   │   ├── index.ts          # GET /api/spipuniform/localities
│   │   ├── search.ts         # GET /api/spipuniform/localities/search
│   │   └── osm.ts            # OSM-specific locality endpoints
│   ├── schools/
│   │   ├── index.ts          # CRUD for schools
│   │   ├── search.ts         # School search endpoints
│   │   └── import.ts         # CSV import endpoints
│   ├── admin/               # Admin-only endpoints
│   │   ├── categories/       # Product category management
│   │   ├── product-types/    # Product type management
│   │   ├── attributes/       # Attribute system management
│   │   ├── conditions/       # Condition management
│   │   ├── shops/           # Shop verification/moderation
│   │   ├── reports/         # Report management
│   │   └── users/           # User role management
│   ├── listings/
│   │   └── index.ts          # Uniform listings CRUD
│   ├── requests/
│   │   └── index.ts          # Uniform requests CRUD
│   └── shops/
│       ├── register.ts       # Shop registration
│       └── profile.ts        # Shop profile management
```

### UI Components Structure
```
src/components/spipuniform/
├── admin/                    # Admin-specific components
│   ├── DataVerification/
│   ├── SchoolManager/
│   ├── ProductManager/
│   │   ├── CategoryManager/
│   │   ├── TypeBuilder/
│   │   ├── AttributeBuilder/
│   │   └── ConditionManager/
│   ├── ShopModeration/
│   ├── ReportManager/
│   └── UserRoleManager/
├── common/                   # Shared components
│   ├── LocationSelector/
│   ├── SchoolSelector/
│   ├── SearchBox/
│   └── DynamicForm/      # Dynamic forms based on product types
├── listings/                 # Listing-related components
├── requests/                 # Request-related components
└── shops/                    # Shop owner components
    ├── Registration/
    ├── Dashboard/
    └── ProfileManager/
```

### Database Schema Structure
```
src/db/schema/
├── spipuniform/
│   ├── index.ts             # Main exports
│   ├── geographic.ts        # Counties, localities, schools
│   ├── products.ts          # Categories, types, attributes
│   ├── marketplace.ts       # Listings, requests, matches
│   └── users.ts             # User profiles, shops
```

### Scripts Organization
```
scripts/spipuniform/
├── setup/                   # One-time setup scripts
│   ├── import-locations.ts
│   ├── import-schools.ts
│   └── seed-spipuniform.ts
├── maintenance/             # Ongoing maintenance
└── utils/                   # Helper scripts
```

---

## 🎯 Phase 3: API Development (with Checkpoints)

### 3.1 Core Data APIs 📊
**Goal: Build and test basic data retrieval APIs**

#### Step 3.1.1: Restructure Existing APIs ✋ **CHECKPOINT**
- [ ] Move current APIs to proper folder structure
- [ ] Test all existing APIs still work after move
- [ ] Update all imports and references
- [ ] **CHECKPOINT: All existing functionality still works**

#### Step 3.1.2: Enhanced Location APIs ✋ **CHECKPOINT** 
- [ ] Add `/api/spipuniform/counties` with full metadata
- [ ] Add `/api/spipuniform/localities/search` with advanced filtering
- [ ] Add error handling and validation
- [ ] **CHECKPOINT: Test county/locality selection in UI**

#### Step 3.1.3: Enhanced School APIs ✋ **CHECKPOINT**
- [ ] Add `/api/spipuniform/schools/search` with geographic filtering
- [ ] Add school creation with locality association
- [ ] Add school update/delete endpoints
- [ ] **CHECKPOINT: Test school CRUD operations in UI**

### 3.2 Admin Dashboard APIs 🔧
**Goal: Build admin tools for product and marketplace management**

#### Step 3.2.1: Product Category Management ✋ **CHECKPOINT**
- [ ] Create product category CRUD APIs
- [ ] Add category ordering and activation
- [ ] Add bulk category operations
- [ ] **CHECKPOINT: Test category management in admin UI**

#### Step 3.2.2: Product Type Management ✋ **CHECKPOINT**
- [ ] Create product type CRUD APIs
- [ ] Add type-to-category relationships
- [ ] Add product type templates/presets
- [ ] **CHECKPOINT: Test type management with categories**

#### Step 3.2.3: Attribute System Management ✋ **CHECKPOINT**
- [ ] Create attribute CRUD APIs
- [ ] Add attribute value management
- [ ] Add dynamic form builder for product types
- [ ] **CHECKPOINT: Test complete attribute system**

#### Step 3.2.4: Condition Management ✋ **CHECKPOINT**
- [ ] Create condition CRUD APIs
- [ ] Add condition ordering and descriptions
- [ ] Add condition validation rules
- [ ] **CHECKPOINT: Test condition management**

### 3.3 User Management APIs 👥
**Goal: Extend user system for uniform marketplace**

#### Step 3.3.1: User Profile Extensions ✋ **CHECKPOINT**
- [ ] Create user profile API endpoints
- [ ] Add family/children management
- [ ] Add user preferences
- [ ] **CHECKPOINT: Test user profile creation/editing**

#### Step 3.3.2: Shop Registration System ✋ **CHECKPOINT**
- [ ] Create shop registration API
- [ ] Add shop verification workflow
- [ ] Add shop profile management
- [ ] **CHECKPOINT: Test complete shop registration flow**

#### Step 3.3.3: Admin Moderation APIs ✋ **CHECKPOINT**
- [ ] Create shop verification/approval endpoints
- [ ] Add report management APIs
- [ ] Add admin user role management
- [ ] **CHECKPOINT: Test admin moderation workflows**

### 3.4 Marketplace Core APIs 🏪 ✅ **COMPLETED**
**Goal: Build the core uniform marketplace functionality**

#### Step 3.4.1: Listings Management ✅ **COMPLETED**
- [x] Create listing CRUD APIs
- [x] Add image upload for listings
- [x] Add listing search and filtering
- [x] **CHECKPOINT: Test creating/editing/searching listings** ✅

#### Step 3.4.2: Requests Management ✅ **COMPLETED**
- [x] Create request CRUD APIs
- [x] Add request search and filtering
- [x] Add request matching preview
- [x] **CHECKPOINT: Test creating/editing/searching requests** ✅

#### Step 3.4.3: Matching System ✅ **COMPLETED**
- [x] Create basic matching algorithm
- [x] Add match creation and management
- [x] Add match status tracking
- [x] **CHECKPOINT: Test end-to-end matching workflow** ✅

---

## 🎯 Phase 4: Frontend Development (with Checkpoints)

### 4.1 Admin Dashboard UI 🛮️
**Goal: Build admin interfaces for marketplace management**

#### Step 4.1.1: Product Category Management UI ✋ **CHECKPOINT**
- [ ] Category list/grid view
- [ ] Category create/edit forms
- [ ] Drag-and-drop ordering
- [ ] Bulk actions (activate/deactivate)
- [ ] **CHECKPOINT: Admins can manage categories**

#### Step 4.1.2: Product Type Management UI ✋ **CHECKPOINT**
- [ ] Type management with category relationships
- [ ] Type builder with attribute assignment
- [ ] Preview forms for each type
- [ ] **CHECKPOINT: Admins can build product types**

#### Step 4.1.3: Attribute Builder UI ✋ **CHECKPOINT**
- [ ] Drag-and-drop attribute builder
- [ ] Attribute value management
- [ ] Form preview for product types
- [ ] **CHECKPOINT: Dynamic forms work correctly**

#### Step 4.1.4: Shop & User Moderation UI ✋ **CHECKPOINT**
- [ ] Shop verification dashboard
- [ ] Report management interface
- [ ] User role management
- [ ] **CHECKPOINT: Admin moderation tools work**

### 4.2 Component Library 🧩
**Goal: Build reusable components for the uniform marketplace**

#### Step 4.2.1: Location Components ✋ **CHECKPOINT**
- [ ] LocationSelector component
- [ ] SchoolSelector component  
- [ ] Test components in isolation
- [ ] **CHECKPOINT: Components work independently**

#### Step 4.2.2: Search Components ✋ **CHECKPOINT**
- [ ] UniversalSearchBox component
- [ ] FilterPanel component
- [ ] ResultsList component
- [ ] **CHECKPOINT: Search experience is smooth**

#### Step 4.2.3: Dynamic Form Components ✋ **CHECKPOINT**
- [ ] DynamicProductForm component (uses product type attributes)
- [ ] AttributeInput components (select, multiselect, text, etc.)
- [ ] FormPreview component
- [ ] **CHECKPOINT: Dynamic forms render correctly for all product types**

### 4.3 Core User Pages 📄
**Goal: Build the main user-facing pages with hierarchical marketplace flow**

#### Step 4.3.1: Hierarchical Marketplace Flow ✅ **COMPLETED**
- [x] Implement county → locality → school selection flow
- [x] School availability checking and item population
- [x] Request creation workflow when no items available
- [x] Listing creation with same hierarchical flow
- [x] **CHECKPOINT: Users can navigate marketplace by geographic hierarchy**

#### Step 4.3.2: Browse & Search UI ✋ **CHECKPOINT**
- [ ] Enhanced browse page with hierarchical filters
- [ ] Advanced search functionality within selected school
- [ ] Filter by product type, condition, price within school
- [ ] **CHECKPOINT: Users can find listings easily within school context**

#### Step 4.3.2: Listing Management ✋ **CHECKPOINT**
- [ ] Create listing page (uses dynamic product forms)
- [ ] Edit listing page
- [ ] My listings dashboard
- [ ] **CHECKPOINT: Users can manage listings with all product types**

#### Step 4.3.3: Shop Owner Dashboard ✋ **CHECKPOINT**
- [ ] Shop profile management
- [ ] Shop listing analytics
- [ ] Bulk listing tools
- [ ] **CHECKPOINT: Shop owners can manage their business**

---

## 🎯 Phase 4.4: School Stock Management 📚
**Goal: Enable schools to manage and list available uniform stock for families**

### 4.4.1 School Stock Database Schema ✋ **CHECKPOINT**
- [ ] Create school stock/inventory tables
- [ ] Link stock items to schools and product types
- [ ] Add stock quantity and availability tracking
- [ ] Add stock condition and notes fields
- [ ] **CHECKPOINT: Database schema supports school inventory**

### 4.4.2 School Stock Management APIs ✋ **CHECKPOINT**
- [ ] Create school stock CRUD APIs
- [ ] Add stock search and filtering by school
- [ ] Add bulk stock import/export functionality
- [ ] Add stock availability checking
- [ ] **CHECKPOINT: APIs support full stock management**

### 4.4.3 School Stock Management UI ✋ **CHECKPOINT**
- [ ] School stock dashboard for administrators
- [ ] Stock item creation/editing forms
- [ ] Bulk stock import interface (CSV/Excel)
- [ ] Stock level monitoring and alerts
- [ ] **CHECKPOINT: Schools can manage their inventory**

### 4.4.4 Integration with Marketplace ✋ **CHECKPOINT**
- [ ] School stock items appear in marketplace search
- [ ] Match school stock with family requests
- [ ] Priority matching for school stock items
- [ ] Stock reservation system for matched items
- [ ] **CHECKPOINT: School stock integrates with existing marketplace**

### 4.4.5 School Stock Analytics ✋ **CHECKPOINT**
- [ ] Stock movement tracking and history
- [ ] Popular item reports
- [ ] Low stock alerts and notifications
- [ ] Usage analytics for school administrators
- [ ] **CHECKPOINT: Schools have visibility into stock performance**

---

## 🎯 Phase 5: Email Notification System 📧
**Goal: Notify parents when requested uniform items become available**

### 5.1 Email Templates for Uniforms ✋ **CHECKPOINT**
- [ ] Create uniform availability notification templates
- [ ] Create request confirmation email templates
- [ ] Create listing confirmation email templates
- [ ] **CHECKPOINT: Email templates work with uniform data**

### 5.2 Notification Triggers ✋ **CHECKPOINT**
- [ ] Trigger emails when new listings match existing requests
- [ ] Trigger emails when requests are created (confirmation)
- [ ] Trigger emails when listings are created (confirmation)
- [ ] **CHECKPOINT: Email notifications fire correctly**

### 5.3 Email Preferences ✋ **CHECKPOINT**
- [ ] User email notification preferences
- [ ] Unsubscribe functionality
- [ ] Email frequency controls
- [ ] **CHECKPOINT: Users can control their email preferences**

---

## 🎯 Phase 6: Messaging System 💬
**Goal: Enable direct parent-to-parent communication for uniform coordination**

### 6.1 Direct Messaging Core ✋ **CHECKPOINT**
- [ ] Create messaging system database schema
- [ ] Build message CRUD APIs
- [ ] Implement real-time messaging with WebSocket/Server-Sent Events
- [ ] **CHECKPOINT: Basic messaging works between users**

### 6.2 Conversation Management ✋ **CHECKPOINT**
- [ ] Thread/conversation grouping
- [ ] Message status (read/unread)
- [ ] Message history and pagination
- [ ] **CHECKPOINT: Conversation management works smoothly**

### 6.3 Messaging UI Components ✋ **CHECKPOINT**
- [ ] Chat/message interface components
- [ ] Conversation list component
- [ ] Message composer component
- [ ] **CHECKPOINT: Messaging UI is user-friendly**

### 6.4 Integration with Listings ✋ **CHECKPOINT**
- [ ] "Message Seller" buttons on listings
- [ ] "Message Requester" functionality
- [ ] Context-aware messaging (include item details)
- [ ] **CHECKPOINT: Messaging integrates seamlessly with marketplace**

---

## 🏃‍♂️ Development Workflow Rules

### Before Starting Any Phase:
1. **Create detailed task breakdown**
2. **Identify all checkpoints**
3. **Plan file organization**
4. **Confirm previous checkpoints pass**

### At Each Checkpoint:
1. **STOP development**
2. **Test everything built so far**
3. **Fix any issues before proceeding**
4. **Update progress documentation**
5. **Get explicit approval to continue**

### File Organization Rules:
1. **Group related files together**
2. **Use consistent naming conventions**
3. **Create index files for clean imports**
4. **Document folder structure**
5. **No random file placement**

---

## 🎯 Next Immediate Steps

### Step 1: File Reorganization ✋ **MANDATORY CHECKPOINT**
- [ ] Reorganize existing APIs into proper folder structure
- [ ] Update all imports and references
- [ ] Test that everything still works
- [ ] **CHECKPOINT: All existing functionality preserved**

### Step 2: Basic Product System Setup ✋ **CRITICAL CHECKPOINT**
- [ ] Create basic product categories (Shirts, Trousers, Accessories, etc.)
- [ ] Create basic product types with attributes
- [ ] Create basic conditions (New, Excellent, Good, Fair, etc.)
- [ ] Seed initial data via migration or script
- [ ] **CHECKPOINT: Basic product system ready for admin UI**

### Step 3: Database Cleanup Tasks 📋
- [ ] Remove duplicate schools from database (e.g., multiple "Greystones Community NS")
- [ ] Standardize school address formats for better locality matching
- [ ] Clean up test data created during development
- [ ] Add database constraints to prevent future duplicates
- [ ] **CHECKPOINT: Database is clean and consistent**

**Only proceed to admin UI development after these checkpoints pass!**

---

## ⚠️ Development Rules

### ❌ What NOT to do:
- ❌ Rush to new features without testing current ones
- ❌ Put files in random locations
- ❌ Skip checkpoints
- ❌ Build multiple features simultaneously without testing

### ✅ What TO do:
- ✅ Test each checkpoint thoroughly
- ✅ Organize files logically
- ✅ Document what you build
- ✅ Get explicit approval before moving forward
- ✅ Fix issues immediately when found

This approach ensures steady, reliable progress with working functionality at every step.