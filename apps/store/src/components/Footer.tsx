import Link from 'next/link';
import { Monitor, Mail, Phone, MapPin, Shield, HelpCircle, Truck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-card text-card-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                MacroStar Tech
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              MacroStar Technologies is Ekpoma's leading computer & hardware store. We deal in desktop PCs, consoles, laptops, premium components, repairs, and professional software installs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Shop Computers & Parts
                </Link>
              </li>
              <li>
                <Link href="/products?category=gaming" className="text-muted-foreground hover:text-primary transition-colors">
                  Gaming Gear & Consoles
                </Link>
              </li>
              <li>
                <Link href="/products?category=software" className="text-muted-foreground hover:text-primary transition-colors">
                  Software Installations
                </Link>
              </li>
              <li>
                <Link href="/products?category=repairs-services" className="text-muted-foreground hover:text-primary transition-colors">
                  Repairs & Diagnostic
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Support & Info</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About MacroStar
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Customer Desk
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Book a Repair
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-muted-foreground hover:text-primary transition-colors">
                  Track Delivery
                </Link>
              </li>
            </ul>
          </div>

          {/* Business Info / Contact */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">Find Us</h3>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span>Opposite First Bank PLC, Ekpoma, Edo State, Nigeria.</span>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>+234 (0) 80 1234 5678</span>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>info@macrostar.ng</span>
            </div>
          </div>
        </div>

        {/* Features banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-t border-b border-border/50 mt-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-full">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">100% Genuine Products</h4>
              <p className="text-xs text-muted-foreground">Direct from HP, Dell, Lenovo, NVIDIA etc.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-full">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Fast Secure Delivery</h4>
              <p className="text-xs text-muted-foreground">Safe shipping across Edo state & nation-wide.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-full">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Expert Repairs & Installs</h4>
              <p className="text-xs text-muted-foreground">Quality hardware fixes & software solutions.</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MacroStar Technologies. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Secured via</span>
            <span className="font-bold text-foreground tracking-tight hover:text-primary transition-colors">
              Paystack
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
