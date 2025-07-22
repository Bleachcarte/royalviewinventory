import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState } from '../types';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import Papa from 'papaparse';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  updateUserPermissions: (userId: string, permissions: string[]) => void;
  getAllUsers: () => User[];
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string }) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration - Core Admin and sample users
const mockUsers: User[] = [];

// User credentials for authentication
let userCredentials: { [email: string]: string } = {
  'due18112004@gmail.com': '12345',
  'manager@company.com': 'password',
  'user@company.com': 'password'
};

const rolePermissions = {
  core_admin: ['read', 'write', 'delete', 'manage_users', 'view_audit', 'export_data', 'manage_permissions', 'manage_categories', 'full_access'],
  admin: ['read', 'write', 'view_audit', 'export_data'],
  user: ['read']
};

const auth = getAuth();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });
  const [users, setUsers] = useState<User[]>([]);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAuthState({
            user: {
              id: firebaseUser.uid,
              name: userData.name || '',
              email: userData.email || '',
              role: userData.role || 'user',
              isActive: userData.isActive !== undefined ? userData.isActive : true,
              createdAt: userData.createdAt ? new Date(userData.createdAt.seconds ? userData.createdAt.seconds * 1000 : userData.createdAt) : null,
              permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
              department: userData.department || null,
              lastLogin: userData.lastLogin ? new Date(userData.lastLogin.seconds ? userData.lastLogin.seconds * 1000 : userData.lastLogin) : null
            },
            isAuthenticated: true,
            loading: false
          });
        } else {
          // If no profile, create one
          const newUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email || '',
            email: firebaseUser.email || '',
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            permissions: ['read']
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setAuthState({
            user: newUser,
            isAuthenticated: true,
            loading: false
          });
        }
      } else {
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch all users (for admin/user management)
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const querySnapshot = await getDocs(collection(db, 'users'));
    setUsers(querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'user',
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: data.createdAt ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt) : null,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        department: data.department || null,
        lastLogin: data.lastLogin ? new Date(data.lastLogin.seconds ? data.lastLogin.seconds * 1000 : data.lastLogin) : null
      };
    }));
  }

  // Login with Firebase Auth
  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting authState
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  // Register with Firebase Auth and create user profile in Firestore
  const register = async (name: string, email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        permissions: ['read']
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setAuthState({ user: newUser, isAuthenticated: true, loading: false });
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAuthState({ user: null, isAuthenticated: false, loading: false });
  };

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    const userPermissions = authState.user.permissions || ['read'];
    return userPermissions.includes(permission);
  };

  const updateUserPermissions = async (userId: string, permissions: string[]) => {
    await updateDoc(doc(db, 'users', userId), { permissions });
    fetchUsers();
  };

  const getAllUsers = () => users;

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string }) => {
    // For admin-created users, create in Auth and Firestore
    if (userData.email && userData.password) {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;
      const newUser: User = {
        ...userData,
        id: firebaseUser.uid,
        createdAt: new Date(),
        isActive: true,
        permissions: userData.permissions || ['read']
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      fetchUsers();
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    await updateDoc(doc(db, 'users', userId), updates);
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
    fetchUsers();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results: Papa.ParseResult<any>) => {
        if (Array.isArray(results.data)) {
          for (const row of results.data) {
            if (row.code) {
              await addItem({
                code: row.code || '',
                description: row.description || '',
                category: row.category || '',
                subcategory: row.subcategory || '',
                stock1: Number(row.stock1) || 0,
                stock2: Number(row.stock2) || 0,
                stockIn: Number(row.stockIn) || 0,
                stockOut: Number(row.stockOut) || 0,
                balance: Number(row.balance) || 0,
                stockInDate: new Date(),
                stockOutDate: row['Out Date'] ? new Date(row['Out Date']) : undefined,
                purpose: row.purpose || '',
                balanceAfterReconciliation: Number(row.balanceAfterReconciliation) || 0,
                createdBy: row.createdBy || '',
                lastModifiedBy: row.lastModifiedBy || ''
              });
            }
          }
        }
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      hasPermission,
      updateUserPermissions,
      getAllUsers,
      createUser,
      updateUser,
      deleteUser,
      register,
      handleImport
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};