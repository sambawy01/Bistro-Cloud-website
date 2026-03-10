import React from 'react';
import { Button } from '../components/ui/button';
import { Phone, Mail, MapPin, MessageCircle, Send, Loader2 } from 'lucide-react';
import { submitContactForm } from '../../services/crmService';

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await submitContactForm({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      message: formData.get('message') as string,
    });

    setIsSubmitting(false);
    if (result.success) {
      setSubmitStatus('success');
      form.reset();
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } else {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  return (
    <div className="w-full bg-[#F9F5F0] min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="font-montserrat font-bold text-4xl mb-4 text-[#2C3E50]">Get in Touch</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have a question about our menu, delivery areas, or just want to say hello? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center hover:border-[#D94E28] transition-all group hover:shadow-xl duration-300">
            <div className="w-20 h-20 bg-[#FFF5F2] text-[#D94E28] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D94E28] group-hover:text-white transition-colors">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[#2C3E50]">Call Us</h3>
            <p className="text-gray-500 mb-6">Mon-Sun from 10am to 8pm</p>
            <a href="tel:+201221288804" className="text-[#D94E28] font-bold text-lg hover:underline decoration-2 underline-offset-4">+20 122 128 8804</a>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center hover:border-[#D94E28] transition-all group hover:shadow-xl duration-300 transform md:-translate-y-4">
            <div className="w-20 h-20 bg-[#FFF5F2] text-[#D94E28] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D94E28] group-hover:text-white transition-colors">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[#2C3E50]">WhatsApp</h3>
            <p className="text-gray-500 mb-6">Fastest way to order</p>
            <a href="https://wa.me/201221288804" className="inline-block px-8 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#128C7E] transition-colors shadow-lg shadow-green-500/20">
              Start Chat
            </a>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center hover:border-[#D94E28] transition-all group hover:shadow-xl duration-300">
            <div className="w-20 h-20 bg-[#FFF5F2] text-[#D94E28] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#D94E28] group-hover:text-white transition-colors">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[#2C3E50]">Email Us</h3>
            <p className="text-gray-500 mb-6">For general inquiries</p>
            <a href="mailto:catering@bistrocloudeg.com" className="text-[#D94E28] font-bold text-lg hover:underline decoration-2 underline-offset-4">catering@bistrocloudeg.com</a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-gray-100 max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="font-montserrat font-bold text-2xl text-[#2C3E50] mb-2">Send Us a Message</h2>
            <p className="text-gray-500 text-sm">We'll respond within 24 hours.</p>
          </div>

          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center font-medium">
              Message sent! We'll be in touch soon.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center font-medium">
              Something went wrong. Please try again or reach out via WhatsApp.
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input name="name" type="text" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="Your name" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input name="email" type="email" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Phone <span className="font-normal text-gray-400">(optional)</span></label>
              <input name="phone" type="tel" className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="+20 123 456 7890" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
              <textarea name="message" rows={4} className="w-full px-4 py-3 rounded-xl bg-[#F9F5F0] border-transparent focus:bg-white border focus:border-[#D94E28] focus:ring-0 transition-all" placeholder="Tell us how we can help..." required></textarea>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full text-lg h-14 rounded-xl shadow-lg shadow-[#D94E28]/20 hover:bg-[#c0392b] transition-transform active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Message
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Map Section */}
        <div className="max-w-5xl mx-auto bg-white p-3 rounded-3xl shadow-lg shadow-gray-200/50">
          <div className="w-full h-96 bg-[#EDE8E1] rounded-2xl flex items-center justify-center text-gray-400 relative overflow-hidden group">
             {/* Abstract Map Pattern */}
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2C3E50_1px,transparent_1px)] [background-size:16px_16px]"></div>

             <div className="text-center z-10 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white">
               <MapPin className="w-12 h-12 mx-auto mb-4 text-[#D94E28]" />
               <h3 className="font-bold text-[#2C3E50] text-lg mb-1">West Golf, New Sabina, El Gouna</h3>
               <p className="text-gray-500 text-sm">Red Sea Governorate, Egypt</p>
               <a
                 href="https://maps.app.goo.gl/zYd24dZBBffosLSH7"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="mt-4 inline-block text-[#D94E28] font-semibold hover:underline decoration-2 underline-offset-4"
               >
                 View on Google Maps
               </a>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
