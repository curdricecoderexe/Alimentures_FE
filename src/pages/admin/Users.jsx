import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Plus, Pencil, Trash2, Search, UserPlus, ShieldCheck, Users, AlertTriangle, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';

const initialUsers = [];

const RoleBadge = ({ role }) => {
  const badgeClassMap = {
    'Admin': 'badge-admin',
    'Staff': 'badge-staff',
    'Customer': 'badge-customer',
  };
  const Icon = { 'Admin': ShieldCheck, 'Staff': Users, 'Customer': Search }[role] || Users;

  return (
    <Badge variant="outline" className={`px-2.5 py-0.5 rounded-lg border font-bold text-[9.5px] uppercase tracking-wider shrink-0 gap-1.5 shadow-none ${badgeClassMap[role] || 'badge-customer'}`}>
      <Icon size={11} className="shrink-0" />
      <span>{role}</span>
    </Badge>
  );
};
export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form States
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  const [loading, setLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(loading);
  const [lastId, setLastId] = useState(null);
  const [pageStack, setPageStack] = useState([]); // Store previous lastIds for back nav
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 8;

  const fetchUsers = async (targetLastId = null, isNext = true) => {
    if (users.length === 0) setLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/users?limit=${PAGE_SIZE}${targetLastId ? `&lastId=${targetLastId}&dir=${isNext ? 'next' : 'prev'}` : ''}`;
      const res = await authenticatedFetch(url);
      if (!res) return;
      const data = await res.json();
      
      if (res.ok) {
        const userData = data.success ? data.data : data;
        const list = Array.isArray(userData) ? userData : [];
        
        // Deduplicate by UID
        const unique = [];
        const seen = new Set();
        list.forEach(u => {
          if (!seen.has(u.uid)) {
            seen.add(u.uid);
            unique.push(u);
          }
        });

        setUsers(unique);
        setHasMore(unique.length === PAGE_SIZE);
        
        if (targetLastId && isNext) {
          setPageStack(prev => [...prev, lastId]);
        }
        
        if (unique.length > 0) {
          setLastId(unique[unique.length - 1].uid);
        }
      } else {
        toast.error(data.error || 'Access denied. Please re-login.');
      }
    } catch {
      toast.error('Network error. Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) fetchUsers(lastId, true);
  };

  const handlePrevPage = () => {
    if (pageStack.length > 0) {
      const prevId = pageStack[pageStack.length - 1];
      const newStack = pageStack.slice(0, -1);
      setPageStack(newStack);
      setLastId(prevId);
      fetchUsers(prevId, false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userToEdit) {
      setEditForm({ name: userToEdit.name || '', email: userToEdit.email || '' });
    }
  }, [userToEdit]);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const handleAddUser = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      return toast.error('Please fill in all fields');
    }

    const toastId = toast.loading('Creating user...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/users/admin-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      const data = await res.json();
      if (res.ok && (data.success || data.uid)) {
        toast.success(`User ${newUser.name} created!`, { id: toastId });
        setIsAddDialogOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'customer' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to create user', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const handleUpdateRole = async (uid, newRole) => {
    const toastId = toast.loading('Updating role...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/users/${uid}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      if (res.ok) {
        toast.success(`Role updated to ${newRole}`, { id: toastId });
        fetchUsers();
      } else {
        toast.error('Failed to update role', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!userToEdit) return;
    const toastId = toast.loading('Updating user profile...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/users/${userToEdit.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      if (res.ok) {
        toast.success(`User details updated`, { id: toastId });
        setUserToEdit(null);
        fetchUsers();
      } else {
        toast.error('Failed to update user', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const toastId = toast.loading('Removing user account...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/users/${userToDelete.uid}`, { 
        method: 'DELETE'
      });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success || data.message)) {
        toast.success(`Account has been removed`, { id: toastId });
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight italic">Accounts.</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Manage permissions and user directories</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-4">
          <Button 
            onClick={() => {
              const exportData = users.map(u => ({
                UID: u.uid,
                Name: u.name,
                Email: u.email,
                Role: u.role,
                Status: u.disabled ? 'Disabled' : 'Active'
              }));
              import('../../lib/exportUtils').then(m => m.exportToExcel(exportData, 'Alimenture_User_Directory'));
            }}
            variant="outline" 
            className="h-10 sm:h-12 px-4 sm:px-6 rounded-2xl border-gray-100 hover:bg-black hover:text-white font-bold transition-all text-xs sm:text-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Export Directory
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 sm:h-12 px-4 sm:px-6 rounded-2xl bg-black hover:bg-zinc-800 !text-white font-bold shadow-lg active:scale-95 transition-all text-xs sm:text-sm">
            <UserPlus className="h-4 w-4 mr-2" /> Create Account
          </Button>
        </div>
      </div>

      {/* SEARCH & TABLE CARD */}
      <Card className="border-0 shadow-sm rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 sm:h-12 rounded-xl bg-gray-50 border-gray-100 font-bold"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px] h-11 sm:h-12 rounded-xl border-gray-100 bg-gray-50 font-bold text-gray-500">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl z-[100]">
                <SelectItem value="all">All Directories</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <div key={user.uid} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-2 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 leading-tight truncate">{user.name || 'Anonymous'}</p>
                    <p className="text-[9px] font-bold text-[#E83D6E] uppercase tracking-wider mt-0.5 truncate max-w-[130px] sm:max-w-[200px]">{user.uid}</p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <RoleBadge role={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Customer'} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[180px]">{user.email}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setUserToEdit(user); setEditForm({ name: user.name || '', email: user.email || '' }); }} className="h-8 w-8 text-gray-500 hover:text-black"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} className="h-8 w-8 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-0">
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em] pl-8">Identity</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em]">Contact</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em]">Permissions</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em]">Activity</TableHead>
                  <TableHead className="h-14 text-[11px] font-bold uppercase text-gray-500 tracking-[0.2em] text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center">
                        {showSkeleton ? <TableSkeleton /> : <div className="h-64"></div>}
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-gray-50 rounded-full">
                            <Users size={48} className="text-gray-800" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">No matching accounts found</p>
                            <p className="text-[10px] text-gray-500 font-medium">Try adjusting your filters or search terms</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => fetchUsers()}
                            className="mt-2 rounded-xl border-gray-100 font-bold"
                          >
                            Refresh Directory
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.map((user, index) => (
                    <motion.tr 
                      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={user.uid}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/20 group transition-colors"
                    >
                      <TableCell className="py-6 pl-8">
                        <div>
                          <p className="text-base font-bold text-gray-900 leading-tight">{user.name || 'Anonymous'}</p>
                          <p className="text-[10px] font-bold text-[#E83D6E] uppercase tracking-wider mt-1">{user.uid}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-gray-700">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Customer'} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${user.disabled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {user.disabled ? 'Disabled' : 'Active Account'}
                          </span>
                          <p className="text-[10px] font-bold text-gray-500">
                            Created {user.createdAt ? new Date(user.createdAt._seconds ? user.createdAt._seconds * 1000 : user.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end items-center gap-2">
                          <Select defaultValue={user.role || 'customer'} onValueChange={(val) => handleUpdateRole(user.uid, val)}>
                            <SelectTrigger className="w-[110px] h-9 rounded-xl border-gray-100 bg-gray-50 text-xs font-bold text-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl z-[100]">
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => { setUserToEdit(user); setEditForm({ name: user.name || '', email: user.email || '' }); }} 
                            size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-gray-100 transition-all text-gray-500 hover:text-black"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button onClick={() => setUserToDelete(user)} size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-red-50 transition-all text-gray-500 hover:text-red-600">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="p-4 sm:p-6 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left bg-gray-50/20">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Showing <span className="text-gray-900">{filteredUsers.length}</span> results per directory
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={pageStack.length === 0 || loading}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl border-gray-100 font-bold text-xs shadow-sm disabled:opacity-30"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl border-gray-100 font-bold text-xs shadow-sm disabled:opacity-30"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- ADD USER MODAL --- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-10 border-0 shadow-2xl bg-white dark:bg-[#1A1021] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/10 w-[95vw]">
          <DialogHeader className="mb-4 sm:mb-6">
            <DialogTitle className="text-2xl sm:text-3xl font-bold italic tracking-tighter">New User.</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Full Name</Label>
              <Input value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="h-12 sm:h-14 rounded-2xl bg-gray-50 dark:bg-[#24162E] border-gray-100 dark:border-white/10" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="h-12 sm:h-14 rounded-2xl bg-gray-50 dark:bg-[#24162E] border-gray-100 dark:border-white/10" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Password</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="h-12 sm:h-14 rounded-2xl bg-gray-50 dark:bg-[#24162E] border-gray-100 dark:border-white/10" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">System Role</Label>
              <Select value={newUser.role} onValueChange={(val) => setNewUser({...newUser, role: val})}>
                <SelectTrigger className="h-12 sm:h-14 rounded-2xl bg-gray-50 dark:bg-[#24162E] border-gray-100 dark:border-white/10 font-bold"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent className="rounded-2xl dark:bg-[#1A1021] z-[110]"><SelectItem value="customer">Customer</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6 sm:mt-8 gap-3">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="h-12 sm:h-14 rounded-2xl font-bold text-gray-500 dark:text-gray-400 flex-1">Discard</Button>
            <Button onClick={handleAddUser} className="h-12 sm:h-14 rounded-2xl bg-black dark:bg-[#E83D6E] !text-white font-bold flex-[2] shadow-xl">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT USER MODAL --- */}
      <Dialog open={!!userToEdit} onOpenChange={() => setUserToEdit(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-10 border-0 shadow-2xl bg-white dark:bg-[#1A1021] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/10 w-[95vw]">
          <DialogHeader className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-gray-100 dark:bg-[#24162E] rounded-2xl"><Pencil size={20} className="text-gray-900 dark:text-gray-100" /></div>
              <DialogTitle className="text-2xl sm:text-3xl font-bold italic tracking-tighter">Edit Profile.</DialogTitle>
            </div>
          </DialogHeader>
          {userToEdit && (
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Display Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="h-12 sm:h-14 rounded-2xl bg-gray-50 dark:bg-[#24162E] border-gray-100 dark:border-white/10 font-bold" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider ml-1">Contact Email</Label>
                <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="h-12 sm:h-14 rounded-2xl bg-gray-50 dark:bg-[#24162E] border-gray-100 dark:border-white/10" />
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-indigo-950/40 border border-blue-100 dark:border-indigo-800/40">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Account Type</p>
                <p className="text-sm font-bold text-blue-900 dark:text-gray-100 mt-0.5">Limited to {userToEdit.role} Permissions</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6 sm:mt-8 gap-3">
            <Button variant="ghost" onClick={() => setUserToEdit(null)} className="h-12 sm:h-14 rounded-2xl font-bold text-gray-500 dark:text-gray-400 flex-1">Cancel</Button>
            <Button onClick={handleUpdateUser} className="h-12 sm:h-14 rounded-2xl bg-black dark:bg-[#E83D6E] !text-white font-bold flex-[2] shadow-xl">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-5 sm:p-10 border-0 shadow-2xl bg-white dark:bg-[#1A1021] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/10 text-center w-[95vw]">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-red-600 dark:text-red-400">
            <AlertTriangle size={36} strokeWidth={2.5} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl sm:text-3xl font-bold italic tracking-tighter text-center">Deactivate.</DialogTitle>
            <DialogDescription className="text-center font-medium pt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-gray-100">{userToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:mt-8 gap-3">
            <Button variant="ghost" onClick={() => setUserToDelete(null)} className="h-12 rounded-2xl font-bold text-gray-500 dark:text-gray-400 flex-1">Cancel</Button>
            <Button onClick={handleDeleteUser} className="h-12 rounded-2xl bg-red-600 hover:bg-red-700 !text-white font-bold flex-1 shadow-lg shadow-red-200 dark:shadow-none">Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}