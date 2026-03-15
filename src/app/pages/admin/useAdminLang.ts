import { useState, useCallback } from 'react';

type Lang = 'en' | 'ar';

const t: Record<string, Record<Lang, string>> = {
  // Login
  'bistro_cloud': { en: 'Bistro Cloud', ar: 'بيسترو كلاود' },
  'admin_panel': { en: 'Admin Panel', ar: 'لوحة التحكم' },
  'admin': { en: 'Admin', ar: 'إدارة' },
  'enter_password': { en: 'Enter admin password', ar: 'أدخل كلمة المرور' },
  'sign_in': { en: 'Sign In', ar: 'تسجيل الدخول' },
  'verifying': { en: 'Verifying...', ar: 'جاري التحقق...' },
  'invalid_password': { en: 'Invalid password. Please try again.', ar: 'كلمة المرور غير صحيحة. حاول مرة أخرى.' },
  'connection_error': { en: 'Connection error. Please try again.', ar: 'خطأ في الاتصال. حاول مرة أخرى.' },
  'logout': { en: 'Logout', ar: 'تسجيل الخروج' },

  // Tabs
  'menu': { en: 'Menu', ar: 'القائمة' },
  'pantry': { en: 'Pantry', ar: 'المخزن' },

  // Menu/Products table
  'menu_items': { en: 'Menu Items', ar: 'أصناف القائمة' },
  'image': { en: 'Image', ar: 'صورة' },
  'name': { en: 'Name', ar: 'الاسم' },
  'category': { en: 'Category', ar: 'الفئة' },
  'price': { en: 'Price', ar: 'السعر' },
  'status': { en: 'Status', ar: 'الحالة' },
  'visible': { en: 'Visible', ar: 'مرئي' },
  'actions': { en: 'Actions', ar: 'إجراءات' },
  'add_item': { en: 'Add Item', ar: 'إضافة صنف' },
  'add_product': { en: 'Add Product', ar: 'إضافة منتج' },
  'pantry_products': { en: 'Pantry Products', ar: 'منتجات المخزن' },
  'search_items': { en: 'Search items...', ar: 'بحث عن أصناف...' },
  'search_products': { en: 'Search products...', ar: 'بحث عن منتجات...' },
  'no_items': { en: 'No menu items found', ar: 'لا توجد أصناف' },
  'no_products': { en: 'No products found', ar: 'لا توجد منتجات' },
  'item_added': { en: 'Item added', ar: 'تمت الإضافة' },
  'item_updated': { en: 'Item updated', ar: 'تم التحديث' },
  'item_deleted': { en: 'Item deleted', ar: 'تم الحذف' },
  'product_added': { en: 'Product added', ar: 'تمت إضافة المنتج' },
  'product_updated': { en: 'Product updated', ar: 'تم تحديث المنتج' },
  'product_deleted': { en: 'Product deleted', ar: 'تم حذف المنتج' },
  'failed_load_menu': { en: 'Failed to load menu items', ar: 'فشل تحميل القائمة' },
  'failed_load_products': { en: 'Failed to load products', ar: 'فشل تحميل المنتجات' },
  'failed_delete': { en: 'Failed to delete', ar: 'فشل الحذف' },
  'failed_toggle': { en: 'Failed to toggle visibility', ar: 'فشل تغيير الرؤية' },
  'confirm_delete': { en: 'Delete', ar: 'حذف' },
  'egp': { en: 'EGP', ar: 'ج.م' },

  // Status values
  'available': { en: 'Available', ar: 'متاح' },
  'limited': { en: 'Limited', ar: 'محدود' },
  'sold_out': { en: 'Sold Out', ar: 'نفد' },
  'hidden': { en: 'Hidden', ar: 'مخفي' },

  // Orders tab
  'type': { en: 'Type', ar: 'النوع' },
  'customer': { en: 'Customer', ar: 'العميل' },
  'contact': { en: 'Contact', ar: 'التواصل' },
  'details': { en: 'Details', ar: 'التفاصيل' },
  'no_orders': { en: 'No orders found', ar: 'لا توجد طلبات' },
  'order_archived': { en: 'Order archived', ar: 'تم أرشفة الطلب' },
  'failed_load_orders': { en: 'Failed to load orders', ar: 'فشل تحميل الطلبات' },
  'failed_archive': { en: 'Failed to archive', ar: 'فشل الأرشفة' },
  'confirm_archive': { en: 'Archive this order?', ar: 'أرشفة هذا الطلب؟' },

  // Item form dialog
  'edit_item': { en: 'Edit Item', ar: 'تعديل الصنف' },
  'add_new_item': { en: 'Add New Item', ar: 'إضافة صنف جديد' },
  'description': { en: 'Description', ar: 'الوصف' },
  'item_name': { en: 'Item name', ar: 'اسم الصنف' },
  'item_description': { en: 'Item description', ar: 'وصف الصنف' },
  'price_egp': { en: 'Price (EGP)', ar: 'السعر (ج.م)' },
  'dietary_tags': { en: 'Dietary Tags', ar: 'علامات غذائية' },
  'hidden_from_site': { en: 'Hidden from public site', ar: 'مخفي من الموقع' },
  'drop_image': { en: 'Drop image or click to upload', ar: 'اسحب صورة أو انقر للرفع' },
  'uploading': { en: 'Uploading...', ar: 'جاري الرفع...' },
  'cancel': { en: 'Cancel', ar: 'إلغاء' },
  'update': { en: 'Update', ar: 'تحديث' },
  'saving': { en: 'Saving...', ar: 'جاري الحفظ...' },
};

const STORAGE_KEY = 'bc-admin-lang';

export function useAdminLang() {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_KEY) as Lang) || 'en'
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const tr = useCallback((key: string): string => {
    return t[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' as const : 'ltr' as const;

  return { lang, setLang, tr, dir };
}

export type AdminLang = ReturnType<typeof useAdminLang>;
