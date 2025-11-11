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
│   ├── api-service.js     # API communication layer
│   ├── auth.js            # Authentication logic
│   ├── cart.js            # Shopping cart functionality
│   ├── customer.js        # Customer portal logic
│   ├── admin.js           # Admin portal logic
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
- **2025-11-11**: Initial project setup in Replit
  - Installed Python 3.11 for HTTP server
  - Configured frontend workflow on port 5000
  - Created .gitignore for Python
  - Set up deployment configuration
  - Verified all pages load correctly

## Notes
- This is a frontend-only application; backend is hosted externally
- No build process required (static HTML/CSS/JS)
- Uses Python's built-in HTTP server for simplicity
- Backend API may need to be running for full functionality
