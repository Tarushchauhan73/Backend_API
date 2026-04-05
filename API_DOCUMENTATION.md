# API Documentation

This document describes the implemented API for the `Finance Dashboard Backend` project.

## Base URL

```text
http://localhost:5000
```

API routes are mounted under:

```text
/api
```

## Authentication

Every `/api/*` route requires these request headers:

```http
x-user-id: <user-id>
x-role-id: <role-id>
```

This project uses header-based mock authentication. The server trusts the header values and then checks permissions from the database using `x-role-id`.

Public routes:

- `GET /health`
- `GET /api`

## Default Roles

The database is seeded with these role IDs:

- `role_viewer`
- `role_analyst`
- `role_admin`

## Permission Matrix

| Role | View Dashboard | Read Record | Create Record | Update Record | Delete Record | Manage Users |
| --- | --- | --- | --- | --- | --- | --- |
| Viewer (`role_viewer`) | Yes | Yes | No | No | No | No |
| Analyst (`role_analyst`) | Yes | Yes | No | No | No | No |
| Admin (`role_admin`) | Yes | Yes | Yes | Yes | Yes | Yes |

## Response Shape

Successful responses use this general pattern:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {}
}
```

Failed responses use this general pattern:

```json
{
  "success": false,
  "error": "Error label",
  "message": "Human-readable message"
}
```

Validation failures may also include:

```json
{
  "details": ["Validation error message"]
}
```

## Common Errors

| Status | When it happens |
| --- | --- |
| `400` | Invalid JSON, invalid input, or no valid update fields |
| `401` | Missing `x-user-id` or `x-role-id` |
| `403` | Role does not have the required permission |
| `404` | Resource not found |
| `409` | Duplicate username or email during user creation |
| `500` | Internal or database error |

## Public Endpoints

### `GET /health`

Returns server health status.

Response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-05T12:00:00.000Z"
}
```

### `GET /api`

Returns API metadata and top-level route groups.

Response:

```json
{
  "success": true,
  "message": "Finance Dashboard Backend API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "users": "/api/users",
    "records": "/api/records",
    "dashboard": "/api/dashboard"
  }
}
```

## User Endpoints

### `POST /api/users`

Create a user.

Permission required: `Manage Users`

Request body:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure123",
  "role_id": "role_viewer"
}
```

Validation rules:

- `username`: string, minimum 3 characters
- `email`: valid email
- `password`: minimum 6 characters
- `role_id`: required string

Success response: `201 Created`

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "generated-uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role_id": "role_viewer"
  }
}
```

### `GET /api/users`

List users with pagination.

Permission required: `Manage Users`

Query parameters:

- `limit`: optional, default `50`, maximum `100`
- `offset`: optional, default `0`

Success response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "user-1",
      "username": "john_doe",
      "email": "john@example.com",
      "role_id": "role_viewer",
      "status": "active",
      "created_at": "2026-04-05 10:00:00"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

### `GET /api/users/:userId`

Fetch one user by ID.

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "username": "john_doe",
    "email": "john@example.com",
    "role_id": "role_viewer",
    "status": "active",
    "created_at": "2026-04-05 10:00:00"
  }
}
```

### `GET /api/users/:userId/role-permissions`

Fetch the user role and resolved permissions.

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "user-1",
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

### `PUT /api/users/:userId`

Update a user.

Permission required: `Manage Users`

Request body:

```json
{
  "email": "new-email@example.com",
  "status": "inactive",
  "role_id": "role_analyst"
}
```

Notes:

- Allowed fields: `email`, `status`, `role_id`
- If `email` is provided, it must be valid
- The service rejects requests with no allowed fields

Success response: `200 OK`

```json
{
  "success": true,
  "message": "User updated successfully"
}
```

## Financial Record Endpoints

### `POST /api/records`

Create a financial record for the authenticated user.

Permission required: `Create Record`

Request body:

```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "description": "Monthly salary payment",
  "record_date": "2026-04-01"
}
```

Validation rules:

- `amount`: positive number
- `type`: `income` or `expense`
- `category`: non-empty string
- `record_date`: valid date
- `description`: optional string

Success response: `201 Created`

```json
{
  "success": true,
  "message": "Financial record created successfully",
  "data": {
    "id": "record-uuid",
    "user_id": "user-1",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary payment",
    "record_date": "2026-04-01",
    "created_at": "2026-04-05T12:00:00.000Z"
  }
}
```

### `GET /api/records`

List records owned by the authenticated user.

Permission required: `Read Record`

Query parameters:

- `type`: optional, `income` or `expense`
- `category`: optional exact category filter
- `startDate`: optional lower bound for `record_date`
- `endDate`: optional upper bound for `record_date`
- `limit`: optional, default `100`, maximum `500`
- `offset`: optional, default `0`

Success response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "record-uuid",
      "user_id": "user-1",
      "amount": 5000,
      "type": "income",
      "category": "Salary",
      "description": "Monthly salary payment",
      "record_date": "2026-04-01",
      "created_at": "2026-04-01 10:00:00",
      "updated_at": "2026-04-01 10:00:00",
      "is_deleted": 0
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1
  }
}
```

