import React from 'react';
import { BrowserRouter, Routes, Route, ScrollRestoration } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { MenuPage } from './pages/Menu';
import { ProductsPage } from './pages/Products';
import { CateringPage } from './pages/Catering';
import { ContactPage } from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="catering" element={<CateringPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
