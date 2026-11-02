import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface SchoolSettings {
  schoolNameArabic: string;
  schoolNameFrench: string;
  slogan: string;
  academicYear: string;
  institutionName: string;
  location: string;
  contactPhone: string;
}

interface SchoolStoreState {
  settings: SchoolSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSchoolStore = create<SchoolStoreState>((set) => ({
  settings: {
    schoolNameArabic: 'مدرسة حبر',
    schoolNameFrench: 'Groupe scolaire Encre & Pastel',
    slogan: 'يا نشء أنت رجاؤنا',
    academicYear: '2026-2027',
    institutionName: 'مؤسسة التربية والتعليم حبر وألوان الخاصة',
    location: 'أولاد فايت - الجزائر غرب',
    contactPhone: '0554075701',
  },
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get('/api/school-settings');
      if (res.data?.settings) {
        set({ settings: res.data.settings, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },
}));