### `GET /api/records/:recordId`

Fetch one record owned by the authenticated user.

Permission required: `Read Record`

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "record-uuid",
    "user_id": "user-1",
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "description": "Monthly salary payment",
    "record_date": "2026-04-01",
    "created_at": "2026-04-01 10:00:00",
    "updated_at": "2026-04-01 10:00:00",
    "is_deleted": 0
  }
}
```

### `PUT /api/records/:recordId`

Update a record owned by the authenticated user.

Permission required: `Update Record`

Allowed request fields:

- `amount`
- `type`
- `category`
- `description`
- `record_date`

Example request body:

```json
{
  "amount": 5200,
  "description": "Adjusted salary entry"
}
```

Notes:

- At least one allowed field must be provided
- The controller validates updates using the same financial-record validator used for create
- Because of that implementation, sending partial updates for only `category`, `description`, or `record_date` may still fail unless `amount` and `type` are also present

Success response: `200 OK`

```json
{
  "success": true,
  "message": "Record updated successfully"
}
```

### `DELETE /api/records/:recordId`

Soft-delete a record owned by the authenticated user.

Permission required: `Delete Record`

Success response: `200 OK`

```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

### `GET /api/records/admin/all`

List all non-deleted records across all users.

Permission required: `Manage Users`

Query parameters:

- `limit`: optional, default `100`, maximum `500`
- `offset`: optional, default `0`

Success response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "record-uuid",
      "user_id": "user-1",
      "username": "john_doe",
      "amount": 5000,
      "type": "income",
      "category": "Salary",
      "description": "Monthly salary payment",
      "record_date": "2026-04-01",
      "created_at": "2026-04-01 10:00:00",
      "updated_at": "2026-04-01 10:00:00",
      "is_deleted": 0
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 1
  }
}
```

## Dashboard Endpoints

### `GET /api/dashboard/summary`

Return aggregate totals for the authenticated user.

Permission required: `View Dashboard`

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "total_income": 15000,
    "total_expenses": 7000,
    "net_balance": 8000,
    "total_records": 5
  }
}
```

### `GET /api/dashboard/categories`

Return totals grouped by category and type.

Permission required: `View Dashboard`

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "by_category": [
      {
        "category": "Salary",
        "type": "income",
        "count": 2,
        "total": 10000
      },
      {
        "category": "Food",
        "type": "expense",
        "count": 3,
        "total": 1200
      }
    ]
  }
}
```

### `GET /api/dashboard/recent`

Return recent transactions for the authenticated user.

Permission required: `View Dashboard`

Query parameters:

- `limit`: optional, default `10`, maximum `50`

Success response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "record-uuid",
      "user_id": "user-1",
      "amount": 1200,
      "type": "expense",
      "category": "Food",
      "description": "Groceries",
      "record_date": "2026-04-03",
      "created_at": "2026-04-03 09:00:00",
      "updated_at": "2026-04-03 09:00:00",
      "is_deleted": 0
    }
  ]
}
```

### `GET /api/dashboard/trends`

Return monthly income and expense totals for the authenticated user.

Permission required: `View Dashboard`

Query parameters:

- `months`: optional, default `6`, maximum `24`

Success response: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "month": "2026-02",
      "income": 8000,
      "expenses": 3200
    },
    {
      "month": "2026-03",
      "income": 7000,
      "expenses": 2800
    }
  ]
}
```

### `GET /api/dashboard/statistics`

Return system-wide statistics across all users and records.

Permission required: `Manage Users`

Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "active_users": 4,
    "total_users": 5,
    "total_records": 38,
    "total_income": 40000,
    "total_expenses": 15000
  }
}
```

## Example cURL Requests

Create a user as admin:

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-user-id" \
  -H "x-role-id: role_admin" \
  -d '{
    "username": "jane",
    "email": "jane@example.com",
    "password": "secure123",
    "role_id": "role_viewer"
  }'
```

Fetch dashboard summary:

```bash
curl -X GET http://localhost:5000/api/dashboard/summary \
  -H "x-user-id: some-user-id" \
  -H "x-role-id: role_viewer"
```

Create a record as admin:

```bash
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-user-id" \
  -H "x-role-id: role_admin" \
  -d '{
    "amount": 1200,
    "type": "expense",
    "category": "Food",
    "description": "Groceries",
    "record_date": "2026-04-05"
  }'
```

## Implementation Notes

- User and record IDs are UUIDs generated by the backend
- Passwords are hashed with `bcryptjs` before being stored
- Financial records are soft-deleted by setting `is_deleted = 1`
- `GET /api/users/:userId` and `GET /api/users/:userId/role-permissions` do not enforce a permission check in the current route configuration
- Authorization is role-based, not user-based; the server trusts `x-role-id` from the request header
