'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Landmark, MessageSquareCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in your name, email address, and message.');
      return;
    }

    setSending(true);
    toast.loading('Sending message to MacroStar customer service...');

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      toast.dismiss();
      toast.success('Message sent! Our Ekpoma desk will contact you shortly.', {
        description: 'Response time is typically under 3 hours during business days.',
      });
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    {
      title: 'Our Physical Address',
      desc: 'Opposite First Bank PLC, Ekpoma, Edo State, Nigeria.',
      icon: MapPin,
    },
    {
      title: 'Phone Numbers',
      desc: '+234 (0) 80 1234 5678, +234 (0) 90 8765 4321',
      icon: Phone,
    },
    {
      title: 'Email Address',
      desc: 'support@macrostar.ng, info@macrostar.ng',
      icon: Mail,
    },
    {
      title: 'Business Hours',
      desc: 'Monday - Saturday: 9:00 AM - 6:00 PM (Closed Sundays)',
      icon: Clock,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="border-b border-border/50 pb-4 text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Contact Us</h1>
        <p className="text-sm text-muted-foreground">
          Have computer questions? Book a hardware diagnostic, order custom laptop parts, or request games and software installation.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Col: Contact Info & Mock Map */}
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold">Store Details</h2>
            <div className="space-y-4">
              {contactInfo.map((info, idx) => {
                const Icon = info.icon;
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{info.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{info.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map mockup */}
          <div className="bg-card border border-border/60 rounded-3xl p-6 text-center space-y-4 shadow-sm relative overflow-hidden h-48 flex flex-col justify-center items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 blur-xl -z-10" />
            <Landmark className="h-10 w-10 text-primary mx-auto" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Interactive Location Finder</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                We are situated right on the main commercial road, directly opposite the First Bank building.
              </p>
            </div>
            <span className="text-[10px] text-primary font-bold tracking-widest uppercase border border-primary/20 bg-primary/5 px-3 py-1 rounded-full">
              Ekpoma, Edo State
            </span>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold">Send Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Your Name</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 80 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Message / Diagnostic Request</label>
              <textarea
                required
                rows={5}
                placeholder="Describe what laptop repair or computer parts you need. Include specifications if possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl px-4 py-2.5 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 bg-primary text-primary-foreground font-black rounded-xl hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-50"
            >
              <span>{sending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
