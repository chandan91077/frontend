# Anvik Biotecch - Medical E-commerce Platform

## Overview
Anvik Biotecch is a healthcare e-commerce platform that provides customers with online medicine ordering and delivery services. The platform features separate portals for customers and administrators.

**Project Type**: Static Frontend Web Application  
**Tech Stack**: HTML, CSS, JavaScript  
**Backend API**: External (https://bakend-88v1.onrender.com)  
**Last Updated**: November 11, 2025

## Current State
- ✅ Project fully configured and running in Replit
- ✅ Web server running on port 5000
- ✅ Deployment configuration set up for autoscale
- ✅ All pages loading correctly

## Project Structure

```
/
├── admin/                  # Admin portal pages
│   ├── dashboard.html     # Dashboard with statistics
│   ├── login.html         # Admin authentication
│   ├── reports.html       # Sales and analytics reports
│   └── sales.html         # Sales management
├── customer/              # Customer portal pages
│   ├── index.html         # Customer homepage
│   ├── products.html      # Medicine catalog
│   ├── product-detail.html # Individual product view
│   ├── cart.html          # Shopping cart
│   ├── checkout.html      # Order checkout
│   ├── orders.html        # Order history
│   ├── order-tracking.html # Track order status
│   └── login.html         # Customer authentication
├── scripts/               # JavaScript files
│   ├── utils.js           # Utility functions (image resolution helper)
│   ├── api-service.js     # API communication layer
│   ├── auth.js            # Authentication logic
│   ├── cart.js            # Shopping cart functionality
│   ├── customer.js        # Customer portal logic
│   ├── customer-api.js    # Customer API functions
│   ├── admin.js           # Admin portal logic
│   ├── admin-api.js       # Admin API functions
│   └── [other scripts]
├── styles/                # CSS stylesheets
│   ├── main.css           # Global styles
│   ├── customer.css       # Customer portal styles
│   └── admin.css          # Admin portal styles
├── env.js                 # Environment configuration
└── index.html             # Landing page
```

## Features

### Customer Portal
- Browse medicines catalog
- Search and filter products
- Shopping cart management
- Secure checkout process
- Order tracking
- User authentication and registration

### Admin Portal
- Inventory management
- Order processing and status updates
- Sales reports and analytics
- Dashboard with key metrics
- Medicine stock management

## Backend Integration
The application connects to an external backend API hosted at:
- **API URL**: https://bakend-88v1.onrender.com
- **Configuration**: See `env.js` and `scripts/api-service.js`

### API Endpoints
- `/api/auth/login` - User authentication
- `/api/medicines` - Medicine CRUD operations
- `/api/orders` - Order management
- `/api/dashboard/stats` - Dashboard statistics

## Development

### Running Locally
The project runs a Python HTTP server on port 5000:
```bash
python -m http.server 5000 --bind 0.0.0.0
```

### Deployment
- **Type**: Autoscale (stateless web application)
- **Port**: 5000
- **Command**: `python -m http.server 5000 --bind 0.0.0.0`

## Recent Changes
- **2025-11-11 (Latest Update)**: Fixed profile dropdown and image loading issues
  - Updated `scripts/auth.js` to implement click-based dropdown with "My Orders" and "Logout" options
  - Added dropdown toggle functionality that works on both desktop and mobile
  - Prevented duplicate event listeners with flag check
  - Enhanced `scripts/utils.js` with robust image fallback system using SVG data URIs
  - Fixed image encoding to use `encodeURIComponent` instead of `btoa` to support all characters
  - Added automatic fallback for broken/missing images across customer, cart, and admin pages
  - Updated `styles/customer.css` to make dropdowns scrollable on mobile (max-height: 200px)
  - All image display now gracefully degrades to geometric placeholder when backend images fail to load

- **2025-11-11**: Added hamburger mobile menu navigation
  - Created `scripts/mobile-menu.js` with toggle functionality for mobile navigation
  - Added hamburger menu button (three-line icon) to all HTML pages
  - Implemented collapsible mobile navigation that hides menu items by default on mobile
  - Menu items now hidden behind hamburger icon on screens < 768px
  - Added smooth transitions and auto-close on outside click
  - Updated all 13 customer pages + main index.html with mobile menu functionality

- **2025-11-11**: Fixed image display and mobile responsiveness
  - Created `scripts/utils.js` with centralized `resolveMedicineImage()` helper function
  - Fixed image resolution across all customer and admin portals to handle multiple backend field formats
  - Added comprehensive mobile responsive CSS with breakpoints at 1024px, 768px, and 480px
  - Updated all HTML pages to include utils.js script before dependent scripts
  - Improved navigation menu, product grids, cart layouts, and admin tables for mobile devices
  
- **2025-11-11**: Initial project setup in Replit
  - Installed Python 3.11 for HTTP server
  - Configured frontend workflow on port 5000
  - Created .gitignore for Python
  - Set up deployment configuration
  - Verified all pages load correctly

## Technical Fixes

### Image Resolution System
The application uses a centralized image resolution helper (`resolveMedicineImage()` in `scripts/utils.js`) that handles multiple backend image field variations:
- Direct string: `medicine.image`
- Nested URL: `medicine.image.url` or `medicine.imageUrl`
- Array format: `medicine.images[0]`
- Firebase storage links
- SVG-based fallback placeholder when no image is available

**Fallback Image System:**
- `createFallbackImage()` - Generates a clean geometric SVG placeholder (circle and rectangles)
- `handleImageError()` - Automatically replaces broken images with fallback SVG
- Uses `encodeURIComponent` for safe data URI encoding (supports all Unicode characters)
- Applied across all views: customer.js, cart.js, admin.js, and customer-api.js
- Images gracefully degrade with `onerror` handlers on all `<img>` tags

### Mobile Responsiveness
Comprehensive responsive design implemented with three breakpoints:
- **1024px**: Tablet layout adjustments
- **768px**: Mobile layout transitions (navigation menu stacking, grid adjustments)
- **480px**: Small mobile optimizations (single column layouts, reduced padding)

Key responsive features:
- **Hamburger Menu**: Three-line icon button appears on mobile (< 768px)
  - Menu items hidden by default on mobile screens
  - Smooth slide-down animation when toggled
  - Auto-closes when clicking outside navigation
  - Implemented via `scripts/mobile-menu.js`
- Flexible product grids (4 columns → 3 → 2 → 1)
- Horizontal scrolling tables on small screens
- Optimized form layouts and spacing
- Fixed navbar height (60px) on mobile for better screen space

## Notes
- This is a frontend-only application; backend is hosted externally
- No build process required (static HTML/CSS/JS)
- Uses Python's built-in HTTP server for simplicity
- Backend API may need to be running for full functionality
- All HTML pages include utils.js before other scripts to ensure helper functions are available
