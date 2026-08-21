import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { User, Role, UserStatus } from '../../types';
import { AdminService } from '../../services/adminService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { format } from 'date-fns';
import { ShieldAlert, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [targetRole, setTargetRole] = useState<Role>('STUDENT');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.studentId && user.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: Role) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REGISTRAR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STAFF': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'STUDENT': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DISABLED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRoleChangeRequest = (user: User) => {
    setSelectedUser(user);
    setTargetRole(user.role);
    setActionError('');
    setActionSuccess('');
    setShowRoleModal(true);
  };

  const executeRoleChange = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      await AdminService.changeUserRole(selectedUser.uid, targetRole);
      setActionSuccess(`User role successfully updated to ${targetRole}.`);
      await fetchUsers(); // Refresh the list from Firestore
      setTimeout(() => setShowRoleModal(false), 2000);
    } catch (err: any) {
      setActionError(err.message || 'The role update could not be completed.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    if (!confirm(`Are you sure you want to ${user.status === 'ACTIVE' ? 'disable' : 'activate'} this account?`)) return;
    
    try {
      const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await AdminService.changeUserStatus(user.uid, newStatus);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error changing user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-2">Manage roles, access, and accounts for all users.</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { label: 'All Roles', value: 'ALL' },
                  { label: 'Administrators', value: 'ADMIN' },
                  { label: 'Registrars', value: 'REGISTRAR' },
                  { label: 'Staff', value: 'STAFF' },
                  { label: 'Students', value: 'STUDENT' },
                ]}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { label: 'All Statuses', value: 'ALL' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Disabled', value: 'DISABLED' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No users found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {user.fullName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {currentUser?.uid !== user.uid && (
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRoleChangeRequest(user)}
                            >
                              Manage Role
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                              onClick={() => toggleUserStatus(user)}
                            >
                              {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                            </Button>
                          </div>
                        )}
                        {currentUser?.uid === user.uid && (
                          <span className="text-gray-400 text-xs italic">Current User</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle>Change User Role</CardTitle>
              <CardDescription>
                Modify permissions for {selectedUser.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-md text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  You are changing the role of this user. This will immediately modify the user's permissions throughout the entire system.
                </p>
              </div>

              {actionError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2 border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{actionError}</p>
                </div>
              )}
              
              {actionSuccess && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm font-medium border border-green-200">
                  {actionSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Current Role</p>
                  <p className="font-medium text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">New Role</p>
                  <Select
                    options={[
                      { label: 'Student', value: 'STUDENT' },
                      { label: 'Staff', value: 'STAFF' },
                      { label: 'Registrar', value: 'REGISTRAR' },
                      { label: 'Administrator', value: 'ADMIN' },
                    ]}
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as Role)}
                    disabled={actionLoading || !!actionSuccess}
                  />
                </div>
              </div>
              
              {targetRole === 'ADMIN' && selectedUser.role !== 'ADMIN' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800 font-medium">⚠️ Warning: Admin Promotion</p>
                  <p className="text-xs text-red-700 mt-1">
                    You are granting this user full administrative control. They will be able to change roles, view audit logs, and configure system settings.
                  </p>
                </div>
              )}
              
            </CardContent>
            <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowRoleModal(false)}
                disabled={actionLoading}
              >
                {actionSuccess ? 'Close' : 'Cancel'}
              </Button>
              {!actionSuccess && (
                <Button 
                  onClick={executeRoleChange} 
                  isLoading={actionLoading}
                  disabled={selectedUser.role === targetRole}
                  className={targetRole === 'ADMIN' && selectedUser.role !== 'ADMIN' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}
                >
                  Confirm Change
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
