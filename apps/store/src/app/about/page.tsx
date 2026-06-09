import React from 'react';
import { ShieldCheck, Landmark, Clock, Award, Hammer, Star } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Happy Customers', value: '1,500+' },
    { label: 'Repairs Completed', value: '800+' },
    { label: 'Genuine Part Brands', value: '15+' },
    { label: 'Years in Ekpoma', value: '5+' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Page Header */}
      <section className="relative overflow-hidden bg-radial from-primary/10 via-background to-background py-16 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">About MacroStar</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Leading supplier of computers, laptops, hardware components, gaming consoles, and professional software installs in Edo State.
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Our Mission & Commitment</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            MacroStar Technologies was established in Ekpoma, Edo State to bridge the gap in accessing premium, genuine computer hardware. We understand that whether you are a university student, a programming developer, or a gaming enthusiast, you need computing tech that is reliable, fast, and authentic.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Our physical retail office is located directly opposite First Bank PLC, Ekpoma. We don't just sell boxes; we configure devices, install certified operating systems and developer tools, build custom gaming rigs, and offer Edo's most reliable laptop diagnostics and repairs with warranty support.
          </p>
        </div>

        {/* Highlight Stats Grid */}
        <div className="grid grid-cols-2 gap-6 bg-card border border-border/60 p-8 rounded-3xl shadow-sm relative">
          <span className="absolute -top-3 -left-3 bg-primary text-primary-foreground text-[10px] font-black uppercase px-3 py-1 rounded-full">
            Fast Stats
          </span>
          {stats.map((stat, idx) => (
            <div key={idx} className="p-4 bg-muted/40 rounded-2xl text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-primary block">{stat.value}</span>
              <span className="text-xs text-muted-foreground font-semibold">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Values Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight">Why Choose MacroStar?</h2>
          <p className="text-sm text-muted-foreground mt-1">We maintain the highest standard of product sourcing and service execution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="inline-flex p-3 bg-primary/10 rounded-xl text-primary">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">100% Authentic Stock</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We source directly from official distributors of top global brands (HP, Dell, Lenovo, ASUS, NVIDIA, Sony, Kingston, and Samsung). No counterfeit parts.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="inline-flex p-3 bg-primary/10 rounded-xl text-primary">
              <Hammer className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">Certified Tech Support</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Our technicians hold certified engineering badges. From simple RAM additions to delicate motherboard soldering, we handle your devices with utmost care.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="inline-flex p-3 bg-primary/10 rounded-xl text-primary">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold">Community Roots</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Conveniently located opposite First Bank PLC on the main street of Ekpoma, we have served Edo's student and business community with honesty for years.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
