import React from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import Feed from '../components/Feed';

export default function FeedPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5" dir="rtl">
        {/* Cover banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#C9A24D]/30 bg-[#FDFBF7] shadow-sm">
          <div className="relative p-6 md:p-7 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7B1E3A] flex items-center justify-center shadow-md shadow-[#7B1E3A]/25 shrink-0 border border-[#C9A24D]/40">
                <Megaphone className="w-6 h-6 text-[#F3E9DC]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#7B1E3A] font-serif leading-tight">فضاء التواصل الأكاديمي</h1>
                <p className="text-xs text-[#2B2022]/70 font-sans mt-0.5">
                  تابع الإعلانات والأخبار وتفاعل مع مجتمعك التعليمي
                </p>
              </div>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#7B1E3A] bg-[#C9A24D]/15 border border-[#C9A24D]/30 px-3 py-1.5 rounded-full font-sans">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A24D]" />
              مباشر
            </span>
          </div>
        </div>

        <Feed />
      </div>
    </DashboardLayout>
  );
}
