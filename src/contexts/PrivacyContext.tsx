import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [isPrivate, setIsPrivate] = useState(true);

  // Reset privacy to true (hidden) on every new session/login
  useEffect(() => {
    setIsPrivate(true);
  }, [session?.user.id]);

  const togglePrivacy = () => {
    setIsPrivate((prev) => !prev);
  };

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
};
