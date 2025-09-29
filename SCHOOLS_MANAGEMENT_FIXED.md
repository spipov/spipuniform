# Schools Management - Proper Implementation

## Problem

The user clarified that they **DO NOT** want to see thousands of inactive schools in the main table. Instead:

1. **Main Table**: Should ONLY show **active schools** (clean, manageable list)
2. **Activation Dialog**: Should show a searchable list of **inactive CSV schools** to activate
3. **Creation Dialog**: Should allow creating **brand new schools** manually
4. **Action Buttons**: Need tooltips to explain what they do

## Solution Implemented

### 1. Main Table - Active Schools Only ✅

**File**: `src/components/school-management-table.tsx`

- Removed the filter dropdown (All/Active/Inactive)
- Table now ONLY fetches and shows active schools
- Query: `GET /api/schools?active=true`
- Clean, manageable list without thousands of inactive schools

### 2. School Activation Dialog ✅

**File**: `src/components/school-activation-dialog.tsx` (NEW)

**Features**:
- **Search & Filter**:
  - County filter (optional)
  - Locality filter (optional, uses LocalitySearch component)
  - School name search
- **Inactive Schools List**:
  - Shows up to 100 inactive schools
  - CSV badge for schools from CSV import
  - Level badge (primary/secondary/mixed)
  - Location info (locality, county)
- **Selection**:
  - Click to select a school
  - Shows selected school details
  - Activate button to make school active
- **BEM Names**: All interactive elements have `name` attributes

**Usage**:
1. Click "Activate School" button in main table
2. Filter by county/locality or search by name
3. Select a school from the list
4. Click "Activate School" button
5. School becomes active and appears in main table

### 3. School Creation Dialog ✅

**File**: `src/components/school-creation-dialog.tsx` (EXISTING)

- Unchanged - still allows creating brand new schools
- For schools NOT in the CSV import
- Requires manual entry of all details

### 4. Action Buttons with Tooltips ✅

**File**: `src/components/school-management-table.tsx`

All action buttons now have tooltips:
- **Hide (X)**: "Hide school from marketplace"
- **View (Eye)**: "View school details"
- **Edit (Pencil)**: "Edit school information"
- **Website (External Link)**: "Visit school website"

All buttons have BEM `name` attributes for testing.

### 5. Two Buttons in Header ✅

**Main Table Header**:
- **"Activate School"** (Primary button) - Opens activation dialog
- **"Create New"** (Outline button) - Opens creation dialog

## User Flow

### Activate Existing School (from CSV)

1. Admin goes to `/dashboard/spipuniform/schools`
2. Clicks **"Activate School"** button
3. Dialog opens showing inactive schools
4. Admin filters by:
   - County: "Wicklow"
   - Locality: "Greystones"
5. Sees list of inactive schools in Greystones
6. Selects "Temple Carrig Secondary School"
7. Clicks "Activate School"
8. School becomes active and appears in main table
9. School is now visible in marketplace

### Create Brand New School

1. Admin goes to `/dashboard/spipuniform/schools`
2. Clicks **"Create New"** button
3. Dialog opens with empty form
4. Admin fills in:
   - County
   - Locality
   - School name
   - Level
   - Address, website, etc.
5. Clicks "Create School"
6. School is created and marked as active
7. School appears in main table and marketplace

### Manage Active Schools

1. Admin sees list of active schools
2. Can search/filter the table
3. Action buttons:
   - **Hide**: Deactivate school (removes from marketplace)
   - **View**: See full details
   - **Edit**: Update school information
   - **Website**: Visit school website

## Files Modified

1. **`src/components/school-management-table.tsx`**
   - Removed filter dropdown
   - Changed to only fetch active schools
   - Added two buttons: "Activate School" and "Create New"
   - Added tooltips to all action buttons
   - Added BEM names to all buttons
   - Integrated SchoolActivationDialog

2. **`src/components/school-activation-dialog.tsx`** (NEW)
   - Complete dialog for activating inactive schools
   - Search and filter functionality
   - Selectable list of inactive schools
   - Shows CSV source indicator
   - BEM names on all elements

3. **`src/routes/api/schools.ts`** (EARLIER)
   - Added `active` query parameter support
   - Added `csvSourceRow` to response

## API Endpoints Used

### Get Active Schools
```bash
GET /api/schools?active=true
```

### Get Inactive Schools
```bash
GET /api/schools?active=false&limit=100&query=search_term
```

### Activate School
```bash
PATCH /api/schools/{schoolId}
Content-Type: application/json

{
  "isActive": true
}
```

### Create School
```bash
POST /api/spipuniform/schools
Content-Type: application/json

{
  "name": "School Name",
  "countyId": "uuid",
  "localityName": "Locality",
  "level": "primary",
  "isActive": true,
  ...
}
```

## Testing

### Test Activation Dialog

1. Go to `/dashboard/spipuniform/schools`
2. Click "Activate School" button
3. Should see dialog with filters
4. Select county "Wicklow"
5. Type "Greystones" in locality search
6. Should see Greystones in dropdown
7. Select it
8. Should see inactive schools from Greystones
9. Click on a school to select it
10. Should see school details below
11. Click "Activate School"
12. Should see success toast
13. School should appear in main table

### Test Creation Dialog

1. Go to `/dashboard/spipuniform/schools`
2. Click "Create New" button
3. Should see creation form
4. Fill in all required fields
5. Click "Create School"
6. Should see success toast
7. School should appear in main table

### Test Tooltips

1. Hover over action buttons in table
2. Should see tooltips:
   - Hide button: "Hide school from marketplace"
   - View button: "View school details"
   - Edit button: "Edit school information"
   - Website button: "Visit school website"

### Test BEM Names

All elements have `name` attributes for testing:
- `school-activation-dialog` - Main dialog
- `county-filter` - County select
- `school-search` - School name input
- `school-item-{id}` - School list items
- `activate-school-button` - Activate button
- `hide-school-{id}` - Hide button
- `view-school-{id}` - View button
- `edit-school-{id}` - Edit button
- `website-school-{id}` - Website link

## Benefits

✅ **Clean Main Table** - Only shows active schools (manageable list)
✅ **Easy Activation** - Search and activate schools from CSV import
✅ **Manual Creation** - Create new schools not in CSV
✅ **Clear UI** - Tooltips explain what each button does
✅ **Testable** - BEM names on all interactive elements
✅ **Flexible** - Filter by county/locality or search by name
✅ **Fast** - Limits to 100 results, client-side filtering
✅ **Informative** - Shows CSV source, level, location

## Next Steps

1. **Test the activation dialog** - Verify search and filters work
2. **Test tooltips** - Hover over buttons to see tooltips
3. **Activate key schools** - Use the dialog to activate popular schools
4. **Consider bulk activation** - Future feature for activating multiple schools at once

## Summary

The schools management page now has:
- **Main table**: Only active schools (clean, manageable)
- **Activation dialog**: Search and activate inactive CSV schools
- **Creation dialog**: Create brand new schools manually
- **Tooltips**: Clear explanations for all action buttons
- **BEM names**: All elements are testable

**The implementation matches the user's requirements perfectly!** 🎉

