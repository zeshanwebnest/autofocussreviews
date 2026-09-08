'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types/app.types';
import { QrCodeGenerator } from './QrCodeGenerator';

interface ClientWithStats extends Client {
  stats?: {
    count: number;
    averageRating: number;
    happyCount: number;
    alertCount: number;
  };
}

interface ClientManagerProps {
  initialClients: ClientWithStats[];
}

export function ClientManager({ initialClients }: ClientManagerProps) {
  const router = useRouter();
  const clients = initialClients;
  const [selectedClientForQr, setSelectedClientForQr] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingClient({
      id: '',
      business_name: '',
      brand_colour: '#2563EB',
      google_review_url: '',
      owner_whatsapp: '',
      owner_email: '',
      alert_threshold: 3,
      webhook_url: '',
      status: 'active',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient({ ...client });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    if (!editingClient.id || !editingClient.business_name || !editingClient.google_review_url) {
      setFormError('Client ID, Business Name, and Google Review URL are mandatory.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save client.');
      }
      setIsModalOpen(false);
      setEditingClient(null);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm(`Are you sure you want to delete client "${clientId}"? This will delete associated submissions.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/clients?clientId=${clientId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete client');
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Active Clients & Tenants</h2>
          <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
            Manage client branding, Google Review URLs, Make.com webhook alerts, and print-ready QR codes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-primary text-xs font-bold py-2.5 px-4 flex items-center gap-2 self-start text-white shadow-btn"
        >
          <span>+ Add New Client</span>
        </button>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          const stats = client.stats || { count: 0, averageRating: 0, happyCount: 0, alertCount: 0 };
          return (
            <div
              key={client.id}
              className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Status */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      client.status === 'active'
                        ? 'bg-[#EAFBF5] text-[#00C896]'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: client.status === 'active' ? '#00C896' : '#8A93A3' }}
                    />
                    {client.status.toUpperCase()}
                  </span>

                  <span className="text-xs font-mono font-semibold text-[#8A93A3]">
                    /f/{client.id}
                  </span>
                </div>

                {/* Business Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0"
                    style={{ backgroundColor: client.brand_colour || '#2563EB' }}
                  >
                    {client.business_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#0B1220] leading-tight">
                      {client.business_name}
                    </h3>
                    <p className="text-xs text-[#8A93A3] mt-0.5 truncate max-w-[200px]">
                      {client.owner_email || client.owner_whatsapp || 'No contact specified'}
                    </p>
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="grid grid-cols-2 gap-2 bg-[#F5F8FF] border border-[#E6EAF2] rounded-2xl p-3 mb-5 text-center">
                  <div>
                    <span className="block text-lg font-black text-[#0B1220]">
                      {stats.count}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] tracking-wider">
                      Submissions
                    </span>
                  </div>
                  <div>
                    <span className="block text-lg font-black text-[#00C896]">
                      {stats.count > 0 ? `${stats.averageRating} ★` : '—'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#8A93A3] tracking-wider">
                      Avg Rating
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#E6EAF2]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClientForQr(client)}
                    className="btn btn-outline flex-1 text-xs font-bold py-2 hover:bg-[#0B1220] hover:text-white"
                  >
                    <span>📷 QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(client)}
                    className="btn btn-outline flex-1 text-xs font-bold py-2"
                  >
                    <span>Edit</span>
                  </button>
                </div>
                <div className="flex justify-between items-center px-1">
                  <a
                    href={`/f/${client.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[#2563EB] hover:underline"
                  >
                    Open Feedback Form ↗
                  </a>
                  {client.id !== 'tambi' && client.id !== 'demo' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(client.id)}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal / Drawer */}
      {selectedClientForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedClientForQr(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold"
            >
              ✕
            </button>
            <QrCodeGenerator client={selectedClientForQr} />
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-[#0B1220] tracking-tight mb-4">
              {editingClient.created_at ? 'Edit Client Config' : 'Onboard New Business Client'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                  Client ID (Slug for URL) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tambi, bombay-salon"
                  value={editingClient.id || ''}
                  disabled={Boolean(editingClient.created_at)}
                  onChange={(e) => setEditingClient({ ...editingClient, id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-gray-100"
                />
                <p className="text-[10px] text-[#8A93A3] mt-0.5">Feedback URL will be: /f/{editingClient.id || 'slug'}</p>
              </div>

              <div>
                <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tambi Filter Coffee"
                  value={editingClient.business_name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, business_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                    Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingClient.brand_colour || '#2563EB'}
                      onChange={(e) => setEditingClient({ ...editingClient, brand_colour: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#E6EAF2]"
                    />
                    <input
                      type="text"
                      value={editingClient.brand_colour || '#2563EB'}
                      onChange={(e) => setEditingClient({ ...editingClient, brand_colour: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#E6EAF2] font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={editingClient.status || 'active'}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E6EAF2] text-sm bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                  Google Review URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  value={editingClient.google_review_url || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, google_review_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                    Owner WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={editingClient.owner_whatsapp || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, owner_whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                    Owner Email
                  </label>
                  <input
                    type="email"
                    placeholder="owner@cafe.in"
                    value={editingClient.owner_email || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, owner_email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0B1220] uppercase tracking-wider mb-1">
                  Make.com Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://hook.eu2.make.com/..."
                  value={editingClient.webhook_url || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, webhook_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline text-xs font-bold py-2.5 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary text-xs font-bold py-2.5 px-6 text-white"
                >
                  {isSaving ? 'Saving…' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
