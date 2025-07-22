# Royal View Inventory Management System

A robust, secure, and user-friendly inventory management platform for **Royal View Services Ltd.**  
Built with React, TypeScript, Tailwind CSS, and Firebase (Firestore & Authentication).

---

## 🚀 Overview

This system is designed to streamline inventory and user management for Royal View Services Ltd., providing real-time data, granular permissions, and a modern, responsive interface.  
It replaces legacy spreadsheet-based workflows with a scalable, persistent, and auditable solution.

---

## ✨ Features

### Inventory Management
- **Add, Edit, and Delete Items:** Full CRUD for inventory items.
- **Category & Subcategory Management:** Core admins can add new categories and subcategories directly from the inventory page.
- **Stock In/Out Tracking:** Users can update stock in/out as deltas; only core admins can edit other fields.
- **Defensive Data Mapping:** Prevents blank pages or crashes when data is missing or malformed.
- **Export/Import:** Export inventory as CSV; robust CSV import with validation and user feedback.
- **Out Date Logic:** “Out Date” only displays if `stockOut` is greater than 0 or has been modified.

### User Management
- **Add/Edit Users:** Core admins can add new users (with password setup) and edit user details.
- **Role-Based Access:** Core Admin, Admin, and User roles, with permissions enforced via Firestore.
- **User Info Popup:** Click the vertical dots on the Users page to view user details in a popup.

### Authentication & Security
- **Firebase Authentication:** Secure login and registration; passwords stored securely.
- **Permission Enforcement:** All sensitive actions are protected by role checks.

### Dashboard & Analytics
- **Weekly Activity Panel:** Dashboard displays this week’s ins, outs, and total balances, refreshing weekly.
- **Accurate Stock Calculations:** “Stock Out” is a summation, not a multiplication.

### Notifications
- **In-App Notifications:** All inventory and user management actions generate notifications for all users.
- **Persistent Notifications:** Notifications are stored in local storage and can be dismissed individually.
- **Notification UI:** Accessible via the bell icon; search icon removed for clarity.

### UI/UX
- **Apple-Inspired Design:** Clean, modern, and responsive interface.
- **Persistent Footer:** “2025 Royal View Services Ltd.” displayed on every page.
- **Custom Favicon:** Branded icon for browser tabs.

---

## 🏗️ Project Structure

```
src/
  components/
    Auth/           # Login form
    Dashboard/      # Dashboard panels
    Inventory/      # Inventory table, add/edit modals
    Layout/         # App layout and footer
    Users/          # User management
  contexts/         # React contexts for Auth, Inventory, Notifications, etc.
  types/            # TypeScript types
  firebase.ts       # Firebase initialization
  index.css         # Tailwind CSS
  main.tsx          # App entry point
  App.tsx           # Main app component
src/favicon.png     # Custom favicon
public/             # (optional) for static assets
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```sh
git clone https://github.com/Bleachcarte/royalviewinventory.git
cd royalviewinventory
```

### 2. Install Dependencies

```sh
npm install
```

### 3. Firebase Setup

- Go to [Firebase Console](https://console.firebase.google.com/).
- Create a project, enable **Firestore Database** and **Authentication** (Email/Password).
- Add a web app and copy your Firebase config.

### 4. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Run the App

```sh
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👤 User Roles & Permissions

- **Core Admin:** Full access, can manage users, categories, and all inventory data.
- **Admin:** Can manage inventory, but not users or permissions.
- **User:** Can view inventory and update stock in/out, but cannot edit other fields.

---

## 🛠️ Development Notes

- **Contexts:** All data (inventory, users, notifications) is managed via React Contexts and persisted in Firestore.
- **Defensive Coding:** All data mapping is defensive to prevent blank pages or crashes.
- **Notifications:** All actions are logged as notifications for transparency and auditability.

---

## 🚚 Deployment

1. Build the app:
   ```sh
   npm run build
   ```
2. Deploy the `dist/` folder to your preferred static hosting (Vercel, Netlify, Firebase Hosting, etc.).

---

## 🆘 Support

For issues or questions, please open an issue on the [GitHub repository](https://github.com/Bleachcarte/royalviewinventory).

---

© 2025 Royal View Services Ltd.
