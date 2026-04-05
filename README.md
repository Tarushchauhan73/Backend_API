# Finance Dashboard Backend

A well-structured backend API for managing financial records with role-based access control, designed as a practical demonstration of backend development principles.

Full endpoint documentation is available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## 📋 Project Overview

This backend serves a finance dashboard system where users with different roles can manage financial records and view analytics. The system demonstrates:

- **Clean Architecture**: Separation of concerns with controllers, services, models, and middleware
- **Role-Based Access Control (RBAC)**: Fine-grained permission management
- **Data Validation**: Comprehensive input validation and error handling
- **RESTful API Design**: Clear and consistent endpoint structure
- **Database Modeling**: Normalized schema with proper relationships

## 🎯 Core Features

### 1. User & Role Management
- Create, read, update users
- Three predefined roles: **Viewer**, **Analyst**, **Admin**
- Role-based permission system
- User status management (active/inactive)

### 2. Financial Records Management
- Create, read, update, delete financial records
- Support for income and expense transactions
- Categorization and date-based filtering
- Soft delete functionality
- User-scoped data access

### 3. Dashboard Analytics
- Summary statistics (income, expenses, net balance)
- Category-wise breakdown
- Recent transactions
- Monthly trends
- System-wide statistics (admin only)

### 4. Access Control
- Middleware-based permission checking
- Fine-grained resource and action-based permissions
- Clear separation between user roles

## 🏗️ Architecture Overview

```
Backend_API/
├── src/
│   ├── controllers/          # HTTP request handlers
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── services/            # Business logic layer
│   │   ├── userService.js
│   │   ├── recordService.js
│   │   └── dashboardService.js
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # Authentication
│   │   ├── authorization.js # Permission checks
│   │   └── validation.js    # Input validation
│   ├── routes/              # API endpoint definitions
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── config/
│   │   └── database.js      # SQLite connection
│   └── app.js               # Express app setup
├── server.js                # Entry point
├── package.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ and npm

### Installation

1. **Clone and setup:**
   ```bash
   cd /workspaces/Backend_API
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Initialize database:**
   ```bash
   npm run db:init
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   The server will start at `http://localhost:5000`

### Development Mode
```bash
npm run dev
```
Uses nodemon for automatic restart on file changes.

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All API endpoints (except `/health` and `/api`) require authentication headers:
```
x-user-id: <user-id>
x-role-id: <role-id>
```

These headers simulate authenticated user context. In a production system, these would be replaced with JWT tokens or session-based authentication.

### Response Format
All responses follow a consistent JSON format:
```json
{
  "success": true/false,
  "message": "Operation result message",
  "data": { /* response data */ },
  "error": "Error type if failed"
}
```

---

## 👥 User Management APIs

### Create User (Admin Only)
Create a new user with assigned role.

```
POST /api/users
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role_id": "role_viewer"
}
```

**Required Permission:** `Manage Users`

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "user-uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role_id": "role_viewer"
  }
}
```

**Status Codes:**
- `201`: User created successfully
- `400`: Validation failed
- `409`: Username or email already exists
- `403`: Insufficient permissions

---

### Get User Details
Retrieve information about a specific user.

```
GET /api/users/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role_id": "role_viewer",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### List All Users (Admin Only)
Get paginated list of all users.

```
GET /api/users?limit=50&offset=0
```

**Query Parameters:**
- `limit` (optional): Max 100, default 50
- `offset` (optional): Default 0

**Required Permission:** `Manage Users`

**Response:**
```json
{
  "success": true,
  "data": [ /* array of users */ ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 25
  }
}
```

---

### Update User (Admin Only)
Update user information or role.

```
PUT /api/users/:userId
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "status": "inactive",
  "role_id": "role_analyst"
}
```

**Allowed Fields:**
- `email`: Valid email format
- `status`: `active` or `inactive`
- `role_id`: Valid role ID

**Required Permission:** `Manage Users`

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### Get User Role & Permissions
Retrieve user's role and associated permissions.

```
GET /api/users/:userId/role-permissions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "john_doe",
    "role_id": "role_viewer",
    "role_name": "Viewer",
    "permissions": [
      {
        "id": "perm_read_record",
        "name": "Read Record",
        "resource": "records",
        "action": "read"
      },
      {
        "id": "perm_view_dashboard",
        "name": "View Dashboard",
        "resource": "dashboard",
        "action": "view"
      }
    ]
  }
}
```

---

## 💰 Financial Records APIs

### Create Financial Record
Add a new income or expense record.

```
POST /api/records
```

