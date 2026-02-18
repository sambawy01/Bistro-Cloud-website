import React from 'react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// I'll implement a custom drawer/sidebar since I haven't installed shadcn sheet fully
export function CartDrawer() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice, isCartOpen, toggleCart } = useCart();
  const [paymentMethod, setPaymentMethod] = React.useState('Cash on Delivery');
  const [deliveryTime, setDeliveryTime] = React.useState('As soon as possible');
  const [orderNotes, setOrderNotes] = React.useState('')
  const [address, setAddress] = React.useState('');

  const handleCheckout = () => {
    // Generate WhatsApp Message
    const orderSummary = items.map(item => 
      `${item.quantity}x ${item.name} (${item.price * item.quantity} EGP)`
    ).join('\n');
    
    const text = `Hi Bistro Cloud! I'd like to place an order:\n\n${orderSummary}\n\nTotal: ${totalPrice} EGP\nPayment Method: ${paymentMethod}
Delivery Time: ${deliveryTime}${orderNotes ? '\nNotes: ' + orderNotes : ''}\n\nPlease confirm delivery time.`;
    const url = `https://wa.me/201221288804?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    clearCart();
    toggleCart();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b flex items-center justify-between bg-[#F9F5F0]">
              <h2 className="font-montserrat font-bold text-xl flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#D94E28]" />
                Your Order
              </h2>
              <button onClick={toggleCart} className="p-2 hover:bg-black/5 rounded-full">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <Button onClick={toggleCart} variant="outline">Browse Menu</Button>
                </div>
              ) : (
                items.map(item => (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
                  >
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg bg-gray-100" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                        <p className="text-[#D94E28] font-bold text-sm">EGP {item.price}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50 text-gray-600 hover:text-[#D94E28]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-[#D94E28]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t bg-[#F9F5F0] overflow-y-auto max-h-[60vh]">
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {['Cash on Delivery', 'Instapay', 'Credit/Debit Card'].map((method) => (
                      <label 
                        key={method}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                          paymentMethod === method 
                            ? 'border-[#D94E28] bg-white shadow-sm ring-1 ring-[#D94E28]' 
                            : 'border-gray-200 bg-transparent hover:bg-white/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method}
                          checked={paymentMethod === method}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-[#D94E28] border-gray-300 focus:ring-[#D94E28]"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Delivery Time (2:00 PM - 8:00 PM)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const now = new Date();
                      const minTime = new Date(now.getTime() + 30 * 60000);
                      const slots: string[] = ["As soon as possible"];
                      for (let h = 14; h <= 20; h++) {
                        for (let m = 0; m < 60; m += 30) {
                          if (h === 20 && m > 0) continue;
                          const slot = new Date();
                          slot.setHours(h, m, 0, 0);
                          if (slot > minTime) {
                            const hr = h > 12 ? h - 12 : h;
                            const ampm = h >= 12 ? "PM" : "AM";
                            slots.push(hr + ":" + (m === 0 ? "00" : "30") + " " + ampm);
                          }
                        }
                      }
                      return slots;
                    })().map((time) => (
                      <button
                        key={time}
                        onClick={() => setDeliveryTime(time)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          deliveryTime === time
                            ? "border-[#D94E28] bg-white shadow-sm ring-1 ring-[#D94E28] text-[#D94E28]"
                            : "border-gray-200 bg-transparent hover:bg-white/50 text-gray-700"
                        } ${time === "As soon as possible" ? "col-span-3" : ""}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">Order Notes (optional)</h3>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Allergies, special requests, delivery instructions..."
                    rows={2}
                    className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D94E28]/20 focus:border-[#D94E28] resize-none"
                  />
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-600">Total</span>
                  <span className="font-montserrat font-bold text-2xl text-[#D94E28]">EGP {totalPrice}</span>
                </div>
                <Button onClick={handleCheckout} className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-[#D94E28]/20">
                  Checkout via WhatsApp
                </Button>
                <p className="text-center text-xs text-gray-500 mt-4">
                  Free delivery across all of El Gouna
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
