const ADMIN_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzN-s2iKeyjIC_k-wyNzj6QHOO5eoW14EqWo7fC4kYzYzqyMOygZpCDPpyqPVxhFA/exec';

import { getStoredPassword } from './adminService';

async function apiGet<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ADMIN_ENDPOINT}?${qs}`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function pw(): string {
  const p = getStoredPassword();
  if (!p) throw new Error('Not authenticated');
  return p;
}

// ── Inventory Interfaces ──

export interface StockItem {
  _rowIndex: number;
  id: number | string;
  name: string;
  category: string;
  unit: string;
  qty_on_hand: number;
  min_level: number;
  cost_per_unit: number;
  supplier: string;
  last_restocked: string;
  notes: string;
}

export interface Recipe {
  _rowIndex: number;
  id: number | string;
  menu_item: string;
  ingredient: string;
  qty_needed: number;
  unit: string;
}

export interface Requisition {
  _rowIndex: number;
  date: string;
  type: string;
  item_name: string;
  quantity: number;
  direction: string;
  performed_by: string;
  notes: string;
}

// ── Stock CRUD (matches deployed: getStock, addStockItem, editStockItem, deleteStockItem) ──

export async function getInventory(): Promise<StockItem[]> {
  const res = await apiGet<{ success: boolean; items?: StockItem[]; error?: string }>({
    action: 'getStock',
    password: pw(),
  });
  if (!res.success) throw new Error(res.error || 'Failed to fetch inventory');
  return res.items || [];
}

export async function addInventoryItem(item: Record<string, string>): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'addStockItem',
    password: pw(),
    item: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to add inventory item');
}

export async function editInventoryItem(rowIndex: number, item: Record<string, string>): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'editStockItem',
    password: pw(),
    rowIndex: String(rowIndex),
    item: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to update inventory item');
}

export async function deleteInventoryItem(rowIndex: number): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'deleteStockItem',
    password: pw(),
    rowIndex: String(rowIndex),
  });
  if (!res.success) throw new Error(res.error || 'Failed to delete inventory item');
}

/**
 * Restock: updates stock qty via editStockItem, then logs a Restock requisition.
 * Done client-side since the deployed API uses generic CRUD.
 */
export async function restockItem(rowIndex: number, quantity: number, performedBy: string, currentItem: StockItem): Promise<void> {
  const newQty = Number(currentItem.qty_on_hand) + quantity;
  const today = new Date().toISOString().split('T')[0];

  // Update stock quantity + last_restocked
  await editInventoryItem(rowIndex, {
    qty_on_hand: String(newQty),
    last_restocked: today,
  });

  // Log the requisition
  await addRequisition({
    date: today,
    type: 'Restock',
    item_name: currentItem.name,
    quantity: String(quantity),
    direction: 'IN',
    performed_by: performedBy,
    notes: 'Restocked +' + quantity,
  });
}

// ── Recipe CRUD (matches deployed: getRecipes, addRecipe, editRecipe, deleteRecipe) ──

export async function getRecipes(): Promise<Recipe[]> {
  const res = await apiGet<{ success: boolean; items?: Recipe[]; error?: string }>({
    action: 'getRecipes',
    password: pw(),
  });
  if (!res.success) throw new Error(res.error || 'Failed to fetch recipes');
  return res.items || [];
}

/** Client-side filter — fetches all recipes then filters by menu_item */
export async function getRecipeFor(menuItem: string): Promise<Recipe[]> {
  const all = await getRecipes();
  return all.filter(r => String(r.menu_item).toLowerCase() === menuItem.toLowerCase());
}

export async function addRecipe(item: Record<string, string>): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'addRecipe',
    password: pw(),
    item: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to add recipe');
}

export async function editRecipe(rowIndex: number, item: Record<string, string>): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'editRecipe',
    password: pw(),
    rowIndex: String(rowIndex),
    item: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to update recipe');
}

export async function deleteRecipe(rowIndex: number): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'deleteRecipe',
    password: pw(),
    rowIndex: String(rowIndex),
  });
  if (!res.success) throw new Error(res.error || 'Failed to delete recipe');
}

// ── Requisitions (matches deployed: getRequisitions, addRequisition, editRequisition, deleteRequisition) ──

export async function getRequisitions(): Promise<Requisition[]> {
  const res = await apiGet<{ success: boolean; items?: Requisition[]; error?: string }>({
    action: 'getRequisitions',
    password: pw(),
  });
  if (!res.success) throw new Error(res.error || 'Failed to fetch requisitions');
  return res.items || [];
}

export async function addRequisition(item: Record<string, string>): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'addRequisition',
    password: pw(),
    item: JSON.stringify(item),
  });
  if (!res.success) throw new Error(res.error || 'Failed to add requisition');
}

export async function deleteRequisition(rowIndex: number): Promise<void> {
  const res = await apiGet<{ success: boolean; error?: string }>({
    action: 'deleteRequisition',
    password: pw(),
    rowIndex: String(rowIndex),
  });
  if (!res.success) throw new Error(res.error || 'Failed to delete requisition');
}

/**
 * Deduct by recipe: fetch recipe ingredients, update each stock item, log requisitions.
 * Multi-step client-side since the deployed API is generic CRUD.
 */
export async function deductByRecipe(
  menuItem: string,
  portions: number,
  performedBy: string,
  stockItems: StockItem[]
): Promise<void> {
  const ingredients = await getRecipeFor(menuItem);
  if (ingredients.length === 0) throw new Error('No recipe found for "' + menuItem + '"');

  const today = new Date().toISOString().split('T')[0];

  for (const ing of ingredients) {
    const totalNeeded = Number(ing.qty_needed) * portions;
    const stockItem = stockItems.find(
      s => s.name.toLowerCase() === String(ing.ingredient).toLowerCase()
    );

    if (stockItem) {
      const newQty = Math.max(0, Number(stockItem.qty_on_hand) - totalNeeded);
      await editInventoryItem(stockItem._rowIndex, { qty_on_hand: String(newQty) });
    }

    await addRequisition({
      date: today,
      type: 'Recipe',
      item_name: String(ing.ingredient),
      quantity: String(totalNeeded),
      direction: 'OUT',
      performed_by: performedBy,
      notes: menuItem + ' x' + portions + (stockItem ? '' : ' (NOT IN STOCK)'),
    });
  }
}

/**
 * Manual deduction: update stock item qty, log requisition.
 */
export async function deductManual(
  itemName: string,
  quantity: number,
  reason: string,
  performedBy: string,
  stockItems: StockItem[]
): Promise<void> {
  const stockItem = stockItems.find(s => s.name === itemName);
  if (!stockItem) throw new Error('Stock item "' + itemName + '" not found');

  const newQty = Math.max(0, Number(stockItem.qty_on_hand) - quantity);
  const today = new Date().toISOString().split('T')[0];

  await editInventoryItem(stockItem._rowIndex, { qty_on_hand: String(newQty) });

  await addRequisition({
    date: today,
    type: 'Manual',
    item_name: itemName,
    quantity: String(quantity),
    direction: 'OUT',
    performed_by: performedBy,
    notes: reason,
  });
}
