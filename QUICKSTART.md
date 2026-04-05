# Quick Start Guide

## Setup Your Development Environment

### 1. Prerequisites
Ensure you have the following installed:
- Node.js 14 or higher
- npm (comes with Node.js)
- A text editor or IDE (VS Code recommended)

### 2. Installation Steps

```bash
# Navigate to project directory
cd /workspaces/Backend_API

# Install dependencies (already done if node_modules exists)
npm install

# The .env file is already set up for local development
```

### 3. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

Server will start at: **http://localhost:5000**

### 4. Verify Installation

Open your browser or use curl:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## Testing the API

### Using curl

**1. Create an Admin User:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-role-id: role_admin" \
  -d '{
    "username": "admin_user",
    "email": "admin@example.com",
    "password": "AdminPass123",
    "role_id": "role_admin"
  }'
```

**2. Create a Regular User (Viewer):**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-role-id: role_admin" \
  -d '{
    "username": "john_viewer",
    "email": "john@example.com",
    "password": "ViewerPass123",
    "role_id": "role_viewer"
  }'
```
Copy the returned `id` for the next step.

**3. Create a Financial Record (as Admin):**
```bash
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-role-id: role_admin" \
  -d '{
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary payment",
    "record_date": "2024-01-20"
  }'
```

**4. Get Dashboard Summary:**
```bash
curl -X GET http://localhost:5000/api/dashboard/summary \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "x-role-id: role_admin"
```

### Using Postman

1. Import the API by setting:
   - Base URL: `http://localhost:5000/api`
   - Add headers: `x-user-id` and `x-role-id`
   - Create collections for each resource (users, records, dashboard)

2. Use the request examples from the [README.md](README.md) documentation

---

## Project Structure Explained

```
src/
├── controllers/        # Handle HTTP requests and send responses
│                      # ↓ calls ↓
├── services/          # Execute business logic
│                      # ↓ uses ↓
├── models/            # SQLite database through services
│
├── middleware/        # Pre-request processing
│   ├── auth.js        # Parse user from headers
│   ├── authorization.js # Check permissions
│   └── validation.js  # Validate input data
│
├── routes/            # Map endpoints to controllers
│   └── Protected by middleware
│
└── config/
    └── database.js    # SQLite connection
```

### Data Flow
```
Request
  ↓
[Middleware: auth] → Extract user info
  ↓
[Middleware: validate] → Check input
  ↓
[Middleware: authorize] → Check permissions
  ↓
[Controller] → Format request
  ↓
[Service] → Execute business logic
  ↓
[Database] → CRUD operations
  ↓
Response
```

---

## Understanding the Access Control

### Three Roles

| Role | Permissions | Use Case |
|------|------------|----------|
| **Viewer** | View records & dashboard only | End users, clients |
| **Analyst** | Same as Viewer + future analytics | Data analysts, accountants |
| **Admin** | Everything | System administrators |

### Permission System

Each API endpoint requires specific permissions. For example:
- `POST /api/records` requires `Create Record`
- `GET /api/records` requires `Read Record`
- `PUT /api/records/:id` requires `Update Record`
- `DELETE /api/records/:id` requires `Delete Record`

The system automatically checks these before executing the request.

---

## Common Issues & Solutions

### Issue: "Missing authentication headers"
**Solution**: Include the required headers in every API request:
```bash
-H "x-user-id: your-user-id" 
-H "x-role-id: your-role-id"
```

### Issue: "You do not have permission to Create Record"
**Solution**: Create records with an Admin user, or assign the `Create Record` permission to the user's role

### Issue: "Cannot access another user's record"
**Solution**: Users can only see their own records. Get the user ID from user creation response and use that

### Issue: Database locked
**Solution**: Close the running server and restart it
```bash
pkill -f "node server.js"
npm start
```

---

## Database & File Structure

The SQLite database (`finance.db`) is created automatically and contains:
- **users**: User accounts with roles
- **roles**: Viewer, Analyst, Admin
- **permissions**: Create, Read, Update, Delete, View Dashboard, etc.
- **role_permissions**: Maps roles to permissions
- **financial_records**: Income and expense transactions

To reset the database:
```bash
rm finance.db
npm start  # Will recreate with fresh data
```

---

## Development Best Practices Used

1. **Separation of Concerns**: Controllers, Services, Routes kept separate
2. **Middleware Pattern**: Auth, validation, authorization as middleware
3. **Error Handling**: Consistent error responses with proper status codes
4. **Input Validation**: All user inputs validated before processing
5. **SQL Injection Prevention**: Parameterized queries throughout
6. **Permission-Based Access**: Fine-grained role-based access control
7. **Soft Deletes**: Records marked deleted, not physically removed
8. **API Consistency**: All responses follow uniform JSON structure

---

## Next Steps

### To Learn More:
1. Read the full [README.md](README.md) for detailed API documentation
2. Explore the source code in `src/` directory
3. Check the database schema section for understanding data relationships
4. Review middleware files for authentication/authorization implementation

### To Extend:
1. Add JWT tokens for production authentication
2. Implement request logging and monitoring
3. Add database indexing for performance
4. Create unit tests for services
5. Add API documentation with Swagger

---

## Support

For detailed API documentation, refer to the main [README.md](README.md) file which includes:
- Complete endpoint documentation
- Request/response examples
- Database schema
- Design decisions and assumptions
- Security considerations
