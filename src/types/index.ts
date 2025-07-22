export interface User {
  id: string;
  name: string;
  email: string;
  role: 'core_admin' | 'admin' | 'user';
  department?: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  permissions?: string[];
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  description: string;
  category: string;
  subcategory: string;
  stock1: number;
  stock2: number;
  stockIn: number;
  stockInDate?: Date;
  stockOut: number;
  stockOutDate?: Date;
  purpose: string;
  balance: number;
  balanceAfterReconciliation: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  date: Date;
  purpose: string;
  performedBy: string;
  notes?: string;
}

export interface WeeklyStats {
  week: string;
  stockIn: number;
  stockOut: number;
  netChange: number;
  transactions: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface InventoryState {
  items: InventoryItem[];
  transactions: StockTransaction[];
  categories: Category[];
  weeklyStats: WeeklyStats[];
  loading: boolean;
  error: string | null;
}