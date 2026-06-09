import React from 'react';
import type { Metadata } from 'next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'MacroStar Technologies | Best Computer Outlet in Ekpoma, Edo State',
  description: 'Shop laptops, desktop computers, parts, gaming consoles, accessories, and get expert repairs and software solutions opposite First Bank, Ekpoma.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
