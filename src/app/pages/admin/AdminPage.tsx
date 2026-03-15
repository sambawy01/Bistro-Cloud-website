import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { getStoredPassword, clearStoredPassword, verifyPassword } from '@/services/adminService';
import { useAdminLang } from './useAdminLang';
import { AdminLogin } from './AdminLogin';
import { MenuTab } from './MenuTab';
import { PantryTab } from './PantryTab';
import { RamadanTab } from './RamadanTab';
import { InventoryTab } from './InventoryTab';
import { RequisitionsTab } from './RequisitionsTab';
import { LogOut, Loader2, Globe, Warehouse, Languages, UtensilsCrossed, Package, Moon, ClipboardList, BoxesIcon } from 'lucide-react';

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [section, setSection] = useState<'website' | 'inventory'>('website');
  const l = useAdminLang();
  const { tr, lang, setLang, dir } = l;

  useEffect(() => {
    const pw = getStoredPassword();
    if (!pw) {
      setChecking(false);
      return;
    }
    verifyPassword(pw).then(valid => {
      if (valid) setAuthed(true);
      else clearStoredPassword();
      setChecking(false);
    });
  }, []);

  function handleLogout() {
    clearStoredPassword();
    setAuthed(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F5F0]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div dir={dir}>
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
            <Languages className="size-4 mr-1" /> {lang === 'en' ? 'عربي' : 'English'}
          </Button>
        </div>
        <AdminLogin onLogin={() => setAuthed(true)} l={l} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F5F0]" dir={dir}>
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#2C3E50]">{tr('bistro_cloud')}</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{tr('admin')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
              <Languages className="size-4 mr-1" /> {lang === 'en' ? 'عربي' : 'English'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="size-4 mr-1" /> {tr('logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Top-level section switcher */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 py-1">
          <button
            onClick={() => setSection('website')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              section === 'website'
                ? 'bg-[#2C3E50] text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Globe className="size-4" /> {tr('section_website')}
          </button>
          <button
            onClick={() => setSection('inventory')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              section === 'inventory'
                ? 'bg-[#2C3E50] text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Warehouse className="size-4" /> {tr('section_inventory')}
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {section === 'website' && (
          <Tabs defaultValue="menu">
            <TabsList className="mb-6">
              <TabsTrigger value="menu">
                <UtensilsCrossed className="size-4 mr-1.5" /> {tr('menu')}
              </TabsTrigger>
              <TabsTrigger value="ramadan">
                <Moon className="size-4 mr-1.5" /> {tr('ramadan')}
              </TabsTrigger>
              <TabsTrigger value="pantry">
                <Package className="size-4 mr-1.5" /> {tr('pantry')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="menu"><MenuTab l={l} /></TabsContent>
            <TabsContent value="ramadan"><RamadanTab l={l} /></TabsContent>
            <TabsContent value="pantry"><PantryTab l={l} /></TabsContent>
          </Tabs>
        )}

        {section === 'inventory' && (
          <Tabs defaultValue="stock">
            <TabsList className="mb-6">
              <TabsTrigger value="stock">
                <BoxesIcon className="size-4 mr-1.5" /> {tr('inv_stock_items')}
              </TabsTrigger>
              <TabsTrigger value="requisitions">
                <ClipboardList className="size-4 mr-1.5" /> {tr('requisitions')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock"><InventoryTab l={l} /></TabsContent>
            <TabsContent value="requisitions"><RequisitionsTab l={l} /></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
