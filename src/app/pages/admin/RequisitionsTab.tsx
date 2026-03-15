import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  StockItem, Recipe, Requisition,
  getInventory, getRecipes, getRequisitions,
  restockItem, getRecipeFor,
  submitRecipeRequisition, submitManualRequisition,
  approveRequisition, rejectRequisition,
} from '@/services/inventoryService';
import { Role } from '@/services/adminService';
import { RecipeManagerDialog } from './RecipeManagerDialog';
import { AdminLang } from './useAdminLang';
import { toast } from 'sonner';
import { Loader2, BookOpen, Minus, PackagePlus, ClipboardList, Check, X } from 'lucide-react';

const DEDUCTION_REASONS = ['Kitchen Use', 'Waste', 'Staff Meal', 'Other'];

export function RequisitionsTab({ l, role }: { l: AdminLang; role: Role }) {
  const { tr } = l;
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);

  // Recipe deduction state
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<Recipe[]>([]);
  const [portions, setPortions] = useState('1');
  const [recipePerformedBy, setRecipePerformedBy] = useState('');
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Manual deduction state
  const [manualItem, setManualItem] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualReason, setManualReason] = useState(DEDUCTION_REASONS[0]);
  const [manualPerformedBy, setManualPerformedBy] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Restock state (accounting only)
  const [restockItemName, setRestockItemName] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockPerformedBy, setRestockPerformedBy] = useState('');
  const [restocking, setRestocking] = useState(false);

  // Approving state
  const [approvingRow, setApprovingRow] = useState<number | null>(null);

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  const isChef = role === 'chef';
  const canApprove = role === 'admin' || role === 'accounting';
  const canRestock = role === 'admin' || role === 'accounting';
  const canSubmitReqs = role === 'admin' || role === 'chef';
  const canManageRecipes = role === 'admin' || role === 'chef';

  const fetchAll = useCallback(async () => {
    try {
      const [inv, reqs, recs] = await Promise.all([
        getInventory(), getRequisitions(), getRecipes(),
      ]);
      setStockItems(inv);
      setRequisitions(reqs);
      setAllRecipes(recs);
    } catch (err) {
      toast.error(tr('inv_failed_load'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tr]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const menuItems = [...new Set(allRecipes.map(r => r.menu_item))].sort();
  const pendingReqs = requisitions.filter(r => r.status === 'Pending');

  async function handleMenuItemChange(menuItem: string) {
    setSelectedMenuItem(menuItem);
    if (!menuItem) { setRecipeIngredients([]); return; }
    setLoadingRecipe(true);
    try {
      const ingredients = await getRecipeFor(menuItem);
      setRecipeIngredients(ingredients);
    } catch (err) {
      console.error(err);
      setRecipeIngredients([]);
    } finally {
      setLoadingRecipe(false);
    }
  }

  async function handleRecipeSubmit() {
    if (!selectedMenuItem || Number(portions) < 1) return;
    setSubmitting(true);
    try {
      await submitRecipeRequisition(selectedMenuItem, Number(portions), recipePerformedBy.trim() || 'Chef');
      toast.success(tr('inv_req_submitted'));
      setSelectedMenuItem(''); setPortions('1'); setRecipeIngredients([]); setRecipePerformedBy('');
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_submit'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleManualSubmit() {
    if (!manualItem || Number(manualQty) < 1) return;
    setManualSubmitting(true);
    try {
      await submitManualRequisition(manualItem, Number(manualQty), manualReason, manualPerformedBy.trim() || 'Chef');
      toast.success(tr('inv_req_submitted'));
      setManualItem(''); setManualQty(''); setManualPerformedBy('');
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_submit'));
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleRestock() {
    if (!restockItemName || Number(restockQty) < 1) return;
    const item = stockItems.find(s => s.name === restockItemName);
    if (!item) return;
    setRestocking(true);
    try {
      await restockItem(item._rowIndex, Number(restockQty), restockPerformedBy.trim() || 'Accounting', item);
      toast.success(tr('inv_restocked'));
      setRestockItemName(''); setRestockQty(''); setRestockPerformedBy('');
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_restock'));
    } finally {
      setRestocking(false);
    }
  }

  async function handleApprove(req: Requisition) {
    setApprovingRow(req._rowIndex);
    try {
      await approveRequisition(req._rowIndex);
      toast.success(tr('inv_req_approved'));
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_approve'));
    } finally {
      setApprovingRow(null);
    }
  }

  async function handleReject(req: Requisition) {
    if (!confirm(tr('inv_confirm_reject') + ` "${req.item_name}"?`)) return;
    setApprovingRow(req._rowIndex);
    try {
      await rejectRequisition(req._rowIndex);
      toast.success(tr('inv_req_rejected'));
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_reject'));
    } finally {
      setApprovingRow(null);
    }
  }

  function statusBadge(status: string) {
    if (status === 'Approved') return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{tr('inv_status_approved')}</Badge>;
    if (status === 'Rejected') return <Badge variant="destructive">{tr('inv_status_rejected')}</Badge>;
    if (status === 'Pending') return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">{tr('inv_status_pending')}</Badge>;
    return <Badge variant="secondary">{status || '—'}</Badge>;
  }

  function directionBadge(dir: string) {
    if (dir === 'IN') return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">IN</Badge>;
    return <Badge variant="destructive">OUT</Badge>;
  }

  function typeBadge(type: string) {
    const colors: Record<string, string> = {
      'Recipe': 'bg-blue-100 text-blue-800',
      'Manual': 'bg-amber-100 text-amber-800',
      'Restock': 'bg-green-100 text-green-800',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Requisitions Banner — accounting/admin */}
      {canApprove && pendingReqs.length > 0 && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2">
            <ClipboardList className="size-5" />
            {tr('inv_pending_requests')} ({pendingReqs.length})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr('inv_date')}</TableHead>
                <TableHead>{tr('type')}</TableHead>
                <TableHead>{tr('name')}</TableHead>
                <TableHead>{tr('inv_quantity')}</TableHead>
                <TableHead>{tr('inv_performed_by')}</TableHead>
                <TableHead>{tr('inv_notes')}</TableHead>
                <TableHead className="text-right">{tr('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReqs.map(req => (
                <TableRow key={req._rowIndex} className="bg-amber-50/50">
                  <TableCell className="text-sm">{req.date}</TableCell>
                  <TableCell>{typeBadge(req.type)}</TableCell>
                  <TableCell className="font-medium">{req.item_name}</TableCell>
                  <TableCell>{req.quantity}</TableCell>
                  <TableCell className="text-sm">{req.performed_by}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{req.notes}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-7 px-2"
                        onClick={() => handleApprove(req)}
                        disabled={approvingRow === req._rowIndex}
                      >
                        {approvingRow === req._rowIndex ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3 mr-1" />}
                        {tr('inv_approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2"
                        onClick={() => handleReject(req)}
                        disabled={approvingRow === req._rowIndex}
                      >
                        <X className="size-3 mr-1" /> {tr('inv_reject')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Action cards */}
      <div className={`grid gap-4 ${canRestock && canSubmitReqs ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {/* Recipe Deduction Card — chef & admin */}
        {canSubmitReqs && (
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <BookOpen className="size-4 text-blue-600" /> {tr('inv_recipe_deduction')}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_menu_item')}</label>
              <select
                value={selectedMenuItem}
                onChange={e => handleMenuItemChange(e.target.value)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">{tr('inv_select_menu_item')}</option>
                {menuItems.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {loadingRecipe && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            {recipeIngredients.length > 0 && (
              <div className="text-xs space-y-1 bg-muted/50 rounded p-2">
                {recipeIngredients.map((ing, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{ing.ingredient}</span>
                    <span className="text-muted-foreground">{Number(ing.qty_needed) * Number(portions)} {ing.unit}</span>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_portions')}</label>
              <Input type="number" value={portions} onChange={e => setPortions(e.target.value)} min="1" className="h-8" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_performed_by')}</label>
              <Input value={recipePerformedBy} onChange={e => setRecipePerformedBy(e.target.value)} placeholder={isChef ? 'Chef' : 'Admin'} className="h-8" />
            </div>
            <Button
              onClick={handleRecipeSubmit}
              disabled={submitting || !selectedMenuItem || Number(portions) < 1}
              className="w-full"
              size="sm"
            >
              {submitting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Minus className="size-4 mr-1" />}
              {isChef ? tr('inv_submit_requisition') : tr('inv_deduct_stock')}
            </Button>
          </div>
        )}

        {/* Manual Deduction Card — chef & admin */}
        {canSubmitReqs && (
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Minus className="size-4 text-amber-600" /> {tr('inv_manual_deduction')}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_stock_item')}</label>
              <select
                value={manualItem}
                onChange={e => setManualItem(e.target.value)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">{tr('inv_select_item')}</option>
                {stockItems.map(s => <option key={s._rowIndex} value={s.name}>{s.name} ({s.qty_on_hand} {s.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_quantity')}</label>
              <Input type="number" value={manualQty} onChange={e => setManualQty(e.target.value)} min="1" className="h-8" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_reason')}</label>
              <select
                value={manualReason}
                onChange={e => setManualReason(e.target.value)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {DEDUCTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_performed_by')}</label>
              <Input value={manualPerformedBy} onChange={e => setManualPerformedBy(e.target.value)} placeholder={isChef ? 'Chef' : 'Admin'} className="h-8" />
            </div>
            <Button
              onClick={handleManualSubmit}
              disabled={manualSubmitting || !manualItem || Number(manualQty) < 1}
              className="w-full"
              size="sm"
              variant="secondary"
            >
              {manualSubmitting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Minus className="size-4 mr-1" />}
              {isChef ? tr('inv_submit_requisition') : tr('inv_deduct_stock')}
            </Button>
          </div>
        )}

        {/* Restock Card — accounting & admin only */}
        {canRestock && (
          <div className="rounded-lg border bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <PackagePlus className="size-4 text-green-600" /> {tr('inv_restock')}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_stock_item')}</label>
              <select
                value={restockItemName}
                onChange={e => setRestockItemName(e.target.value)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-input-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="">{tr('inv_select_item')}</option>
                {stockItems.map(s => <option key={s._rowIndex} value={s.name}>{s.name} ({s.qty_on_hand} {s.unit})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_quantity')}</label>
              <Input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} min="1" className="h-8" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{tr('inv_performed_by')}</label>
              <Input value={restockPerformedBy} onChange={e => setRestockPerformedBy(e.target.value)} placeholder="Accounting" className="h-8" />
            </div>
            <Button
              onClick={handleRestock}
              disabled={restocking || !restockItemName || Number(restockQty) < 1}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {restocking ? <Loader2 className="size-4 animate-spin mr-1" /> : <PackagePlus className="size-4 mr-1" />}
              {tr('inv_add_stock')}
            </Button>
          </div>
        )}
      </div>

      {/* Manage Recipes — chef & admin */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tr('inv_requisition_log')} ({requisitions.length})</h2>
        {canManageRecipes && (
          <Button variant="outline" size="sm" onClick={() => setRecipeDialogOpen(true)}>
            <ClipboardList className="size-4 mr-1" /> {tr('inv_manage_recipes')}
          </Button>
        )}
      </div>

      {/* Requisitions Log Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{tr('inv_date')}</TableHead>
            <TableHead>{tr('type')}</TableHead>
            <TableHead>{tr('name')}</TableHead>
            <TableHead>{tr('inv_quantity')}</TableHead>
            <TableHead>{tr('inv_direction')}</TableHead>
            <TableHead>{tr('status')}</TableHead>
            <TableHead>{tr('inv_performed_by')}</TableHead>
            <TableHead>{tr('inv_notes')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requisitions.map((req, idx) => (
            <TableRow key={req._rowIndex}>
              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
              <TableCell className="text-sm">{req.date}</TableCell>
              <TableCell>{typeBadge(req.type)}</TableCell>
              <TableCell className="font-medium">{req.item_name}</TableCell>
              <TableCell>{req.quantity}</TableCell>
              <TableCell>{directionBadge(req.direction)}</TableCell>
              <TableCell>{statusBadge(req.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{req.performed_by}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{req.notes}</TableCell>
            </TableRow>
          ))}
          {requisitions.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{tr('inv_no_requisitions')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {canManageRecipes && (
        <RecipeManagerDialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen} l={l} />
      )}
    </div>
  );
}
