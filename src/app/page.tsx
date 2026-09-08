"use client";

import { useState, useEffect } from 'react';
import AgriOrderDashboard from "@/components/AgriOrderDashboard";
import Login from "@/components/Login";
import { getSessionUser, logout, User } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const sessionUser = await getSessionUser();
      if (sessionUser) {
        setUser(sessionUser);
      }
      setIsHydrated(true);
    }
    checkSession();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (!isHydrated) return <main className="min-h-screen bg-slate-50 dark:bg-slate-950" />;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {user ? (
        <AgriOrderDashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </main>
  );
}
