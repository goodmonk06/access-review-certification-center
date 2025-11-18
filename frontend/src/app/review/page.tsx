'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ReviewItem } from '@/lib/types';
import ReviewItemCard from '@/components/ReviewItemCard';

function ReviewDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'decided'>('pending');

  useEffect(() => {
    if (!email) {
      router.push('/');
      return;
    }

    loadReviewItems();
  }, [email]);

  const loadReviewItems = async () => {
    if (!email) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getReviewItems(email);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review items');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (itemId: string, decision: 'KEEP' | 'REVOKE', comment?: string) => {
    if (!email) return;

    try {
      await api.updateReviewDecision(itemId, email, decision, comment);
      await loadReviewItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update decision');
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return item.decision === 'PENDING';
    if (filter === 'decided') return item.decision !== 'PENDING';
    return true;
  });

  const stats = {
    total: items.length,
    pending: items.filter(i => i.decision === 'PENDING').length,
    keep: items.filter(i => i.decision === 'KEEP').length,
    revoke: items.filter(i => i.decision === 'REVOKE').length,
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Access Review Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Reviewer: {email}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Change Reviewer
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.keep}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Revoked</p>
            <p className="text-2xl font-bold text-red-600">{stats.revoke}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('decided')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'decided'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Decided ({stats.keep + stats.revoke})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading review items...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No review items found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onDecision={handleDecision}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReviewDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewDashboardContent />
    </Suspense>
  );
}
