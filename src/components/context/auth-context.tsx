"use client";

import { getUserProfile } from "@/app/api/user/action";
import { UserProfile } from "@/features/user/models/response";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type AuthContextType = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  logout: () => void;
  setAuthenticated: (value: boolean) => void;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
  setAuthenticated: () => {},
  refetch: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = async () => {
    try {
      const response = await fetch("/api/auth", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);

        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const checkAuth = useCallback(async () => {
    const response = await getUserProfile();

    console.log("fetching user profile:", response);

    if (response.isSuccess && response.value) {
      setUser(response.value);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const setAuthenticated = (value: boolean) => {
    setIsAuthenticated(value);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        logout,
        setAuthenticated,
        refetch: checkAuth,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
