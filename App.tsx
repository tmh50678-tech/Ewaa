
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import type { PurchaseRequest, User, RoleDefinition, Branch, CatalogItem, Supplier, SalesRepresentative } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { INITIAL_USERS, MOCK_REQUESTS, MOCK_BRANCHES, INITIAL_SUPPLIERS } from './services/mockDataService';
import { INITIAL_ITEM_CATALOG } from './services/catalog';
import { INITIAL_ROLE_DEFINITIONS, ROLES } from './constants';
import { useTranslation } from './i18n';
import Toast from './components/Toast';

// 1. DEFINE CONTEXT SHAPE AND CREATE CONTEXT
interface AppContextType {
  currentUser: User | null;
  originalUser: User | null;
  purchaseRequests: PurchaseRequest[];
  users: User[];
  roles: RoleDefinition[];
  branches: Branch[];
  itemCatalog: CatalogItem[];
  suppliers: Supplier[];
  toast: string | null;
  language: string;
  t: (key: string, options?: Record<string, string | number>) => string;
  handleLogin: (email: string, password: string) => boolean;
  handleLogout: () => void;
  updateRequest: (updatedRequest: PurchaseRequest) => void;
  addRequest: (newRequest: PurchaseRequest) => void;
  showToast: (message: string) => void;
  handleUpdateCatalog: (invoiceItems: { itemName: string; price: number; unit: string; category: string }[]) => void;
  handleUpsertSupplier: (vendorName: string, salesRep?: SalesRepresentative, branchId?: string) => void;
  handleLoginAs: (targetUser: User) => void;
  handleRevertLogin: () => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setRoles: React.Dispatch<React.SetStateAction<RoleDefinition[]>>;
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  setToast: React.Dispatch<React.SetStateAction<string | null>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// 2. CREATE A CUSTOM HOOK FOR EASY ACCESS
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// 3. MAIN APP CONTENT COMPONENT
const AppContent: React.FC = () => {
  const { currentUser, toast, setToast, language } = useAppContext();

  return (
    <div className="min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Routes>
            <Route path="/login" element={
                !currentUser ? <Login /> : <Navigate to="/dashboard" replace />
            }/>
            <Route path="/dashboard" element={
                currentUser ? <Dashboard /> : <Navigate to="/login" replace />
            }/>
            <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
        </Routes>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// --- START: ENHANCED FOR STATE PERSISTENCE ---
const PURCHASE_REQUESTS_STORAGE_KEY = 'ewaa-purchase-requests';
const USERS_STORAGE_KEY = 'ewaa-users';
const ROLES_STORAGE_KEY = 'ewaa-roles';
const BRANCHES_STORAGE_KEY = 'ewaa-branches';
const SUPPLIERS_STORAGE_KEY = 'ewaa-suppliers';
const ITEM_CATALOG_STORAGE_KEY = 'ewaa-item-catalog';

// Helper to save state to localStorage with error handling
function saveState<T>(key: string, value: T) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save state for key "${key}":`, error);
    }
}

// Helper to get initial state from localStorage or use a default value
function getInitialState<T>(key: string, defaultValue: T): T {
    try {
        const savedItem = localStorage.getItem(key);
        if (savedItem) {
            return JSON.parse(savedItem);
        }
        // If no saved item, save the default value for next time
        saveState(key, defaultValue);
        return defaultValue;
    } catch (error) {
        console.error(`Failed to load state for key "${key}":`, error);
        // Don't try to save if loading fails, just return default
        return defaultValue;
    }
}
// --- END: ENHANCED FOR STATE PERSISTENCE ---


// 4. THE APP COMPONENT BECOMES THE PROVIDER
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  
  // --- START: MODIFIED FOR STATE PERSISTENCE ---
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => getInitialState(PURCHASE_REQUESTS_STORAGE_KEY, MOCK_REQUESTS));
  const [users, setUsers] = useState<User[]>(() => getInitialState(USERS_STORAGE_KEY, INITIAL_USERS));
  const [roles, setRoles] = useState<RoleDefinition[]>(() => getInitialState(ROLES_STORAGE_KEY, INITIAL_ROLE_DEFINITIONS));
  const [branches, setBranches] = useState<Branch[]>(() => getInitialState(BRANCHES_STORAGE_KEY, MOCK_BRANCHES));
  const [itemCatalog, setItemCatalog] = useState<CatalogItem[]>(() => getInitialState(ITEM_CATALOG_STORAGE_KEY, INITIAL_ITEM_CATALOG));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getInitialState(SUPPLIERS_STORAGE_KEY, INITIAL_SUPPLIERS));
  // --- END: MODIFIED FOR STATE PERSISTENCE ---

  const [toast, setToast] = useState<string | null>(null);
  
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  // --- START: ADDED FOR STATE PERSISTENCE ---
  useEffect(() => {
    saveState(PURCHASE_REQUESTS_STORAGE_KEY, purchaseRequests);
  }, [purchaseRequests]);

  useEffect(() => {
    saveState(USERS_STORAGE_KEY, users);
  }, [users]);

  useEffect(() => {
    saveState(ROLES_STORAGE_KEY, roles);
  }, [roles]);

  useEffect(() => {
    saveState(BRANCHES_STORAGE_KEY, branches);
  }, [branches]);
  
  useEffect(() => {
    saveState(ITEM_CATALOG_STORAGE_KEY, itemCatalog);
  }, [itemCatalog]);

  useEffect(() => {
    saveState(SUPPLIERS_STORAGE_KEY, suppliers);
  }, [suppliers]);
  // --- END: ADDED FOR STATE PERSISTENCE ---

  const showToast = (message: string) => {
    setToast(message);
  };

  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUser(user);
      navigate('/dashboard', { replace: true });
      showToast(t('toast.loginSuccess'));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOriginalUser(null);
    navigate('/login', { replace: true });
  };

  const updateRequest = (updatedRequest: PurchaseRequest) => {
    setPurchaseRequests(prevRequests => 
      prevRequests.map(pr => pr.id === updatedRequest.id ? updatedRequest : pr)
    );
  };

  const addRequest = (newRequest: PurchaseRequest) => {
    setPurchaseRequests(prevRequests => [newRequest, ...prevRequests]);
  };
  
  const handleUpdateCatalog = (invoiceItems: { itemName: string; price: number; unit: string; category: string }[]) => {
      setItemCatalog(prevCatalog => {
          const newCatalog = [...prevCatalog];
          let isUpdated = false;

          invoiceItems.forEach(invoiceItem => {
              const catalogIndex = newCatalog.findIndex(
                  ci => ci.name.toLowerCase() === invoiceItem.itemName.toLowerCase()
              );
              
              if (catalogIndex > -1) {
                  if (invoiceItem.price < newCatalog[catalogIndex].estimatedCost) {
                      newCatalog[catalogIndex] = { ...newCatalog[catalogIndex], estimatedCost: invoiceItem.price };
                      isUpdated = true;
                  }
              } else {
                  newCatalog.push({ 
                      name: invoiceItem.itemName, 
                      estimatedCost: invoiceItem.price, 
                      unit: invoiceItem.unit, 
                      category: invoiceItem.category || 'Uncategorized' 
                  });
                  isUpdated = true;
              }
          });
          
          if(isUpdated) {
            showToast(t('toast.catalogUpdated'));
          }
          return isUpdated ? newCatalog : prevCatalog;
      });
  };

  const handleUpsertSupplier = (vendorName: string, salesRep?: SalesRepresentative, branchId?: string) => {
      setSuppliers(prevSuppliers => {
          const newSuppliers = [...prevSuppliers];
          const supplierIndex = newSuppliers.findIndex(s => s.name.toLowerCase() === vendorName.toLowerCase());

          let supplier: Supplier;
          if (supplierIndex > -1) {
              supplier = { ...newSuppliers[supplierIndex], representatives: [...newSuppliers[supplierIndex].representatives] };
              if (branchId && !supplier.branches.includes(branchId)) {
                  supplier.branches = [...supplier.branches, branchId];
              }
              newSuppliers[supplierIndex] = supplier;
          } else {
              supplier = { 
                  name: vendorName, 
                  contact: '', 
                  category: 'General', 
                  representatives: [],
                  branches: branchId ? [branchId] : []
              };
              newSuppliers.push(supplier);
          }

          if (salesRep && salesRep.name && salesRep.contact) {
              const repExists = supplier.representatives.some(
                  r => r.name.toLowerCase() === salesRep.name.toLowerCase() || r.contact === salesRep.contact
              );
              if (!repExists) {
                  supplier.representatives.push(salesRep);
                  showToast(t('toast.supplierRepAdded', { repName: salesRep.name, vendorName: vendorName }));
              }
          }
          return newSuppliers;
      });
  };

  const handleLoginAs = (targetUser: User) => {
      if (currentUser && currentUser.role === ROLES.ADMIN) {
          setOriginalUser(currentUser);
          setCurrentUser(targetUser);
          navigate('/dashboard', { replace: true });
          showToast(t('toast.loginAsSuccess', { userName: targetUser.name }));
      }
  };

  const handleRevertLogin = () => {
      if (originalUser) {
          setCurrentUser(originalUser);
          setOriginalUser(null);
          navigate('/dashboard', { replace: true });
          showToast(t('toast.revertedToAdmin'));
      }
  };

  const contextValue: AppContextType = {
    currentUser,
    originalUser,
    purchaseRequests,
    users,
    roles,
    branches,
    itemCatalog,
    suppliers,
    toast,
    language,
    t,
    handleLogin,
    handleLogout,
    updateRequest,
    addRequest,
    showToast,
    handleUpdateCatalog,
    handleUpsertSupplier,
    handleLoginAs,
    handleRevertLogin,
    setUsers,
    setRoles,
    setBranches,
    setSuppliers,
    setToast,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <AppContent />
    </AppContext.Provider>
  );
};

export default App;
