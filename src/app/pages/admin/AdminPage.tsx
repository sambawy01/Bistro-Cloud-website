import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { getStoredPassword, clearStoredPassword, verifyPassword } from '@/services/adminService';
import { useAdminLang } from './useAdminLang';
import { AdminLogin } from './AdminLogin';
import { MenuTab } from './MenuTab';
import { PantryTab } from './PantryTab';
import { RamadanTab } from './RamadanTab';
import { LogOut, Loader2, UtensilsCrossed, Package, Moon, Languages } from 'lucide-react';

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
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

      <main className="max-w-6xl mx-auto px-4 py-6">
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
      </main>
    </div>
  );
}
