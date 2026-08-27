import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
        
        <div className="relative z-10 space-y-6 bg-white/50 backdrop-blur-xl p-8 sm:p-12 rounded-[2rem] border border-white shadow-xl shadow-gray-200/20">
          <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 tracking-tighter drop-shadow-sm">404</h1>
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Page Not Found</h2>
            <p className="text-gray-500 text-sm sm:text-base font-medium">
              We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in this timeline.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
            <button 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-900 hover:shadow-md transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <Link 
              to="/"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-black text-white font-bold hover:bg-zinc-800 hover:shadow-md transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4" /> Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
