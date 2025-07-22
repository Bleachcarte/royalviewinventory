import React, { createContext, useContext, useEffect, useState } from 'react';
import { InventoryItem, StockTransaction, Category, WeeklyStats } from '../types';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, QuerySnapshot, getDoc } from 'firebase/firestore';

interface GoogleSheetsInventoryState {
  items: InventoryItem[];
  transactions: StockTransaction[];
  categories: Category[];
  weeklyStats: WeeklyStats[];
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

interface GoogleSheetsInventoryContextType extends GoogleSheetsInventoryState {
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<StockTransaction, 'id'>) => Promise<void>;
  searchItems: (query: string) => InventoryItem[];
  getItemByCode: (code: string) => InventoryItem | null;
  getFormattedDescription: (item: InventoryItem) => string;
  calculateWeeklyStats: () => WeeklyStats[];
  setCategories: (categories: Category[]) => void;
  addCategory: (name: string) => Promise<void>;
  addSubcategory: (categoryId: string, subcategory: string) => Promise<void>;
}

const GoogleSheetsInventoryContext = createContext<GoogleSheetsInventoryContextType | undefined>(undefined);

export const GoogleSheetsInventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventoryState, setInventoryState] = useState<GoogleSheetsInventoryState>({
    items: [],
    transactions: [],
    categories: [],
    weeklyStats: [],
    loading: false,
    error: null,
    lastSync: new Date()
  });

  // Real-time listeners for inventory, transactions, and categories
  useEffect(() => {
    const unsubInventory = onSnapshot(collection(db, 'inventory'), (querySnapshot: QuerySnapshot) => {
      const items = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          code: data.code || '',
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          stock1: data.stock1 !== undefined ? data.stock1 : 0,
          stock2: data.stock2 !== undefined ? data.stock2 : 0,
          stockIn: data.stockIn !== undefined ? data.stockIn : 0,
          stockInDate: data.stockInDate ? new Date(data.stockInDate.seconds ? data.stockInDate.seconds * 1000 : data.stockInDate) : new Date(),
          stockOut: data.stockOut !== undefined ? data.stockOut : 0,
          stockOutDate: data.stockOutDate ? new Date(data.stockOutDate.seconds ? data.stockOutDate.seconds * 1000 : data.stockOutDate) : new Date(),
          purpose: data.purpose || '',
          balance: data.balance !== undefined ? data.balance : 0,
          balanceAfterReconciliation: data.balanceAfterReconciliation !== undefined ? data.balanceAfterReconciliation : 0,
          createdBy: data.createdBy || '',
          lastModifiedBy: data.lastModifiedBy || '',
          createdAt: data.createdAt ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds ? data.updatedAt.seconds * 1000 : data.updatedAt) : new Date()
        };
      });
      setInventoryState(prev => ({ ...prev, items, loading: false }));
    });
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (querySnapshot: QuerySnapshot) => {
      const transactions = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          itemId: data.itemId || '',
          type: data.type || '',
          quantity: data.quantity !== undefined ? data.quantity : 0,
          date: data.date ? new Date(data.date.seconds ? data.date.seconds * 1000 : data.date) : new Date(),
          purpose: data.purpose || '',
          performedBy: data.performedBy || '',
          notes: data.notes || ''
        };
      });
      setInventoryState(prev => ({ ...prev, transactions }));
    });
    const unsubCategories = onSnapshot(collection(db, 'categories'), (querySnapshot: QuerySnapshot) => {
      const categories = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          subcategories: Array.isArray(data.subcategories) ? data.subcategories.map((sub: any, idx: number) =>
            typeof sub === 'string'
              ? { id: `${docSnap.id}-sub-${idx}`, name: sub, categoryId: docSnap.id }
              : sub
          ) : []
        };
      });
      setInventoryState(prev => ({ ...prev, categories }));
    });
    return () => {
      unsubInventory();
      unsubTransactions();
      unsubCategories();
    };
  }, []);

  const addTransaction = async (transaction: Omit<StockTransaction, 'id'>) => {
    await addDoc(collection(db, 'transactions'), { ...transaction, date: transaction.date || new Date() });
  };

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const docRef = await addDoc(collection(db, 'inventory'), item);
    await addTransaction({
      itemId: docRef.id,
      type: 'in',
      quantity: item.stockIn || 0,
      date: new Date(),
      purpose: item.purpose || '',
      performedBy: item.createdBy || '',
      notes: 'Item added'
    });
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    // Fetch current item
    const itemDoc = await getDoc(doc(db, 'inventory', id));
    const current = itemDoc.exists() ? itemDoc.data() : {};
    let newBalance = current.balance || 0;
    // If stockOut is being increased, subtract from balance
    if (updates.stockOut && updates.stockOut > (current.stockOut || 0)) {
      const diff = updates.stockOut - (current.stockOut || 0);
      newBalance -= diff;
    }
    // If stockIn is being increased, add to balance
    if (updates.stockIn && updates.stockIn > (current.stockIn || 0)) {
      const diff = updates.stockIn - (current.stockIn || 0);
      newBalance += diff;
    }
    await updateDoc(doc(db, 'inventory', id), {
      ...updates,
      balance: newBalance,
      // balanceAfterReconciliation is only updated if explicitly set in updates
      updatedAt: new Date()
    });
    let type: 'in' | 'out' = 'in';
    if (updates.stockOut && updates.stockOut > 0) type = 'out';
    await addTransaction({
      itemId: id,
      type,
      quantity: updates.stockIn || updates.stockOut || 0,
      date: new Date(),
      purpose: updates.purpose || '',
      performedBy: updates.lastModifiedBy || '',
      notes: 'Item updated'
    });
  };

  const deleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'inventory', id));
    await addTransaction({
      itemId: id,
      type: 'out',
      quantity: 0,
      date: new Date(),
      purpose: '',
      performedBy: '',
      notes: 'Item deleted'
    });
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

  // Add a new category to Firestore
  const addCategory = async (name: string) => {
    await addDoc(collection(db, 'categories'), { name, subcategories: [] });
  };

  // Add a new subcategory to Firestore
  const addSubcategory = async (categoryId: string, subcategory: string) => {
    const categoryRef = doc(db, 'categories', categoryId);
    const categoryDoc = await getDoc(categoryRef);
    if (categoryDoc.exists()) {
      const data = categoryDoc.data();
      const updatedSubcategories = Array.isArray(data.subcategories)
        ? [...data.subcategories, subcategory]
        : [subcategory];
      await updateDoc(categoryRef, { subcategories: updatedSubcategories });
    }
  };

  // Update setCategories to write to Firestore (for bulk updates, if needed)
  const setCategories = async (categories: Category[]) => {
    // This is a bulk update; for each category, update or add in Firestore
    for (const cat of categories) {
      if (cat.id && cat.id !== 'custom') {
        await updateDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          subcategories: cat.subcategories.map(sub => sub.name)
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          name: cat.name,
          subcategories: cat.subcategories.map(sub => sub.name)
        });
      }
    }
  };

  return (
    <GoogleSheetsInventoryContext.Provider value={{
      ...inventoryState,
      addItem,
      updateItem,
      deleteItem,
      addTransaction,
      searchItems,
      getItemByCode,
      getFormattedDescription,
      calculateWeeklyStats,
      setCategories,
      addCategory,
      addSubcategory
    }}>
      {children}
    </GoogleSheetsInventoryContext.Provider>
  );
};

export const useGoogleSheetsInventory = () => {
  const context = useContext(GoogleSheetsInventoryContext);
  if (context === undefined) {
    throw new Error('useGoogleSheetsInventory must be used within a GoogleSheetsInventoryProvider');
  }
  return context;
};