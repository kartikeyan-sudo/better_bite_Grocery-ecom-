# Admin CMS Portal - Feature Guide

## Admin Access

To access the admin CMS portal, navigate to the dedicated admin login page:
```
http://localhost:5174/admin/login
```

Or click the "🛡️ Admin Access" link in the footer of the home page.

## Setting Up an Admin User

You'll need to manually set `isAdmin: true` for a user in MongoDB. You can do this via MongoDB Compass or the mongo shell:

```javascript
// In MongoDB shell or Compass (choose your database, then run)
db.users.updateOne(
  { email: "youradmin@example.com" },
  { $set: { isAdmin: true } }
)
```

Or register a new user via `/register` and then update their `isAdmin` field in the database.

## Admin Features

### 1. Dashboard (`/admin`)
- **Stats Overview**: View total customers, products, orders, and pending orders
- **Quick Actions**: Fast links to add products, manage orders, and view customers

### 2. Customer Management (`/admin/customers`)
- View all registered customers
- See customer details: name, email, phone, registration date
- Total customer count
- Block/Unblock customers (prevents login and API access)

### 3. Product Management (`/admin/products`)
- **Add New Products**: 
  - Product name *
  - Category (Food, Cook, Wash, Care, Drinks, Snacks, Dairy) *
  - Price (₹) *
  - Weight (e.g., "1 kg")
  - Quantity/Pack (e.g., "Pack of 1")
  - Image (emoji or URL)
  - Description
  - Stock status (In Stock / Out of Stock)
  - Stock status (In Stock / Out of Stock) — controllable via checkbox in the add/edit modal or the inline toggle button in the products table
  
- **Edit Products**: Update any product details
- **Delete Products**: Remove products from the catalog
- **View Stock Status**: See which products are in stock or out of stock
 - **Quick Toggle**: Use the inline "Mark Out of Stock" / "Mark In Stock" button to flip availability instantly without opening the modal

### 4. Order Management (`/admin/orders`)
- View all customer orders
- See customer details for each order
- **Update Order Status** with dropdown:
  - Pending
  - Processing
  - Shipped
  - Delivered
  - Cancelled
- View order items and totals
- Order date and customer email displayed

## How It Works

### Backend (Admin Routes)
- **Admin Middleware** (`backend/middleware/adminAuth.js`): Validates JWT and checks `isAdmin` flag
- **Admin Routes** (`backend/routes/admin.js`):
  - `GET /api/admin/stats` - Dashboard statistics
  - `GET /api/admin/customers` - All customers
  - `PUT /api/admin/customers/:id/block` - Block/Unblock a customer (`{ blocked: true|false }`)
  - `GET /api/admin/products` - All products
  - `POST /api/admin/products` - Create product
  - `PUT /api/admin/products/:id` - Update product
  - `DELETE /api/admin/products/:id` - Delete product
  - `GET /api/admin/orders` - All orders
  - `PUT /api/admin/orders/:id/status` - Update order status

### Frontend (Admin Pages)
- `AdminDashboard.jsx` - Main dashboard with stats
- `AdminCustomers.jsx` - Customer list table
- `AdminProducts.jsx` - Product CRUD with modal form
- `AdminOrders.jsx` - Order list with status update dropdowns
- `AdminDashboard.css` - Responsive admin styling

## Customer-Facing Changes

### Updated Checkout Flow
- Cart checkout now posts to `POST /api/orders`
- Orders are saved to MongoDB
- Cart is cleared after successful order

### Updated Orders Page
- Orders are fetched from `GET /api/orders/user/:userId`
- Real-time status updates from admin reflected immediately
- Status badges with color coding:
  - 🟠 Pending (Orange)
  - 🔵 Processing (Blue)
  - 🟣 Shipped (Purple)
  - 🟢 Delivered (Green)
  - 🔴 Cancelled (Red)

### Stock-Aware Shopping Experience
- Out-of-stock items are visibly labeled and the "Add to Cart" button is disabled on the customer dashboard.
- In-stock items behave as usual; toggling stock in the admin portal reflects immediately on the customer UI.

## Product Model Update
Added `inStock` field (boolean, default: `true`) to track availability.

## Security Notes
- All admin routes are protected with `adminAuth` middleware
- Requires valid JWT with `isAdmin: true`
- Non-admin users will receive `403 Forbidden` error
- Blocked users cannot log in and receive `403` for protected endpoints

### Session Separation (Important)
- Admin and customer sessions are stored separately to avoid cross-login conflicts.
- Customer keys: `isAuthenticated`, `user`, `authToken`.
- Admin keys: `adminIsAuthenticated`, `adminUser`, `adminAuthToken`.
- Admin pages use a dedicated context and API client, so logging into the admin portal no longer affects the customer session (and vice versa).

## Access Flow
1. Login as admin user (with `isAdmin: true`)
2. Navigate to `/admin`
3. Use the navigation bar to access:
   - Dashboard
   - Customers
   - Products
   - Orders

## Testing the CMS
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `http://localhost:5174/admin/login`
4. Login with default admin credentials (see below)
5. You'll be redirected to the admin dashboard at `http://localhost:5174/admin`

### Default Admin (Dev only)

For development convenience a default admin user is created automatically when the backend first connects to the database (only if no admin exists). Use the following credentials to sign in to the admin CMS:

- **username:** `admin`
- **email:** `admin@admin.com`
- **password:** `admin@123`

Note: This is intended for local development only. Remove or change these credentials before deploying to production.

Enjoy your new admin CMS portal! 🛡️
