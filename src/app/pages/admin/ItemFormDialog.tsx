import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { AdminLang } from './useAdminLang';
import { Upload, X } from 'lucide-react';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminItem | null;
  sheetType: 'Menu' | 'Products';
  onSave: (data: Record<string, string>) => Promise<void>;
  l: AdminLang;
}

const MENU_CATEGORIES = ['Mains', 'Salads', 'Sides', 'Desserts', 'Drinks', 'Breakfast', 'Ramadan'];
const PRODUCT_CATEGORIES = ['Pantry', 'Tallow', 'Broth', 'Sauces', 'Spices', 'Snacks'];
const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'GF', 'Keto', 'Carnivore', 'High Protein', 'Dairy-Free'];
const STATUS_OPTIONS = ['available', 'limited', 'sold_out', 'hidden'];

function parseDietary(raw: string): string[] {
  if (!raw) return [];
  // Support both comma and dot separators
  return raw.split(/[,.]/).map(d => d.trim()).filter(Boolean);
}

export function ItemFormDialog({ open, onOpenChange, item, sheetType, onSave, l }: ItemFormDialogProps) {
  const { tr } = l;
  const baseCategories = sheetType === 'Menu' ? MENU_CATEGORIES : PRODUCT_CATEGORIES;
  // Include the item's current category if it's not in the preset list
  const categories = useMemo(() => {
    if (item?.category && !baseCategories.some(c => c.toLowerCase() === item.category.toLowerCase())) {
      return [item.category, ...baseCategories];
    }
    return baseCategories;
  }, [item, baseCategories]);

  const isEdit = !!item;

  // Initial values for dirty checking
  const initName = item?.name || '';
  const initDescription = item?.description || '';
  const initPrice = item?.price?.toString() || '';
  const initCategory = item?.category || categories[0];
  const initDietary = parseDietary(item?.dietary || '');
  const initStatus = item?.status || 'available';
  const initHidden = item?.hidden === 'true' || item?.hidden === 'hidden' || item?.hidden === 'yes';
  const initImage = item?.image || '';

  const [name, setName] = useState(initName);
  const [description, setDescription] = useState(initDescription);
  const [price, setPrice] = useState(initPrice);
  const [category, setCategory] = useState(initCategory);
  const [dietary, setDietary] = useState<string[]>(initDietary);
  const [status, setStatus] = useState(initStatus);
  const [hidden, setHidden] = useState(initHidden);
  const [imageUrl, setImageUrl] = useState(initImage);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = isEdit ? (
    name !== initName ||
    description !== initDescription ||
    price !== initPrice ||
    category !== initCategory ||
    status !== initStatus ||
    hidden !== initHidden ||
    imageUrl !== initImage ||
    dietary.sort().join(',') !== [...initDietary].sort().join(',')
  ) : true; // For new items, always allow save

  const canSave = name.trim() !== '' && price.trim() !== '' && isDirty;

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
    if (!canSave) return;
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
          <DialogTitle>{isEdit ? tr('edit_item') : tr('add_new_item')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">{tr('name')} *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={tr('item_name')} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{tr('description')}</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={tr('item_description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{tr('price_egp')} *</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{tr('category')}</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{tr('status')}</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{tr(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{tr('dietary_tags')}</label>
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
            <label className="text-sm font-medium mb-1 block">{tr('image')}</label>
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
                <p className="text-sm text-muted-foreground">{tr('uploading')}</p>
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
                  <p className="text-sm text-muted-foreground">{tr('drop_image')}</p>
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
            <Switch checked={hidden} onCheckedChange={setHidden} className="data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-400" />
            <label className="text-sm font-medium">{tr('hidden_from_site')}</label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {tr('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? tr('saving') : isEdit ? tr('update') : tr('add_item')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
