'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/store/useAuth';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, CheckCircle, XCircle, ShoppingBag, Send } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  } | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: number;
  orderNumber: string;
  total: string;
  status: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuth((state) => state.token);
  const customerId = parseInt(params.id as string);

  // Validate customer ID
  if (isNaN(customerId) || customerId <= 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Invalid customer ID
        </div>
      </div>
    );
  }

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchCustomer = async () => {
    if (!token) {
      setLoading(false);
      toast.error('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        setCustomer(json.data);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/orders?customerId=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        setOrders(json.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomer();
      fetchOrders();
    }
  }, [customerId, token]);

  const handleSendEmail = async () => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    if (!emailSubject || !emailBody) {
      toast.error('Subject and body are required');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/customers/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerIds: [customerId],
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (!res.ok) throw new Error('Failed to send email');

      toast.success('Email sent successfully');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!token || !customer) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success('Customer status updated');
      fetchCustomer();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading customer details...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          Customer not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Customer Details</h1>
      </div>

      {/* Customer Info Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {customer.avatar ? (
              <Image src={customer.avatar} alt={customer.name} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">{customer.name}</h2>
              <button
                onClick={handleToggleStatus}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  customer.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                }`}
              >
                {customer.isActive ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    Inactive
                  </>
                )}
              </button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {customer.email}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    {customer.address.street && <div>{customer.address.street}</div>}
                    {(customer.address.city || customer.address.state) && (
                      <div>
                        {[customer.address.city, customer.address.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {(customer.address.country || customer.address.zip) && (
                      <div>
                        {[customer.address.country, customer.address.zip].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            Send Email
          </button>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/40 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1">Customer ID</div>
            <div className="font-semibold">{customer.id}</div>
          </div>
          <div className="p-4 bg-muted/40 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined
            </div>
            <div className="font-semibold">{new Date(customer.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="p-4 bg-muted/40 rounded-xl">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last Login
            </div>
            <div className="font-semibold">
              {customer.lastLoginAt
                ? new Date(customer.lastLoginAt).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Order History
        </h3>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">₦{parseFloat(order.total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                        order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No orders found
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Send Email</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recipient</label>
                <div className="text-sm text-muted-foreground">{customer.name} ({customer.email})</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl resize-none"
                  rows={6}
                  placeholder="Email message..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
