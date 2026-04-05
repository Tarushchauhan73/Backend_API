#!/bin/bash

# Finance Dashboard Backend - Setup Verification Script
# Run this script to verify everything is properly set up

echo "=================================================="
echo "Finance Dashboard Backend - Setup Verification"
echo "=================================================="
echo ""

# Check Node.js
echo "1. Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo "   ✓ Node.js: $NODE_VERSION"
    echo "   ✓ npm: $NPM_VERSION"
else
    echo "   ✗ Node.js not found. Please install Node.js 14+"
    exit 1
fi
echo ""

# Check project files
echo "2. Checking project structure..."
FILES=(
    "server.js"
    "package.json"
    ".env"
    "src/app.js"
    "src/config/database.js"
    "src/controllers/userController.js"
    "src/controllers/recordController.js"
    "src/controllers/dashboardController.js"
    "src/services/userService.js"
    "src/services/recordService.js"
    "src/services/dashboardService.js"
    "src/middleware/auth.js"
    "src/middleware/authorization.js"
    "src/middleware/validation.js"
    "src/routes/userRoutes.js"
    "src/routes/recordRoutes.js"
    "src/routes/dashboardRoutes.js"
    "README.md"
    "QUICKSTART.md"
    "DESIGN.md"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ✗ $file (MISSING)"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "   → All files present!"
else
    echo "   → $MISSING file(s) missing"
    exit 1
fi
echo ""

# Check dependencies
echo "3. Checking npm dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✓ node_modules directory exists"
    
    # Check key packages
    for pkg in express sqlite3 uuid bcryptjs dotenv; do
        if [ -d "node_modules/$pkg" ]; then
            echo "   ✓ $pkg"
        else
            echo "   ✗ $pkg (MISSING)"
        fi
    done
else
    echo "   ✗ node_modules not found"
    echo "   → Run: npm install"
    exit 1
fi
echo ""

# Check .env file
echo "4. Checking configuration..."
if [ -f ".env" ]; then
    echo "   ✓ .env file exists"
    if grep -q "NODE_ENV" .env; then
        echo "   ✓ NODE_ENV configured"
    fi
    if grep -q "PORT" .env; then
        echo "   ✓ PORT configured"
    fi
    if grep -q "DATABASE_PATH" .env; then
        echo "   ✓ DATABASE_PATH configured"
    fi
else
    echo "   ✗ .env file not found"
    echo "   → Run: cp .env.example .env"
    exit 1
fi
echo ""

# Check package.json scripts
echo "5. Checking package.json scripts..."
if grep -q '"start"' package.json; then
    echo "   ✓ start script defined"
fi
if grep -q '"dev"' package.json; then
    echo "   ✓ dev script defined"
fi
if grep -q '"db:init"' package.json; then
    echo "   ✓ db:init script defined"
fi
echo ""

# Verification complete
echo "=================================================="
echo "✓ Setup Verification Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. In another terminal, test the API:"
echo "   curl http://localhost:5000/health"
echo ""
echo "3. Read the quick start guide:"
echo "   cat QUICKSTART.md"
echo ""
echo "4. For full documentation:"
echo "   cat README.md"
echo "   cat DESIGN.md"
echo ""
echo "=================================================="