**Request Body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "description": "Monthly salary",
  "record_date": "2024-01-20"
}
```

**Field Validation:**
- `amount`: Positive number
- `type`: `income` or `expense`
- `category`: Non-empty string
- `record_date`: Valid date (YYYY-MM-DD)
- `description`: Optional

**Required Permission:** `Create Record`

**Response:**
```json
{
  "success": true,
  "message": "Financial record created successfully",
  "data": {
    "id": "record-uuid",
    "user_id": "user-uuid",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary",
    "record_date": "2024-01-20",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```

**Status Codes:**
- `201`: Record created
- `400`: Validation failed
- `403`: Insufficient permissions

---

### Get Financial Record
Retrieve a specific record (user can only access their own records).

```
GET /api/records/:recordId
```

**Required Permission:** `Read Record`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "record-uuid",
    "user_id": "user-uuid",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary",
    "record_date": "2024-01-20",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z",
    "is_deleted": false
  }
}
```

---

### List Financial Records
Get paginated list of user's records with optional filtering.

```
GET /api/records?type=income&category=Salary&startDate=2024-01-01&endDate=2024-01-31&limit=100&offset=0
```

**Query Parameters:**
- `type` (optional): `income` or `expense`
- `category` (optional): Filter by category
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)
- `limit` (optional): Max 500, default 100
- `offset` (optional): Default 0

**Required Permission:** `Read Record`

**Response:**
```json
{
  "success": true,
  "data": [ /* array of records */ ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 15
  }
}
```

---

### Update Financial Record
Update a specific record.

```
PUT /api/records/:recordId
```

**Request Body:**
```json
{
  "amount": 5500,
  "category": "Bonus",
  "description": "Updated description"
}
```

**Allowed Fields:**
- `amount`: Positive number
- `type`: `income` or `expense`
- `category`: Non-empty string
- `description`: Optional
- `record_date`: Valid date

**Required Permission:** `Update Record`

---

### Delete Financial Record
Soft delete a record (marked as deleted, not physically removed).

```
DELETE /api/records/:recordId
```

**Required Permission:** `Delete Record`

**Response:**
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

---

### Get All Records (Admin)
Retrieve all financial records across all users.

```
GET /api/records/admin/all?limit=100&offset=0
```

**Required Permission:** `Manage Users` (Admin)

---

## 📊 Dashboard APIs

### Get Dashboard Summary
Get overview statistics for a user's finances.

```
GET /api/dashboard/summary
```

**Required Permission:** `View Dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_income": 50000,
    "total_expenses": 15000,
    "net_balance": 35000,
    "total_records": 45
  }
}
```

---

### Get Category Breakdown
Get income/expense breakdown by category.

```
GET /api/dashboard/categories
```

**Required Permission:** `View Dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "by_category": [
      {
        "category": "Salary",
        "type": "income",
        "count": 12,
        "total": 60000
      },
      {
        "category": "Food",
        "type": "expense",
        "count": 42,
        "total": 8000
      }
    ]
  }
}
```

---

### Get Recent Transactions
Get user's most recent transactions.

```
GET /api/dashboard/recent?limit=10
```

**Query Parameters:**
- `limit` (optional): Max 50, default 10

**Required Permission:** `View Dashboard`

**Response:**
```json
{
  "success": true,
  "data": [ /* array of recent records */ ]
}
```

---

### Get Monthly Trends
Get income and expense trends for the last N months.

```
GET /api/dashboard/trends?months=6
```

**Query Parameters:**
- `months` (optional): Max 24, default 6

**Required Permission:** `View Dashboard`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01",
      "income": 15000,
      "expenses": 5000
    },
    {
      "month": "2023-12",
      "income": 14500,
      "expenses": 4800
    }
  ]
}
```

---

### Get System Statistics (Admin)
Get system-wide statistics for all users.

```
GET /api/dashboard/statistics
```

**Required Permission:** `Manage Users` (Admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "active_users": 25,
    "total_users": 30,
    "total_records": 1250,
    "total_income": 500000,
    "total_expenses": 150000
  }
}
```

---

## 🔐 Role-Based Access Control

### Roles & Permissions

#### Viewer Role
- **Permissions**: `Read Record`, `View Dashboard`
- **Capabilities**: View their own records and dashboard analytics
- **Restrictions**: Cannot create, update, or delete records

#### Analyst Role
- **Permissions**: `Read Record`, `View Dashboard`
- **Capabilities**: Same as Viewer
- **Purpose**: For future expansion with advanced analytics

#### Admin Role
- **Permissions**: All permissions
  - `Create Record`, `Read Record`, `Update Record`, `Delete Record`
  - `View Dashboard`
  - `Manage Users`, `Manage Roles`
- **Capabilities**: Full system access, user management, role assignment

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### Financial Records Table
```sql
CREATE TABLE financial_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  record_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Roles Table
```sql
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Permissions Table
```sql
CREATE TABLE permissions (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Role-Permissions Junction Table
```sql
CREATE TABLE role_permissions (
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);
```

---

## 🧪 Example Usage

### Creating and Testing Data

#### 1. Create an Admin User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-uuid" \
  -H "x-role-id: role_admin" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin@123",
    "role_id": "role_admin"
  }'
```

