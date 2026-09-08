'use client';

import React, { useState } from 'react';
import { Submission, Client } from '@/types/app.types';

interface SubmissionsTableProps {
  submissions: Submission[];
  clients: Client[];
}

export function SubmissionsTable({ submissions, clients }: SubmissionsTableProps) {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedClient !== 'all' && sub.client_id !== selectedClient) return false;
    if (ratingFilter === 'high' && sub.rating < 4) return false;
    if (ratingFilter === 'low' && sub.rating > 3) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.name.toLowerCase().includes(q);
      const matchPhone = sub.phone.includes(q);
      const matchComment = sub.comment?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchComment) return false;
    }
    return true;
  });

  const getClientName = (clientId: string) => {
    const found = clients.find((c) => c.id === clientId);
    return found ? found.business_name : clientId;
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filters */}
      <div className="bg-white border border-[#E6EAF2] rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E6EAF2] text-xs font-semibold text-[#0B1220] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          >
            <option value="all">All Clients ({submissions.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E6EAF2] text-xs font-semibold text-[#0B1220] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
          >
            <option value="all">All Ratings (1-5 ★)</option>
            <option value="high">Happy (4-5 ★ Only)</option>
            <option value="low">Service Recovery (1-3 ★ Only)</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search name, phone, comment…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E6EAF2] text-xs text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 w-full sm:w-56"
          />
        </div>

        {/* CSV Export Action */}
        <a
          href={`/api/admin/export${selectedClient !== 'all' ? `?clientId=${selectedClient}` : ''}`}
          className="btn btn-outline text-xs font-bold py-2 px-4 flex items-center gap-2 self-stretch md:self-auto justify-center hover:bg-[#0B1220] hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export Customer CSV</span>
        </a>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-[#E6EAF2] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F8FF] border-b border-[#E6EAF2] text-[11px] font-extrabold uppercase text-[#5B6472] tracking-wider">
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Rating</th>
                <th className="py-3.5 px-6">Business / Client</th>
                <th className="py-3.5 px-6">Feedback / Comments</th>
                <th className="py-3.5 px-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EAF2] text-xs">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#8A93A3]">
                    No customer submissions found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isHappy = sub.rating >= 4;
                  return (
                    <tr key={sub.id} className="hover:bg-[#F5F8FF]/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#0B1220]">
                        {sub.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-[#5B6472]">
                        +91 {sub.phone}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-extrabold text-xs ${
                            isHappy
                              ? 'bg-[#EAFBF5] text-[#00C896]'
                              : 'bg-[#FFF1F5] text-[#FF4D8D]'
                          }`}
                        >
                          <span>{sub.rating}</span>
                          <span>★</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-[#0B1220]">
                        {getClientName(sub.client_id)}
                      </td>
                      <td className="py-4 px-6 max-w-xs text-[#5B6472] truncate">
                        {sub.comment ? `"${sub.comment}"` : <span className="text-[#8A93A3] italic">No comment</span>}
                      </td>
                      <td className="py-4 px-6 text-[#8A93A3] whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
