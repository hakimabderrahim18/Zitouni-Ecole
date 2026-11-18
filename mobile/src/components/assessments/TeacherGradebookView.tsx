import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {
  GraduationCap,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  BookOpen,
  Users,
  Check,
  ChevronDown,
  Lock,
  Sparkles,
  Calendar,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { theme } from '../../theme/tokens';

const SUGGESTED_REMARKS = [
  'ممتاز، استيعاب عميق.',
  'جيد جداً، واصل.',
  'عمل جيد، نتائج مشجعة.',
  'مستوى متوسط، ركّز أكثر.',
  'يحتاج إلى تحسين في المنهجية.',
  'يحتاج إلى متابعة منزلية.',
];

const ASSESSMENT_TYPES = [
  'الفرض الأول',
  'الفرض الثاني',
  'التقويم المستمر',
  'اختبار الثلاثي الأول',
  'اختبار الثلاثي الثاني',
  'فرض تجريبي',
];

export function TeacherGradebookView() {
  const [activeSubTab, setActiveSubTab] = useState<'entry' | 'history'>('entry');
  const [loading, setLoading] = useState(true);
  const [assignedData, setAssignedData] = useState<{ classes: any[]; subjects: string[] }>({
    classes: [],
    subjects: [],
  });

  // Current Selection
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessmentType, setAssessmentType] = useState('الفرض الأول');
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxGrade, setMaxGrade] = useState(20);

  // Active Assessment State
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState('draft');
  const [returnReason, setReturnReason] = useState('');
  const [classRemark, setClassRemark] = useState('');
  const [studentRecords, setStudentRecords] = useState<any[]>([]);

  // Auto-save Status
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimerRef = useRef<any>(null);

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [savingManual, setSavingManual] = useState(false);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  useEffect(() => {
    fetchAssigned();
    loadHistory();
  }, []);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/assessments/teacher/assigned');
      setAssignedData(res.data);

      if (res.data.classes?.length > 0) {
        const first = res.data.classes[0];
        setSelectedClassId(first._id);
        if (res.data.subjects?.length > 0) setSelectedSubject(res.data.subjects[0]);
        initRoster(first);
      }
    } catch (err) {
      console.warn('Error fetching teacher assigned:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await apiClient.get('/api/assessments/teacher/my-assessments');
      setHistoryList(res.data || []);
    } catch (err) {
      console.warn('Error loading history:', err);
    }
  };

  const initRoster = (classObj: any) => {
    if (!classObj || !classObj.students) return;
    const records = (classObj.students || []).map((st: any) => ({
      student: st._id,
      fullName: st.fullName,
      registrationNumber: st.registrationNumber,
      grade: '',
      isAbsent: false,
      individualRemark: '',
    }));
    setStudentRecords(records);
    setCurrentAssessmentId(null);
    setAssessmentStatus('draft');
    setReturnReason('');
    setClassRemark('');
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    const found = assignedData.classes.find((c) => c._id === classId);
    if (found) initRoster(found);
  };

  const handleGradeChange = (studentId: string, val: string) => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setStudentRecords((prev) =>
      prev.map((r) => {
        if (r.student === studentId) {
          if (val === '') return { ...r, grade: '', isAbsent: false };
          const num = parseFloat(val);
          if (isNaN(num) || num < 0 || num > maxGrade) return r;
          return { ...r, grade: val, isAbsent: false };
        }
        return r;
      })
    );
    triggerAutoSave();
  };

  const handleToggleAbsent = (studentId: string) => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setStudentRecords((prev) =>
      prev.map((r) => {
        if (r.student === studentId) {
          const next = !r.isAbsent;
          return { ...r, isAbsent: next, grade: next ? '' : r.grade };
        }
        return r;
      })
    );
    triggerAutoSave();
  };

  const handleRemarkSelect = (studentId: string, remark: string) => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setStudentRecords((prev) =>
      prev.map((r) => (r.student === studentId ? { ...r, individualRemark: remark } : r))
    );
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (assessmentStatus === 'submitted' || assessmentStatus === 'approved') return;
    setAutoSaveStatus('saving');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      executeSave(false, true);
    }, 2500);
  };

  const executeSave = async (submitToAdmin = false, isAutoSave = false) => {
    if (!selectedClassId || !selectedSubject) return;

    if (submitToAdmin) setSubmittingAdmin(true);
    else if (!isAutoSave) setSavingManual(true);

    try {
      const payload = {
        assessmentId: currentAssessmentId,
        classId: selectedClassId,
        subject: selectedSubject,
        assessmentType,
        assessmentDate,
        maxGrade,
        classRemark,
        records: studentRecords.map((r) => ({
          student: r.student,
          grade: r.grade === '' ? null : Number(r.grade),
          isAbsent: r.isAbsent,
          individualRemark: r.individualRemark,
        })),
        submitToAdmin,
        forceDuplicate: true,
      };

      const res = await apiClient.post('/api/assessments/save', payload);
      const saved = res.data.assessment;
      setCurrentAssessmentId(saved._id);
      setAssessmentStatus(saved.status);
      setAutoSaveStatus('saved');

      if (submitToAdmin) {
        Alert.alert('تم الإرسال', 'تم إرسال الكشف بنجاح إلى الإدارة وهو الآن قيد المراجعة.');
        loadHistory();
      } else if (!isAutoSave) {
        Alert.alert('تم الحفظ', 'تم حفظ مسودة كشف النقاط بنجاح.');
        loadHistory();
      }
    } catch (err: any) {
      setAutoSaveStatus('error');
      if (!isAutoSave) {
        Alert.alert('خطأ', err.response?.data?.message || 'فشل حفظ الكشف.');
      }
    } finally {
      setSavingManual(false);
      setSubmittingAdmin(false);
    }
  };

  const isLocked = assessmentStatus === 'submitted' || assessmentStatus === 'approved';

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand[500]} />
        <Text style={styles.loadingText}>جاري تحميل الأقسام والمواد المسندة...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Switcher Sub-Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeSubTab === 'entry' && styles.topTabBtnActive]}
          onPress={() => setActiveSubTab('entry')}
        >
          <BookOpen size={16} color={activeSubTab === 'entry' ? '#FFF' : theme.colors.text.secondary} />
          <Text style={[styles.topTabText, activeSubTab === 'entry' && styles.topTabTextActive]}>
            إدخال النقاط
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeSubTab === 'history' && styles.topTabBtnActive]}
          onPress={() => {
            setActiveSubTab('history');
            loadHistory();
          }}
        >
          <Clock size={16} color={activeSubTab === 'history' ? '#FFF' : theme.colors.text.secondary} />
          <Text style={[styles.topTabText, activeSubTab === 'history' && styles.topTabTextActive]}>
            سجل كشوفاتي ({historyList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'entry' && (
        <View style={styles.entryContainer}>
          {/* Status Alerts */}
          {assessmentStatus === 'returned' && (
            <View style={styles.returnedBanner}>
              <RotateCcw size={20} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.returnedTitle}>تنبيه: الكشف مُعاد للتصحيح من الإدارة</Text>
                <Text style={styles.returnedReason}>سبب الإرجاع: {returnReason}</Text>
              </View>
            </View>
          )}

          {assessmentStatus === 'submitted' && (
            <View style={styles.submittedBanner}>
              <Lock size={18} color="#0284C7" />
              <Text style={styles.submittedText}>الكشف مرسل إلى الإدارة وقيد المراجعة (مقفل للتعديل)</Text>
            </View>
          )}

          {/* Selectors Bar */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>بيانات الفرض والتقييم</Text>

            {/* Class chips */}
            <Text style={styles.fieldLabel}>اختر القسم المسند:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {assignedData.classes.map((cls) => (
                <TouchableOpacity
                  key={cls._id}
                  disabled={isLocked}
                  style={[styles.chip, selectedClassId === cls._id && styles.chipActive]}
                  onPress={() => handleClassChange(cls._id)}
                >
                  <Text style={[styles.chipText, selectedClassId === cls._id && styles.chipTextActive]}>
                    {cls.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Subject chips */}
            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>اختر المادة:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {assignedData.subjects.map((sub, i) => (
                <TouchableOpacity
                  key={i}
                  disabled={isLocked}
                  style={[styles.chip, selectedSubject === sub && styles.chipActive]}
                  onPress={() => setSelectedSubject(sub)}
                >
                  <Text style={[styles.chipText, selectedSubject === sub && styles.chipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Assessment Type chips */}
            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>نوع التقييم:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {ASSESSMENT_TYPES.map((type, i) => (
                <TouchableOpacity
                  key={i}
                  disabled={isLocked}
                  style={[styles.chip, assessmentType === type && styles.chipActive]}
                  onPress={() => setAssessmentType(type)}
                >
                  <Text style={[styles.chipText, assessmentType === type && styles.chipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Student Roster Cards */}
          <View style={styles.rosterHeader}>
            <Text style={styles.rosterTitle}>قائمة تلاميذ القسم ({studentRecords.length} تلميذ)</Text>
            {autoSaveStatus === 'saving' && (
              <Text style={styles.autoSaveText}>جاري الحفظ التلقائي...</Text>
            )}
            {autoSaveStatus === 'saved' && (
              <Text style={[styles.autoSaveText, { color: '#16A34A' }]}>تم الحفظ التلقائي ✓</Text>
            )}
          </View>

          {studentRecords.map((r, idx) => (
            <View key={r.student} style={[styles.studentCard, r.isAbsent && styles.studentCardAbsent]}>
              <View style={styles.studentHeader}>
                <View style={styles.numBadge}>
                  <Text style={styles.numText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{r.fullName}</Text>
                  <Text style={styles.studentReg}>رقم التسجيل: {r.registrationNumber || '-'}</Text>
                </View>

                {/* Score Input */}
                <View style={styles.scoreBox}>
                  <TextInput
                    style={[styles.scoreInput, r.isAbsent && { opacity: 0.3 }]}
                    keyboardType="numeric"
                    editable={!isLocked && !r.isAbsent}
                    placeholder="0-20"
                    placeholderTextColor="#A8A29E"
                    value={r.isAbsent ? '' : String(r.grade)}
                    onChangeText={(val) => handleGradeChange(r.student, val)}
                  />
                  <Text style={styles.scoreMax}>/ {maxGrade}</Text>
                </View>
              </View>

              {/* Absent Toggle & Quick Remarks */}
              <View style={styles.studentFooter}>
                <TouchableOpacity
                  disabled={isLocked}
                  style={[styles.absentToggle, r.isAbsent && styles.absentToggleActive]}
                  onPress={() => handleToggleAbsent(r.student)}
                >
                  <Text style={[styles.absentToggleText, r.isAbsent && styles.absentToggleTextActive]}>
                    {r.isAbsent ? 'غائب ✓' : 'تسجيل غياب'}
                  </Text>
                </TouchableOpacity>

                {/* Suggestion Chips */}
                {!isLocked && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 8 }}>
                    {SUGGESTED_REMARKS.map((sug, sIdx) => (
                      <TouchableOpacity
                        key={sIdx}
                        style={[
                          styles.sugChip,
                          r.individualRemark === sug && styles.sugChipActive,
                        ]}
                        onPress={() => handleRemarkSelect(r.student, sug)}
                      >
                        <Text style={[styles.sugChipText, r.individualRemark === sug && styles.sugChipTextActive]}>
                          {sug}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Custom Individual Remark Input */}
              <TextInput
                style={styles.remarkInput}
                editable={!isLocked}
                placeholder="ملاحظة خاصة بالتلميذ..."
                placeholderTextColor="#A8A29E"
                value={r.individualRemark}
                onChangeText={(val) => handleRemarkSelect(r.student, val)}
              />
            </View>
          ))}

          {/* Class General Remark */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>الملاحظة العامة للقسم (بخصوص هذا الفرض):</Text>
            <TextInput
              style={styles.classRemarkInput}
              multiline
              numberOfLines={3}
              editable={!isLocked}
              placeholder="اكتب ملاحظة تشمل القسم بأكمله (مثل: تحسن ملحوظ في النتائج، أو ضرورة مراجعة الدروس...)"
              placeholderTextColor="#A8A29E"
              value={classRemark}
              onChangeText={(val) => {
                setClassRemark(val);
                triggerAutoSave();
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              disabled={isLocked || savingManual}
              style={[styles.draftBtn, isLocked && { opacity: 0.5 }]}
              onPress={() => executeSave(false, false)}
            >
              <Save size={16} color={theme.colors.brand[500]} />
              <Text style={styles.draftBtnText}>
                {savingManual ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isLocked || submittingAdmin}
              style={[styles.submitBtn, isLocked && { opacity: 0.5 }]}
              onPress={() => {
                Alert.alert(
                  'تأكيد الإرسال',
                  'هل أنت متأكد من اكتمال إدخال العلامات والرغبة في إرسال الكشف للإدارة للمراجعة؟',
                  [
                    { text: 'إلغاء', style: 'cancel' },
                    { text: 'إرسال للإدارة', onPress: () => executeSave(true, false) },
                  ]
                );
              }}
            >
              <Send size={16} color="#FFF" />
              <Text style={styles.submitBtnText}>
                {submittingAdmin ? 'جاري الإرسال...' : 'إرسال إلى الإدارة'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* History Sub-Tab */}
      {activeSubTab === 'history' && (
        <View style={styles.historyContainer}>
          {historyList.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد كشوفات مسجلة سابقة.</Text>
          ) : (
            historyList.map((item) => (
              <View key={item._id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyClass}>{item.class?.name || 'قسم'}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'approved' && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                      item.status === 'submitted' && { backgroundColor: 'rgba(2, 132, 199, 0.15)' },
                      item.status === 'returned' && { backgroundColor: 'rgba(217, 119, 6, 0.15)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'approved' && { color: '#059669' },
                        item.status === 'submitted' && { color: '#0284C7' },
                        item.status === 'returned' && { color: '#D97706' },
                      ]}
                    >
                      {item.status === 'approved' && 'معتمد'}
                      {item.status === 'submitted' && 'مرسل'}
                      {item.status === 'returned' && 'مُعاد للتصحيح'}
                      {item.status === 'draft' && 'مسودة'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.historyType}>{item.assessmentType}</Text>
                <Text style={styles.historySubject}>المادة: {item.subject}</Text>
                <Text style={styles.historyDate}>
                  تاريخ الفرض: {item.assessmentDate ? new Date(item.assessmentDate).toLocaleDateString('ar-DZ') : '-'}
                </Text>

                {item.status === 'returned' && item.returnReason && (
                  <Text style={styles.returnedHistoryReason}>ملاحظة الإدارة: {item.returnReason}</Text>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface.background },
  contentContainer: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 13, color: theme.colors.text.secondary },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  topTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  topTabBtnActive: { backgroundColor: theme.colors.brand[500] },
  topTabText: { fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary },
  topTabTextActive: { color: '#FFF' },
  entryContainer: { gap: 14 },
  returnedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  returnedTitle: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  returnedReason: { fontSize: 12, color: '#92400E', marginTop: 2 },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  submittedText: { fontSize: 12, fontWeight: '700', color: '#0369A1' },
  card: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary, marginBottom: 6 },
  chipsScroll: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.brand[500],
    borderColor: theme.colors.brand[600],
  },
  chipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.primary },
  chipTextActive: { color: '#FFF', fontWeight: '700' },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  rosterTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  autoSaveText: { fontSize: 11, fontWeight: '600', color: theme.colors.gold[600] },
  studentCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    gap: 8,
  },
  studentCardAbsent: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  studentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.surface.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 11, fontWeight: '700', color: theme.colors.text.muted },
  studentName: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary },
  studentReg: { fontSize: 10, color: theme.colors.text.muted, marginTop: 1 },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreInput: {
    width: 54,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  scoreMax: { fontSize: 11, fontWeight: '700', color: theme.colors.text.muted },
  studentFooter: { flexDirection: 'row', alignItems: 'center' },
  absentToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  absentToggleActive: { backgroundColor: '#EF4444', borderColor: '#DC2626' },
  absentToggleText: { fontSize: 11, fontWeight: '700', color: theme.colors.text.secondary },
  absentToggleTextActive: { color: '#FFF' },
  sugChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginRight: 6,
  },
  sugChipActive: { backgroundColor: theme.colors.brand[100], borderColor: theme.colors.brand[400] },
  sugChipText: { fontSize: 10, color: theme.colors.text.secondary },
  sugChipTextActive: { color: theme.colors.brand[700], fontWeight: '700' },
  remarkInput: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  classRemarkInput: {
    backgroundColor: theme.colors.surface.input,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  draftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.brand[400],
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  draftBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.brand[500] },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brand[500],
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  submitBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  historyContainer: { gap: 10 },
  historyCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyClass: { fontSize: 14, fontWeight: '800', color: theme.colors.text.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#E5E7EB' },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
  historyType: { fontSize: 13, fontWeight: '700', color: theme.colors.brand[600], marginTop: 4 },
  historySubject: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  historyDate: { fontSize: 11, color: theme.colors.text.muted, marginTop: 2 },
  returnedHistoryReason: { fontSize: 11, color: '#B45309', backgroundColor: '#FEF3C7', padding: 6, borderRadius: 6, marginTop: 6 },
  emptyText: { textAlign: 'center', color: theme.colors.text.muted, paddingVertical: 24, fontSize: 13 },
});
