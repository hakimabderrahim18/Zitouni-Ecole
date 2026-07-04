import React from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import Feed from '../components/Feed';

export default function FeedPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5" dir="rtl">
        {/* Cover banner */}
        <div className="relative overflow-hidden rounded-2xl border border-luxury-border glass-panel">
          <div className="absolute inset-0 mesh-gradient opacity-80 pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 md:p-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">فضاء التواصل الأكاديمي</h1>
                <p className="text-xs text-slate-450 mt-0.5">
                  تابع الإعلانات والأخبار وتفاعل مع مجتمعك التعليمي
                </p>
              </div>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-300 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              مباشر
            </span>
          </div>
        </div>

        <Feed />
      </div>
    </DashboardLayout>
  );
}
