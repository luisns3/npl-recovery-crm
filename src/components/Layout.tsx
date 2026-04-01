import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-indigo-700 tracking-tight">Recovery CRM</h1>
        <span className="text-sm text-gray-500">Carlos Ruiz</span>
      </header>
      <main className="h-[calc(100vh-49px)]">{children}</main>
    </div>
  );
}
