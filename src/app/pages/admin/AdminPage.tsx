import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { getStoredPassword, clearStoredPassword, verifyPassword } from '@/services/adminService';
import { AdminLogin } from './AdminLogin';
import { MenuTab } from './MenuTab';
import { ProductsTab } from './ProductsTab';
import { OrdersTab } from './OrdersTab';
import { LogOut, Loader2, UtensilsCrossed, Package, ShoppingCart } from 'lucide-react';

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

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
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F9F5F0]">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#2C3E50]">Bistro Cloud</h1>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="menu">
          <TabsList className="mb-6">
            <TabsTrigger value="menu">
              <UtensilsCrossed className="size-4 mr-1.5" /> Menu
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="size-4 mr-1.5" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="size-4 mr-1.5" /> Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu">
            <MenuTab />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
