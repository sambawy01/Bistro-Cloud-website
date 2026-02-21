import { useState, useEffect } from 'react';
import { MenuItem } from './menuData';
import { PRODUCTS } from './productsData';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQhWKyAGcnrDwWDPDUyXdPZ8rR8iz5mtWqMsXzrz7xCzbD4ab5OwmwEGMzvy_B4QXy1Wobtvr_YUazl/pub?gid=0&single=true&output=csv';

function parseCSV(csv: string): string[][] {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let row: string[] = [];
    for (let i = 0; i < csv.length; i++) {
          const char = csv[i];
          const next = csv[i + 1];
          if (inQuotes) {
                  if (char === '"' && next === '"') { current += '"'; i++; }
                  else if (char === '"') { inQuotes = false; }
                  else { current += char; }
          } else {
                  if (char === '"') { inQuotes = true; }
                  else if (char === ',') { row.push(current.trim()); current = ''; }
                  else if (char === '\n' || (char === '\r' && next === '\n')) {
                            row.push(current.trim());
                            if (row.some(cell => cell !== '')) rows.push(row);
                            row = []; current = '';
                            if (char === '\r') i++;
                  } else { current += char; }
          }
    }
    if (current || row.length > 0) {
          row.push(current.trim());
          if (row.some(cell => cell !== '')) rows.push(row);
    }
    return rows;
}

function csvToItems(csv: string): MenuItem[] {
    const rows = parseCSV(csv);
    if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim());
    const col = (name: string) => headers.indexOf(name);

  return rows.slice(1).map((row): MenuItem | null => {
        try {
                // Check 'hidden' column first (sheet uses "hidden" not "status")
          const hiddenVal = (row[col('hidden')] || '').toLowerCase().trim();
                if (hiddenVal === 'hidden' || hiddenVal === 'true' || hiddenVal === 'yes') return null;

          // Fall back to 'status' column if it exists
          const status = (row[col('status')] || 'available').toLowerCase().trim();
                if (status === 'hidden') return null;

          const dietaryRaw = row[col('dietary')] || '';
                const dietary = dietaryRaw
                  ? dietaryRaw.split(',').map(d => d.trim()).filter(Boolean)
                          : undefined;

          const price = Number(row[col('price')]);
                if (!row[col('name')] || isNaN(price)) return null;

          return {
                    id: row[col('id')] || String(Math.random()),
                    name: row[col('name')] || '',
                    description: row[col('description')] || '',
                    price,
                    category: row[col('category')] || 'General',
                    image: row[col('image')] || '',
                    dietary,
                    status: (['available', 'limited', 'sold_out'].includes(status)
                                       ? status
                                       : 'available') as MenuItem['status'],
          };
        } catch {
                return null;
        }
  }).filter((item): item is MenuItem => item !== null);
}

export function useProductsData() {
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(!!SHEET_CSV_URL);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
        if (!SHEET_CSV_URL) {
                setLoading(false);
                return;
        }

                let cancelled = false;

                async function fetchProducts() {
                        try {
                                  const response = await fetch(SHEET_CSV_URL + '&_t=' + Date.now(), {
                                              cache: 'no-store',
                                  });
                                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                                  const csv = await response.text();
                                  const items = csvToItems(csv);

                          if (!cancelled) {
                                      if (items.length > 0) {
                                                    setProducts(items);
                                      } else {
                                                    setError('Sheet returned no valid items');
                                      }
                                      setLoading(false);
                          }
                        } catch (err) {
                                  if (!cancelled) {
                                              setError(`Fetch failed: ${err}`);
                                              setLoading(false);
                                  }
                        }
                }

                fetchProducts();
        return () => { cancelled = true; };
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(item => item.category)))];

  return { products, categories, loading, error };
}
