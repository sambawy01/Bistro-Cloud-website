import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { adminList, adminArchive, getStoredPassword, OrderItem } from '@/services/adminService';
import { toast } from 'sonner';
import { Archive, Loader2 } from 'lucide-react';

export function OrdersTab() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const pw = getStoredPassword();
    if (!pw) return;
    try {
      const data = await adminList('Opportunities', pw) as OrderItem[];
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleArchive(order: OrderItem) {
    if (!confirm('Archive this order?')) return;
    const pw = getStoredPassword();
    if (!pw) return;
    try {
      await adminArchive(pw, order.row, String(order.row));
      toast.success('Order archived');
      await fetchOrders();
    } catch {
      toast.error('Failed to archive');
    }
  }

  const statusVariant = (s: string) => {
    const lower = (s || '').toLowerCase();
    if (lower === 'completed' || lower === 'delivered') return 'default' as const;
    if (lower === 'pending' || lower === 'new') return 'secondary' as const;
    return 'outline' as const;
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
        <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Order Summary</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.row}>
              <TableCell className="text-muted-foreground">{order.date || '—'}</TableCell>
              <TableCell>
                <div className="font-medium">{order.name || '—'}</div>
                {order.phone && <div className="text-xs text-muted-foreground">{order.phone}</div>}
              </TableCell>
              <TableCell className="max-w-xs truncate">{order.orderSummary || '—'}</TableCell>
              <TableCell>{order.orderTotal ? `${order.orderTotal} EGP` : '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(order.status)}>
                  {order.status || 'New'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleArchive(order)}>
                  <Archive className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No orders found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
