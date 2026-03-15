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
  deductByRecipe, deductManual, restockItem, getRecipeFor,
} from '@/services/inventoryService';
import { RecipeManagerDialog } from './RecipeManagerDialog';
import { AdminLang } from './useAdminLang';
import { toast } from 'sonner';
import { Loader2, BookOpen, Minus, PackagePlus, ClipboardList } from 'lucide-react';

const DEDUCTION_REASONS = ['Kitchen Use', 'Waste', 'Staff Meal', 'Other'];

export function RequisitionsTab({ l }: { l: AdminLang }) {
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
  const [deducting, setDeducting] = useState(false);

  // Manual deduction state
  const [manualItem, setManualItem] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualReason, setManualReason] = useState(DEDUCTION_REASONS[0]);
  const [manualPerformedBy, setManualPerformedBy] = useState('');
  const [manualDeducting, setManualDeducting] = useState(false);

  // Restock state
  const [restockItemName, setRestockItemName] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockPerformedBy, setRestockPerformedBy] = useState('');
  const [restocking, setRestocking] = useState(false);

  // All known recipes for menu item list
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

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

  // Load recipe ingredients when menu item changes
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

  async function handleRecipeDeduct() {
    if (!selectedMenuItem || Number(portions) < 1) return;
    setDeducting(true);
    try {
      await deductByRecipe(selectedMenuItem, Number(portions), recipePerformedBy.trim() || 'Admin', stockItems);
      toast.success(tr('inv_deducted_recipe'));
      setSelectedMenuItem(''); setPortions('1'); setRecipeIngredients([]); setRecipePerformedBy('');
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_deduct'));
    } finally {
      setDeducting(false);
    }
  }

  async function handleManualDeduct() {
    if (!manualItem || Number(manualQty) < 1) return;
    setManualDeducting(true);
    try {
      await deductManual(manualItem, Number(manualQty), manualReason, manualPerformedBy.trim() || 'Admin', stockItems);
      toast.success(tr('inv_deducted_manual'));
      setManualItem(''); setManualQty(''); setManualPerformedBy('');
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_deduct'));
    } finally {
      setManualDeducting(false);
    }
  }

  async function handleRestock() {
    if (!restockItemName || Number(restockQty) < 1) return;
    const item = stockItems.find(s => s.name === restockItemName);
    if (!item) return;
    setRestocking(true);
    try {
      await restockItem(item._rowIndex, Number(restockQty), restockPerformedBy.trim() || 'Admin', item);
      toast.success(tr('inv_restocked'));
      setRestockItemName(''); setRestockQty(''); setRestockPerformedBy('');
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || tr('inv_failed_restock'));
    } finally {
      setRestocking(false);
    }
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
      {/* Action cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recipe Deduction Card */}
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
            <Input value={recipePerformedBy} onChange={e => setRecipePerformedBy(e.target.value)} placeholder="Admin" className="h-8" />
          </div>
          <Button
            onClick={handleRecipeDeduct}
            disabled={deducting || !selectedMenuItem || Number(portions) < 1}
            className="w-full"
            size="sm"
          >
            {deducting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Minus className="size-4 mr-1" />}
            {tr('inv_deduct_stock')}
          </Button>
        </div>

        {/* Manual Deduction Card */}
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
            <Input value={manualPerformedBy} onChange={e => setManualPerformedBy(e.target.value)} placeholder="Admin" className="h-8" />
          </div>
          <Button
            onClick={handleManualDeduct}
            disabled={manualDeducting || !manualItem || Number(manualQty) < 1}
            className="w-full"
            size="sm"
            variant="secondary"
          >
            {manualDeducting ? <Loader2 className="size-4 animate-spin mr-1" /> : <Minus className="size-4 mr-1" />}
            {tr('inv_deduct_stock')}
          </Button>
        </div>

        {/* Restock Card */}
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
            <Input value={restockPerformedBy} onChange={e => setRestockPerformedBy(e.target.value)} placeholder="Admin" className="h-8" />
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
      </div>

      {/* Manage Recipes Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tr('inv_requisition_log')} ({requisitions.length})</h2>
        <Button variant="outline" size="sm" onClick={() => setRecipeDialogOpen(true)}>
          <ClipboardList className="size-4 mr-1" /> {tr('inv_manage_recipes')}
        </Button>
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
              <TableCell className="text-sm text-muted-foreground">{req.performed_by}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{req.notes}</TableCell>
            </TableRow>
          ))}
          {requisitions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{tr('inv_no_requisitions')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <RecipeManagerDialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen} l={l} />
    </div>
  );
}
