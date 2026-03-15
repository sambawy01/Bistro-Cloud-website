import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import {
  AdminItem, adminList, adminAdd, adminUpdate, adminDelete, adminToggle, getStoredPassword,
} from '@/services/adminService';
import { ItemFormDialog } from './ItemFormDialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export function MenuTab() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminItem | null>(null);

  const fetchItems = useCallback(async () => {
    const pw = getStoredPassword();
    if (!pw) return;
    try {
      const data = await adminList('Menu', pw) as AdminItem[];
      setItems(data);
    } catch (err) {
      toast.error('Failed to load menu items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openAdd() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: AdminItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  async function handleSave(data: Record<string, string>) {
    const pw = getStoredPassword();
    if (!pw) return;
    if (editItem) {
      await adminUpdate('Menu', pw, editItem.row, data);
      toast.success('Item updated');
    } else {
      await adminAdd('Menu', pw, data);
      toast.success('Item added');
    }
    await fetchItems();
  }

  async function handleDelete(item: AdminItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const pw = getStoredPassword();
    if (!pw) return;
    try {
      await adminDelete('Menu', pw, item.row, item.id);
      toast.success('Item deleted');
      await fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function handleToggleHidden(item: AdminItem) {
    const pw = getStoredPassword();
    if (!pw) return;
    const newVal = item.hidden === 'true' || item.hidden === 'hidden' || item.hidden === 'yes' ? '' : 'true';
    try {
      await adminToggle('Menu', pw, item.row, 'hidden', newVal);
      await fetchItems();
    } catch {
      toast.error('Failed to toggle visibility');
    }
  }

  const statusVariant = (s: string) => {
    if (s === 'available') return 'default' as const;
    if (s === 'limited') return 'secondary' as const;
    return 'destructive' as const;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Menu Items ({items.length})</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="size-4 mr-1" /> Add Item
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Visible</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const isHidden = item.hidden === 'true' || item.hidden === 'hidden' || item.hidden === 'yes';
            return (
              <TableRow key={item.row} className={isHidden ? 'opacity-50' : ''}>
                <TableCell>
                  {item.image ? (
                    <img src={item.image} alt="" className="size-10 rounded object-cover" />
                  ) : (
                    <div className="size-10 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.price} EGP</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>
                    {(item.status || 'available').replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!isHidden}
                    onCheckedChange={() => handleToggleHidden(item)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No menu items found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        sheetType="Menu"
        onSave={handleSave}
      />
    </div>
  );
}
