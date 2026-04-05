import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-700 tracking-tight">Recovery CRM</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.full_name ?? user?.email}</span>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>
      <main className="h-[calc(100vh-49px)]">{children}</main>
    </div>
  );
}
