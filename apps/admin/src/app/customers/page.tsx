'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/store/useAuth';
import { Search, Mail, User, Phone, Calendar, CheckCircle, XCircle, MoreVertical, Send } from 'lucide-react';
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

export default function AdminCustomersPage() {
  const router = useRouter();
  const token = useAuth((state) => state.token);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!token) {
      setLoading(false);
      toast.error('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (res.ok) {
        setCustomers(json.data || []);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCustomer = (id: number) => {
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCustomers(
      selectedCustomers.length === filteredCustomers.length
        ? []
        : filteredCustomers.map(c => c.id)
    );
  };

  const handleSendEmail = async () => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    if (!emailSubject || !emailBody) {
      toast.error('Subject and body are required');
      return;
    }

    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer');
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
          customerIds: selectedCustomers,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (!res.ok) throw new Error('Failed to send email');

      toast.success(`Email sent to ${selectedCustomers.length} customer(s)`);
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailBody('');
      setSelectedCustomers([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSingleEmail = (customerId: number) => {
    setSelectedCustomers([customerId]);
    setShowEmailModal(true);
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success('Customer status updated');
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-3">
          {selectedCustomers.length > 0 && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90"
            >
              <Mail className="h-4 w-4" />
              Send Email ({selectedCustomers.length})
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border focus:border-primary focus:outline-none rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading customers...</div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleSelectCustomer(customer.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {customer.avatar ? (
                            <Image src={customer.avatar} alt={customer.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="text-sm">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.address ? (
                        <div className="text-sm text-muted-foreground">
                          {[customer.address.street, customer.address.city, customer.address.state, customer.address.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No address</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(customer.id, customer.isActive)}
                        className={`flex items-center gap-1 text-xs font-medium ${
                          customer.isActive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {customer.isActive ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        {customer.lastLoginAt
                          ? new Date(customer.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendSingleEmail(customer.id)}
                          className="p-1.5 bg-muted hover:bg-primary hover:text-primary-foreground rounded-lg border border-border transition-colors"
                          title="Send email"
                          aria-label="Send email to customer"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No customers found
            </div>
          )}
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Send Email</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Recipients</label>
                <div className="text-sm text-muted-foreground">
                  {selectedCustomers.length} customer(s) selected
                </div>
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
