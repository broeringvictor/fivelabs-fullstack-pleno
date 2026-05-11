import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  signed: boolean;
  signIn(token: string, user: User): void;
  signOut(): void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storageUser = localStorage.getItem("@express:user");
      const storageToken = localStorage.getItem("@express:token");

      if (storageUser && storageToken) {
        setUser(JSON.parse(storageUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  function signIn(token: string, user: User) {
    setUser(user);
    localStorage.setItem("@express:token", token);
    localStorage.setItem("@express:user", JSON.stringify(user));
  }

  function signOut() {
    localStorage.removeItem("@express:token");
    localStorage.removeItem("@express:user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
