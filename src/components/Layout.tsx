import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Settings, Users, LogOut, FileSearch, Bell, Check, X } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Notification } from '../types';
import { format } from 'date-fns';

export function Layout() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', userData.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach(doc => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      notifs.sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNavItems = () => {
    if (!userData) return [];
    
    switch (userData.role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
          { name: 'My Requests', path: '/student/requests', icon: FileText },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', path: '/staff', icon: LayoutDashboard },
          { name: 'Process Requests', path: '/staff/requests', icon: FileSearch },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Manage Users', path: '/admin/users', icon: Users },
          { name: 'Document Types', path: '/admin/documents', icon: FileText },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">SDSystem</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== `/${userData?.role.toLowerCase()}` && item.path.split('/').length > 2);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4 px-2">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {userData?.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{userData?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{userData?.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-semibold text-gray-900">
            {navItems.find(item => location.pathname === item.path)?.name || 'Application'}
          </h1>
          <div className="flex items-center relative">
            <button 
              className="p-2 text-gray-400 hover:text-gray-500 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {notifications.map(notif => (
                        <div key={notif.id} className={`p-4 ${notif.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-sm font-medium ${notif.isRead ? 'text-gray-900' : 'text-blue-900'}`}>{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{format(notif.createdAt, 'MMM dd, h:mm a')}</p>
                            </div>
                            {!notif.isRead && (
                              <button onClick={() => markAsRead(notif.id)} className="text-blue-600 hover:text-blue-800" title="Mark as read">
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
