"use client";

import { useState, useEffect } from 'react';
import AgriOrderDashboard from "@/components/AgriOrderDashboard";
import Login from "@/components/Login";
import { getSessionUser, User } from '@/lib/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
    setIsHydrated(true);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('isLoggedIn', 'true');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('agriorder_session');
  };

  if (!isHydrated) return <main className="min-h-screen bg-slate-950" />;

  return (
    <main className="min-h-screen bg-slate-950">
      {user ? (
        <AgriOrderDashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </main>
  );
}
