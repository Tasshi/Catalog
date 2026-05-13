import { createContext, useContext, useState, useCallback } from 'react';
import { ToastData } from '../components/ui/cons';


interface AppContextType {
  toast: ToastData | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}
const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{ toast, showToast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
