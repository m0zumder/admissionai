import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => (
  <a
    href="https://wa.me/8801609059992?text=Admission AI সম্পর্কে জানতে চাই"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-24 md:bottom-8 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-fade-in"
    aria-label="WhatsApp এ যোগাযোগ করুন"
  >
    <MessageCircle className="h-6 w-6" />
  </a>
);

export default WhatsAppButton;
