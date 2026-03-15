import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { getOrders, archiveOrder, getStoredPassword, OrderItem } from '@/services/adminService';
import { AdminLang } from './useAdminLang';
import { toast } from 'sonner';
import { Archive, Loader2 } from 'lucide-react';

export function OrdersTab({ l }: { l: AdminLang }) {
  const { tr } = l;
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const pw = getStoredPassword();
    if (!pw) return;
    try {
      const data = await getOrders(pw);
      setOrders(data);
    } catch (err) {
      toast.error(tr('failed_load_orders'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleArchive(order: OrderItem) {
    if (!confirm(tr('confirm_archive'))) return;
    const pw = getStoredPassword();
    if (!pw) return;
    try {
      await archiveOrder(pw, order._rowIndex);
      toast.success(tr('order_archived'));
      await fetchOrders();
    } catch { toast.error(tr('failed_archive')); }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{tr('orders')} ({orders.length})</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('type')}</TableHead>
            <TableHead>{tr('name')}</TableHead>
            <TableHead>{tr('contact')}</TableHead>
            <TableHead>{tr('details')}</TableHead>
            <TableHead className="text-right">{tr('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => {
            const values = Object.entries(order)
              .filter(([k]) => k !== '_rowIndex')
              .map(([, v]) => String(v || '').trim())
              .filter(Boolean);
            return (
              <TableRow key={order._rowIndex}>
                <TableCell><Badge variant="outline">{values[0] || '—'}</Badge></TableCell>
                <TableCell className="font-medium">{values[1] || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{values[3] || values[4] || '—'}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{values[values.length - 1] || '—'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleArchive(order)}><Archive className="size-4" /></Button>
                </TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{tr('no_orders')}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
