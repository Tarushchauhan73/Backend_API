# Backend Design & Architecture

## Overview

This document explains the architectural decisions, design patterns, and engineering principles used in building the Finance Dashboard Backend.

## Design Philosophy

The backend is designed with these principles in mind:

1. **Clarity over Cleverness**: Code should be easy to understand and maintain
2. **Separation of Concerns**: Each layer handles one responsibility
3. **Testability**: Components are independent and can be tested in isolation
4. **Scalability**: Structure allows for growth without complete rewrites
5. **Security First**: User data and access control are properly protected

## Architecture Layers

### 1. Route Layer (`src/routes/`)

**Purpose**: Define API endpoints and apply middleware

**Responsibility**:
- Map HTTP methods to controller functions
- Apply middleware in correct order (auth → authorization → controller)
- Define endpoint paths and structure

**Example**:
```javascript
// routes/recordRoutes.js
router.post('/', requirePermission('Create Record'), recordController.createRecord);
```

**Design Decision**: Routes are separate from controllers to keep endpoint definitions clear and middleware application centralized.

---

### 2. Middleware Layer (`src/middleware/`)

**Purpose**: Pre-process requests before they reach controllers

**Components**:

#### Authentication Middleware (`auth.js`)
- **What it does**: Extracts user information from request headers
- **Why**: Simulates authenticated user context without JWT complexity
- **How**: Reads `x-user-id` and `x-role-id` headers
- **Future**: Can be replaced with JWT parsing

```javascript
// Example flow
Request with headers: x-user-id: abc123, x-role-id: role_admin
↓
auth.js extracts → req.user = { id: 'abc123', roleId: 'role_admin' }
↓
Passed to next middleware
```

#### Authorization Middleware (`authorization.js`)
- **What it does**: Checks if user has permission for requested action
- **Why**: Enforces role-based access control at API level
- **How**: Queries database for user's role permissions
- **Pattern**: Factory function for reusable permission checks

```javascript
// Usage
router.post('/', requirePermission('Create Record'), controller.create);
// Automatically blocks users without permission
```

#### Validation Middleware (`validation.js`)
- **What it does**: Validates input data structure and types
- **Why**: Prevent invalid data from reaching business logic
- **How**: Functions check against requirements before controller executes
- **Response**: Returns detailed validation errors

---

### 3. Controller Layer (`src/controllers/`)

**Purpose**: Handle HTTP requests and coordinate response

**Responsibility**:
- Parse request data
- Call appropriate service methods
- Format response in consistent JSON structure
- Handle errors with appropriate HTTP status codes

**Pattern Used**: Async/await for clean error handling

```javascript
// Example controller function
async function createRecord(req, res) {
  try {
    // 1. Extract data
    const { amount, type, category, record_date } = req.body;
    const userId = req.user.id;
    
    // 2. Validate
    const validation = validateFinancialRecord(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ ... });
    }
    
    // 3. Call service
    const newRecord = await recordService.createRecord(userId, {...});
    
    // 4. Return response
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(error.status || 500).json({ ... });
  }
}
```

**Design Decision**: Controllers are thin - they don't contain business logic, just request/response handling. This makes them easy to test and update.

---

### 4. Service Layer (`src/services/`)

**Purpose**: Implement all business logic

**Responsibility**:
- Execute business rules
- Perform database operations
- Transform and aggregate data
- Handle complex operations

**Services**:

#### User Service (`userService.js`)
- Create users with hashed passwords
- Retrieve user information
- Update user status and roles
- Get user's role and permissions

```javascript
async function createUser(userData) {
  // Validate uniqueness handled by DB constraint
  // Hash password with bcryptjs
  // Create UUID
  // Insert into database
  // Return user info (without password)
}
```

#### Record Service (`recordService.js`)
- CRUD operations for financial records
- User-scoped access (users only see own records)
- Soft delete implementation
- Flexible filtering

```javascript
async function getRecordsByUser(userId, filters = {}, limit, offset) {
  // Build query with optional filters
  // Apply pagination
  // Only return non-deleted records
  // Return formatted response
}
```

#### Dashboard Service (`dashboardService.js`)
- Aggregate financial data
- Calculate statistics
- Generate trends and breakdowns
- System-wide analytics (admin only)

```javascript
// Complex aggregation query
SELECT
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  ...
FROM financial_records ...
```

**Design Decision**: Each service handles one domain. This allows them to grow independently without affecting others.

---

### 5. Database Layer (`src/config/database.js`)

**Purpose**: Manage data persistence

**Design Choices**:

#### Why SQLite?
- ✅ No external server needed (perfect for college project)
- ✅ File-based, version-controllable
- ✅ Sufficient for small-to-medium workloads
- ✅ Can be migrated to PostgreSQL later without code changes

#### Schema Design

```
Normalized Design with 3NF (Third Normal Form)

users (1) ──────────¹ (M) financial_records
  │
  │ many-to-one
  ↓
roles (1) ────────────── (M) role_permissions ─────────── (M) permissions
```

**Why this structure?**
- Each user has one role
- Each role can have multiple permissions
- Easy to add/remove permissions from roles
- Prevents data duplication

