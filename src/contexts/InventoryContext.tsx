import React, { createContext, useContext, useEffect, useState } from 'react';
import { InventoryItem, StockTransaction, InventoryState, Category, WeeklyStats } from '../types';

interface InventoryContextType extends InventoryState {
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  addTransaction: (transaction: Omit<StockTransaction, 'id'>) => void;
  getTransactions: (itemId: string) => StockTransaction[];
  searchItems: (query: string) => InventoryItem[];
  getItemByCode: (code: string) => InventoryItem | null;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getFormattedDescription: (item: InventoryItem) => string;
  calculateWeeklyStats: () => WeeklyStats[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Mock categories
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    subcategories: [
      { id: '1', name: 'Laptops', categoryId: '1' },
      { id: '2', name: 'Monitors', categoryId: '1' },
      { id: '3', name: 'Accessories', categoryId: '1' }
    ]
  },
  {
    id: '2',
    name: 'Furniture',
    subcategories: [
      { id: '4', name: 'Desks', categoryId: '2' },
      { id: '5', name: 'Chairs', categoryId: '2' },
      { id: '6', name: 'Storage', categoryId: '2' }
    ]
  },
  {
    id: '3',
    name: 'Office Supplies',
    subcategories: [
      { id: '7', name: 'Stationery', categoryId: '3' },
      { id: '8', name: 'Paper', categoryId: '3' },
      { id: '9', name: 'Writing Tools', categoryId: '3' }
    ]
  }
];

// Mock items with all required fields
const mockItems: InventoryItem[] = [
  {
    id: '1',
    code: 'LAPTOP001',
    description: 'MacBook Pro 16" M3 Pro',
    category: 'Electronics',
    subcategory: 'Laptops',
    stock1: 15,
    stock2: 12,
    stockIn: 5,
    stockInDate: new Date('2024-01-20'),
    stockOut: 3,
    stockOutDate: new Date('2024-01-22'),
    purpose: 'Employee Assignment',
    balance: 27,
    balanceAfterReconciliation: 29,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin@company.com',
    lastModifiedBy: 'manager@company.com'
  },
  {
    id: '2',
    code: 'DESK001',
    description: 'Standing Desk Electric',
    category: 'Furniture',
    subcategory: 'Desks',
    stock1: 8,
    stock2: 5,
    stockIn: 3,
    stockInDate: new Date('2024-01-18'),
    stockOut: 1,
    stockOutDate: new Date('2024-01-19'),
    purpose: 'Office Setup',
    balance: 13,
    balanceAfterReconciliation: 15,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'admin@company.com',
    lastModifiedBy: 'user@company.com'
  },
  {
    id: '3',
    code: 'CHAIR001',
    description: 'Ergonomic Office Chair',
    category: 'Furniture',
    subcategory: 'Chairs',
    stock1: 25,
    stock2: 20,
    stockIn: 8,
    stockInDate: new Date('2024-01-16'),
    stockOut: 9,
    stockOutDate: new Date('2024-01-21'),
    purpose: 'Department Expansion',
    balance: 45,
    balanceAfterReconciliation: 44,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22'),
    createdBy: 'manager@company.com',
    lastModifiedBy: 'admin@company.com'
  },
  {
    id: '4',
    code: 'MON001',
    description: 'Dell 27" 4K Monitor',
    category: 'Electronics',
    subcategory: 'Monitors',
    stock1: 18,
    stock2: 15,
    stockIn: 6,
    stockInDate: new Date('2024-01-17'),
    stockOut: 4,
    stockOutDate: new Date('2024-01-23'),
    purpose: 'Workstation Upgrade',
    balance: 33,
    balanceAfterReconciliation: 35,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-23'),
    createdBy: 'admin@company.com',
    lastModifiedBy: 'admin@company.com'
  }
];

