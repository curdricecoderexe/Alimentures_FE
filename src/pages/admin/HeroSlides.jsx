import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Plus, Pencil, Trash2, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '../../lib/api';
import DashboardSkeleton from '../../components/skeletons/DashboardSkeleton';
import useSkeletonLoader from '../../hooks/useSkeletonLoader';

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showSkeleton = useSkeletonLoader(isLoading);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  const [formData, setFormData] = useState({
    src: '',
    title: ''
  });

  const fetchSlides = async (showLoading = true) => {
    try {
      if (showLoading && slides.length === 0) setIsLoading(true);
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/hero-slides`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setSlides(data.data);
      }
    } catch {
      toast.error('Failed to fetch slideshow images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 1920; 
          
          if (width > max_size || height > max_size) {
            if (width > height) {
              height = Math.round(height * (max_size / width));
              width = max_size;
            } else {
              width = Math.round(width * (max_size / height));
              height = max_size;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/webp', 0.82);
          
          if (dataUrl.length > 2500000) { 
            toast.error('Image is too large after compression. Please upload a more compact file.');
          } else {
            setFormData({ ...formData, src: dataUrl });
            toast.success('High-resolution banner uploaded successfully!');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.src) return toast.error('Please upload an image or provide an image URL');

    const toastId = toast.loading(editingSlide ? 'Updating banner...' : 'Publishing new banner...');
    try {
      const url = editingSlide 
        ? `${import.meta.env.VITE_API_URL}/hero-slides/${editingSlide.id}`
        : `${import.meta.env.VITE_API_URL}/hero-slides`;
      const method = editingSlide ? 'PUT' : 'POST';

      const payload = {
        src: formData.src,
        title: formData.title || 'Hero Banner Image'
      };

      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        toast.success(editingSlide ? 'Banner updated successfully!' : 'Banner added to homepage slideshow!', { id: toastId });
        setIsAddModalOpen(false);
        setEditingSlide(null);
        setFormData({ src: '', title: '' });
        fetchSlides(false);
      } else {
        toast.error(data.error || 'Failed to save slide', { id: toastId });
      }
    } catch {
      toast.error('Network error occurred', { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this banner from the homepage slideshow?')) return;
    const toastId = toast.loading('Deleting banner slide...');
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_API_URL}/hero-slides/${id}`, { method: 'DELETE' });
      if (!res) {
        toast.dismiss(toastId);
        return;
      }
      if (res.ok) {
        toast.success('Banner slide removed successfully', { id: toastId });
        fetchSlides(false);
      } else {
        toast.error('Failed to delete banner slide', { id: toastId });
      }
    } catch {
      toast.error('Network Error', { id: toastId });
    }
  };

  const openEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      src: slide.src || '',
      title: slide.title || 'Hero Banner Image'
    });
    setIsAddModalOpen(true);
  };

  if (isLoading) {
    if (showSkeleton) return <div className="p-4 sm:p-6 lg:p-10 bg-transparent min-h-screen"><DashboardSkeleton /></div>;
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <div className="p-6 lg:p-10 bg-transparent min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Homepage Hero Banners.</h1>
          <p className="text-sm text-gray-500 font-medium">Manage the full-screen periodic slideshow displayed on the customer home page</p>
        </div>
        <Button 
          onClick={() => {
            setEditingSlide(null);
            setFormData({ src: '', title: '' });
            setIsAddModalOpen(true);
          }} 
          className="bg-black hover:bg-zinc-800 text-white h-12 px-6 rounded-xl font-bold shadow-md flex items-center gap-2"
        >
          <Plus className="h-5 w-5 text-[#E91E8C]" /> Add New Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {slides.map((slide, index) => (
            <motion.div key={slide.id || index} layout initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}}>
              <Card className="border-0 shadow-md rounded-3xl bg-white overflow-hidden group relative transition-all duration-300 hover:shadow-xl border border-gray-100 flex flex-col">
                <div className="relative w-full h-60 bg-gray-900 overflow-hidden flex items-center justify-center">
                  <img 
                    src={slide.src} 
                    alt={slide.title || `Banner ${index + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#E91E8C] text-white">
                        Slide #{index + 1}
                      </span>
                      <h3 className="font-bold text-base mt-2 text-white drop-shadow-md truncate max-w-[200px]">
                        {slide.title || 'Homepage Banner'}
                      </h3>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      type="button"
                      onClick={() => openEdit(slide)} 
                      size="icon" 
                      variant="outline" 
                      className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border-0 hover:bg-white text-gray-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => handleDelete(slide.id)} 
                      size="icon" 
                      variant="outline" 
                      className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border-0 hover:bg-red-50 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {slides.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 flex flex-col items-center justify-center max-w-2xl mx-auto">
          <ImageIcon className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-1">No Custom Banners Yet</h3>
          <p className="text-sm text-gray-500 font-medium max-w-md mb-6">
            The homepage is currently displaying default high-resolution periodic banners. Upload your own banner images here to customize the customer slideshow.
          </p>
          <Button 
            onClick={() => {
              setEditingSlide(null);
              setFormData({ src: '', title: '' });
              setIsAddModalOpen(true);
            }} 
            className="bg-black hover:bg-zinc-800 text-white h-12 px-6 rounded-xl font-bold shadow-md"
          >
            Upload First Banner
          </Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-3xl p-8 bg-white border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingSlide ? 'Edit Banner Slide' : 'Add Homepage Banner'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 block">
                Banner Name / Tag (For Admin Reference)
              </Label>
              <Input 
                value={formData.title || ''} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Summer Wholesome Campaign Banner"
                className="h-12 rounded-xl border-gray-200 focus:border-[#E91E8C]"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                Banner Image (Recommended 1920x1080 or widescreen)
              </Label>
              
              {formData.src ? (
                <div className="relative rounded-2xl overflow-hidden h-52 bg-gray-900 border border-gray-200 group">
                  <img src={formData.src} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-white text-black font-bold rounded-xl text-xs shadow hover:bg-gray-100 transition-all flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-[#E91E8C]" /> Replace
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, src: '' })}
                      className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl text-xs shadow hover:bg-red-600 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 cursor-pointer transition-colors group p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#E91E8C]/10 text-[#E91E8C] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">Click to upload banner image</span>
                  <span className="text-xs text-gray-400 mt-1">Supports PNG, JPG, WebP (Max resolution: 1920px)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}

              <div className="pt-2">
                <Label className="text-[11px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" /> Or enter Image URL directly:
                </Label>
                <Input 
                  value={(formData.src && formData.src.startsWith('data:')) ? '' : (formData.src || '')} 
                  onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                  placeholder="https://example.com/banner-image.jpg"
                  className="h-10 text-xs rounded-xl border-gray-200"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setIsAddModalOpen(false); setEditingSlide(null); }}
                className="h-12 px-6 rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="h-12 px-8 rounded-xl font-bold bg-[#0a0806] hover:bg-[#E91E8C] text-white transition-all shadow-md"
              >
                {editingSlide ? 'Save Changes' : 'Publish Banner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
