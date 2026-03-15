import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Hardcoded credentials for demo (in production use JWT + DB)
const USERS = {
  admin: [
    { username: "admin", password: "sih2024", name: "Rahul Sharma", role: "admin", dept: "Smart City PMU" },
    { username: "engineer1", password: "infra123", name: "Priya Nair", role: "admin", dept: "Civil Engineering" },
  ],
  citizen: [
    { username: "citizen", password: "citizen123", name: "Ananya Patel", role: "citizen", area: "Andheri West" },
    { username: "demo", password: "demo", name: "Demo User", role: "citizen", area: "Mumbai" },
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("infraplan_user")); } catch { return null; }
  });

  const login = (username, password) => {
    const all = [...USERS.admin, ...USERS.citizen];
    const found = all.find((u) => u.username === username && u.password === password);
    if (found) {
      setUser(found);
      localStorage.setItem("infraplan_user", JSON.stringify(found));
      return { ok: true, role: found.role };
    }
    return { ok: false, error: "Invalid username or password" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("infraplan_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin", isCitizen: user?.role === "citizen" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
