import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Eye, Filter, X } from 'lucide-react';

interface KYCSubmission {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  rd_number: string;
  document_type: string;
  kyc_status: string;
  kyc_data: any;
  created_at: string;
  kyc_verified_at?: string;
}

const AdminKYC: React.FC = () => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingSubmission, setViewingSubmission] = useState<KYCSubmission | null>(null);

  useEffect(() => {
    const fetchKYCs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
        const response = await fetch('/api/admin/kyc', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSubmissions(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching KYC submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCs();
  }, []);

  const handleApprove = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this KYC submission?')) return;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/admin/users/${userId}/verify-kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'verified' })
      });

      if (response.ok) {
        // Refresh the list
        const refreshResponse = await fetch('/api/admin/kyc', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.success && data.data) {
            setSubmissions(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert('Failed to approve KYC. Please try again.');
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this KYC submission?')) return;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/admin/users/${userId}/verify-kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        // Refresh the list
        const refreshResponse = await fetch('/api/admin/kyc', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          if (data.success && data.data) {
            setSubmissions(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert('Failed to reject KYC. Please try again.');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.rd_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.kyc_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-charcoal dark:text-white mb-2">KYC Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Review and manage KYC verification submissions.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <input 
              type="text" 
              placeholder="Search by name, email or RD number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary text-charcoal dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="size-3" /> Status: 
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none text-xs font-bold focus:ring-0"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">RD Number</th>
                <th className="px-6 py-4">Document Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-charcoal dark:text-white text-sm">{sub.user_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{sub.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal dark:text-white font-mono">
                      {sub.rd_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal dark:text-white capitalize">
                      {sub.document_type === 'mn_id' ? 'Mongolian ID' : 'Passport'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${sub.kyc_status === 'verified' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                          sub.kyc_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                        {sub.kyc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sub.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewingSubmission(sub)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-charcoal dark:text-white transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {sub.kyc_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(sub.user_id)}
                              className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(sub.user_id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No KYC submissions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Submission Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white">KYC Submission Details</h2>
              <button
                onClick={() => setViewingSubmission(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="size-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">User</p>
                <p className="text-charcoal dark:text-white">{viewingSubmission.user_name} ({viewingSubmission.user_email})</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">RD Number</p>
                <p className="text-charcoal dark:text-white font-mono">{viewingSubmission.rd_number}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Document Type</p>
                <p className="text-charcoal dark:text-white capitalize">{viewingSubmission.document_type === 'mn_id' ? 'Mongolian ID' : 'Passport'}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                  ${viewingSubmission.kyc_status === 'verified' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                    viewingSubmission.kyc_status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {viewingSubmission.kyc_status}
                </span>
              </div>
              {viewingSubmission.kyc_data && (
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Documents</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {viewingSubmission.kyc_data.front_document && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Front Document</p>
                        <div className="relative group">
                          <img 
                            src={viewingSubmission.kyc_data.front_document} 
                            alt="Front document" 
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(viewingSubmission.kyc_data.front_document, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                            <Eye className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    )}
                    {viewingSubmission.kyc_data.back_document && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Back Document</p>
                        <div className="relative group">
                          <img 
                            src={viewingSubmission.kyc_data.back_document} 
                            alt="Back document" 
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(viewingSubmission.kyc_data.back_document, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                            <Eye className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    )}
                    {viewingSubmission.kyc_data.selfie && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selfie</p>
                        <div className="relative group">
                          <img 
                            src={viewingSubmission.kyc_data.selfie} 
                            alt="Selfie" 
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(viewingSubmission.kyc_data.selfie, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                            <Eye className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    )}
                    {!viewingSubmission.kyc_data.front_document && 
                     !viewingSubmission.kyc_data.back_document && 
                     !viewingSubmission.kyc_data.selfie && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 col-span-3 text-center py-4">
                        No documents available
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {viewingSubmission.kyc_status === 'pending' && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleApprove(viewingSubmission.user_id);
                    setViewingSubmission(null);
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} /> Approve
                </button>
                <button
                  onClick={() => {
                    handleReject(viewingSubmission.user_id);
                    setViewingSubmission(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={20} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
