import React from 'react';
import type { Metadata } from 'next';
import AdminLayout from '../components/AdminLayout';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'MacroStar Technologies | Admin Control Panel',
  description: 'Manage sales, inventory, categories, product catalog and orders for MacroStar Technologies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <AdminLayout>
          {children}
        </AdminLayout>
        <Toaster position="top-right" theme="dark" richColors />
      </body>
    </html>
  );
}
