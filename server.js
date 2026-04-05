/**
 * Server Entry Point
 * Initializes database and starts the Express server
 */

require('dotenv').config();
const app = require('./src/app');
const db = require('./src/config/database');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize database tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Roles table
      db.run(`
        CREATE TABLE IF NOT EXISTS roles (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Permissions table
      db.run(`
        CREATE TABLE IF NOT EXISTS permissions (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          resource TEXT NOT NULL,
          action TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Role-Permission junction table
      db.run(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id TEXT NOT NULL,
          permission_id TEXT NOT NULL,
          PRIMARY KEY (role_id, permission_id),
          FOREIGN KEY (role_id) REFERENCES roles(id),
          FOREIGN KEY (permission_id) REFERENCES permissions(id)
        )
      `);

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role_id TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles(id)
        )
      `);

      // Financial Records table
      db.run(`
        CREATE TABLE IF NOT EXISTS financial_records (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
          category TEXT NOT NULL,
          description TEXT,
          record_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_deleted BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, () => {
        // Seed default data after tables are created
        seedDefaultData();
        resolve();
      });
    });
  });
};

function seedDefaultData() {
  // Check if roles already exist
  db.get('SELECT COUNT(*) as count FROM roles', (err, row) => {
    if (row && row.count > 0) {
      console.log('Database already seeded with roles');
      return;
    }

    const roles = [
      { id: 'role_viewer', name: 'Viewer', description: 'Can only view dashboard data' },
      { id: 'role_analyst', name: 'Analyst', description: 'Can view records and access insights' },
      { id: 'role_admin', name: 'Admin', description: 'Full access to all features' }
    ];

    const permissions = [
      { id: 'perm_create_record', name: 'Create Record', resource: 'records', action: 'create' },
      { id: 'perm_read_record', name: 'Read Record', resource: 'records', action: 'read' },
      { id: 'perm_update_record', name: 'Update Record', resource: 'records', action: 'update' },
      { id: 'perm_delete_record', name: 'Delete Record', resource: 'records', action: 'delete' },
      { id: 'perm_view_dashboard', name: 'View Dashboard', resource: 'dashboard', action: 'view' },
      { id: 'perm_manage_users', name: 'Manage Users', resource: 'users', action: 'manage' },
      { id: 'perm_manage_roles', name: 'Manage Roles', resource: 'roles', action: 'manage' }
    ];

    // Insert roles
    roles.forEach(role => {
      db.run('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)',
        [role.id, role.name, role.description]);
    });

    // Insert permissions
    permissions.forEach(perm => {
      db.run('INSERT OR IGNORE INTO permissions (id, name, description, resource, action) VALUES (?, ?, ?, ?, ?)',
        [perm.id, perm.name, perm.description, perm.resource, perm.action]);
    });

    // Assign permissions to roles
    const rolePermissions = {
      'role_viewer': ['perm_read_record', 'perm_view_dashboard'],
      'role_analyst': ['perm_read_record', 'perm_view_dashboard'],
      'role_admin': ['perm_create_record', 'perm_read_record', 'perm_update_record', 'perm_delete_record', 'perm_view_dashboard', 'perm_manage_users', 'perm_manage_roles']
    };

    Object.entries(rolePermissions).forEach(([roleId, permIds]) => {
      permIds.forEach(permId => {
        db.run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permId]);
      });
    });

    console.log('✓ Database seeded with default roles and permissions');
  });
}

// Start server
createTables().then(() => {
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Finance Dashboard Backend Server`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Server running at: http://localhost:${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`API Documentation available at: http://localhost:${PORT}/api`);
    console.log(`${'='.repeat(60)}\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