#### Queries Use Parameterization
```javascript
// SAFE - prevents SQL injection
db.run('INSERT INTO users (id, username) VALUES (?, ?)', [id, username]);

// UNSAFE - could allow injection
db.run(`INSERT INTO users (id, username) VALUES ('${id}', '${username}')`);
```

---

## Key Design Patterns

### 1. Middleware Pattern
**What**: Functions that process requests before reaching controller
**Why**: Separates cross-cutting concerns (auth, validation) from business logic
**Example**: Authentication middleware extracts user info, authorization checks permissions

### 2. Service Pattern
**What**: Classes/modules that encapsulate business logic
**Why**: Keeps logic out of controllers, makes it reusable and testable
**Example**: `userService` handles all user-related operations

### 3. Factory Pattern
**What**: Function that creates middleware with parameters
**Why**: Allows reusable middleware for different permissions
**Example**: `requirePermission('Create Record')` creates middleware for specific permission

### 4. Error Handling Pattern
**What**: Consistent error structure with status codes
**Why**: Client can parse errors programmatically
**Example**:
```javascript
{
  success: false,
  error: "Validation failed",
  message: "Amount must be positive",
  details: [...]
}
```

### 5. Promise-Based Async Pattern
**What**: Services return Promises that resolve/reject
**Why**: Allows proper error handling and flow control
**Example**:
```javascript
async function createUser(userData) {
  return new Promise((resolve, reject) => {
    db.run(query, [...], function(err) {
      if (err) reject(error);
      else resolve(result);
    });
  });
}
```

---

## Access Control Implementation

### How Permissions Work

```
1. User makes request with headers:
   x-user-id: user-123
   x-role-id: role_viewer

2. Auth middleware extracts → req.user = { id: 'user-123', roleId: 'role_viewer' }

3. Route applies authorization:
   requirePermission('Create Record')

4. Authorization checks database:
   Does role_viewer have 'Create Record' permission? → NO
   
5. Middleware returns 403 Forbidden

6. Request never reaches controller
```

### Database-Driven Permissions

```sql
-- Query: Does role_viewer have Create Record permission?
SELECT rp.permission_id
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 'role_viewer'
AND p.name = 'Create Record'

-- Returns: empty (permission denied)
```

**Why database-driven?**
- Permissions can be changed without code deployment
- Easy to add new permissions
- Fine-grained control
- Auditable

---

## Data Flow Examples

### Creating a Financial Record

```
1. HTTP Request
   POST /api/records
   Headers: x-user-id, x-role-id
   Body: { amount, type, category, record_date }

2. Authentication Middleware
   ✓ Extract user info → req.user = { id, roleId }

3. Authorization Middleware
   ✓ Check permission 'Create Record'
   ✓ Query database for role permissions
   ✓ Permission confirmed, continue

4. Controller (recordController.createRecord)
   ✓ Extract amount, type, category, record_date from req.body
   ✓ Extract userId from req.user.id
   ✓ Call validation function
   ✓ If valid, call recordService.createRecord()
   ✓ If error, return error response

5. Service (recordService.createRecord)
   ✓ Generate UUID for record
   ✓ Insert into financial_records table with userId
   ✓ Return created record

6. Controller formats response
   res.status(201).json({
     success: true,
     message: "Record created successfully",
     data: { id, amount, type, ... }
   })

7. HTTP Response 201 Created to client
```

### Getting User's Dashboard

```
1. Request: GET /api/dashboard/summary
   Headers: x-user-id: user-123, x-role-id: role_viewer

2. Middleware chain passes (user authenticated, has View Dashboard permission)

3. Controller calls dashboardService.getUserDashboardSummary(user-123)

4. Service runs aggregation query:
   SELECT
     SUM(CASE WHEN type='income' ...) as total_income,
     SUM(CASE WHEN type='expense' ...) as total_expenses,
     ...
   FROM financial_records
   WHERE user_id = 'user-123' AND is_deleted = 0

5. Returns calculated summary:
   {
     total_income: 50000,
     total_expenses: 15000,
     net_balance: 35000,
     total_records: 45
   }

6. Controller returns response with summary data
```

---

## Why These Design Decisions?

### 1. Header-Based Auth Instead of JWT
**Decision**: Use `x-user-id` and `x-role-id` headers

**Reasoning**:
- Simpler to understand and test
- No token generation/validation complexity
- Perfect for development and college project
- Can be easily replaced with JWT later

**Production Path**: 
```javascript
// Current
const userId = req.headers['x-user-id'];

// Future JWT
const decoded = jwt.verify(token, secret);
const userId = decoded.id;
```

### 2. Soft Deletes Instead of Hard Deletes
**Decision**: Mark records with `is_deleted = 1` instead of removing

**Reasoning**:
- Preserves historical data
- Allows recovery of accidentally deleted records
- Maintains referential integrity
- Enables audit trails

**Example**:
```javascript
// Soft delete
UPDATE financial_records SET is_deleted = 1 WHERE id = ?

// Hard delete (avoided)
// DELETE FROM financial_records WHERE id = ?
```

### 3. SQLite Instead of PostgreSQL/MySQL
**Decision**: Use file-based SQLite for persistence