#### 2. Create a Viewer User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-uuid" \
  -H "x-role-id: role_admin" \
  -d '{
    "username": "viewer_user",
    "email": "viewer@example.com",
    "password": "Viewer@123",
    "role_id": "role_viewer"
  }'
```

#### 3. Create a Financial Record (as viewer)
```bash
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: viewer-user-uuid" \
  -H "x-role-id: role_viewer" \
  -d '{
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary",
    "record_date": "2024-01-20"
  }'
```
**Note:** This will fail because Viewer role doesn't have `Create Record` permission.

#### 4. Get Dashboard Summary
```bash
curl -X GET http://localhost:5000/api/dashboard/summary \
  -H "x-user-id: viewer-user-uuid" \
  -H "x-role-id: role_viewer"
```

---

## ✔️ Input Validation

The backend implements comprehensive validation:

### User Creation
- Username: minimum 3 characters
- Email: valid email format
- Password: minimum 6 characters
- Role ID: required, valid UUID format

### Financial Records
- Amount: positive number (decimal allowed)
- Type: must be `income` or `expense`
- Category: non-empty string
- Record Date: valid date format (YYYY-MM-DD)
- Description: optional text field

### Error Responses
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Amount must be a positive number",
    "Type must be either 'income' or 'expense'"
  ]
}
```

---

## 🔒 Security Considerations

### Implemented Features
- ✅ **Password Hashing**: bcryptjs for secure password storage
- ✅ **Foreign Keys**: Enforced referential integrity
- ✅ **SQL Injection Prevention**: Parameterized queries throughout
- ✅ **Soft Deletes**: Records marked deleted, not permanently removed
- ✅ **User Scoping**: Users can only access their own records
- ✅ **Permission-Based Access**: Middleware checks before execution

### Production Recommendations
1. Replace header-based auth with JWT tokens
2. Add HTTPS/SSL enforcement
3. Implement rate limiting
4. Add request/response logging
5. Use environment-specific configurations
6. Add database backup and recovery procedures
7. Implement audit logging for sensitive operations

---

## 📋 Assumptions & Design Decisions

### 1. Authentication Model
- **Assumption**: Uses header-based auth for simplicity
- **Rationale**: Perfect for college project; easily replaceable with JWT
- **Production**: Use JWT tokens with expiration, refresh tokens, and secure httpOnly cookies

### 2. Soft Deletes
- **Assumption**: Records are marked deleted but not physically removed
- **Rationale**: Maintains data integrity and enables recovery
- **Benefit**: Historical tracking without complex archiving

### 3. Database Choice (SQLite)
- **Assumption**: No external database server needed
- **Rationale**: Perfect for development, testing, and small deployments
- **Scalability**: Can be migrated to PostgreSQL/MySQL for production

### 4. UUID for IDs
- **Assumption**: Using UUID v4 for all primary keys
- **Rationale**: Globally unique, collision-free, distributable
- **Alternative**: Could use sequential IDs for simplicity

### 5. Permission Granularity
- **Assumption**: Fine-grained permissions (Create, Read, Update, Delete)
- **Rationale**: Shows proper RBAC implementation
- **Flexibility**: Easy to add new permissions without schema changes

---

## 🚧 Future Enhancements

1. **Authentication**
   - JWT token-based authentication
   - Refresh token mechanism
   - Password reset flow

2. **Advanced Features**
   - Budget management and alerts
   - Recurring transactions
   - Multi-currency support
   - Receipt upload and OCR

3. **Performance**
   - Database indexing optimization
   - Caching layer (Redis)
   - API response compression

4. **Testing**
   - Unit tests for services
   - Integration tests for APIs
   - E2E tests for complete flows

5. **Monitoring**
   - Request logging and analytics
   - Error tracking (Sentry)
   - Performance monitoring

---

## 📁 Project Files Summary

| File | Purpose |
|------|---------|
| `server.js` | Application entry point, database initialization |
| `src/app.js` | Express app configuration, middleware setup |
| `src/config/database.js` | SQLite connection and configuration |
| `src/services/` | Business logic for users, records, and dashboard |
| `src/controllers/` | HTTP request handlers |
| `src/routes/` | API endpoint definitions |
| `src/middleware/` | Authentication, authorization, validation |
| `package.json` | Project dependencies and scripts |

---

## 📝 License

This project is open source and available for educational purposes.

---

## 👤 Author

Tarush Chauhan 
tarushchauhan19@gmail.com

---

## ❓ Support

For questions or issues:
1. Check the API documentation above
2. Review the code comments for specific implementations
3. Check database schema for data structure
4. Ensure authentication headers are included in requests

---

**Last Updated**: January 2024
