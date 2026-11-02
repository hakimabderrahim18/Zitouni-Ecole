import { create } from 'zustand';
import axios from 'axios';

export const useSchoolStore = create((set, get) => ({
  settings: {
    schoolNameArabic: 'مدرسة حبر',
    schoolNameFrench: 'Groupe scolaire Encre & Pastel',
    slogan: 'يا نشء أنت رجاؤنا',
    institutionName: 'مؤسسة التربية والتعليم حبر وألوان الخاصة',
    location: 'أولاد فايت - الجزائر غرب',
    contactPhone: '0554075701',
    logoUrl: '',
    headerBannerUrl: '',
    carouselImages: [],
    primaryColor: '#7B1E3A',
    secondaryColor: '#F3E9DC',
    accentColor: '#C9A24D',
    textColor: '#2B2022',
    titleFont: 'Cormorant Garamond',
    bodyFont: 'Lato',
    academicYear: '2026-2027',
    sessionTimeoutMinutes: 30,
    maxFailedLoginAttempts: 4,
  },
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    try {
      set({ isLoading: true });
      const res = await axios.get('/api/school-settings');
      if (res.data?.settings) {
        set({ settings: res.data.settings, isLoading: false });
      }
    } catch (err) {
      console.warn('Could not load school settings, using defaults:', err.message);
      set({ isLoading: false });
    }
  },

  updateSettings: async (updatedData) => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('zitouni_access_token');
      const res = await axios.put('/api/school-settings', updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.settings) {
        set({ settings: res.data.settings, isLoading: false });
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la mise à jour des paramètres';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  uploadAsset: async (file, type) => {
    try {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem('zitouni_access_token');
      const formData = new FormData();
      formData.append('file', file);
      if (type) formData.append('type', type);

      const res = await axios.post('/api/school-settings/upload-asset', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh settings
      await get().fetchSettings();
      set({ isLoading: false });
      return res.data?.url;
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors du téléchargement du fichier';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },
}));
