import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { uploadToImgBB } from '@/services/imgbbService';
import { AdminItem } from '@/services/adminService';
import { Upload, X } from 'lucide-react';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminItem | null; // null = add mode
  sheetType: 'Menu' | 'Products';
  onSave: (data: Record<string, string>) => Promise<void>;
}

const MENU_CATEGORIES = ['Mains', 'Salads', 'Sides', 'Desserts', 'Drinks', 'Breakfast'];
const PRODUCT_CATEGORIES = ['Tallow', 'Broth', 'Sauces', 'Spices', 'Snacks'];
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'GF', 'Keto', 'Carnivore', 'High Protein', 'Dairy-Free'];
const STATUS_OPTIONS = ['available', 'limited', 'sold_out'];

export function ItemFormDialog({ open, onOpenChange, item, sheetType, onSave }: ItemFormDialogProps) {
  const categories = sheetType === 'Menu' ? MENU_CATEGORIES : PRODUCT_CATEGORIES;
  const isEdit = !!item;

  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [category, setCategory] = useState(item?.category || categories[0]);
  const [dietary, setDietary] = useState<string[]>(
    item?.dietary ? item.dietary.split(',').map(d => d.trim()).filter(Boolean) : []
  );
  const [status, setStatus] = useState(item?.status || 'available');
  const [hidden, setHidden] = useState(item?.hidden === 'true' || item?.hidden === 'hidden' || item?.hidden === 'yes');
  const [imageUrl, setImageUrl] = useState(item?.image || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await uploadToImgBB(file);
      setImageUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }

  function toggleDietary(tag: string) {
    setDietary(prev =>
      prev.includes(tag) ? prev.filter(d => d !== tag) : [...prev, tag]
    );
  }

  async function handleSave() {
    if (!name.trim() || !price.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: price.trim(),
        category,
        dietary: dietary.join(', '),
        status,
        hidden: hidden ? 'true' : '',
        image: imageUrl,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Item description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Price (EGP) *</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleDietary(tag)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    dietary.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Image</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              {uploading ? (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              ) : imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="Preview" className="h-24 rounded-md object-cover" />
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setImageUrl(''); }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drop image or click to upload</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={hidden} onCheckedChange={setHidden} />
            <label className="text-sm font-medium">Hidden from public site</label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || !price.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
