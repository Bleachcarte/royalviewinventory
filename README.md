# Google Sheets Inventory Management System

A beautiful, Apple-inspired inventory management system that uses Google Sheets as the backend database with Google authentication for access control.

## Features

- **Google Sheets Integration**: Real-time synchronization with your Google Sheets
- **Google Authentication**: Secure login using Google accounts
- **Role-Based Access Control**: Core Admin, Admin, and User roles managed through Google Sheets
- **Real-time Dashboard**: Weekly analytics and stock movement tracking
- **Interactive Inventory Table**: Full CRUD operations synchronized with Google Sheets
- **Search & Filter**: Advanced search by item code with invoice-ready descriptions
- **Print Support**: Print-friendly views for reports and inventory listings
- **Responsive Design**: Apple-inspired UI that works on all devices

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API and Google Drive API
4. Create credentials (OAuth 2.0 Client ID) for a web application
5. Add your domain to authorized origins (e.g., `http://localhost:5173` for development)

### 2. Google Sheets Setup

Create a Google Sheet with the following tabs:

#### Inventory Sheet
Columns (A-R):
- A: ID
- B: Code
- C: Description  
- D: Category
- E: Subcategory
- F: Stock1
- G: Stock2
- H: StockIn
- I: StockInDate
- J: StockOut
- K: StockOutDate
- L: Purpose
- M: Balance
- N: BalanceAfterReconciliation
- O: CreatedAt
- P: UpdatedAt
- Q: CreatedBy
- R: LastModifiedBy

#### Users Sheet
Columns (A-D):
- A: Email
- B: Role (core_admin, admin, user)
- C: Department
- D: Active (TRUE/FALSE)

#### Categories Sheet
Columns (A-C):
- A: ID
- B: Name
- C: Subcategories (comma-separated)

#### Transactions Sheet
Columns (A-H):
- A: ID
- B: ItemCode
- C: Type (in/out)
- D: Quantity
- E: Date
- F: Purpose
- G: PerformedBy
- H: Notes

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Google configuration:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_SHEET_ID=your_google_sheet_id_here

VITE_INVENTORY_SHEET_NAME=Inventory
VITE_USERS_SHEET_NAME=Users
VITE_CATEGORIES_SHEET_NAME=Categories
VITE_TRANSACTIONS_SHEET_NAME=Transactions
```

### 4. Installation & Running

```bash
npm install
npm run dev
```

## User Roles & Permissions

### Core Admin
- Full access to all features
- Can manage users and permissions
- Can add, edit, and delete inventory items
- Can view all analytics and reports
- Can export data and manage categories

### Admin
- Can add and edit inventory items
- Can view analytics and reports
- Can export data
- Cannot manage users or permissions

### User
- Read-only access to inventory
- Can view basic inventory information
- Cannot modify data or access admin features

## Google Sheets as Database

The system treats your Google Sheet as the primary database:

- **Real-time Sync**: All changes are immediately reflected in Google Sheets
- **Collaborative**: Multiple users can work simultaneously
- **Backup**: Google Sheets provides automatic backup and version history
- **Accessible**: Data can be accessed directly in Google Sheets when needed
- **Familiar**: Uses the familiar Google Sheets interface for data management

## Security

- Google OAuth 2.0 authentication
- Role-based access control through Google Sheets
- API key protection
- Secure token handling
- Permission validation on all operations

## Development

The application is built with:
- React 18 with TypeScript
- Tailwind CSS for styling
- Google Sheets API v4
- Google Auth Library
- Vite for development and building

## Deployment

For production deployment:
1. Update OAuth redirect URIs in Google Cloud Console
2. Set production environment variables
3. Build the application: `npm run build`
4. Deploy to your preferred hosting platform

## Support

For issues or questions:
1. Check Google Sheets API documentation
2. Verify OAuth configuration
3. Ensure proper sheet structure and permissions
4. Check browser console for detailed error messages# royalviewinventory
