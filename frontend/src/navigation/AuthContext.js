// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadSession = async () => {
    try {
      const stored = await AsyncStorage.getItem("session");
      if (!stored) return setLoading(false);

      const session = JSON.parse(stored);

  
      if (session?.token && session?.user?.id) {
        setToken(session.token);
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        await AsyncStorage.removeItem("session");
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Error restoring session:", err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  loadSession();
}, []);

  // helper to login (store token + user)
  const login = async ({ token: newToken, user: newUser }) => {
    setToken(newToken);
    setIsAuthenticated(true);
    setUser(newUser ?? null);
    try {
      await AsyncStorage.setItem("token", newToken);
      if (newUser) await AsyncStorage.setItem("user", JSON.stringify(newUser));
    } catch (err) {
      console.warn("Unable to persist auth", err);
    }
  };

  // helper to logout (clear local storage and state)
  const logout = async () => {
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } catch (err) {
      console.warn("Error clearing storage on logout", err);
    }
  };

  // helper to update local user cache
  const setUserAndPersist = async (u) => {
    setUser(u);
    try {
      await AsyncStorage.setItem("user", JSON.stringify(u));
    } catch (err) {
      console.warn("Error persisting user", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        token,
        user,
        login,
        logout,
        setUser: setUserAndPersist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
