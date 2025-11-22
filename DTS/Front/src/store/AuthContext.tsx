import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserProps { email: string; password: string; }
interface AuthContextProps {
  user: UserProps | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

function getUsersFromStorage(): UserProps[] {
  const itm = localStorage.getItem('nova_users');
  return itm ? JSON.parse(itm) : [];
}
function saveUsersToStorage(users: UserProps[]) {
  localStorage.setItem('nova_users', JSON.stringify(users));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProps | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('nova_user');
    if (data) setUser(JSON.parse(data));
  }, []);

  function signup(email: string, password: string): boolean {
    const users = getUsersFromStorage();
    if (users.some(u => u.email === email)) return false;
    const newUsers = [...users, { email, password }];
    saveUsersToStorage(newUsers);
    localStorage.setItem('nova_user', JSON.stringify({ email }));
    setUser({ email, password });
    return true;
  }
  function login(email: string, password: string): boolean {
    const users = getUsersFromStorage();
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return false;
    localStorage.setItem('nova_user', JSON.stringify({ email }));
    setUser({ email, password });
    return true;
  }
  function logout() {
    setUser(null);
    localStorage.removeItem('nova_user');
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used in AuthProvider');
  return ctx;
}
