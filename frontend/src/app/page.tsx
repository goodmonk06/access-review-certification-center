'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      router.push(`/review?email=${encodeURIComponent(email)}`);
    }
  };

  const quickLogin = (testEmail: string) => {
    setEmail(testEmail);
    router.push(`/review?email=${encodeURIComponent(testEmail)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Review Center
          </h1>
          <p className="text-gray-600">
            Periodic access certification and review
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Reviewer Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your.email@company.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            Continue to Reviews
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Quick login for demo:</p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('alice@company.com')}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
            >
              Alice Johnson (alice@company.com)
            </button>
            <button
              onClick={() => quickLogin('bob@company.com')}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
            >
              Bob Smith (bob@company.com)
            </button>
            <button
              onClick={() => quickLogin('carol@company.com')}
              className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
            >
              Carol Williams (carol@company.com)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
