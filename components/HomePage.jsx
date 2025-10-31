"use client";

import DocumentForm from "@/components/document-form";
import DocumentList from "@/components/document-list";
import AuthPage from "@/components/auth/AuthPage";
import { useAuth } from "@/contexts/AuthContext";
import { FaClock, FaSignOutAlt } from "react-icons/fa";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FaClock className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-linear-to-r from-primary to-indigo-600 text-primary-foreground py-6 px-4 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Top Row - Logo and Sign Out */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FaClock className="w-10 h-10" />
              <h1 className="text-4xl font-bold text-balance">DocReminder</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              <FaSignOutAlt className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Middle Row - Tagline */}
          <div className="mb-3">
            <p className="text-indigo-100 text-lg text-pretty">
              Never miss an important document expiry date again
            </p>
          </div>

          {/* Bottom Row - Account Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-indigo-200/80 text-sm font-medium">
                Logged in as:
              </span>
              <span className="text-white bg-white/10 px-3 py-1 rounded-full text-sm font-medium">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <DocumentForm />
        <DocumentList />
      </main>
    </div>
  );
}
