import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, Check, ChevronDown, Sparkles } from 'lucide-react';

export default function StudentSearchInput({
  students = [],
  selectedStudentId,
  onSelectStudent,
  placeholder = 'ابحث باسم التلميذ، اللقب، رقم الرقمنة أو القسم...',
  label = 'التلميذ المعني بالخروج *',
  required = true,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find currently selected student
  const selectedStudent = students.find((s) => s._id === selectedStudentId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students by query
  const filteredStudents = students.filter((stu) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const arabicName = `${stu.firstNameArabic || ''} ${stu.lastNameArabic || ''}`.toLowerCase();
    const latinName = `${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.toLowerCase();
    const email = (stu.user?.email || '').toLowerCase();
    const regNum = (stu.registrationNumber || '').toLowerCase();
    const natId = (stu.nationalIdDigitization || '').toLowerCase();
    const clsName = (stu.class?.name || '').toLowerCase();

    return (
      arabicName.includes(q) ||
      latinName.includes(q) ||
      email.includes(q) ||
      regNum.includes(q) ||
      natId.includes(q) ||
      clsName.includes(q)
    );
  });

  const getStudentDisplayName = (stu) => {
    if (!stu) return '';
    if (stu.firstNameArabic && stu.lastNameArabic) {
      return `${stu.firstNameArabic} ${stu.lastNameArabic}`;
    }
    return `${stu.user?.firstName || ''} ${stu.user?.lastName || ''}`.trim() || 'تلميذ مسجل';
  };

  const handleSelect = (stu) => {
    onSelectStudent(stu._id, stu);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectStudent('', null);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 text-right font-sans relative" ref={containerRef} dir="rtl">
      {label && (
        <label className="text-[#7B1E3A] font-extrabold text-xs flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-[#2B2022]/50 font-normal">
            ({students.length} تلميذ مسجل في النظام)
          </span>
        </label>
      )}

      {/* Selected Student Display Card */}
      {selectedStudent ? (
        <div className="p-3 rounded-2xl bg-[#FCF8F2] border-2 border-[#7B1E3A] flex items-center justify-between gap-3 shadow-xs transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#7B1E3A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {selectedStudent.user?.profilePic ? (
                <img
                  src={selectedStudent.user.profilePic}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                getStudentDisplayName(selectedStudent).charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#2B2022] text-sm truncate">
                  {getStudentDisplayName(selectedStudent)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#7B1E3A]/10 text-[#7B1E3A] text-[10px] font-extrabold border border-[#7B1E3A]/20">
                  {selectedStudent.class?.name || 'بدون قسم'}
                </span>
              </div>
              <p className="text-[11px] text-[#2B2022]/60 mt-0.5 font-mono">
                رقم الرقمنة: {selectedStudent.nationalIdDigitization || selectedStudent.registrationNumber || '—'} &bull; ولي الأمر: {selectedStudent.parent?.fatherNameArabic || selectedStudent.parent?.user?.firstName || 'مسجل'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shrink-0"
            title="تغيير التلميذ المختار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Search Input with Live Suggestions Dropdown */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#7B1E3A] absolute right-3.5 pointer-events-none" />
            <input
              type="text"
              required={required && !selectedStudentId}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full pr-10 pl-9 py-2.5 rounded-xl bg-white border-2 border-[#C9A24D]/45 hover:border-[#C9A24D] focus:border-[#7B1E3A] focus:ring-2 focus:ring-[#7B1E3A]/20 text-[#2B2022] text-xs font-bold transition-all placeholder:text-[#2B2022]/40 shadow-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute left-3 text-stone-400 hover:text-[#7B1E3A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-[#C9A24D]/50 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-50 divide-y divide-[#C9A24D]/15">
              <div className="p-2 bg-[#F3E9DC]/60 text-[10px] text-[#7B1E3A] font-bold flex items-center justify-between border-b border-[#C9A24D]/25">
                <span>اقتراحات التلاميذ المطابقة ({filteredStudents.length})</span>
                <span className="text-stone-500 font-normal">انقر لاختيار التلميذ</span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-[#2B2022]/50 text-xs italic">
                  لا توجد نتائج مطابقة لـ "{query}". تأكد من كتابة الاسم أو رقم الرقمنة بشكل صحيح.
                </div>
              ) : (
                filteredStudents.slice(0, 40).map((stu) => {
                  const name = getStudentDisplayName(stu);
                  return (
                    <button
                      key={stu._id}
                      type="button"
                      onClick={() => handleSelect(stu)}
                      className="w-full p-2.5 text-right flex items-center justify-between gap-2.5 hover:bg-[#F3E9DC]/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#7B1E3A]/10 text-[#7B1E3A] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#7B1E3A] group-hover:text-white transition-colors">
                          {stu.user?.profilePic ? (
                            <img
                              src={stu.user.profilePic}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="font-bold text-[#2B2022] text-xs group-hover:text-[#7B1E3A] transition-colors truncate">
                            {name}
                          </p>
                          <p className="text-[10px] text-[#2B2022]/60 font-mono">
                            {stu.nationalIdDigitization || stu.registrationNumber || 'بدون رقم رقمنة'}
                          </p>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#FAF4EB] border border-[#C9A24D]/35 text-[#7B1E3A] text-[10px] font-bold">
                          {stu.class?.name || 'بدون قسم'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
