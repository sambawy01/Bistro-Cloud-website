import { Button } from '../components/ui/button';
import { Check, Anchor, Briefcase, MapPin, UtensilsCrossed } from 'lucide-react';
import weddingImage from '@/assets/699e163a5a4cd8a2c79cb2efaf64cdbdf659f75a.png';
import boatImage from '@/assets/c278aaff636c8eb3234aefe831140cca51bd2356.png';

export function CateringPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your inquiry! We will contact you shortly.");
  };

  return (
    <div className="w-full bg-[#F9F5F0]">
      {/* Header */}
      <section className="bg-[#2C3E50] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1751651054936-db23f5d67160?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRlcmluZyUyMGZvb2QlMjB0YWJsZSUyMGVsZWdhbnR8ZW58MXx8fHwxNzcxMTM3NTc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')] bg-cover bg-center opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-montserrat font-bold text-4xl md:text-5xl mb-6">Premium Catering Services</h1>
          <p className="text-gray-200 text-lg max-w-2xl mx-auto">
            From boardroom lunches to Red Sea yacht trips, we bring the freshest ingredients to your table—wherever it may be.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 space-y-24">
        
        {/* Corporate Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
             <img 
              src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80" 
              alt="Corporate Catering" 
              className="rounded-3xl shadow-xl w-full object-cover h-64 md:h-96"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#D94E28]/10 rounded-xl">
                <Briefcase className="w-6 h-6 text-[#D94E28]" />
              </div>
              <span className="text-[#D94E28] font-bold tracking-wider text-sm uppercase">Business Solutions</span>
            </div>
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-6 text-[#2C3E50]">Corporate Catering</h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Impress your clients and team with El Gouna's finest culinary experience. Tailored menus for meetings, events, and daily office lunches. We cover the entire area from Safaga to Ras Ghareb.
            </p>
            <ul className="space-y-4">
              {[
                "Customizable menus tailored to dietary needs",
                "Professional presentation and service",
                "Service area: Safaga to Ras Ghareb (incl. Hurghada)",
                "Volume discounts for recurring orders"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-[#2C3E50]/10 flex items-center justify-center text-[#2C3E50] shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Boat Catering Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#3498DB]/10 rounded-xl">
                <Anchor className="w-6 h-6 text-[#3498DB]" />
              </div>
              <span className="text-[#3498DB] font-bold tracking-wider text-sm uppercase">Maritime Dining</span>
            </div>
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-6 text-[#2C3E50]">Boat & Yacht Catering</h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Elevate your Red Sea experience with our specialized boat catering. We understand the unique challenges of dining at sea and provide hassle-free, delicious solutions.
            </p>
            <ul className="space-y-4">
              {[
                "Seaworthy, spill-proof packaging",
                "Fresh seafood & light Mediterranean options",
                "Ready-to-eat platters (no reheating needed)",
                "Early morning delivery directly to the marina"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-[#3498DB]/10 flex items-center justify-center text-[#3498DB] shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
             <img 
              src={boatImage}
              alt="Boat Catering" 
              className="rounded-3xl shadow-xl w-full object-cover h-64 md:h-96"
            />
          </div>
        </div>

        {/* Home & Wedding Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
             <img 
              src={weddingImage}
              alt="Wedding & Home Catering" 
              className="rounded-3xl shadow-xl w-full object-cover h-64 md:h-96"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#9B59B6]/10 rounded-xl">
                <UtensilsCrossed className="w-6 h-6 text-[#9B59B6]" />
              </div>
              <span className="text-[#9B59B6] font-bold tracking-wider text-sm uppercase">Private Events</span>
            </div>
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl mb-6 text-[#2C3E50]">Weddings & Gatherings</h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              From intimate home dinners to grand wedding celebrations, we craft unforgettable culinary experiences. Let us handle the food, service, and setup so you can focus on your guests.
            </p>
            <ul className="space-y-4">
              {[
                "Full-service catering (Waitstaff & Bartenders)",
                "Live cooking stations (Pasta, Grill, Sushi)",
                "Elegant buffet setups with decor matching your theme",
                "Drop-off options for casual gatherings"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-[#9B59B6]/10 flex items-center justify-center text-[#9B59B6] shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Request Form Section */}
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100 max-w-4xl mx-auto" id="request-form">
          <div className="text-center mb-10">
            <h2 className="font-montserrat font-bold text-3xl text-[#2C3E50] mb-4">Request a Quote</h2>
            <p className="text-gray-500">Tell us about your event and we'll craft the perfect menu.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Type</label>
                <select className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all appearance-none cursor-pointer">
                  <option>Corporate Event / Office Lunch</option>
                  <option>Boat / Yacht Trip</option>
                  <option>Private Party / Home Gathering</option>
                  <option>Wedding</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Guests</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="20" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Company / Boat Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="jane@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                <input type="tel" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="+20 123 456 7890" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Date</label>
                <input type="date" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location / Marina</label>
                 <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="e.g. Abu Tig Marina" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Menu Preferences & Details</label>
              <textarea rows={4} className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="Tell us about your preferences (e.g. Seafood focus, Vegetarian options, Finger foods only)..."></textarea>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-14 rounded-xl shadow-lg shadow-[#D94E28]/20 hover:bg-[#c0392b] transition-transform active:scale-95">Send Request</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
