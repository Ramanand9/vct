
import React from 'react';
import { useLMS } from '../store';
import { UserRole } from '../types';
import Logo from './Logo';
import AIChatSupport from './AIChatSupport';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout } = useLMS();

  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const navItems = [
    { id: 'dashboard', label: 'My Courses', icon: 'fa-book-open' },
    { id: 'community', label: 'Community', icon: 'fa-users' },
    { id: 'worksheets', label: 'Worksheets', icon: 'fa-file-signature' },
    { id: 'announcements', label: 'Updates', icon: 'fa-bullhorn' },
    { id: 'profile', label: 'Profile', icon: 'fa-user-circle' },
  ];

  if (isAdmin) {
    navItems.splice(1, 0, { id: 'admin', label: 'Admin Panel', icon: 'fa-tachometer-alt' });
  } else {
    // Add dedicated AI Advisor tab for Students and Coaches
    navItems.splice(1, 0, { id: 'ai-advisor', label: 'AI Advisor', icon: 'fa-robot' });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen sticky top-0 shadow-sm">
        <div className="p-8 border-b border-slate-100 flex justify-center">
          <Logo size="md" showTagline={false} />
        </div>
        
        <nav className="flex-1 p-6 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-nitrocrimson-600 text-white font-bold shadow-lg shadow-nitrocrimson-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <i className={`fas ${item.icon} w-5 text-lg`}></i>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-3 mb-4 bg-slate-50 rounded-2xl">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-8 max-w-7xl mx-auto w-full px-4 md:px-10 pt-10 relative">
        {children}
        {/* Only show AI Support for non-admin users */}
        { <AIChatSupport />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-3 px-2 z-50">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center flex-1 py-1 transition-all ${
              activeTab === item.id ? 'text-nitrocrimson-600 scale-110 font-bold' : 'text-slate-400'
            }`}
          >
            <i className={`fas ${item.icon} text-xl`}></i>
            <span className="text-[9px] mt-1 uppercase font-black tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
