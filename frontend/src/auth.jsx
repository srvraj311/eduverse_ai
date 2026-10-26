import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [logout]);

  const accept = useCallback(({ token, ...profile }) => {
    setToken(token);
    setUser(profile);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      logout,
      setUser,
      loginWithGoogle: async (credential) => accept(await api.google(credential)),
      login: async (email, password) => accept(await api.login(email, password)),
      signup: async (name, email, password) => accept(await api.signup(name, email, password)),
    }),
    [user, loading, logout, accept],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
