import { useState } from 'react';
import { ReviewItem } from '@/lib/types';

interface ReviewItemCardProps {
  item: ReviewItem;
  onDecision: (itemId: string, decision: 'KEEP' | 'REVOKE', comment?: string) => void;
}

export default function ReviewItemCard({ item, onDecision }: ReviewItemCardProps) {
  const [comment, setComment] = useState(item.comment || '');
  const [isCommenting, setIsCommenting] = useState(false);

  const isPending = item.decision === 'PENDING';

  const handleDecision = (decision: 'KEEP' | 'REVOKE') => {
    if (isCommenting && !comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    onDecision(item.id, decision, comment || undefined);
    setIsCommenting(false);
    setComment('');
  };

  const getStatusBadge = () => {
    switch (item.decision) {
      case 'KEEP':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Approved</span>;
      case 'REVOKE':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Revoked</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pending</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {item.accessGrant.system?.name || 'Unknown System'}
          </h3>
          <p className="text-sm text-gray-600">
            {item.accessGrant.system?.type} • Campaign: {item.campaign.name}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">User</p>
          <p className="font-medium text-gray-900">{item.accessGrant.principal?.name}</p>
          <p className="text-sm text-gray-500">{item.accessGrant.principal?.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Role / Permission</p>
          <p className="font-medium text-gray-900">{item.accessGrant.role}</p>
          <p className="text-sm text-gray-500">
            Granted: {new Date(item.accessGrant.grantedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {item.accessGrant.metaJson && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600 mb-1">Additional Info</p>
          <pre className="text-xs text-gray-700 font-mono">
            {JSON.stringify(item.accessGrant.metaJson, null, 2)}
          </pre>
        </div>
      )}

      {item.comment && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-600 mb-1">Review Comment</p>
          <p className="text-sm text-gray-700">{item.comment}</p>
          {item.decidedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Decided: {new Date(item.decidedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {isPending && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {isCommenting ? (
            <div className="space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDecision('KEEP')}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Approve Access
                </button>
                <button
                  onClick={() => handleDecision('REVOKE')}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Revoke Access
                </button>
                <button
                  onClick={() => {
                    setIsCommenting(false);
                    setComment('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => handleDecision('KEEP')}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecision('REVOKE')}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Revoke
              </button>
              <button
                onClick={() => setIsCommenting(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
              >
                Add Comment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
