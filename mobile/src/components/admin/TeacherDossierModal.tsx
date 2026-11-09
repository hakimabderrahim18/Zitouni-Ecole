import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Image,
} from 'react-native';
import {
  X,
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  FileText,
  Clock,
  CreditCard,
  Briefcase,
  BookOpen,
  Layers,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
  History,
  Lock,
  Edit2,
  Save,
  RefreshCw,
  ExternalLink,
  Printer,
  ChevronDown,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { apiClient } from '../../api/client';
import { SchoolLogo } from '../SchoolLogo';
import { theme } from '../../theme/tokens';

export interface TeacherDossierModalProps {
  visible: boolean;
  onClose: () => void;
  teacherId: string | null;
  initialTeacher?: any;
  initialEditMode?: boolean;
  onUpdated?: () => void;
}

export const TeacherDossierModal: React.FC<TeacherDossierModalProps> = ({
  visible,
  onClose,
  teacherId,
  initialTeacher,
  initialEditMode,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dossier, setDossier] = useState<any>(initialTeacher || null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(!!initialEditMode);
  const [editForm, setEditForm] = useState<any>({});

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('cv');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Sub-modals for Article 24
  const [activeSubModal, setActiveSubModal] = useState<'cert' | 'contract' | 'resignation' | null>(null);

  // Resignation form state
  const [resignationNoticeDays, setResignationNoticeDays] = useState('30');
  const [resignationReason, setResignationReason] = useState('ظروف شخصية');
  const [resignationSubmitting, setResignationSubmitting] = useState(false);

  // Format date helper
  const safeDate = (val?: string | Date, fallback = '—') => {
    if (!val) return fallback;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString('ar-DZ');
    } catch {
      return fallback;
    }
  };

  const safeDateTime = (val?: string | Date, fallback = '—') => {
    if (!val) return fallback;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleString('ar-DZ');
    } catch {
      return fallback;
    }
  };

  const fetchDossier = async () => {
    if (!teacherId) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/admin/teachers/${teacherId}/dossier`);
      const data = res.data?.dossier;
      setDossier(data);
      setAttendanceStats(res.data?.attendanceStats);

      const u = data?.user || {};
      setEditForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        firstNameArabic: u.firstNameArabic || '',
        lastNameArabic: u.lastNameArabic || '',
        phoneNumber: u.phoneNumber || '',
        email: u.email || '',
        specialization: data?.specialization || data?.subjects?.[0] || '',
        cycle: data?.cycle || 'primary',
        hiringDate: data?.hiringDate ? new Date(data.hiringDate).toISOString().split('T')[0] : '',
        contractType: data?.contractType || u.contractType || 'CDI',
        contractDuration: data?.contractDuration || u.contractDuration || '1 سنة',
        contractStartDate: data?.contractStartDate ? new Date(data.contractStartDate).toISOString().split('T')[0] : '',
        contractEndDate: data?.contractEndDate ? new Date(data.contractEndDate).toISOString().split('T')[0] : '',
        baseSalary: String(data?.baseSalary || u.baseSalary || 0),
        assignedHours: String(data?.assignedHours || 18),
        assignedTasks: data?.assignedTasks || 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات',
        professionalStatus: data?.professionalStatus || 'active',
      });
    } catch (err: any) {
      console.warn('Failed to fetch teacher dossier:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setIsEditing(!!initialEditMode);
      if (initialTeacher) {
        setDossier(initialTeacher);
        const u = initialTeacher?.user || {};
        setEditForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          firstNameArabic: u.firstNameArabic || '',
          lastNameArabic: u.lastNameArabic || '',
          phoneNumber: u.phoneNumber || '',
          email: u.email || '',
          specialization: initialTeacher?.specialization || (initialTeacher?.subjects || [])[0] || '',
          cycle: initialTeacher?.cycle || 'primary',
          hiringDate: initialTeacher?.hiringDate ? new Date(initialTeacher.hiringDate).toISOString().split('T')[0] : '',
          contractType: initialTeacher?.contractType || u.contractType || 'CDI',
          contractDuration: initialTeacher?.contractDuration || u.contractDuration || '1 سنة',
          contractStartDate: initialTeacher?.contractStartDate ? new Date(initialTeacher.contractStartDate).toISOString().split('T')[0] : '',
          contractEndDate: initialTeacher?.contractEndDate ? new Date(initialTeacher.contractEndDate).toISOString().split('T')[0] : '',
          baseSalary: String(initialTeacher?.baseSalary || u.baseSalary || 64000),
          assignedHours: String(initialTeacher?.assignedHours || 18),
          assignedTasks: initialTeacher?.assignedTasks || 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات',
          professionalStatus: initialTeacher?.professionalStatus || 'active',
        });
      }
      if (teacherId) {
        fetchDossier();
      }
    } else {
      setDossier(null);
      setIsEditing(false);
      setActiveSubModal(null);
    }
  }, [visible, teacherId, initialEditMode]);

  // Handle Status Switch (active, suspended, resigned, terminated)
  const handleStatusChange = async (newStatus: string) => {
    if (!teacherId || dossier?.professionalStatus === newStatus) return;
    try {
      const res = await apiClient.put(`/api/admin/teachers/${teacherId}/dossier`, {
        professionalStatus: newStatus,
      });
      setDossier(res.data?.dossier);
      setEditForm((prev: any) => ({ ...prev, professionalStatus: newStatus }));
      Alert.alert('نجاح', `تم تحديث الوضعية المهنية للأستاذ بنجاح.`);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر تعديل الوضعية المهنية.');
    }
  };

  // Handle Save Edit Form
  const handleSaveEdit = async () => {
    if (!teacherId) return;
    try {
      setSaving(true);
      const payload = {
        ...editForm,
        baseSalary: Number(editForm.baseSalary) || 0,
        assignedHours: Number(editForm.assignedHours) || 18,
      };
      const res = await apiClient.put(`/api/admin/teachers/${teacherId}/dossier`, payload);
      setDossier(res.data?.dossier);
      setIsEditing(false);
      Alert.alert('نجاح', 'تم حفظ التعديلات في الملف المهني وتسجيلها في سجل التدقيق بنجاح.');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر حفظ تعديلات الملف.');
    } finally {
      setSaving(false);
    }
  };

  // Pick Document via expo-document-picker
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('تنبيه', 'تعذر فتح منتقي الملفات.');
    }
  };

  // Upload Document
  const handleUploadDocument = async () => {
    if (!teacherId || !uploadFile) {
      Alert.alert('تنبيه', 'يرجى اختيار ملف الوثيقة أولاً.');
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      const fileObj = {
        uri: uploadFile.uri,
        name: uploadFile.name || 'document.pdf',
        type: uploadFile.mimeType || 'application/pdf',
      } as any;
      formData.append('file', fileObj);
      formData.append('docType', uploadDocType);
      formData.append('title', uploadTitle.trim() || uploadFile.name || 'وثيقة مهنية');

      await apiClient.post(`/api/admin/teachers/${teacherId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('نجاح', 'تم إيداع الوثيقة بنجاح في الملف المهني وتحديث قائمة التدقيق.');
      setUploadFile(null);
      setUploadTitle('');
      await fetchDossier();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل رفع الوثيقة.');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه الوثيقة من الملف المهني للأستاذ؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/admin/teachers/${teacherId}/documents/${docId}`);
            Alert.alert('نجاح', 'تم حذف الوثيقة بنجاح.');
            await fetchDossier();
            if (onUpdated) onUpdated();
          } catch (err: any) {
            Alert.alert('خطأ', err.response?.data?.message || 'تعذر حذف الوثيقة.');
          }
        },
      },
    ]);
  };

  // Submit Resignation
  const handleSubmitResignation = async () => {
    if (!teacherId) return;
    try {
      setResignationSubmitting(true);
      const res = await apiClient.post(`/api/admin/teachers/${teacherId}/resignation`, {
        submissionDate: new Date().toISOString().split('T')[0],
        noticeDays: Number(resignationNoticeDays) || 30,
        reason: resignationReason,
      });
      Alert.alert('نجاح', res.data?.message || 'تم تسجيل طلب الاستقالة وبدء مدة الإشعار بنجاح.');
      setActiveSubModal(null);
      await fetchDossier();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل تسجيل طلب الاستقالة.');
    } finally {
      setResignationSubmitting(false);
    }
  };

  // Share Dossier Summary
  const handleShareDossier = async () => {
    if (!dossier) return;
    const u = dossier?.user || {};
    const text = `الملف المهني للأستاذ (المادة 23)
المؤسسة: مؤسسة التربية والتعليم حبر وألوان الخاصة
الأستاذ: ${u.firstNameArabic || u.firstName} ${u.lastNameArabic || u.lastName}
البريد الإلكتروني: ${u.email || '—'}
الهاتف: ${u.phoneNumber || '—'}
التخصص: ${dossier.specialization || (dossier.subjects || []).join(', ') || 'تعليم عام'}
الطور: ${dossier.cycle === 'middle' ? 'التعليم المتوسط' : dossier.cycle === 'secondary' ? 'التعليم الثانوي' : 'التعليم الابتدائي'}
نوع العقد: ${dossier.contractType || 'CDI'}
الراتب الأساسي: ${Number(dossier.baseSalary || 0).toLocaleString()} دج
الوضعية: ${dossier.professionalStatus || 'نشط'}`;

    try {
      await Share.share({ message: text, title: 'الملف المهني للأستاذ - المادة 23' });
    } catch {}
  };

  const statusLabels: Record<string, string> = {
    active: 'نشط (Actif)',
    suspended: 'موقوف مؤقتاً',
    resigned: 'مستقيل',
    terminated: 'منتهية العلاقة',
  };

  const docTypeLabels: Record<string, string> = {
    cv: 'السيرة الذاتية (CV)',
    diploma: 'الشهادات والمؤهلات العلمية (Diplômes & Qualifications)',
    medicalCertificate: 'الشهادة الطبية (Certificat Médical)',
    idPhotos: "الصور الشمسية (Photos d'identité - ص ش)",
    criminalRecord: 'شهادة السوابق العدلية (Casier Judiciaire - ش ر2)',
    workContract: 'عقد العمل الموقع (Contrat de travail)',
    experienceCert: 'شهادة العمل السابقة / شهادات الخبرة',
    other: 'وثيقة أخرى',
  };

  if (!visible) return null;

  const u = dossier?.user || initialTeacher?.user || {};
  const currentStatus = dossier?.professionalStatus || 'active';
  const effectiveTeacherName = `${u.firstNameArabic || u.firstName || 'الأستاذ'} ${u.lastNameArabic || u.lastName || ''}`.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* ============================================================== */}
        {/* 1. TOP ACTIONS TOOLBAR (Parity with Web Toolbar)               */}
        {/* ============================================================== */}
        <View style={styles.topToolbar}>
          <View style={styles.topToolbarHeader}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.topToolbarIconBox}>
                <Briefcase size={20} color={theme.colors.brand[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topToolbarTitle}>
                  الملف المهني للأستاذ والموظف - الفصل التاسع (المادة 23)
                </Text>
                <Text style={styles.topToolbarSubtitle} numberOfLines={1}>
                  العناصر القانونية الـ 15 | الربط الآلي بالأقسام والأفواج | سرية البيانات المالية
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Action Chips Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolbarChipsScroll}
            style={{ marginTop: 10 }}
          >
            <TouchableOpacity
              style={[styles.actionChip, isEditing && styles.actionChipActive]}
              onPress={() => setIsEditing(!isEditing)}
              activeOpacity={0.8}
            >
              <Edit2 size={14} color={isEditing ? '#FFFFFF' : theme.colors.gold[500]} />
              <Text style={[styles.actionChipText, isEditing && styles.actionChipTextActive]}>
                {isEditing ? 'معاينة الملف' : 'تعديل البيانات'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => setActiveSubModal('cert')}
              activeOpacity={0.8}
            >
              <FileCheck size={14} color={theme.colors.gold[500]} />
              <Text style={styles.actionChipText}>شهادة عمل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => setActiveSubModal('contract')}
              activeOpacity={0.8}
            >
              <FileText size={14} color={theme.colors.gold[500]} />
              <Text style={styles.actionChipText}>نموذج العقد</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => setActiveSubModal('resignation')}
              activeOpacity={0.8}
            >
              <Clock size={14} color="#D97706" />
              <Text style={styles.actionChipText}>طلب استقالة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, styles.actionChipBurgundy]}
              onPress={handleShareDossier}
              activeOpacity={0.8}
            >
              <Printer size={14} color="#FFFFFF" />
              <Text style={[styles.actionChipText, { color: '#FFFFFF' }]}>طباعة (PDF)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ============================================================== */}
        {/* 2. BODY SCROLL CONTENT                                         */}
        {/* ============================================================== */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.brand[500]} />
            <Text style={styles.loadingText}>جاري تحميل وثائق وبيانات الملف المهني...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ---------------------------------------------------------- */}
            {/* OFFICIAL REPUBLIC & INSTITUTION BANNER                     */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.officialHeaderCard}>
              <View style={styles.republicRow}>
                <View style={styles.republicRight}>
                  <Text style={styles.republicTitle}>الجمهورية الجزائرية الديمقراطية الشعبية</Text>
                  <Text style={styles.republicSub}>وزارة التربية الوطنية</Text>
                  <Text style={styles.republicSub}>مديرية التربية والتعليم الخاصة</Text>
                </View>

                <View style={styles.republicCenter}>
                  <SchoolLogo size={46} showText={false} />
                  <Text style={styles.schoolArabicName}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                  <Text style={styles.schoolFrenchName}>Groupe scolaire Encre & Pastel</Text>
                </View>

                <View style={styles.republicLeft}>
                  <Text style={styles.republicMetaText}>السنة الدراسية: 2026-2027</Text>
                  <Text style={[styles.republicMetaText, { color: theme.colors.brand[500], fontWeight: '700' }]}>
                    ملف مهني: {u.email || 'PROF'}
                  </Text>
                  <Text style={styles.republicMetaText}>الفصل التاسع - المادة 23</Text>
                </View>
              </View>

              {/* Big Burgundy Ribbon Banner */}
              <View style={styles.ribbonBanner}>
                <Text style={styles.ribbonTitle}>الملف المهني الإلكتروني للأستاذ والموظف (المادة 23)</Text>
                <Text style={styles.ribbonSubtitle}>
                  DOSSIER PROFESSIONNEL DE L'ENSEIGNANT ET DU PERSONNEL - STATUT OFFICIEL
                </Text>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* CURRENT STATUS & SWITCHER (الوضعية الحالية - البند 14)       */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeaderRow}>
                <Text style={styles.statusLabelTitle}>الوضعية الحالية (البند 14):</Text>
                <View
                  style={[
                    styles.statusPill,
                    currentStatus === 'active' && styles.statusPillActive,
                    currentStatus === 'suspended' && styles.statusPillSuspended,
                    currentStatus === 'resigned' && styles.statusPillResigned,
                    currentStatus === 'terminated' && styles.statusPillTerminated,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      currentStatus === 'active' && { color: '#065F46' },
                      currentStatus === 'suspended' && { color: '#92400E' },
                      currentStatus === 'resigned' && { color: '#334155' },
                      currentStatus === 'terminated' && { color: '#991B1B' },
                    ]}
                  >
                    {statusLabels[currentStatus] || currentStatus}
                  </Text>
                </View>
              </View>

              {/* Interactive Status Switcher Chips */}
              <View style={styles.statusChipsRow}>
                <Text style={styles.statusChipsRowLabel}>تغيير الوضعية:</Text>
                {(['active', 'suspended', 'resigned', 'terminated'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionChip, currentStatus === st && styles.statusOptionChipActive]}
                    onPress={() => handleStatusChange(st)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusOptionChipText,
                        currentStatus === st && styles.statusOptionChipTextActive,
                      ]}
                    >
                      {statusLabels[st].split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 1: PERSONAL & PROFESSIONAL IDENTITY                */}
            {/* (البيانات الشخصية والمهنية الأساسية - البنود 1، 2، 4، 5)   */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <User size={16} color={theme.colors.gold[500]} />
                  <Text style={styles.sectionTitle}>
                    البيانات الشخصية والمهنية الأساسية (البنود 1، 2، 4، 5)
                  </Text>
                </View>
              </View>

              {/* Identity Row with Photo on Right */}
              <View style={styles.identityRow}>
                {/* Photo with Gold dashed border */}
                <View style={styles.avatarBox}>
                  {u.profilePic ? (
                    <Image source={{ uri: u.profilePic }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={36} color={theme.colors.gold[500]} />
                      <Text style={styles.avatarPlaceholderText}>صورة الأستاذ (ص ش)</Text>
                    </View>
                  )}
                  <Text style={styles.avatarNameText}>{effectiveTeacherName}</Text>
                  <Text style={styles.avatarSubText}>{u.firstName || ''} {u.lastName || ''}</Text>
                </View>

                {/* Details Fields */}
                <View style={styles.identityDetails}>
                  {isEditing ? (
                    <View style={{ gap: 8 }}>
                      <View>
                        <Text style={styles.editInputLabel}>الاسم واللقب بالعربية:</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editForm.firstNameArabic}
                          onChangeText={(v) => setEditForm({ ...editForm, firstNameArabic: v })}
                          placeholder="الاسم بالعربية"
                          textAlign="right"
                        />
                      </View>
                      <View>
                        <Text style={styles.editInputLabel}>اللقب بالعربية:</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editForm.lastNameArabic}
                          onChangeText={(v) => setEditForm({ ...editForm, lastNameArabic: v })}
                          placeholder="اللقب بالعربية"
                          textAlign="right"
                        />
                      </View>
                      <View>
                        <Text style={styles.editInputLabel}>رقم الهاتف:</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editForm.phoneNumber}
                          onChangeText={(v) => setEditForm({ ...editForm, phoneNumber: v })}
                          placeholder="0550555555"
                          keyboardType="phone-pad"
                        />
                      </View>
                      <View>
                        <Text style={styles.editInputLabel}>البريد الإلكتروني:</Text>
                        <TextInput
                          style={styles.editInput}
                          value={editForm.email}
                          onChangeText={(v) => setEditForm({ ...editForm, email: v })}
                          placeholder="teacher@ecole-zitouni.dz"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.detailsList}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>1. الاسم واللقب الكامل:</Text>
                        <Text style={styles.detailValueBold}>{effectiveTeacherName}</Text>
                        <Text style={styles.detailValueSecondary}>{u.firstName || ''} {u.lastName || ''}</Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>2. الوظيفة المسندة:</Text>
                        <Text style={[styles.detailValueBold, { color: theme.colors.brand[500] }]}>
                          {u.jobTitle || (u.role === 'teacher' ? 'أستاذ(ة) تعليم' : u.role)}
                        </Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>4. رقم الهاتف:</Text>
                        <Text style={styles.detailValueMono}>{u.phoneNumber || '—'}</Text>
                      </View>

                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>5. البريد الإلكتروني المهني:</Text>
                        <Text style={styles.detailValueMono}>{u.email || '—'}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 2: SPECIALIZATION, CYCLE, CLASSES & GROUPS         */}
            {/* (3. التخصص والطور والأقسام المسندة | 11. الساعات والمهام) */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                  <BookOpen size={16} color={theme.colors.gold[500]} />
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    3. التخصص والطور والأقسام المسندة | 11. الساعات والمهام
                  </Text>
                </View>
                <View style={styles.badgeAutoLinked}>
                  <Text style={styles.badgeAutoLinkedText}>ربط آلي معتمد</Text>
                </View>
              </View>

              {isEditing ? (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <View>
                    <Text style={styles.editInputLabel}>التخصص / المادة:</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.specialization}
                      onChangeText={(v) => setEditForm({ ...editForm, specialization: v })}
                      textAlign="right"
                    />
                  </View>
                  <View>
                    <Text style={styles.editInputLabel}>الساعات المسندة أسبوعياً:</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.assignedHours}
                      onChangeText={(v) => setEditForm({ ...editForm, assignedHours: v })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View>
                    <Text style={styles.editInputLabel}>المهام البيداغوجية:</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.assignedTasks}
                      onChangeText={(v) => setEditForm({ ...editForm, assignedTasks: v })}
                      textAlign="right"
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8, marginTop: 8 }}>
                  {/* 4 Dark Cards Grid */}
                  <View style={styles.darkGrid}>
                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>التخصص / المادة:</Text>
                      <Text style={[styles.darkCardValue, { color: '#FB7185' }]}>
                        {dossier?.specialization || (dossier?.subjects || []).join(', ') || 'لغة فرنسية'}
                      </Text>
                    </View>

                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>الطور المعتمد:</Text>
                      <Text style={styles.darkCardValue}>
                        {dossier?.cycle === 'middle'
                          ? 'التعليم المتوسط'
                          : dossier?.cycle === 'secondary'
                          ? 'التعليم الثانوي'
                          : 'التعليم الابتدائي'}
                      </Text>
                    </View>

                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>11. الساعات المسندة:</Text>
                      <Text style={[styles.darkCardValue, { color: '#34D399' }]}>
                        {dossier?.assignedHours || 18} ساعة أسبوعياً
                      </Text>
                    </View>

                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>المهام البيداغوجية:</Text>
                      <Text style={[styles.darkCardValue, { fontSize: 11, lineHeight: 16 }]}>
                        {dossier?.assignedTasks || 'تدريس، تنسيق بيداغوجي، متابعة الفروض والامتحانات'}
                      </Text>
                    </View>
                  </View>

                  {/* Auto-linked Classes & Groups */}
                  <View style={styles.darkClassesRow}>
                    {/* Classes Card */}
                    <View style={styles.darkClassCard}>
                      <View style={styles.darkClassHeader}>
                        <Text style={styles.darkClassTitle}>الأقسام المسندة (كلاسته - ربط تلقائي):</Text>
                        <View style={styles.darkCounterBadge}>
                          <Text style={styles.darkCounterBadgeText}>
                            {dossier?.classes?.length || 0} قسم
                          </Text>
                        </View>
                      </View>
                      <View style={styles.pillContainer}>
                        {Array.isArray(dossier?.classes) && dossier.classes.length > 0 ? (
                          dossier.classes.map((cls: any, i: number) => (
                            <View key={cls._id || i} style={styles.classPillLight}>
                              <Text style={styles.classPillLightText}>{cls.name || cls}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyNoticeText}>لا توجد أقسام مسندة</Text>
                        )}
                      </View>
                    </View>

                    {/* Groups Card */}
                    <View style={styles.darkClassCard}>
                      <View style={styles.darkClassHeader}>
                        <Text style={styles.darkClassTitle}>الأفواج المسندة (أفواجه - ربط تلقائي):</Text>
                        <View style={styles.darkCounterBadgeGreen}>
                          <Text style={styles.darkCounterBadgeGreenText}>
                            {dossier?.groups?.length || 0} فوج
                          </Text>
                        </View>
                      </View>
                      <View style={styles.pillContainer}>
                        {Array.isArray(dossier?.groups) && dossier.groups.length > 0 ? (
                          dossier.groups.map((grp: any, i: number) => (
                            <View key={grp._id || i} style={styles.groupPillLight}>
                              <Text style={styles.groupPillLightText}>{grp.name || grp}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyNoticeText}>لا توجد أفواج مسندة</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 3: CONTRACTUAL & FINANCIAL DATA                    */}
            {/* (البيانات التعاقدية والمالية - البنود 6، 7، 8، 9، 10)       */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                  <CreditCard size={16} color={theme.colors.gold[500]} />
                  <Text style={styles.sectionTitle}>
                    البيانات التعاقدية والمالية (البنود 6، 7، 8، 9، 10)
                  </Text>
                </View>
                <View style={styles.badgeRestricted}>
                  <Lock size={11} color="#B45309" />
                  <Text style={styles.badgeRestrictedText}>مقيدة بالصلاحيات (سرية إدارية)</Text>
                </View>
              </View>

              {isEditing ? (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <View>
                    <Text style={styles.editInputLabel}>نوع العقد (CDI / CDD):</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.contractType}
                      onChangeText={(v) => setEditForm({ ...editForm, contractType: v })}
                    />
                  </View>
                  <View>
                    <Text style={styles.editInputLabel}>مدة العقد:</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.contractDuration}
                      onChangeText={(v) => setEditForm({ ...editForm, contractDuration: v })}
                      textAlign="right"
                    />
                  </View>
                  <View>
                    <Text style={styles.editInputLabel}>الراتب الأساسي (دج):</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editForm.baseSalary}
                      onChangeText={(v) => setEditForm({ ...editForm, baseSalary: v })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <View style={styles.darkGrid}>
                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>6. تاريخ التوظيف:</Text>
                      <Text style={styles.darkCardValue}>
                        {safeDate(dossier?.hiringDate || u.hiringDate, 'غير محدد')}
                      </Text>
                    </View>

                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>7. نوع العقد:</Text>
                      <Text style={[styles.darkCardValue, { color: '#E879F9' }]}>
                        {dossier?.contractType || u.contractType || 'CDI'}
                      </Text>
                    </View>

                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>8. مدة العقد:</Text>
                      <Text style={styles.darkCardValue}>
                        {dossier?.contractDuration || u.contractDuration || '1 سنة'}
                      </Text>
                    </View>

                    <View style={styles.darkCard}>
                      <Text style={styles.darkCardLabel}>9. فترة سريان العقد:</Text>
                      <Text style={[styles.darkCardValue, { fontSize: 11 }]}>
                        {safeDate(dossier?.contractStartDate, '—')} إلى {safeDate(dossier?.contractEndDate, 'مفتوح')}
                      </Text>
                    </View>
                  </View>

                  {/* Highlighted Gold Salary Card */}
                  <View style={styles.goldSalaryCard}>
                    <Text style={styles.goldSalaryLabel}>10. الراتب الأساسي:</Text>
                    <Text style={styles.goldSalaryValue}>
                      {Number(dossier?.baseSalary || u.baseSalary || 64000).toLocaleString()} دج
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 4: ABSENCES & LATES TRACKING                       */}
            {/* (12. سجل الغيابات والتأخيرات - مربوط بنظام الانضباط)       */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Clock size={16} color={theme.colors.gold[500]} />
                  <Text style={styles.sectionTitle}>
                    12. سجل الغيابات والتأخيرات (مربوط بنظام الانضباط الإداري)
                  </Text>
                </View>
                <View style={styles.counterBadgeGrey}>
                  <Text style={styles.counterBadgeGreyText}>
                    إجمالي السجلات: {attendanceStats?.totalRecords || 0}
                  </Text>
                </View>
              </View>

              {/* 4 Colorful Metric Cards (Parity with Screenshot 3) */}
              <View style={styles.attendanceGrid}>
                {/* 1. Total Absences (Red) */}
                <View style={[styles.metricCard, styles.metricCardRed]}>
                  <Text style={[styles.metricCardLabel, { color: '#B91C1C' }]}>إجمالي الغيابات</Text>
                  <Text style={[styles.metricCardValue, { color: '#991B1B' }]}>
                    {attendanceStats?.totalAbsences || 0}
                  </Text>
                </View>

                {/* 2. Excused Absences (Blue) */}
                <View style={[styles.metricCard, styles.metricCardBlue]}>
                  <Text style={[styles.metricCardLabel, { color: '#1D4ED8' }]}>غيابات مبررة</Text>
                  <Text style={[styles.metricCardValue, { color: '#1E40AF' }]}>
                    {attendanceStats?.totalExcused || 0}
                  </Text>
                </View>

                {/* 3. Lates (Amber/Yellow) */}
                <View style={[styles.metricCard, styles.metricCardYellow]}>
                  <Text style={[styles.metricCardLabel, { color: '#B45309' }]}>حالات التأخر</Text>
                  <Text style={[styles.metricCardValue, { color: '#92400E' }]}>
                    {attendanceStats?.totalLates || 0}
                  </Text>
                </View>

                {/* 4. Applied Deductions (Purple) */}
                <View style={[styles.metricCard, styles.metricCardPurple]}>
                  <Text style={[styles.metricCardLabel, { color: '#7E22CE' }]}>الخصومات المطبقة</Text>
                  <Text style={[styles.metricCardValue, { color: '#6B21A8' }]}>
                    {Number(attendanceStats?.totalDeductions || 0).toLocaleString()} دج
                  </Text>
                </View>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 5: PROFESSIONAL DOCUMENTS CHECKLIST & REPOSITORY   */}
            {/* (13. الوثائق المهنية وقائمة التدقيق - Checklist المادة 23)  */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                  <FileCheck size={16} color={theme.colors.gold[500]} />
                  <Text style={styles.sectionTitle}>
                    13. الوثائق المهنية وقائمة التدقيق (Checklist - المادة 23)
                  </Text>
                </View>
                <Text style={styles.sectionSubtitleHeader}>
                  مكتمل: {dossier?.documents?.length || 0} وثيقة مودعة
                </Text>
              </View>

              {/* Checklist Grid (Parity with Screenshot 3) */}
              <View style={styles.checklistGrid}>
                {Object.entries(docTypeLabels).map(([key, label]) => {
                  if (key === 'other') return null;
                  const isUploaded =
                    dossier?.checklist?.[key] ||
                    (dossier?.documents && dossier.documents.some((d: any) => d.docType === key));
                  return (
                    <View
                      key={key}
                      style={[
                        styles.checklistItem,
                        isUploaded && styles.checklistItemCompleted,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.checklistItemText,
                            isUploaded && styles.checklistItemTextCompleted,
                          ]}
                          numberOfLines={2}
                        >
                          {label}
                        </Text>
                      </View>
                      {isUploaded ? (
                        <CheckCircle2 size={16} color="#059669" />
                      ) : (
                        <AlertCircle size={16} color="#64748B" />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Uploaded Documents List */}
              {Array.isArray(dossier?.documents) && dossier.documents.length > 0 && (
                <View style={{ marginTop: 12, gap: 6 }}>
                  <Text style={styles.subSectionTitle}>الملفات المودعة إلكترونياً:</Text>
                  {dossier.documents.map((doc: any) => (
                    <View key={doc._id} style={styles.uploadedDocRow}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
                        <FileText size={16} color={theme.colors.brand[500]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.uploadedDocTitle} numberOfLines={1}>
                            {doc.title}
                          </Text>
                          <Text style={styles.uploadedDocMeta}>
                            {docTypeLabels[doc.docType] || doc.docType} | {safeDate(doc.uploadedAt)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDeleteDocument(doc._id)}
                        style={styles.deleteDocBtn}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Upload New Document Form Card (Parity with Screenshot 4) */}
              <View style={styles.uploadCard}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Upload size={16} color={theme.colors.brand[500]} />
                  <Text style={styles.uploadCardTitle}>إيداع وثيقة مهنية جديدة في الملف:</Text>
                </View>

                {/* Document Type Picker */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.uploadFieldLabel}>نوع الوثيقة:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                      {Object.entries(docTypeLabels).map(([k, lbl]) => (
                        <TouchableOpacity
                          key={k}
                          onPress={() => setUploadDocType(k)}
                          style={[styles.docTypeChip, uploadDocType === k && styles.docTypeChipActive]}
                        >
                          <Text style={[styles.docTypeChipText, uploadDocType === k && styles.docTypeChipTextActive]}>
                            {lbl.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Title Input */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.uploadFieldLabel}>عنوان أو وصف الوثيقة:</Text>
                  <TextInput
                    style={styles.uploadTextInput}
                    placeholder="مثال: شهادة ليسانس رياضيات 2020"
                    placeholderTextColor="#64748B"
                    value={uploadTitle}
                    onChangeText={setUploadTitle}
                    textAlign="right"
                  />
                </View>

                {/* File Picker Button */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.uploadFieldLabel}>اختر الملف (PDF / صورة):</Text>
                  <TouchableOpacity
                    style={styles.pickFileBtn}
                    onPress={handlePickDocument}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickFileBtnText} numberOfLines={1}>
                      {uploadFile ? `الملف: ${uploadFile.name}` : 'Choisir un fichier / اختر ملف'}
                    </Text>
                    <Upload size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Submit Upload Button */}
                <TouchableOpacity
                  style={[styles.submitUploadBtn, (!uploadFile || uploading) && styles.submitUploadBtnDisabled]}
                  onPress={handleUploadDocument}
                  disabled={!uploadFile || uploading}
                  activeOpacity={0.85}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Upload size={14} color={theme.colors.gold[500]} />
                      <Text style={styles.submitUploadBtnText}>تأكيد إيداع الوثيقة بالملف</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* SECTION 6: ADMINISTRATIVE AUDIT TRAIL                      */}
            {/* (15. سجل التعديلات الإدارية - Audit Trail)                 */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                  <History size={16} color={theme.colors.gold[500]} />
                  <Text style={styles.sectionTitle}>
                    15. سجل التعديلات الإدارية (Audit Trail - البند 15)
                  </Text>
                </View>
                <Text style={styles.sectionSubtitleHeader}>تسجيل زمني دقيق لكل حركة إدارية</Text>
              </View>

              {Array.isArray(dossier?.auditTrail) && dossier.auditTrail.length > 0 ? (
                <View style={{ gap: 6, marginTop: 8 }}>
                  {dossier.auditTrail
                    .slice()
                    .reverse()
                    .map((item: any, idx: number) => (
                      <View key={item._id || idx} style={styles.auditItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.auditAction}>{item.action}</Text>
                          <Text style={styles.auditDetails}>{item.details}</Text>
                          <Text style={styles.auditMeta}>
                            بواسطة: {item.performedBy} ({item.performedByRole})
                          </Text>
                        </View>
                        <Text style={styles.auditTime}>{safeDateTime(item.timestamp)}</Text>
                      </View>
                    ))}
                </View>
              ) : (
                <View style={styles.auditEmptyBox}>
                  <Text style={styles.auditEmptyText}>لا توجد تعديلات مسجلة بعد في سجل التدقيق.</Text>
                </View>
              )}
            </View>

            {/* ---------------------------------------------------------- */}
            {/* OFFICIAL SIGNATURES & STAMPS SECTION                       */}
            {/* (Parity with Screenshot 4)                                 */}
            {/* ---------------------------------------------------------- */}
            <View style={styles.signaturesRow}>
              {/* Teacher Signature Box */}
              <View style={styles.signatureBox}>
                <Text style={styles.signatureTitle}>توقيع المعني بالأمر (الأستاذ/الموظف):</Text>
                <View style={{ height: 40 }} />
              </View>

              {/* Principal Seal & Visa Box */}
              <View style={styles.signatureBox}>
                <Text style={[styles.signatureTitle, { color: theme.colors.brand[500] }]}>
                  خاتم وتأشيرة مدير المؤسسة:
                </Text>
                <View style={{ height: 40 }} />
              </View>
            </View>

            {/* Edit Mode Save Button */}
            {isEditing && (
              <View style={styles.editSaveContainer}>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelEditBtnText}>إلغاء التعديل</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveEditBtn}
                  onPress={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={16} color={theme.colors.gold[500]} />
                      <Text style={styles.saveEditBtnText}>حفظ التعديلات في السجل</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* ============================================================== */}
        {/* 3. SUB-MODALS (Article 24 Modals: Cert, Contract, Resignation) */}
        {/* ============================================================== */}

        {/* 3.1 Work Certificate Modal */}
        {activeSubModal === 'cert' && (
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalSheet}>
              <View style={styles.subModalHeader}>
                <Text style={styles.subModalTitle}>شهادة عمل رسمية (المادة 24)</Text>
                <TouchableOpacity onPress={() => setActiveSubModal(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 16 }}>
                <View style={styles.certPreviewBox}>
                  <SchoolLogo size={40} showText={false} />
                  <Text style={styles.certSchoolTitle}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                  <Text style={styles.certSchoolSub}>Groupe scolaire Encre & Pastel</Text>
                  <View style={styles.certDivider} />

                  <Text style={styles.certHeading}>شهادة عـمـل</Text>
                  <Text style={styles.certBodyText}>
                    يشهد مدير مؤسسة التربية والتعليم الخاصة "حبر وألوان" بأن:
                  </Text>
                  <Text style={styles.certPersonName}>الأستاذ(ة): {effectiveTeacherName}</Text>
                  <Text style={styles.certBodyText}>
                    يعمل لدى مؤسستنا بصفته: {u.jobTitle || 'أستاذ تعليم'}، تخصص: {dossier?.specialization || 'لغة فرنسية'}، بنظام العقد {dossier?.contractType || 'CDI'}، وذلك ابتداءً من تاريخ {safeDate(dossier?.hiringDate || u.hiringDate)}.
                  </Text>
                  <Text style={styles.certBodyText}>
                    سُلمت له هذه الشهادة بطلب منه لاستعمالها في حدود ما يسمح به القانون والتشريع المدرسي المعمول به.
                  </Text>

                  <View style={{ marginTop: 24, alignItems: 'flex-start', width: '100%' }}>
                    <Text style={styles.certDate}>حرر بتاريخ: {new Date().toLocaleDateString('ar-DZ')}</Text>
                    <Text style={styles.certSign}>خاتم وتأشيرة المدير</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.certPrintBtn}
                  onPress={() => {
                    Share.share({
                      message: `شهادة عمل رسمية - الأستاذ(ة): ${effectiveTeacherName} - مؤسسة التربية والتعليم حبر وألوان الخاصة`,
                    });
                  }}
                >
                  <Printer size={16} color="#FFFFFF" />
                  <Text style={styles.certPrintBtnText}>مشاركة / طباعة الشهادة</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {/* 3.2 Contract Template Modal */}
        {activeSubModal === 'contract' && (
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalSheet}>
              <View style={styles.subModalHeader}>
                <Text style={styles.subModalTitle}>نموذج عقد العمل الرسمي (المادة 24)</Text>
                <TouchableOpacity onPress={() => setActiveSubModal(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 16 }}>
                <View style={styles.certPreviewBox}>
                  <Text style={styles.contractTitle}>عقد عمل أستاذ تعليم ({dossier?.contractType || 'CDI'})</Text>
                  <Text style={styles.contractSubtitle}>وفقاً للمرسوم التنفيذي والقانون الأساسي المعتمد</Text>
                  <View style={styles.certDivider} />

                  <Text style={styles.contractClauseTitle}>الطرف الأول: مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
                  <Text style={styles.contractClauseTitle}>الطرف الثاني: الأستاذ(ة) {effectiveTeacherName}</Text>

                  <Text style={styles.contractBody}>
                    البند 1 (موضوع العقد): يلتزم الطرف الثاني بممارسة مهام التدريس في الطور {dossier?.cycle === 'middle' ? 'المتوسط' : dossier?.cycle === 'secondary' ? 'الثانوي' : 'الابتدائي'} لمادة {dossier?.specialization || 'التخصص المعتمد'}.
                  </Text>
                  <Text style={styles.contractBody}>
                    البند 2 (الحجم الساعي): حُدد الحجم الساعي الأسبوعي بـ {dossier?.assignedHours || 18} ساعة أسبوعياً.
                  </Text>
                  <Text style={styles.contractBody}>
                    البند 3 (الراتب والأجر): يتقاضى الطرف الثاني راتباً شهرياً أساسياً قدره {Number(dossier?.baseSalary || 64000).toLocaleString()} دج.
                  </Text>
                  <Text style={styles.contractBody}>
                    البند 4 (مدة العقد): عقد ساري المفعول ابتداءً من {safeDate(dossier?.contractStartDate)} {dossier?.contractEndDate ? `إلى غاية ${safeDate(dossier.contractEndDate)}` : 'غير محدد المدة (مفتوح)'}.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.certPrintBtn}
                  onPress={() => {
                    Share.share({
                      message: `نموذج عقد العمل - ${effectiveTeacherName} - مؤسسة حبر وألوان`,
                    });
                  }}
                >
                  <Printer size={16} color="#FFFFFF" />
                  <Text style={styles.certPrintBtnText}>مشاركة / طباعة نموذج العقد</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {/* 3.3 Resignation Request Modal */}
        {activeSubModal === 'resignation' && (
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalSheet}>
              <View style={styles.subModalHeader}>
                <Text style={styles.subModalTitle}>تسجيل ومتابعة طلب الاستقالة (المادة 24)</Text>
                <TouchableOpacity onPress={() => setActiveSubModal(null)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 16 }}>
                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={styles.uploadFieldLabel}>اسم الأستاذ المعني:</Text>
                    <Text style={styles.detailValueBold}>{effectiveTeacherName}</Text>
                  </View>

                  <View>
                    <Text style={styles.uploadFieldLabel}>مدة الإشعار القانونية (أيام):</Text>
                    <TextInput
                      style={styles.editInput}
                      value={resignationNoticeDays}
                      onChangeText={setResignationNoticeDays}
                      keyboardType="numeric"
                    />
                  </View>

                  <View>
                    <Text style={styles.uploadFieldLabel}>سبب الاستقالة:</Text>
                    <TextInput
                      style={styles.editInput}
                      value={resignationReason}
                      onChangeText={setResignationReason}
                      textAlign="right"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitUploadBtn, resignationSubmitting && styles.submitUploadBtnDisabled]}
                    onPress={handleSubmitResignation}
                    disabled={resignationSubmitting}
                  >
                    {resignationSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitUploadBtnText}>تأكيد تسجيل طلب الاستقالة وبدء الإشعار</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  topToolbar: {
    backgroundColor: '#F3E9DC',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.3)',
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  topToolbarHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topToolbarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topToolbarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  topToolbarSubtitle: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarChipsScroll: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 2,
  },
  actionChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
  },
  actionChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  actionChipBurgundy: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7B1E3A',
  },
  actionChipTextActive: {
    color: '#FFFFFF',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  // Scroll Content
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 40,
  },

  // Official Republic Header
  officialHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    gap: 12,
  },
  republicRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  republicRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  republicTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2B2022',
    textAlign: 'right',
  },
  republicSub: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 1,
  },
  republicCenter: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  schoolArabicName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7B1E3A',
    marginTop: 4,
    textAlign: 'center',
  },
  schoolFrenchName: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
  },
  republicLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  republicMetaText: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ribbonBanner: {
    backgroundColor: '#7B1E3A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  ribbonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  ribbonSubtitle: {
    fontSize: 9,
    color: '#FDE68A',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.3)',
    gap: 10,
  },
  statusHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  statusPillSuspended: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  statusPillResigned: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  statusPillTerminated: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusChipsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusChipsRowLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  statusOptionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  statusOptionChipActive: {
    backgroundColor: '#7B1E3A',
  },
  statusOptionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusOptionChipTextActive: {
    color: '#FFFFFF',
  },

  // Sections General
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.2)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'right',
  },
  sectionSubtitleHeader: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  badgeAutoLinked: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeAutoLinkedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  badgeRestricted: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeRestrictedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },

  // Identity Row
  identityRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 90,
    alignItems: 'center',
  },
  avatarImg: {
    width: 80,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C9A24D',
  },
  avatarPlaceholder: {
    width: 80,
    height: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9A24D',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  avatarPlaceholderText: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  avatarNameText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'center',
    marginTop: 6,
  },
  avatarSubText: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
  },
  identityDetails: {
    flex: 1,
  },
  detailsList: {
    gap: 6,
  },
  detailItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },
  detailValueSecondary: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
  },
  detailValueMono: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Dark Cards Grid (Parity with Screenshot 2)
  darkGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  darkCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  darkCardLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'right',
  },
  darkCardValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'right',
  },
  darkClassesRow: {
    gap: 8,
  },
  darkClassCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  darkClassHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkClassTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'right',
  },
  darkCounterBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  darkCounterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FDE68A',
  },
  darkCounterBadgeGreen: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  darkCounterBadgeGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  pillContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  classPillLight: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classPillLightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  groupPillLight: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  groupPillLightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  emptyNoticeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Gold Salary Card (Screenshot 2)
  goldSalaryCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  goldSalaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  goldSalaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#7B1E3A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 4,
  },

  // Attendance Metric Cards (Screenshot 3)
  counterBadgeGrey: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counterBadgeGreyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  attendanceGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  metricCardRed: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  metricCardBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  metricCardYellow: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FDE68A',
  },
  metricCardPurple: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Checklist Grid (Screenshot 3)
  checklistGrid: {
    gap: 6,
    marginTop: 6,
  },
  checklistItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  checklistItemCompleted: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  checklistItemText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'right',
  },
  checklistItemTextCompleted: {
    color: '#065F46',
  },

  // Uploaded Docs List
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'right',
  },
  uploadedDocRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 8,
  },
  uploadedDocTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
  },
  uploadedDocMeta: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'right',
  },
  deleteDocBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },

  // Upload Card (Screenshot 4)
  uploadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  uploadCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'right',
  },
  uploadFieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'right',
    marginBottom: 4,
  },
  docTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  docTypeChipActive: {
    backgroundColor: '#7B1E3A',
  },
  docTypeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  docTypeChipTextActive: {
    color: '#FFFFFF',
  },
  uploadTextInput: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#F8FAFC',
    fontSize: 11,
  },
  pickFileBtn: {
    backgroundColor: '#7B1E3A',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pickFileBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  submitUploadBtn: {
    backgroundColor: '#7B1E3A',
    borderWidth: 1,
    borderColor: '#C9A24D',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 9,
  },
  submitUploadBtnDisabled: {
    opacity: 0.5,
  },
  submitUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Audit Trail
  auditItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 8,
  },
  auditAction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'right',
  },
  auditDetails: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'right',
    marginTop: 2,
  },
  auditMeta: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
  },
  auditTime: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  auditEmptyBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  auditEmptyText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Signatures Row (Screenshot 4)
  signaturesRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  signatureBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },

  // Edit Mode Inputs & Save
  editInputLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'right',
    marginBottom: 2,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: '#0F172A',
  },
  editSaveContainer: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 10,
  },
  cancelEditBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  saveEditBtn: {
    flex: 2,
    backgroundColor: '#7B1E3A',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveEditBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Sub-Modals
  subModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  subModalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  subModalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3E9DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201, 162, 77, 0.3)',
  },
  subModalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7B1E3A',
  },
  certPreviewBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  certSchoolTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7B1E3A',
    textAlign: 'center',
  },
  certSchoolSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  certDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#C9A24D',
    marginVertical: 8,
  },
  certHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'center',
    marginVertical: 6,
  },
  certBodyText: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'right',
    lineHeight: 18,
    width: '100%',
  },
  certPersonName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    width: '100%',
    marginVertical: 4,
  },
  certDate: {
    fontSize: 10,
    color: '#64748B',
  },
  certSign: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
    marginTop: 4,
  },
  certPrintBtn: {
    backgroundColor: '#7B1E3A',
    borderRadius: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 14,
  },
  certPrintBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'center',
  },
  contractSubtitle: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  contractClauseTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    width: '100%',
    marginTop: 4,
  },
  contractBody: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'right',
    lineHeight: 16,
    width: '100%',
    marginTop: 2,
  },
});