**Reasoning**:
- No database server configuration needed
- File-based (can be backed up easily)
- Good for prototyping and learning
- Standard SQL syntax (portable)

**Migration Path**:
- Service layer hides SQL logic
- Switching databases requires only config changes
- No controller/service code changes needed

### 4. UUID Instead of Auto-Increment IDs
**Decision**: Use UUID v4 for primary keys

**Reasoning**:
- Globally unique (no collision even in distributed systems)
- Can't guess next ID (security)
- Easier to merge databases
- Suitable for future horizontal scaling

**Trade-off**: Slightly larger storage, faster generation

### 5. Promise-Based Services
**Decision**: Return Promises instead of callbacks

**Reasoning**:
- Cleaner async/await syntax
- Better error handling
- Easier to test
- Follows modern Node.js patterns

```javascript
// Using Promises
const user = await userService.getUserById(userId);

// vs Callbacks
userService.getUserById(userId, (err, user) => { ... });
```

---

## Error Handling Strategy

### HTTP Status Codes Used

```
200 OK              → GET successful, resource returned
201 Created         → POST successful, resource created
400 Bad Request     → Client error (validation failed)
401 Unauthorized    → Missing authentication
403 Forbidden       → Authenticated but lacks permission
404 Not Found       → Resource doesn't exist
409 Conflict        → Duplicate (username already exists)
500 Server Error    → Unexpected server error
```

### Response Format

**Success**:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human readable message",
  "details": [ "Validation details..." ]
}
```

**Design**: Consistent format allows client to reliably parse responses

---

## Security Measures Implemented

### Input Validation
- All user inputs checked before database operations
- Type validation (amount is number, type is enum)
- Length validation (username minimum 3 chars)
- Format validation (email format check)

### SQL Injection Prevention
- Parameterized queries throughout
- Never string concatenation in SQL
- Prepared statements with parameter substitution

### Password Security
- Salted hashing with bcryptjs (10 rounds)
- Never stored in plaintext
- Passwords excluded from response data

### User Isolation
- Users can only access their own records
- Service layer enforces `user_id` check
- Admin can view all records with explicit permission

### Access Control
- Permission checks before execution
- Middleware-enforced authorization
- Database-driven permissions (flexible, auditable)

---

## Extensibility & Future Enhancements

### Adding New Roles
```javascript
// Just add to database:
INSERT INTO roles (id, name, description) VALUES
('role_accountant', 'Accountant', 'Can manage reports');

// Add the necessary permissions...
// No code change needed
```

### Adding New Permissions
```javascript
// Add to database:
INSERT INTO permissions (id, name, resource, action) VALUES
('perm_export', 'Export Data', 'reports', 'export');

// Assign to existing roles...
// Existing authorization middleware works automatically
```

### Adding JWT Authentication
```javascript
// Replace auth middleware function
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId, roleId: decoded.roleId };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Adding Database Migration to PostgreSQL
```javascript
// Services use parameterized queries (no change needed)
// Only change: database.js configuration
// Use pg module instead of sqlite3
// All service code remains the same
```

---

## Testing Considerations

### Testable Architecture
```
✓ Services are independent → Unit test easily
✓ Controllers are thin → Integration test specific endpoints
✓ Middleware is isolated → Middleware tests straightforward
✓ Database is mocked easily → Service tests don't need real DB
```

### Example Unit Test
```javascript
// Test service in isolation
describe('recordService.createRecord', () => {
  it('should create record with valid data', async () => {
    const record = await recordService.createRecord('user-1', {
      amount: 100,
      type: 'income',
      category: 'Salary',
      record_date: '2024-01-01'
    });
    
    expect(record.amount).toBe(100);
    expect(record.user_id).toBe('user-1');
  });
});
```

---

## Performance Considerations

### Current Approach
- Simple queries with filters
- Pagination for list endpoints (limit, offset)
- SQL aggregation for summaries

### Future Optimizations
1. **Database Indexing**
   ```sql
   CREATE INDEX idx_user_records ON financial_records(user_id);
   CREATE INDEX idx_record_date ON financial_records(record_date);
   ```

2. **Caching Layer**
   ```javascript
   // Cache dashboard summaries with Redis
   const cachedSummary = await cache.get(`summary:${userId}`);
   ```

3. **Query Optimization**
   - Use proper JOINs instead of multiple queries
   - Limit result sets appropriately
   - Use selective columns instead of SELECT *

4. **Async Processing**
   - Move expensive operations to background jobs
   - Use worker queue for bulk operations

---

## Conclusion

This backend demonstrates professional software architecture principles:

1. **Layered Architecture**: Clear separation between routes, controllers, services, and data access
2. **Security First**: Proper access control, input validation, and data protection
3. **Maintainability**: Clean code, consistent patterns, well-documented
4. **Extensibility**: Easy to add new features without modifying existing code
5. **Testability**: Components are independent and can be tested in isolation
6. **Scalability**: Structure supports growing requirements and complexity

The design prioritizes **clarity and correctness** over clever optimizations, making it ideal for a college-level project that demonstrates solid engineering fundamentals.
