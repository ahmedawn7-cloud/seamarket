import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2">
            <span className="text-xl font-bold tracking-wider text-blue-400">📊 SEA Market</span>
          </div>
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">🏠 Dashboard</a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 rounded-lg transition">🎯 Watchlist</a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 rounded-lg transition">🔍 Product Scout</a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 rounded-lg transition">📈 Analytics</a>
          </nav>
        </div>
        <div className="border-t border-gray-800 pt-4 px-2 text-xs text-gray-500">
          Logged in as Account
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-900/30">
          <h1 className="text-lg font-semibold text-gray-200">Market Intelligence Hub</h1>
          <div className="text-sm bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700 text-gray-300">Malaysia Region (RM)</div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}