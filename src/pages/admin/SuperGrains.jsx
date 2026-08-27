import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';
import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function SuperGrains() {
  const [grains, setGrains] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGrain, setEditingGrain] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);
  const fileInputRef = useRef(null);

  const emptyForm = { 
    name: '', local: '', benefit: '', image: null
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchGrains = async (showLoading = true) => {
    try {
      if (showLoading && grains.length === 0) setIsLoading(true);
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/super-grains`);
      if (!res) return;
      const data = await res.json();
      
      if (data.success) {
        setGrains(data.data || []);
      }
    } catch { toast.error('Failed to load super grains'); }
    finally { setIsLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchGrains(true); }, []);

  useEffect(() => {
    if (editingGrain) {
      setFormData({ ...editingGrain });
    } else {
      setFormData(emptyForm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingGrain, isAddModalOpen]);

  const handleAction = async (e) => {
    e.preventDefault();
    const finalData = { ...formData };

    const toastId = toast.loading(editingGrain ? 'Updating...' : 'Creating...');
    try {
      if (finalData.image && finalData.image.length > 1048487) {
        toast.error("Image is too large for database", { id: toastId });
        return;
      }
      const url = editingGrain ? `${import.meta.env.VITE_API_URL}/super-grains/${editingGrain.id}` : `${import.meta.env.VITE_API_URL}/super-grains`;
      const method = editingGrain ? 'PUT' : 'POST';
      const res = await authenticatedFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(editingGrain ? 'Grain Updated' : 'Grain Added', { id: toastId });
        fetchGrains(false);
        setIsAddModalOpen(false);
        setEditingGrain(null);
      } else {
        toast.error(data.error || 'Operation failed', { id: toastId });
      }
    } catch { toast.error('Network Error', { id: toastId }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this grain?")) return;
    const toastId = toast.loading('Deleting grain...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/super-grains/${id}`, { method: 'DELETE' });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      if (res.ok) { toast.success('Grain deleted', { id: toastId }); fetchGrains(false); }
      else toast.error('Failed to delete', { id: toastId });
    } catch { toast.error('Network Error', { id: toastId }); }
  };

  if (isLoading && grains.length === 0) {
    if (showSkeleton) return <div className="p-4 sm:p-6 lg:p-10 bg-transparent min-h-screen"><TableSkeleton /></div>;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Ancient Super Grains.</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Manage Nutritional Blueprint list</p>
        </div>
        <div className="flex justify-center sm:justify-end">
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-black hover:bg-zinc-800 !text-white h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-bold shadow-md text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#E83D6E]" /> Add Grain
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 sm:p-6 border-b border-gray-50">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Search grains..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toLowerCase())} className="pl-11 h-11 sm:h-12 rounded-xl bg-gray-100 border-gray-100 font-bold tracking-tight" />
            </div>
          </div>

          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {grains.filter(g => {
              const query = searchQuery.toLowerCase();
              return g.name?.toLowerCase().includes(query) || 
                     g.local?.toLowerCase().includes(query) || 
                     g.benefit?.toLowerCase().includes(query);
            }).map((grain) => (
              <div key={grain.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 shrink-0">
                      {grain.image && <img src={grain.image} className="h-full w-full object-cover" alt="" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{grain.name}</p>
                      <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#E91E8C] mt-0.5">{grain.local}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setEditingGrain(grain)} className="h-8 w-8 text-gray-500 hover:text-black"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(grain.id)} className="h-8 w-8 text-gray-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">{grain.benefit}</p>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="pl-6">Grain</TableHead>
                  <TableHead>Benefit</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grains.filter(g => {
                  const query = searchQuery.toLowerCase();
                  return g.name?.toLowerCase().includes(query) || 
                         g.local?.toLowerCase().includes(query) || 
                         g.benefit?.toLowerCase().includes(query);
                }).map((grain) => (
                  <TableRow key={grain.id} className="border-b border-gray-50">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-16 w-16 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 shrink-0">
                          {grain.image && <img src={grain.image} className="h-full w-full object-cover" alt="" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{grain.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#E91E8C] mt-1">{grain.local}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 max-w-[300px] leading-relaxed">{grain.benefit}</p>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingGrain(grain)} className="text-gray-500 hover:text-black"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(grain.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen || !!editingGrain} onOpenChange={(open) => { if (!open) { setIsAddModalOpen(false); setEditingGrain(null); } }}>
        <DialogContent className="max-w-2xl rounded-3xl p-4 sm:p-8 border-0 shadow-2xl bg-white dark:bg-[#1A1021] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/10 overflow-y-auto max-h-[90vh] w-[95vw]">
          <DialogHeader className="mb-4 sm:mb-6"><DialogTitle className="text-xl sm:text-2xl font-bold italic">{editingGrain ? 'Edit Grain.' : 'New Grain.'}</DialogTitle></DialogHeader>
          <form onSubmit={handleAction} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Media</Label>
                  <div onClick={() => fileInputRef.current.click()} className="h-64 w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-100 transition-all">
                    {formData.image ? <img src={formData.image} className="h-full w-full object-cover" alt="" /> : <ImageIcon className="h-8 w-8 text-gray-700" />}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File is too large (Max 5MB). Please compress it first.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.src = reader.result;
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;
                          const MAX_SIZE = 600;
                          if (width > height) {
                            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                          } else {
                            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4);
                          
                          if (compressedBase64.length > 900000) {
                            toast.error("Image is still too large. Try a different photo.");
                          } else {
                            setFormData(prev => ({ ...prev, image: compressedBase64 }));
                          }
                        };
                      };
                      reader.readAsDataURL(file);
                    }
                  }} className="hidden" accept="image/*" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Grain Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="rounded-xl h-12 bg-gray-50 font-bold tracking-tight" placeholder="e.g. Finger Millet" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Local Name</Label>
                  <Input required value={formData.local} onChange={(e) => setFormData({...formData, local: e.target.value})} className="rounded-xl h-12 bg-gray-50 font-bold" placeholder="e.g. Ragi" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Nutritional Benefit</Label>
                  <Textarea required value={formData.benefit} onChange={(e) => setFormData({...formData, benefit: e.target.value})} className="rounded-xl bg-gray-50 h-24" placeholder="Naturally rich in calcium..." />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-4">
              <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); setEditingGrain(null); }} className="font-bold text-gray-500">Cancel</Button>
              <Button type="submit" className="bg-black !text-white px-10 h-14 rounded-2xl font-bold flex-1 active:scale-95 transition-all shadow-lg shadow-black/40">
                {editingGrain ? 'Update Grain' : 'Add Grain'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
