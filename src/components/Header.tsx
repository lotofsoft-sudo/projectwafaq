/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  User as UserIcon, 
  ShieldAlert, 
  LogOut, 
  Settings, 
  Sparkles,
  Info,
  Menu
} from 'lucide-react';
import { User, Notification, Role, Tax } from '../types';

interface HeaderProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  availableRoles: Role[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSearch: () => void;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
  taxes: Tax[];
  activeTaxId: string;
  setActiveTaxId: (val: string) => void;
  includeVat: boolean;
  onToggleIncludeVat: (val: boolean) => void;
  excludeVat: boolean;
  onToggleExcludeVat: (val: boolean) => void;
}

export default function Header({
  currentUser,
  setCurrentUser,
  availableUsers,
  availableRoles,
  notifications,
  setNotifications,
  searchQuery,
  setSearchQuery,
  onOpenSearch,
  onToggleSidebar,
  onLogout,
  taxes,
  activeTaxId,
  setActiveTaxId,
  includeVat,
  onToggleIncludeVat,
  excludeVat,
  onToggleExcludeVat,
}: HeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showRbacDropdown, setShowRbacDropdown] = useState(false);

  const currentPermissions = React.useMemo(() => {
    return availableRoles.find(r => r.name === currentUser.role)?.permissions;
  }, [availableRoles, currentUser]);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const rbacDropdownRef = useRef<HTMLDivElement>(null);

  const getTaxFlag = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('zatca') || lower.includes('ksa') || lower.includes('saudi')) return '🇸🇦';
    if (lower.includes('cgst') || lower.includes('gst') || lower.includes('india')) return '🇮🇳';
    if (lower.includes('uae')) return '🇦🇪';
    if (lower.includes('qat') || lower.includes('qatar')) return '🇶🇦';
    if (lower.includes('bahrain')) return '🇧🇭';
    if (lower.includes('oman')) return '🇴🇲';
    if (lower.includes('kuwait')) return '🇰🇼';
    return '🏛️';
  };

  const activeTax = taxes.find(t => t.id === activeTaxId) || taxes[0] || { id: 'none', name: 'No Tax', rate: 0 };

  const handleSelectTax = (tax: Tax) => {
    setActiveTaxId(tax.id);
    setShowRegionDropdown(false);
    
    // Add a success notification
    setNotifications(prev => [
      {
        id: `notif_tax_${Date.now()}`,
        text: `Active tax context changed to ${tax.name} (${tax.rate}%)`,
        type: 'success',
        timestamp: 'Just now',
        read: false
      },
      ...prev
    ]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
      }
      if (rbacDropdownRef.current && !rbacDropdownRef.current.contains(event.target as Node)) {
        setShowRbacDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <header id="header-container" className="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      
      {/* Left Search Bar Trigger & Hamburger Button for Mobile */}
      <div className="flex items-center space-x-2 md:space-x-3 flex-1 max-w-full mr-1 md:mr-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg lg:hidden cursor-pointer shrink-0 active-scale"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div id="header-left-search" className="flex items-center w-full max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm lg:w-96 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            id="header-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={onOpenSearch}
            readOnly
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50/80 hover:bg-gray-50 border border-gray-200/80 rounded-lg focus:outline-none cursor-pointer transition-all placeholder:text-gray-400 select-none"
          />
        </div>
      </div>

      {/* Right User Controls & Notification Bell */}
      <div id="header-right-controls" className="flex items-center space-x-1.5 md:space-x-4 shrink-0">
        
        {/* Global VAT Inclusion Toggle */}
        <div id="vat-inclusion-toggle" className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 select-none transition">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVat}
              onChange={(e) => {
                onToggleIncludeVat(e.target.checked);
                // Trigger a notification
                setNotifications(prev => [
                  {
                    id: `notif_vat_toggle_${Date.now()}`,
                    text: `Amounts changed to ${e.target.checked ? 'INCLUDE' : 'EXCLUDE'} ${activeTax.name} (${activeTax.rate}%) automatically.`,
                    type: 'info',
                    timestamp: 'Just now',
                    read: false
                  },
                  ...prev
                ]);
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-350 cursor-pointer accent-indigo-600"
            />
            <span className="font-mono text-slate-600 text-[10px] md:text-xs">Inc. VAT ({activeTax.rate}%)</span>
          </label>
        </div>

        {/* Global VAT Exclusion Toggle */}
        <div id="vat-exclusion-toggle" className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 select-none transition">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeVat}
              onChange={(e) => {
                onToggleExcludeVat(e.target.checked);
                // Trigger a notification
                setNotifications(prev => [
                  {
                    id: `notif_vat_exclude_toggle_${Date.now()}`,
                    text: `Amounts changed to ${e.target.checked ? 'EXCLUDE' : 'DEFAULT'} ${activeTax.name} (${activeTax.rate}%) automatically.`,
                    type: 'info',
                    timestamp: 'Just now',
                    read: false
                  },
                  ...prev
                ]);
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-350 cursor-pointer accent-indigo-600"
            />
            <span className="font-mono text-slate-600 text-[10px] md:text-xs">Exc. VAT ({activeTax.rate}%)</span>
          </label>
        </div>



        {/* Dynamic RBAC Demo Alert Badge Dropdown */}
        {currentPermissions?.manageUsers !== false && (
          <div ref={rbacDropdownRef} className="relative hidden lg:block">
            <button
              id="rbac-demo-badge-btn"
              onClick={() => setShowRbacDropdown(!showRbacDropdown)}
              className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 text-xs px-2.5 py-1 rounded-md cursor-pointer transition active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
              <span>Role: {currentUser.role}</span>
              <ChevronDown className="w-3 h-3 text-indigo-500" />
            </button>

            {showRbacDropdown && (
              <div id="rbac-dropdown-menu" className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-1.5">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Active Role-Based View</div>
                <div className="space-y-0.5">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setShowRbacDropdown(false);
                        // Add notification
                        setNotifications(prev => [
                          {
                            id: `notif_role_${Date.now()}`,
                            text: `Active session switched to ${user.name} (${user.role})`,
                            type: 'info',
                            timestamp: 'Just now',
                            read: false
                          },
                          ...prev
                        ]);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                        currentUser.id === user.id 
                          ? 'bg-indigo-50 text-indigo-800 font-bold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <img src={user.avatar} className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200" alt="" referrerPolicy="no-referrer" />
                        <span className="truncate">{user.name}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-indigo-600 shrink-0 uppercase">{user.role.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Dropdown */}
        <div ref={notificationDropdownRef} className="relative">
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 rounded-full transition relative cursor-pointer active-scale"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span id="notification-badge" className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationDropdown && (
            <div id="notifications-dropdown-menu" className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <span className="text-xs font-semibold text-gray-800">Recent Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`p-3 text-xs transition hover:bg-gray-50/80 cursor-pointer ${notif.read ? 'opacity-70' : 'bg-indigo-50/20 font-medium'}`}
                    >
                      <div className="flex items-start justify-between space-x-2">
                        <p className="text-gray-700 text-xs leading-relaxed">{notif.text}</p>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                          notif.type === 'alert' ? 'bg-rose-500' :
                          notif.type === 'warning' ? 'bg-amber-500' :
                          notif.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}></span>
                      </div>
                      <span className="text-[10px] text-gray-400 block mt-1 font-mono">{notif.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Role Switcher Profile Dropdown */}
        <div ref={userDropdownRef} className="relative">
          <button
            id="user-profile-dropdown-btn"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2 p-1 px-2.5 hover:bg-gray-100 rounded-lg transition text-left cursor-pointer border border-gray-100 active-scale"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-indigo-500/20"
              referrerPolicy="no-referrer"
            />
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-800 leading-none">{currentUser.name}</p>
              <span className="text-[10px] font-mono font-semibold text-indigo-600 uppercase tracking-wider block mt-0.5">{currentUser.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
          </button>

          {showUserDropdown && (
            <div id="user-dropdown-menu" className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* Dropdown Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 font-mono uppercase tracking-wider">Active Account</p>
                <div className="flex items-center space-x-3 mt-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-indigo-500"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{currentUser.name}</h4>
                    <p className="text-xs text-gray-500">{currentUser.email}</p>
                    <span className="inline-block text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase mt-1">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* RBAC Simulation Switcher Section */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-1.5 px-2 mb-2 text-[10px] font-semibold text-gray-400 font-mono uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Switch Role (RBAC Simulation)</span>
                </div>
                <div className="space-y-1">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        currentUser.id === user.id 
                          ? 'bg-indigo-50 text-indigo-800 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <img src={user.avatar} className="w-5 h-5 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                        <span className="truncate text-xs">{user.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 font-normal shrink-0">{user.role.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Links */}
              <div className="p-1.5 bg-gray-50 flex flex-col">
                {currentPermissions?.viewSystemSettings !== false && (
                  <>
                    <button 
                      onClick={() => alert("Wafaq ERP Configuration - Managed by Corporate Admin")} 
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer transition text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span>ERP Settings</span>
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                  </>
                )}
                <button 
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      alert("Simulated Logout. To swap roles, use the Role Switcher above.");
                    }
                    setShowUserDropdown(false);
                  }} 
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Session</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
}
