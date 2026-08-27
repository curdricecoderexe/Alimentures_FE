import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon, X, Scale, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';

function Select({ value, onValueChange, children, defaultValue }) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value || defaultValue);
      // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (value !== undefined) setInternalValue(value); }, [value]);
  const handleValueChange = (newVal) => { setInternalValue(newVal); if (onValueChange) onValueChange(newVal); };
  return (
    <div className="relative w-full">
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, {
          value: internalValue, onValueChange: handleValueChange, open, setOpen,
        }) : child
      )}
    </div>
  );
}
function SelectTrigger({ children, open, setOpen, value }) {
  return (
    <div onClick={() => setOpen(!open)} className="h-11 px-4 rounded-xl bg-gray-50 flex justify-between items-center cursor-pointer border border-gray-100 hover:bg-gray-100 transition-all shadow-sm">
      {React.Children.map(children, (child) => React.isValidElement(child) ? React.cloneElement(child, { value }) : child)}
      <span className={`text-[10px] text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
    </div>
  );
}
function SelectValue({ value, placeholder }) {
  const labels = { grains: "Organic Grains", spices: "Natural Spices", snacks: "Healthy Snacks" };
  return <span className="text-sm font-medium text-gray-700">{labels[value] || placeholder || "Select Category"}</span>;
}
function SelectContent({ children, open, setOpen, onValueChange }) {
  if (!open) return null;
  return (
    <div className="absolute top-full left-0 w-full bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 mt-2 rounded-xl shadow-2xl z-[110] overflow-hidden">
      {React.Children.map(children, (child) => React.isValidElement(child) ? React.cloneElement(child, { onSelect: (val) => { onValueChange(val); setOpen(false); } }) : child)}
    </div>
  );
}
function SelectItem({ value, children, onSelect }) {
  return <div onClick={() => onSelect(value)} className="px-4 py-3 text-sm font-medium text-gray-500 hover:bg-[#E83D6E]/5 hover:text-[#E83D6E] cursor-pointer transition-colors">{children}</div>;
}

import TableSkeleton from '../../components/skeletons/TableSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);
  const fileInputRef = useRef(null);
  const secondaryFileInputRef = useRef(null);
  
  
// Removed unused var assignment: const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const emptyForm = { 
    title: '', category: 'Cookies', price: '', stock: '', description: '', secondaryDescription: '', image: null, secondaryImage: null, isFeatured: false,
    variants: [
      { weight: '250g', price: '', stock: '' },
      { weight: '500g', price: '', stock: '' },
      { weight: '1000g', price: '', stock: '' }
    ]
  };
  const [formData, setFormData] = useState(emptyForm);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_LIMIT = 8;
  const abortControllerRef = useRef(null);

  const fetchProducts = async (pageToFetch = 1, query = '', showLoading = true) => {
    try {
      if (showLoading && products.length === 0) setIsLoading(true);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const url = `${import.meta.env.VITE_API_URL}/products/search?limit=${PAGE_LIMIT}&page=${pageToFetch}&q=${encodeURIComponent(query)}`;
      const res = await authenticatedFetch(url, { signal: abortControllerRef.current.signal });
      if (!res) return;
      const data = await res.json();
      
      if (data.success) {
        setProducts(data.data || []);
        setHasMore(data.hasMore);
        setCurrentPage(pageToFetch);
      }
    } catch (err) { 
      if (err.name === 'AbortError') return;
      toast.error('Failed to load products'); 
    }
    finally { 
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Fetch when searchQuery changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, searchQuery, false);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => { fetchProducts(1, '', true); }, []);

  useEffect(() => {
    if (editingProduct) setFormData({ ...emptyForm, ...editingProduct });
    else setFormData(emptyForm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct, isAddModalOpen]);

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { weight: '', price: '', stock: '' }]
    }));
  };

  const handleRemoveVariant = (index) => {
    if (formData.variants.length <= 1) {
      return toast.error('Product must have at least one variant');
    }
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleAction = async (e) => {
    e.preventDefault();
    const validVariants = formData.variants.filter(v => v.weight?.trim() || v.price || v.stock);
    if (validVariants.length === 0) {
      toast.error('Please add at least one variant with weight, price and stock');
      return;
    }

    const finalData = { 
      ...formData, 
      isFeatured: Boolean(formData.isFeatured),
      price: Number(validVariants[0]?.price || 0), 
      stock: validVariants.reduce((acc, v) => acc + Number(v.stock || 0), 0),
      variants: validVariants.map(v => ({ 
        weight: v.weight?.trim() || 'Standard', 
        price: Number(v.price || 0), 
        stock: Number(v.stock || 0) 
      }))
    };

    const toastId = toast.loading(editingProduct ? 'Updating...' : 'Creating...');
    try {
      if (finalData.image && finalData.image.length > 1048487) {
        toast.error("Image is too large for database", { id: toastId });
        return;
      }
      const url = editingProduct ? `${import.meta.env.VITE_API_URL}/products/${editingProduct.id}` : `${import.meta.env.VITE_API_URL}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
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
        toast.success(editingProduct ? 'Product Updated' : 'Product Added', { id: toastId });
        fetchProducts(currentPage, searchQuery, false);
        setIsAddModalOpen(false);
        setEditingProduct(null);
      } else {
        toast.error(data.error || 'Operation failed', { id: toastId });
      }
    } catch { toast.error('Network Error', { id: toastId }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const toastId = toast.loading('Deleting product...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/products/${id}`, { method: 'DELETE' });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      if (res.ok) { toast.success('Product deleted', { id: toastId }); fetchProducts(currentPage, searchQuery, false); }
      else toast.error('Failed to delete', { id: toastId });
    } catch { toast.error('Network Error', { id: toastId }); }
  };

  if (isLoading && products.length === 0) {
    if (showSkeleton) return <div className="p-4 sm:p-6 lg:p-10 bg-transparent min-h-screen"><TableSkeleton /></div>;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Inventory.</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">Manage custom weights, prices & stocks for N variants</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-4 pr-0 sm:pr-4">
          <Button 
            onClick={() => {
              const exportData = products.map(p => ({
                ID: p.id,
                Title: p.title,
                Category: p.category,
                TotalStock: p.stock,
                Variants: (p.variants || []).map(v => `${v.weight}:${v.stock}@₹${v.price}`).join(', ')
              }));
              import('../../lib/exportUtils').then(m => m.exportToExcel(exportData, 'Alimenture_Product_Catalog'));
            }}
            variant="outline" 
            className="h-10 sm:h-12 px-4 sm:px-6 rounded-xl border-gray-100 hover:bg-black hover:!text-white font-bold transition-all shadow-sm text-xs sm:text-sm"
          >
            <Download className="h-4 w-4 mr-2" /> Export Catalog
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-black hover:bg-zinc-800 !text-white h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-bold shadow-md text-xs sm:text-sm">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-[#E83D6E]" /> Add Product
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl bg-white shadow-sm border-gray-200/60 transition-shadow duration-300 border border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-50">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input placeholder="Search inventory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value.toUpperCase())} className="pl-11 h-12 rounded-xl bg-gray-100 border-gray-100 font-bold tracking-tight" />
            </div>
          </div>
          {/* Mobile Card List View (< 768px) */}
          <div className="block md:hidden divide-y divide-gray-100">
            {products.map((product) => (
              <div key={product.id} className="p-4 bg-white">
                <div className="flex gap-3.5">
                  <div className="h-20 w-20 rounded-2xl bg-gray-50 border border-gray-100 shrink-0 relative overflow-hidden shadow-sm">
                    {product.image ? (
                      <img src={product.image} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-300">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    {product.isFeatured && (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white flex items-center justify-center h-4 w-4 rounded-full shadow-sm">
                        <Sparkles className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate leading-tight">{product.title}</h3>
                          <p className="text-[10px] font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                            Stock: <span className="text-gray-900">{product.stock}</span>
                          </p>
                        </div>
                        <div className="flex gap-0.5 shrink-0 -mt-1.5 -mr-1.5">
                          <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)} className="h-7 w-7 text-gray-400 hover:text-black bg-white">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-7 w-7 text-gray-400 hover:text-red-600 bg-white">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {product.variants?.map((v, i) => (
                        <div key={i} className="text-[9px] bg-gray-50 border border-gray-200/60 rounded-md px-1.5 py-0.5 text-gray-500 font-semibold flex items-center gap-1">
                          <span className="text-gray-900">{v.weight}</span>
                          <span className="text-gray-300">|</span>
                          <span className={v.stock <= 5 ? 'text-rose-600 font-bold' : ''}>₹{v.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Weights & Prices</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="border-b border-gray-50">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-20 w-20 rounded-xl bg-gray-100 overflow-hidden shadow-sm border border-gray-100 shrink-0">
                          {product.image && <img src={product.image} className="h-full w-full object-cover" alt="" />}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-gray-900">{product.title}</p>
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full w-max">
                              <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-bold">{product.stock}</span></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {product.variants?.map((v, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-gray-50 border-gray-100 text-gray-500 font-bold min-w-[60px] justify-center">
                              {v.weight}
                            </Badge>
                            <span className={`text-sm font-bold ${v.stock <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                              {v.stock}
                            </span>
                            {v.stock <= 5 && v.stock > 0 && (
                              <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] font-bold italic">
                                ONLY {v.stock} LEFT
                              </Badge>
                            )}
                            {v.stock === 0 && (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-100 text-[9px] font-bold italic">
                                OUT OF STOCK
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)} className="text-gray-500 hover:text-black"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-[#E83D6E] hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Page {currentPage}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage <= 1}
                onClick={() => fetchProducts(currentPage - 1, searchQuery, false)}
                className="rounded-xl border-gray-100 font-bold text-xs h-9"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!hasMore}
                onClick={() => fetchProducts(currentPage + 1, searchQuery, false)}
                className="rounded-xl border-gray-100 font-bold text-xs h-9"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen || !!editingProduct} onOpenChange={(open) => { if (!open) { setIsAddModalOpen(false); setEditingProduct(null); } }}>
        <DialogContent className="max-w-2xl rounded-3xl p-4 sm:p-8 border-0 shadow-2xl bg-white border border-gray-100 overflow-y-auto max-h-[90vh] w-[95vw]">
          <DialogHeader className="mb-4 sm:mb-6"><DialogTitle className="text-xl sm:text-2xl font-bold italic">{editingProduct ? 'Edit Product.' : 'New Product.'}</DialogTitle></DialogHeader>
          <form onSubmit={handleAction} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Primary Media (Main Image)</Label>
                  <div onClick={() => fileInputRef.current.click()} className="h-44 w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-100 transition-all">
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
                          const MAX_SIZE = 1000;
                          if (width > height) {
                            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                          } else {
                            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                          
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

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Secondary Media (2nd Image for Product Page Left Panel)</Label>
                  <div onClick={() => secondaryFileInputRef.current.click()} className="h-36 w-full rounded-2xl bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-100 transition-all relative group">
                    {formData.secondaryImage ? (
                      <>
                        <img src={formData.secondaryImage} className="h-full w-full object-cover" alt="" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, secondaryImage: null })); }}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400">+ Add Secondary Image</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={secondaryFileInputRef} onChange={(e) => {
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
                          const MAX_SIZE = 1000;
                          if (width > height) {
                            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                          } else {
                            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                          
                          if (compressedBase64.length > 900000) {
                            toast.error("Image is still too large. Try a different photo.");
                          } else {
                            setFormData(prev => ({ ...prev, secondaryImage: compressedBase64 }));
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
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Title</Label>
                  <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value.toUpperCase()})} className="rounded-xl h-12 bg-gray-50 font-bold tracking-tight" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Category (Select via Checkbox)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Cookies', label: 'Cookies' },
                      { id: 'Health Mixtures', label: 'Health Mixtures' },
                      { id: 'Honey', label: 'Honey' },
                      { id: 'Jaggery', label: 'Jaggery' }
                    ].map((cat) => {
                      const isChecked = (formData.category || '').toLowerCase() === cat.id.toLowerCase();
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#920075] text-white border-[#920075] shadow-xs scale-[1.02]'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setFormData({ ...formData, category: cat.id })}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300 text-[#920075] focus:ring-[#920075] cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-1">
                    <Input
                      placeholder="Or enter custom category name..."
                      value={['cookies', 'health mixtures', 'honey', 'jaggery'].includes((formData.category || '').toLowerCase()) ? '' : formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="rounded-xl h-10 bg-gray-50 text-xs font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setFormData(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}>
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={Boolean(formData.isFeatured)}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-bold text-gray-800 cursor-pointer flex items-center gap-1.5 select-none">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Featured Product (Show on Homepage)
                  </label>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Primary Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl bg-gray-50 h-20 text-xs" placeholder="Main product summary..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider ml-1">Secondary / Detailed Description (Left Side Banner)</Label>
                  <Textarea value={formData.secondaryDescription} onChange={(e) => setFormData({...formData, secondaryDescription: e.target.value})} className="rounded-xl bg-gray-50 h-24 text-xs" placeholder="Add extra features, recipe origin, nutrition story, or ingredient highlights to display on the left side of product detail page..." />
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5 text-[#920075]" /> Variant Management (Custom Weight, Price & Stock)
                  </Label>
                  <Button
                    type="button"
                    onClick={handleAddVariant}
                    className="h-8 px-3 rounded-xl bg-[#920075] hover:bg-[#72005b] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Variant
                  </Button>
                </div>

                <div className="space-y-3">
                    {formData.variants.map((v, i) => (
                        <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-xs relative group">
                            <div className="flex-1 space-y-1">
                                <Label className="text-[9px] font-bold uppercase text-gray-500 ml-1">Weight / Unit</Label>
                                <Input 
                                    type="text"
                                    placeholder="e.g. 250g, 1kg, 500ml" 
                                    value={v.weight} 
                                    onChange={(e) => handleVariantChange(i, 'weight', e.target.value)}
                                    className="rounded-xl h-10 bg-gray-50 border-gray-100 font-bold text-xs"
                                />
                            </div>
                            <div className="w-full sm:w-28 space-y-1">
                                <Label className="text-[9px] font-bold uppercase text-gray-500 ml-1">Price (₹)</Label>
                                <Input 
                                    type="number" 
                                    min="0"
                                    placeholder="Price" 
                                    value={v.price} 
                                    onChange={(e) => handleVariantChange(i, 'price', e.target.value)}
                                    className="rounded-xl h-10 bg-gray-50 border-gray-100 font-bold text-xs"
                                />
                            </div>
                            <div className="w-full sm:w-28 space-y-1">
                                <Label className="text-[9px] font-bold uppercase text-gray-500 ml-1">Stock (Units)</Label>
                                <Input 
                                    type="number" 
                                    min="0"
                                    placeholder="Stock" 
                                    value={v.stock} 
                                    onChange={(e) => handleVariantChange(i, 'stock', e.target.value)}
                                    className="rounded-xl h-10 bg-gray-50 border-gray-100 font-bold text-xs"
                                />
                            </div>
                            {formData.variants.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveVariant(i)}
                                className="h-10 w-10 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors self-end"
                                title="Remove variant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <DialogFooter className="pt-4 flex gap-4">
              <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); setEditingProduct(null); }} className="font-bold text-gray-500">Cancel</Button>
              <Button type="submit" className="bg-black !text-white px-10 h-14 rounded-2xl font-bold flex-1 active:scale-95 transition-all shadow-lg shadow-black/40">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}