const mockTransactions: StockTransaction[] = [
  {
    id: '1',
    itemId: '1',
    type: 'in',
    quantity: 5,
    date: new Date('2024-01-20'),
    purpose: 'New stock arrival',
    performedBy: 'manager@company.com',
    notes: 'Quarterly refresh'
  },
  {
    id: '2',
    itemId: '1',
    type: 'out',
    quantity: 3,
    date: new Date('2024-01-22'),
    purpose: 'Employee assignment',
    performedBy: 'user@company.com',
    notes: 'New hires in marketing'
  },
  {
    id: '3',
    itemId: '2',
    type: 'in',
    quantity: 3,
    date: new Date('2024-01-18'),
    purpose: 'Supplier delivery',
    performedBy: 'admin@company.com'
  },
  {
    id: '4',
    itemId: '3',
    type: 'out',
    quantity: 9,
    date: new Date('2024-01-21'),
    purpose: 'Department expansion',
    performedBy: 'manager@company.com',
    notes: 'HR department growth'
  }
];

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventoryState, setInventoryState] = useState<InventoryState>({
    items: mockItems,
    transactions: mockTransactions,
    categories: mockCategories,
    weeklyStats: [],
    loading: false,
    error: null
  });

  useEffect(() => {
    // Calculate weekly stats on component mount
    const stats = calculateWeeklyStats();
    setInventoryState(prev => ({ ...prev, weeklyStats: stats }));
  }, [inventoryState.transactions]);

  const addItem = (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setInventoryState(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventoryState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      )
    }));
  };

  const deleteItem = (id: string) => {
    setInventoryState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const addTransaction = (transaction: Omit<StockTransaction, 'id'>) => {
    const newTransaction: StockTransaction = {
      ...transaction,
      id: Date.now().toString()
    };
    
    setInventoryState(prev => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction]
    }));

    // Update item balance
    const item = inventoryState.items.find(i => i.id === transaction.itemId);
    if (item) {
      const balanceChange = transaction.type === 'in' ? transaction.quantity : -transaction.quantity;
      updateItem(transaction.itemId, {
        balance: item.balance + balanceChange,
        balanceAfterReconciliation: item.balanceAfterReconciliation + balanceChange,
        [transaction.type === 'in' ? 'stockIn' : 'stockOut']: transaction.quantity,
        [transaction.type === 'in' ? 'stockInDate' : 'stockOutDate']: transaction.date,
        purpose: transaction.purpose
      });
    }
  };

  const getTransactions = (itemId: string): StockTransaction[] => {
    return inventoryState.transactions.filter(t => t.itemId === itemId);
  };

  const searchItems = (query: string): InventoryItem[] => {
    if (!query.trim()) return inventoryState.items;
    
    const lowercaseQuery = query.toLowerCase();
    return inventoryState.items.filter(item =>
      item.code.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery) ||
      item.subcategory.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getItemByCode = (code: string): InventoryItem | null => {
    return inventoryState.items.find(item => item.code === code) || null;
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString()
    };
    
    setInventoryState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setInventoryState(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      )
    }));
  };

  const deleteCategory = (id: string) => {
    setInventoryState(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id)
    }));
  };

  const getFormattedDescription = (item: InventoryItem): string => {
    return `${item.category}: ${item.subcategory} - ${item.description}`;
  };

  const calculateWeeklyStats = (): WeeklyStats[] => {
    const stats: { [key: string]: WeeklyStats } = {};
    
    inventoryState.transactions.forEach(transaction => {
      const weekKey = getWeekKey(transaction.date);
      
      if (!stats[weekKey]) {
        stats[weekKey] = {
          week: weekKey,
          stockIn: 0,
          stockOut: 0,
          netChange: 0,
          transactions: 0
        };
      }
      
      stats[weekKey].transactions++;
      
      if (transaction.type === 'in') {
        stats[weekKey].stockIn += transaction.quantity;
        stats[weekKey].netChange += transaction.quantity;
      } else {
        stats[weekKey].stockOut += transaction.quantity;
        stats[weekKey].netChange -= transaction.quantity;
      }
    });
    
    return Object.values(stats).sort((a, b) => b.week.localeCompare(a.week));
  };

  const getWeekKey = (date: Date): string => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  };

  return (
    <InventoryContext.Provider value={{
      ...inventoryState,
      addItem,
      updateItem,
      deleteItem,
      addTransaction,
      getTransactions,
      searchItems,
      getItemByCode,
      addCategory,
      updateCategory,
      deleteCategory,
      getFormattedDescription,
      calculateWeeklyStats
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};