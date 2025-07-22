import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const { getAllUsers, createUser, updateUser, deleteUser, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [infoUser, setInfoUser] = useState<User | null>(null);
  const { addNotification } = useNotifications();

  const users = getAllUsers();
  const canManageUsers = hasPermission('manage_users');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'core_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateUser = (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>, password?: string) => {
    createUser({ ...userData, password });
    setShowAddModal(false);
    addNotification(`User "${userData.name}" was created by ${user?.name || user?.email}`);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    updateUser(userId, updates);
    setSelectedUser(null);
    addNotification(`User "${updates.name || ''}" was updated by ${user?.name || user?.email}`);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
      addNotification(`User was deleted by ${user?.name || user?.email}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="core_admin">Core Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              {canManageUsers && (
                <div className="relative">
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                    onClick={() => setInfoUser(user)}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Role</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Department</span>
                <span className="text-sm text-gray-900">{user.department || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <div className="flex items-center space-x-1">
                  {user.isActive ? (
                    <>
                      <UserCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Inactive</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Login</span>
                <span className="text-sm text-gray-900">
                  {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">
                  {user.createdAt.toLocaleDateString()}
                </span>
              </div>
            </div>

            {canManageUsers && (
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedUser(user)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
      {canManageUsers && showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.target as typeof e.target & {
                  name: { value: string };
                  email: { value: string };
                  role: { value: string };
                  department: { value: string };
                  password: { value: string };
                };
                handleCreateUser({
                  name: form.name.value,
                  email: form.email.value,
                  role: form.role.value as 'core_admin' | 'admin' | 'user',
                  department: form.department.value,
                  isActive: true,
                  permissions: [],
                }, form.password.value);
              }}
              className="space-y-4"
            >
              <input name="name" required placeholder="Name" className="w-full px-3 py-2 border rounded" />
              <input name="email" required type="email" placeholder="Email" className="w-full px-3 py-2 border rounded" />
              <input name="password" required type="password" placeholder="Password" className="w-full px-3 py-2 border rounded" />
              <select name="role" required className="w-full px-3 py-2 border rounded">
                <option value="">Select Role</option>
                <option value="core_admin">Core Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <input name="department" placeholder="Department" className="w-full px-3 py-2 border rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {canManageUsers && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit User</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.target as typeof e.target & {
                  name: { value: string };
                  email: { value: string };
                  role: { value: string };
                  department: { value: string };
                };
                handleUpdateUser(selectedUser.id, {
                  name: form.name.value,
                  email: form.email.value,
                  role: form.role.value as 'core_admin' | 'admin' | 'user',
                  department: form.department.value,
                });
              }}
              className="space-y-4"
            >
              <input name="name" required defaultValue={selectedUser.name} placeholder="Name" className="w-full px-3 py-2 border rounded" />
              <input name="email" required type="email" defaultValue={selectedUser.email} placeholder="Email" className="w-full px-3 py-2 border rounded" />
              <select name="role" required defaultValue={selectedUser.role} className="w-full px-3 py-2 border rounded">
                <option value="">Select Role</option>
                <option value="core_admin">Core Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <input name="department" defaultValue={selectedUser.department} placeholder="Department" className="w-full px-3 py-2 border rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedUser(null)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {infoUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setInfoUser(null)}
            >
              <span className="text-xl">&times;</span>
            </button>
            <h3 className="text-lg font-bold mb-4">User Information</h3>
            <div className="space-y-2">
              <div><b>Name:</b> {infoUser.name}</div>
              <div><b>Email:</b> {infoUser.email}</div>
              <div><b>Role:</b> {infoUser.role}</div>
              <div><b>Department:</b> {infoUser.department || 'N/A'}</div>
              <div><b>Status:</b> {infoUser.isActive ? 'Active' : 'Inactive'}</div>
              <div><b>Created At:</b> {infoUser.createdAt ? (infoUser.createdAt instanceof Date ? infoUser.createdAt.toLocaleDateString() : String(infoUser.createdAt)) : 'N/A'}</div>
              <div><b>Permissions:</b> {Array.isArray(infoUser.permissions) ? infoUser.permissions.join(', ') : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;