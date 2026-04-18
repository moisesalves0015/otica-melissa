import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface ClientData {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  role: "admin" | "client" | null;
  clientData: ClientData | null;
  loading: boolean;
  logout: () => Promise<void>;
  setClientData: (data: ClientData | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "client" | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.isAnonymous) {
          setRole("client");
          // Tenta recuperar os dados do cliente do localStorage caso recarregue a página
          const storedClient = localStorage.getItem("@otica:client");
          if (storedClient) {
            setClientData(JSON.parse(storedClient));
          }
        } else {
          setRole("admin");
        }
      } else {
        setRole(null);
        setClientData(null);
        localStorage.removeItem("@otica:client");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update localStorage when clientData changes
  useEffect(() => {
    if (clientData) {
      localStorage.setItem("@otica:client", JSON.stringify(clientData));
    } else {
      localStorage.removeItem("@otica:client");
    }
  }, [clientData]);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, clientData, loading, logout, setClientData }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
