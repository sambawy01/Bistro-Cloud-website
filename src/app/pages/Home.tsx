import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { ArrowRight, Star, Leaf, ChefHat, Clock, ChevronDown, MapPin, Plus, Users, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useMenuData } from '../data/useMenuData';
import { useProductsData } from '../data/useProductsData';

export function HomePage() {
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const { addItem } = useCart();
  const { menuItems, loading: menuLoading } = useMenuData();
  const { products, loading: productsLoading } = useProductsData();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full bg-[#F9F5F0]">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1768726134294-92234fe2f76c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZm9vZCUyMHNwcmVhZCUyMHRhYmxlJTIwb3ZlcmhlYWR8ZW58MXx8fHwxNzcxMTMzNjU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Delicious food spread"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-2 px-4 border border-white/30 rounded-full bg-white/10 backdrop-blur-md text-sm font-bold tracking-widest uppercase mb-6 text-[#F9F5F0]">
              El Gouna's Open Kitchen
            </span>
            <h1 className="font-montserrat font-bold text-5xl md:text-7xl lg:text-8xl leading-tight mb-8 drop-shadow-lg">
              Fresh. Natural.<br/>Delivered Daily.
            </h1>
            <p className="font-inter text-lg md:text-2xl text-gray-100 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              100% natural ingredients, made fresh every day. Order now and taste the difference quality makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/menu">
                <Button size="lg" className="w-full sm:w-auto text-lg h-16 px-10 rounded-full bg-[#D94E28] hover:bg-[#c0392b] border-none shadow-[0_0_20px_rgba(217,78,40,0.4)] transition-all hover:scale-105">
                  See Today's Menu
                </Button>
              </Link>
              <Link to="/catering">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-16 px-10 rounded-full border-2 border-white text-white hover:bg-white hover:text-[#2C3E50] bg-transparent transition-all">
                  Request Catering Quote
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white"
        >
          <ChevronDown className="w-8 h-8 opacity-70" />
        </motion.div>
      </section>

      {/* Today's Menu Section */}
      <section className="py-24 bg-[#F9F5F0]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[#D94E28] font-bold tracking-widest uppercase mb-4 block text-sm">Daily Specials</span>
            <h2 className="font-montserrat font-bold text-3xl md:text-5xl mb-4 text-[#2C3E50]">Today's Menu</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Freshly prepared for today. Order now for immediate delivery across El Gouna.
            </p>
          </div>

          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <AnimatePresence>
              {menuLoading ? [1,2,3].map((i) => (<motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse flex flex-col"><div className="h-64 bg-gray-200 shrink-0" /><div className="p-6"><div className="h-5 bg-gray-200 rounded w-3/4 mb-3" /><div className="h-4 bg-gray-200 rounded w-full mb-2" /><div className="h-12 bg-gray-200 rounded-xl mt-6" /></div></motion.div>)) : (isMenuExpanded ? menuItems : menuItems.slice(0, 3)).map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={item.id}
                  className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col ${
                    item.status === 'sold_out' ? 'opacity-75 grayscale-[0.5]' : ''
                  }`}
                >
                  <div className="relative h-64 overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {item.dietary?.map((tag) => (
                        <span key={tag} className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase text-[#2C3E50] shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {item.status === 'limited' && (
                      <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm animate-pulse">
                        Low Stock
                      </div>
                    )}
                    {item.status === 'sold_out' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg transform -rotate-12 border-2 border-gray-800">SOLD OUT</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-montserrat font-bold text-lg text-[#2C3E50] leading-tight">{item.name}</h3>
                      <span className="font-bold text-[#D94E28] whitespace-nowrap ml-2">EGP {item.price}</span>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-1">{item.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      {item.status === 'sold_out' ? (
                         <Button disabled className="w-full bg-gray-100 text-gray-400 border border-gray-200">
                           Unavailable
                         </Button>
                      ) : (
                        <Button 
                          onClick={() => addItem(item)}
                          className="w-full bg-[#2C3E50] hover:bg-[#D94E28] text-white transition-all duration-300 shadow-lg hover:shadow-[#D94E28]/25 h-12 rounded-xl text-base font-semibold group-hover:translate-y-[-2px]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <div className="text-center">
            <Button
              onClick={() => setIsMenuExpanded(!isMenuExpanded)}
              variant="outline"
              size="lg"
              className="rounded-full px-10 py-6 border-2 border-[#D94E28] text-[#D94E28] hover:bg-[#D94E28] hover:text-white transition-all text-lg font-bold group"
            >
              {isMenuExpanded ? (
                <>Show Less <ChevronDown className="ml-2 w-5 h-5 rotate-180 transition-transform" /></>
              ) : (
                <>View Full Menu <ChevronDown className="ml-2 w-5 h-5 transition-transform group-hover:translate-y-1" /></>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Bistro Pantry Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <span className="text-[#D94E28] font-bold tracking-widest uppercase mb-4 block text-sm">Bistro Pantry</span>
              <h2 className="font-montserrat font-bold text-3xl md:text-5xl text-[#2C3E50] mb-4">Bring the Bistro Home</h2>
              <p className="text-gray-600 max-w-2xl text-lg">
                Handcrafted essentials made in our open kitchen. From our family to yours.
              </p>
            </div>
            <Link to="/products">
              <Button variant="outline" className="hidden md:flex rounded-full border-2 border-[#D94E28] text-[#D94E28] hover:bg-[#D94E28] hover:text-white transition-all px-8 py-6 text-lg font-bold group">
                Shop All Items <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {productsLoading ? [1,2,3].map((i) => (<motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group relative"><div className="h-80 rounded-2xl overflow-hidden mb-6 bg-gray-200 animate-pulse" /><div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" /><div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" /></motion.div>)) : products.slice(0, 3).map((product) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={product.id}
                className="group relative"
              >
                <div className="relative h-80 rounded-2xl overflow-hidden mb-6 bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      onClick={() => addItem(product)}
                      className="bg-white text-[#2C3E50] hover:bg-[#D94E28] hover:text-white rounded-full h-14 px-8 font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                    >
                      <Plus className="w-5 h-5 mr-2" /> Add to Cart
                    </Button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase text-[#2C3E50] shadow-sm">
                      {product.category}
                    </span>
                  </div>
                </div>
                <h3 className="font-montserrat font-bold text-xl text-[#2C3E50] mb-2 group-hover:text-[#D94E28] transition-colors">
                  {product.name}
                </h3>
                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-sm line-clamp-1 flex-1 mr-4">{product.description}</p>
                  <span className="font-bold text-[#D94E28] text-lg">EGP {product.price}</span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center md:hidden">
            <Link to="/products">
              <Button className="w-full rounded-full bg-[#D94E28] text-white hover:bg-[#c0392b] transition-all px-8 py-6 text-lg font-bold group">
                Shop All Items <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <motion.div variants={itemVariants} className="text-center p-8 rounded-3xl bg-[#F9F5F0] hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-white shadow-sm text-[#D94E28] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Leaf className="w-10 h-10" />
              </div>
              <h3 className="font-montserrat font-bold text-2xl mb-4 text-[#2C3E50]">100% Natural Ingredients</h3>
              <p className="text-gray-600 leading-relaxed">
                No powder stock, no shortcuts, no processed ingredients, no flavor enhancers or plant fats. Just fresh, quality food made the way it should be.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center p-8 rounded-3xl bg-[#F9F5F0] hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-white shadow-sm text-[#D94E28] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <ChefHat className="w-10 h-10" />
              </div>
              <h3 className="font-montserrat font-bold text-2xl mb-4 text-[#2C3E50]">Open Kitchen Policy</h3>
              <p className="text-gray-600 leading-relaxed">
                Walk in anytime. See how we cook. We have nothing to hide and everything to show.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center p-8 rounded-3xl bg-[#F9F5F0] hover:shadow-xl transition-all duration-300 group">
              <div className="w-20 h-20 bg-white shadow-sm text-[#D94E28] rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <MapPin className="w-10 h-10" />
              </div>
              <h3 className="font-montserrat font-bold text-2xl mb-4 text-[#2C3E50]">Made for El Gouna</h3>
              <p className="text-gray-600 leading-relaxed">
                From sunrise breakfast to sunset boat parties - we bring the flavor to every corner of El Gouna. Corporate lunch? Covered. Beach picnic? Done. Home BBQ and gatherings? We've got you. Your community kitchen, delivered wherever you are.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* WhatsApp Community Section */}
      <section className="py-20 bg-[#25D366]/5 border-y border-[#25D366]/10">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-4 text-[#2C3E50]">Get the Daily Menu First</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 text-lg">
            Join 1,000+ El Gouna residents in our exclusive WhatsApp group. Be the first to see our daily specials, seasonal offers, and community updates.
          </p>
          <a 
            href="https://chat.whatsapp.com/BYGHdETThbn9kYUf8W7fpu?mode=gi_t" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-green-500/20 transition-all hover:scale-105"
          >
            <MessageCircle className="w-6 h-6" />
            Join WhatsApp Group
          </a>
        </div>
      </section>

      {/* Image Split Section */}
      <section className="py-0">
        <div className="grid grid-cols-1 md:grid-cols-2 h-auto md:h-[700px]">
          <div className="relative h-96 md:h-full overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1769955817432-641929f613f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMG9wZW4lMjBraXRjaGVuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTEzMzY1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
              alt="Chef cooking" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>
          <div className="bg-[#2C3E50] text-white p-12 md:p-24 flex flex-col justify-center">
            <span className="text-[#D94E28] font-bold tracking-widest uppercase mb-4 text-sm">Catering Services</span>
            <h2 className="font-montserrat font-bold text-4xl md:text-6xl mb-8 leading-tight">Elevate Your Events</h2>
            <p className="text-gray-300 text-lg mb-10 leading-relaxed max-w-lg">
              From corporate meetings to luxury yacht trips and intimate weddings, we bring the restaurant experience to you. Custom menus, professional service, and zero hassle.
            </p>
            <Link to="/catering">
              <Button className="w-fit bg-[#D94E28] hover:bg-[#c0392b] text-white h-14 px-8 rounded-xl text-lg group">
                Get a Quote <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#F9F5F0]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-montserrat font-bold text-3xl md:text-5xl mb-4 text-[#2C3E50]">Loved by El Gouna</h2>
            <p className="text-gray-600">Don't just take our word for it.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 relative">
              <div className="absolute -top-6 left-10 w-12 h-12 bg-[#D94E28] rounded-full flex items-center justify-center text-white text-2xl font-serif">"</div>
              <div className="flex gap-1 text-[#F39C12] mb-6">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-8 italic text-lg leading-relaxed">
                "The quality is unmatched. You can taste the difference when ingredients are this fresh. My go-to for healthy lunches."
              </p>
              <div className="font-bold text-[#2C3E50]">
                Sarah J. <span className="font-normal text-gray-400 block text-sm mt-1">Resident, Marina</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 relative">
              <div className="absolute -top-6 left-10 w-12 h-12 bg-[#D94E28] rounded-full flex items-center justify-center text-white text-2xl font-serif">"</div>
              <div className="flex gap-1 text-[#F39C12] mb-6">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-8 italic text-lg leading-relaxed">
                "We ordered catering for our team retreat and everyone was blown away. The setup was professional and the food was hot and delicious."
              </p>
              <div className="font-bold text-[#2C3E50]">
                Mark T. <span className="font-normal text-gray-400 block text-sm mt-1">CEO, TechStart Gouna</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 relative">
              <div className="absolute -top-6 left-10 w-12 h-12 bg-[#D94E28] rounded-full flex items-center justify-center text-white text-2xl font-serif">"</div>
              <div className="flex gap-1 text-[#F39C12] mb-6">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-gray-600 mb-8 italic text-lg leading-relaxed">
                "Finally, a place that takes 'natural' seriously. As a nutritionist, I appreciate the transparency of their open kitchen."
              </p>
              <div className="font-bold text-[#2C3E50]">
                Dr. Laila M. <span className="font-normal text-gray-400 block text-sm mt-1">Nutritionist</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-12 text-center text-[#2C3E50]">Frequently Asked Questions</h2>
          <div className="space-y-4">
             {[
               { q: "How do I order?", a: (<span>You can order directly through this website, message us on WhatsApp, or join our <a href="https://chat.whatsapp.com/BYGHdETThbn9kYUf8W7fpu?mode=gi_t" target="_blank" rel="noopener noreferrer" className="text-[#25D366] font-bold hover:underline">Daily Menu Group</a> for specials.</span>) },
               { q: "What is the delivery time?", a: "Typical delivery time is 30-45 minutes depending on your location in El Gouna." },
               { q: "Where do you deliver?", a: "For daily orders (B2C), we offer free delivery across all of El Gouna. For corporate catering (B2B), we cover the entire area from Safaga to Ras Ghareb, including Hurghada." },
               { q: "Can I customize my order?", a: "Absolutely! Mention any dietary requirements or customization requests in your order notes." },
               { q: "How do I pay?", a: "We accept Cash on Delivery, Instapay, and Credit/Debit Card payments." }
             ].map((faq, i) => (
               <details key={i} className="group border border-gray-100 rounded-2xl bg-[#F9F5F0] open:bg-white open:shadow-md transition-all duration-300">
                 <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6 text-lg text-[#2C3E50]">
                   {faq.q}
                   <span className="transition group-open:rotate-180">
                     <ChevronDown className="w-5 h-5" />
                   </span>
                 </summary>
                 <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                   {faq.a}
                 </div>
               </details>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}
