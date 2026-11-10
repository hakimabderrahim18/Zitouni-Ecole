import React, { useState, useMemo } from 'react';
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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Users,
  GraduationCap,
  Briefcase,
  ChevronDown,
  Search,
  RefreshCw,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '../../theme/tokens';
import { apiClient } from '../../api/client';
import { StudentDetailsModal } from './StudentModals';

export interface AdminClassesViewProps {
  classesList: any[];
  groupsList: any[];
  teachersList: any[];
  studentsList: any[];
  modulesList: any[];
  onRefreshData: () => Promise<void>;
  onOpenStudentDossier?: (student: any) => void;
}

// Fallback modules list if database modules are empty
const DEFAULT_ALGERIAN_MODULES = [
  'تاريخ وجغرافيا',
  'تربية اسلامية',
  'تربية بدنية',
  'تربية مدنية',
  'تكنولوجيا',
  'رسم',
  'رياضيات',
  'علوم طبيعية',
  'فيزياء',
  'لغة ألمانية',
  'لغة إسبانية',
  'لغة إنجليزية',
  'لغة إيطالية',
  'لغة تركية',
  'لغة روسية',
  'لغة عربية',
  'لغة فرنسية',
  'فلسفة',
  'اقتصاد ومناجمنت',
  'قانون',
];

export const AdminClassesView: React.FC<AdminClassesViewProps> = ({
  classesList = [],
  groupsList = [],
  teachersList = [],
  studentsList = [],
  modulesList = [],
  onRefreshData,
  onOpenStudentDossier,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | 'primary' | 'middle' | 'secondary'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Group Modal States (Add / Edit)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [groupForm, setGroupForm] = useState<{
    name: string;
    classId: string;
    capacity: number;
    teacherIds: string[];
    modules: string[];
  }>({
    name: '',
    classId: '',
    capacity: 30,
    teacherIds: [],
    modules: [],
  });
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // Class Modal States (Add / Edit)
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [classForm, setClassForm] = useState<{
    name: string;
    level: 'primary' | 'middle' | 'secondary';
    description: string;
    capacity: number;
  }>({
    name: '',
    level: 'secondary',
    description: '',
    capacity: 30,
  });
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);

  // Student Details Modal
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<any | null>(null);

  // Available Modules list (merge database modules and fallback)
  const allModules = useMemo(() => {
    const dbNames = modulesList.map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean);
    const combined = Array.from(new Set([...dbNames, ...DEFAULT_ALGERIAN_MODULES]));
    return combined;
  }, [modulesList]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classesList.filter((cls) => {
      // Level filter
      if (selectedLevelFilter !== 'all') {
        const clsLvl = (cls.level || '').toLowerCase();
        if (clsLvl !== selectedLevelFilter) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (cls.name || '').toLowerCase().includes(q);
        const matchDesc = (cls.description || '').toLowerCase().includes(q);
        const matchLevel = (cls.level || '').toLowerCase().includes(q);
        // check if any child group matches
        const childGroups = groupsList.filter(
          (g) => String(g.class?._id || g.class) === String(cls._id)
        );
        const matchGroup = childGroups.some((g) => (g.name || '').toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchLevel && !matchGroup) return false;
      }
      return true;
    });
  }, [classesList, groupsList, selectedLevelFilter, searchQuery]);

  // Handle Manual Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } catch {
      // Silent error
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ==================================================================== */
  /*  GROUP ACTIONS (Create, Edit, Delete)                                */
  /* ==================================================================== */

  // Open modal to create a new group (optionally pre-selected for a class)
  const handleOpenAddGroup = (preselectedClassId?: string) => {
    const targetClassId = preselectedClassId || classesList[0]?._id || '';
    const targetClass = classesList.find((c) => c._id === targetClassId);
    setEditingGroup(null);
    setGroupForm({
      name: '',
      classId: targetClassId,
      capacity: 30,
      teacherIds: [],
      modules: targetClass?.modules || [],
    });
    setIsClassDropdownOpen(false);
    setIsGroupModalOpen(true);
  };

  // Open modal to edit an existing group
  const handleOpenEditGroup = (group: any) => {
    const classId = group.class?._id || group.class || '';
    const teacherIds = Array.isArray(group.teachers)
      ? group.teachers.map((t: any) => (typeof t === 'string' ? t : t._id))
      : [];
    setEditingGroup(group);
    setGroupForm({
      name: group.name || '',
      classId: String(classId),
      capacity: group.capacity || 30,
      teacherIds: teacherIds,
      modules: Array.isArray(group.modules) ? group.modules : [],
    });
    setIsClassDropdownOpen(false);
    setIsGroupModalOpen(true);
  };

  // Submit Group Form (POST / PUT)
  const handleSubmitGroup = async () => {
    if (!groupForm.name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الفوج الدراسي');
      return;
    }
    if (!groupForm.classId) {
      Alert.alert('تنبيه', 'يرجى اختيار القسم الدراسي المرتبط بهذا الفوج');
      return;
    }

    setIsSubmittingGroup(true);
    try {
      if (editingGroup) {
        // Update group
        await apiClient.put(`/api/admin/groups/${editingGroup._id}`, {
          name: groupForm.name.trim(),
          classId: groupForm.classId,
          capacity: Number(groupForm.capacity) || 30,
          teacherIds: groupForm.teacherIds,
          modules: groupForm.modules,
        });
        Alert.alert('نجاح', 'تم تحديث الفوج الدراسي بنجاح!');
      } else {
        // Create group
        await apiClient.post('/api/admin/groups', {
          name: groupForm.name.trim(),
          classId: groupForm.classId,
          capacity: Number(groupForm.capacity) || 30,
          teacherIds: groupForm.teacherIds,
          modules: groupForm.modules,
        });
        Alert.alert('نجاح', 'تم إنشاء الفوج الدراسي بنجاح!');
      }

      setIsGroupModalOpen(false);
      setEditingGroup(null);
      await onRefreshData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ الفوج';
      Alert.alert('خطأ', msg);
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = (groupId: string, groupName: string) => {
    // Check if students are assigned
    const assignedStudents = studentsList.filter(
      (s) => String(s.group?._id || s.group) === String(groupId)
    );
    if (assignedStudents.length > 0) {
      Alert.alert(
        'تعذر الحذف',
        `لا يمكن حذف الفوج "${groupName}" لأنه يحتوي على ${assignedStudents.length} تلميذ مسجل. يرجى نقل التلاميذ أولاً.`
      );
      return;
    }

    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من رغبتك في حذف الفوج "${groupName}" نهائياً؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف الفوج',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/admin/groups/${groupId}`);
              Alert.alert('نجاح', 'تم حذف الفوج بنجاح.');
              await onRefreshData();
            } catch (err: any) {
              const msg = err.response?.data?.message || 'فشل حذف الفوج';
              Alert.alert('خطأ', msg);
            }
          },
        },
      ]
    );
  };

  /* ==================================================================== */
  /*  CLASS ACTIONS (Create, Edit, Delete)                                */
  /* ==================================================================== */

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassForm({
      name: '',
      level: 'secondary',
      description: '',
      capacity: 30,
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: any) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name || '',
      level: (cls.level || 'secondary').toLowerCase() as any,
      description: cls.description || '',
      capacity: cls.capacity || 30,
    });
    setIsClassModalOpen(true);
  };

  const handleSubmitClass = async () => {
    if (!classForm.name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم القسم الدراسي');
      return;
    }

    setIsSubmittingClass(true);
    try {
      if (editingClass) {
        await apiClient.put(`/api/admin/classes/${editingClass._id}`, {
          name: classForm.name.trim(),
          level: classForm.level,
          description: classForm.description.trim(),
          capacity: Number(classForm.capacity) || 30,
        });
        Alert.alert('نجاح', 'تم تحديث القسم بنجاح!');
      } else {
        await apiClient.post('/api/admin/classes', {
          name: classForm.name.trim(),
          level: classForm.level,
          description: classForm.description.trim(),
          capacity: Number(classForm.capacity) || 30,
        });
        Alert.alert('نجاح', 'تم إنشاء القسم بنجاح!');
      }

      setIsClassModalOpen(false);
      setEditingClass(null);
      await onRefreshData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ القسم';
      Alert.alert('خطأ', msg);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  const handleDeleteClass = (classId: string, className: string) => {
    const assignedStudents = studentsList.filter(
      (s) => String(s.class?._id || s.class) === String(classId)
    );
    if (assignedStudents.length > 0) {
      Alert.alert(
        'تعذر الحذف',
        `لا يمكن حذف القسم "${className}" لأنه يحتوي على ${assignedStudents.length} تلميذ مسجل.`
      );
      return;
    }

    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من رغبتك في حذف القسم "${className}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف القسم',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/admin/classes/${classId}`);
              Alert.alert('نجاح', 'تم حذف القسم بنجاح.');
              await onRefreshData();
            } catch (err: any) {
              const msg = err.response?.data?.message || 'فشل حذف القسم';
              Alert.alert('خطأ', msg);
            }
          },
        },
      ]
    );
  };

  // Toggle Module Selection in Group Form
  const toggleGroupModule = (modName: string) => {
    setGroupForm((prev) => {
      const exists = prev.modules.includes(modName);
      if (exists) {
        return { ...prev, modules: prev.modules.filter((m) => m !== modName) };
      } else {
        return { ...prev, modules: [...prev.modules, modName] };
      }
    });
  };

  // Toggle Teacher Selection in Group Form
  const toggleGroupTeacher = (teacherId: string) => {
    setGroupForm((prev) => {
      const exists = prev.teacherIds.includes(teacherId);
      if (exists) {
        return { ...prev, teacherIds: prev.teacherIds.filter((id) => id !== teacherId) };
      } else {
        return { ...prev, teacherIds: [...prev.teacherIds, teacherId] };
      }
    });
  };

  // Selected Class Object for Display in Dropdown
  const selectedClassObject = useMemo(() => {
    return classesList.find((c) => String(c._id) === String(groupForm.classId));
  }, [classesList, groupForm.classId]);

  return (
    <View style={styles.container}>
      {/* ============================================================== */}
      {/* 1. TOP HEADER & ACTION BUTTON (Screenshot 1 Matching)          */}
      {/* ============================================================== */}
      <View style={styles.glassHeaderCard}>
        <View style={styles.headerTopRow}>
          {/* Right side: Icon + Title */}
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerIconContainer}>
              <BookOpen size={20} color="#C9A24D" />
            </View>
            <View>
              <Text style={styles.headerTitle}>قائمة الأقسام والأفواج الدراسية</Text>
              <Text style={styles.headerSubtitle}>
                {classesList.length} قسماً دراسياً • {groupsList.length} فوجاً دراسياً
              </Text>
            </View>
          </View>

          {/* Left side: Refresh */}
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            disabled={isRefreshing}
            activeOpacity={0.7}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#7B1E3A" />
            ) : (
              <RefreshCw size={16} color="#7B1E3A" />
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.headerActionsRow}>
          {/* Main Burgundy Button: + إضافة فوج دراسي (Screenshot 1) */}
          <TouchableOpacity
            style={styles.mainAddGroupBtn}
            onPress={() => handleOpenAddGroup()}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#C9A24D" strokeWidth={2.5} />
            <Text style={styles.mainAddGroupBtnText}>إضافة فوج دراسي</Text>
          </TouchableOpacity>

          {/* Secondary Button: + إنشاء قسم */}
          <TouchableOpacity
            style={styles.secondaryAddClassBtn}
            onPress={handleOpenAddClass}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#7B1E3A" />
            <Text style={styles.secondaryAddClassBtnText}>إنشاء قسم</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Level Filter */}
        <View style={styles.searchBarContainer}>
          <Search size={15} color="#766065" style={{ marginLeft: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث عن قسم، فوج، أو طور دراسي..."
            placeholderTextColor="#9C8288"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color="#766065" />
            </TouchableOpacity>
          )}
        </View>

        {/* Level Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedLevelFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedLevelFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedLevelFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              الكل ({classesList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedLevelFilter === 'secondary' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedLevelFilter('secondary')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedLevelFilter === 'secondary' && styles.filterChipTextActive,
              ]}
            >
              التعليم الثانوي (SECONDARY)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, selectedLevelFilter === 'middle' && styles.filterChipActive]}
            onPress={() => setSelectedLevelFilter('middle')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedLevelFilter === 'middle' && styles.filterChipTextActive,
              ]}
            >
              التعليم المتوسط (MIDDLE)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedLevelFilter === 'primary' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedLevelFilter('primary')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedLevelFilter === 'primary' && styles.filterChipTextActive,
              ]}
            >
              التعليم الابتدائي (PRIMARY)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ============================================================== */}
      {/* 2. CLASSES AND GROUPS GRID / LIST (Screenshot 1 Exact)         */}
      {/* ============================================================== */}
      {filteredClasses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color="#C9A24D" style={{ opacity: 0.6, marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>لا توجد أقسام دراسية مطابقة</Text>
          <Text style={styles.emptySubtitle}>
            يمكنك إنشاء قسم دراسي جديد أو إضافة أفواج دراسية لتنظيم سير الدروس.
          </Text>
          <TouchableOpacity style={styles.mainAddGroupBtn} onPress={handleOpenAddClass}>
            <Plus size={16} color="#C9A24D" />
            <Text style={styles.mainAddGroupBtnText}>إنشاء أول قسم الآن</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.classesListWrap}>
          {filteredClasses.map((cls) => {
            // Find child groups for this class
            const classGroups = groupsList.filter(
              (g) => String(g.class?._id || g.class) === String(cls._id)
            );
            // Find students enrolled in this class
            const classStudents = studentsList.filter(
              (s) => String(s.class?._id || s.class) === String(cls._id)
            );
            // Find teachers assigned to this class
            const classTeachers = teachersList.filter((t) =>
              t.classes?.some((c: any) => String(c?._id || c) === String(cls._id))
            );

            return (
              <View key={cls._id} style={styles.classCard}>
                {/* Class Card Top Row */}
                <View style={styles.classCardHeader}>
                  {/* Right: Title & Level badge */}
                  <View style={styles.classTitleBlock}>
                    <Text style={styles.classNameText}>{cls.name}</Text>
                    <View style={styles.levelBadgeContainer}>
                      <Text style={styles.levelBadgeText}>
                        {(cls.level || 'SECONDARY').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Left: Action buttons (Edit & Delete) */}
                  <View style={styles.classActionButtons}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleOpenEditClass(cls)}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={13} color="#574549" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionIconBtn, styles.deleteIconBtn]}
                      onPress={() => handleDeleteClass(cls._id, cls.name)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#BE123C" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Class Description / Arabic Grade */}
                <Text style={styles.classDescriptionText}>
                  {cls.description || 'لا يوجد وصف مخصص لهذا القسم.'}
                </Text>

                {/* Statistics Box: Students & Teachers (Screenshot 1) */}
                <View style={styles.classStatsBox}>
                  {/* Registered Students Column */}
                  <View style={styles.statColumnStudents}>
                    <Text style={styles.statLabel}>التلاميذ المسجلون</Text>
                    <Text style={styles.statNumber}>{classStudents.length}</Text>
                  </View>

                  {/* Teachers Column */}
                  <View style={styles.statColumnTeachers}>
                    <Text style={styles.statLabel}>الأساتذة</Text>
                    <View style={styles.teachersPillsWrap}>
                      {classTeachers.length > 0 ? (
                        classTeachers.map((t) => {
                          const name = t.user
                            ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim()
                            : 'أستاذ';
                          return (
                            <View key={t._id} style={styles.teacherBadgePill}>
                              <Text style={styles.teacherBadgeText}>{name}</Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.noItemItalic}>لا يوجد enseignant</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Sub-Section Header: الأفواج / الأفواج الفرعية */}
                <View style={styles.subGroupsHeaderRow}>
                  <Text style={styles.subGroupsTitle}>الأفواج / الأفواج الفرعية:</Text>
                  <TouchableOpacity
                    style={styles.addSectionGroupBtn}
                    onPress={() => handleOpenAddGroup(cls._id)}
                    activeOpacity={0.8}
                  >
                    <Plus size={11} color="#C9A24D" />
                    <Text style={styles.addSectionGroupBtnText}>إضافة فوج لهذا القسم</Text>
                  </TouchableOpacity>
                </View>

                {/* Nested Group Cards List */}
                {classGroups.length === 0 ? (
                  <View style={styles.emptyGroupsBox}>
                    <Text style={styles.emptyGroupsText}>
                      لا يوجد فوج مرتبط بهذا القسم حالياً.
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleOpenAddGroup(cls._id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.createFirstGroupLink}>+ إنشاء أول فوج الآن</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.nestedGroupsList}>
                    {classGroups.map((g) => {
                      // Find students in this specific group
                      const groupStudents = studentsList.filter(
                        (s) => String(s.group?._id || s.group) === String(g._id)
                      );
                      const maxCap = g.capacity || 30;
                      const ratio = Math.min(1, groupStudents.length / maxCap);
                      const isFull = groupStudents.length >= maxCap;
                      const groupTeachers = g.teachers || [];

                      return (
                        <View key={g._id} style={styles.nestedGroupCard}>
                          {/* Group Title, Capacity and Action Icons */}
                          <View style={styles.nestedGroupTopRow}>
                            <Text style={styles.groupCardName}>{g.name}</Text>
                            <View style={styles.groupCapAndActions}>
                              <Text style={styles.groupCapacityText}>
                                {maxCap} / {groupStudents.length} تلميذ
                              </Text>
                              <TouchableOpacity
                                style={styles.nestedGroupIconBtn}
                                onPress={() => handleOpenEditGroup(g)}
                                activeOpacity={0.7}
                              >
                                <Edit2 size={11} color="#574549" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.nestedGroupIconBtn, styles.deleteIconBtn]}
                                onPress={() => handleDeleteGroup(g._id, g.name)}
                                activeOpacity={0.7}
                              >
                                <Trash2 size={11} color="#BE123C" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Progress Line */}
                          <View style={styles.progressBarTrack}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  width: `${Math.round(ratio * 100)}%`,
                                  backgroundColor: isFull ? '#EF4444' : '#7B1E3A',
                                },
                              ]}
                            />
                          </View>

                          {/* Linked Teachers */}
                          <View style={styles.groupSectionBlock}>
                            <Text style={styles.groupSectionLabel}>الأساتذة المرتبطون:</Text>
                            <View style={styles.groupPillsRow}>
                              {groupTeachers.length > 0 ? (
                                groupTeachers.map((t: any) => {
                                  const tName = t.user
                                    ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim()
                                    : 'أستاذ';
                                  return (
                                    <View key={t._id} style={styles.groupTeacherPill}>
                                      <Text style={styles.groupTeacherPillText}>{tName}</Text>
                                    </View>
                                  );
                                })
                              ) : (
                                <Text style={styles.noItemItalic}>لا يوجد أساتذة مرتبطون</Text>
                              )}
                            </View>
                          </View>

                          {/* Divider */}
                          <View style={styles.groupCardDivider} />

                          {/* Enrolled Students in this Group (Screenshot 1) */}
                          <View style={styles.groupSectionBlock}>
                            <View style={styles.groupStudentsHeaderRow}>
                              <Text style={styles.groupSectionLabel}>التلاميذ المسجلون بالفوج:</Text>
                              <View style={styles.groupStudentsCountBadge}>
                                <Text style={styles.groupStudentsCountBadgeText}>
                                  {groupStudents.length}{' '}
                                  {groupStudents.length === 1 ? 'élève' : 'تلميذ'}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.groupPillsRow}>
                              {groupStudents.length > 0 ? (
                                groupStudents.map((s) => {
                                  const sName = s.user
                                    ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim()
                                    : 'تلميذ';
                                  return (
                                    <TouchableOpacity
                                      key={s._id}
                                      style={styles.studentPillBadge}
                                      onPress={() => setSelectedStudentForDetails(s)}
                                      activeOpacity={0.7}
                                    >
                                      <View style={styles.studentDotIndicator} />
                                      <Text style={styles.studentPillText} numberOfLines={1}>
                                        {sName}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })
                              ) : (
                                <Text style={styles.noItemItalic}>لا يوجد élève rattaché</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ============================================================== */}
      {/* 3. ADD / EDIT GROUP MODAL (Screenshots 2 & 3 Matching 1:1)     */}
      {/* ============================================================== */}
      <Modal visible={isGroupModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              {/* Modal Header (Screenshot 2: Icon + Title + Close) */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderTitleWrap}>
                  <Users size={18} color="#C9A24D" />
                  <Text style={styles.modalMainTitle}>
                    {editingGroup ? 'تعديل الفوج الدراسي' : 'إضافة فوج دراسي جديد'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsGroupModalOpen(false)}
                >
                  <X size={18} color="#574549" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Form Body */}
              <ScrollView
                style={styles.modalScrollBody}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* 1. اسم الفوج الدراسي * */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>اسم الفوج الدراسي *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="مثال: الفوج 1 أو Groupe A"
                    placeholderTextColor="#9C8288"
                    value={groupForm.name}
                    onChangeText={(txt) => setGroupForm((prev) => ({ ...prev, name: txt }))}
                  />
                </View>

                {/* 2. القسم الدراسي المرتبط * (Dropdown Selector) */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>القسم الدراسي المرتبط *</Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                    activeOpacity={0.8}
                  >
                    <ChevronDown
                      size={16}
                      color="#766065"
                      style={{
                        transform: [{ rotate: isClassDropdownOpen ? '180deg' : '0deg' }],
                      }}
                    />
                    <Text style={styles.dropdownSelectorText}>
                      {selectedClassObject
                        ? `${selectedClassObject.name} (${selectedClassObject.level})`
                        : 'اختر القسم الدراسي'}
                    </Text>
                  </TouchableOpacity>

                  {/* Dropdown Options List */}
                  {isClassDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {classesList.map((c) => {
                        const isSelected = String(c._id) === String(groupForm.classId);
                        return (
                          <TouchableOpacity
                            key={c._id}
                            style={[
                              styles.dropdownMenuItem,
                              isSelected && styles.dropdownMenuItemSelected,
                            ]}
                            onPress={() => {
                              setGroupForm((prev) => ({ ...prev, classId: c._id }));
                              setIsClassDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownMenuItemText,
                                isSelected && styles.dropdownMenuItemTextActive,
                              ]}
                            >
                              {c.name} ({c.level || 'طور عام'})
                            </Text>
                            {isSelected && <Check size={14} color="#7B1E3A" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* 3. الطاقة الاستيعابية للفوج */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>الطاقة الاستيعابية للفوج</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="30"
                    placeholderTextColor="#9C8288"
                    keyboardType="numeric"
                    value={String(groupForm.capacity)}
                    onChangeText={(txt) =>
                      setGroupForm((prev) => ({ ...prev, capacity: Number(txt) || 30 }))
                    }
                  />
                </View>

                {/* 4. المواد المقررة لهذا الفوج (Screenshot 2: 2-column checklist) */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>المواد المقررة لهذا الفوج</Text>
                  <View style={styles.modulesChecklistContainer}>
                    {allModules.length === 0 ? (
                      <Text style={styles.noItemItalic}>لا توجد مواد مسجلة.</Text>
                    ) : (
                      <View style={styles.twoColumnGrid}>
                        {allModules.map((modName, idx) => {
                          const isChecked = groupForm.modules.includes(modName);
                          return (
                            <TouchableOpacity
                              key={`${modName}-${idx}`}
                              style={styles.checklistItem}
                              onPress={() => toggleGroupModule(modName)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.checkboxBox,
                                  isChecked && styles.checkboxBoxChecked,
                                ]}
                              >
                                {isChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                              </View>
                              <Text
                                style={[
                                  styles.checklistLabel,
                                  isChecked && styles.checklistLabelActive,
                                ]}
                                numberOfLines={1}
                              >
                                {modName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>

                {/* 5. تعيين الأساتذة (اختياري) (Screenshot 2: teacher checklist) */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>تعيين الأساتذة (اختياري)</Text>
                  <View style={styles.teachersChecklistContainer}>
                    {teachersList.length === 0 ? (
                      <Text style={styles.noItemItalic}>لا يوجد أساتذة متاحين حالياً.</Text>
                    ) : (
                      teachersList.map((t) => {
                        const isChecked = groupForm.teacherIds.includes(t._id);
                        const tUser = t.user || {};
                        const fullName = `${tUser.firstName || ''} ${tUser.lastName || ''}`.trim() || 'أستاذ';
                        const subjStr = t.subjects && t.subjects.length > 0 ? ` (${t.subjects.join(', ')})` : '';

                        return (
                          <TouchableOpacity
                            key={t._id}
                            style={styles.teacherChecklistItem}
                            onPress={() => toggleGroupTeacher(t._id)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.checkboxBox,
                                isChecked && styles.checkboxBoxChecked,
                              ]}
                            >
                              {isChecked && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                            </View>
                            <Text
                              style={[
                                styles.teacherChecklistLabel,
                                isChecked && styles.checklistLabelActive,
                              ]}
                            >
                              {fullName}
                              <Text style={styles.teacherSubjectSubText}>{subjStr}</Text>
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons: Left: Save Burgundy, Right: Cancel (Screenshot 3) */}
              <View style={styles.modalActionsRow}>
                {/* Burgundy Save Button */}
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={handleSubmitGroup}
                  disabled={isSubmittingGroup}
                  activeOpacity={0.85}
                >
                  {isSubmittingGroup ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>
                      {editingGroup ? 'حفظ التعديلات' : 'حفظ وإضافة الفوج'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Light Beige Cancel Button */}
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsGroupModalOpen(false)}
                  disabled={isSubmittingGroup}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================== */}
      {/* 4. ADD / EDIT CLASS MODAL                                      */}
      {/* ============================================================== */}
      <Modal visible={isClassModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderTitleWrap}>
                  <BookOpen size={18} color="#C9A24D" />
                  <Text style={styles.modalMainTitle}>
                    {editingClass ? 'تعديل القسم الدراسي' : 'إنشاء قسم دراسي جديد'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setIsClassModalOpen(false)}
                >
                  <X size={18} color="#574549" />
                </TouchableOpacity>
              </View>

              {/* Form Body */}
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                {/* 1. اسم القسم الدراسي */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>اسم القسم الدراسي *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="مثال: Scientifique 1 أو 1AS-A"
                    placeholderTextColor="#9C8288"
                    value={classForm.name}
                    onChangeText={(txt) => setClassForm((prev) => ({ ...prev, name: txt }))}
                  />
                </View>

                {/* 2. الطور التعليمي */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>الطور التعليمي (Cycle) *</Text>
                  <View style={styles.levelSelectorRow}>
                    <TouchableOpacity
                      style={[
                        styles.levelSelectorChip,
                        classForm.level === 'secondary' && styles.levelSelectorChipActive,
                      ]}
                      onPress={() => setClassForm((prev) => ({ ...prev, level: 'secondary' }))}
                    >
                      <Text
                        style={[
                          styles.levelSelectorText,
                          classForm.level === 'secondary' && styles.levelSelectorTextActive,
                        ]}
                      >
                        ثانوي (SECONDARY)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.levelSelectorChip,
                        classForm.level === 'middle' && styles.levelSelectorChipActive,
                      ]}
                      onPress={() => setClassForm((prev) => ({ ...prev, level: 'middle' }))}
                    >
                      <Text
                        style={[
                          styles.levelSelectorText,
                          classForm.level === 'middle' && styles.levelSelectorTextActive,
                        ]}
                      >
                        متوسط (MIDDLE)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.levelSelectorChip,
                        classForm.level === 'primary' && styles.levelSelectorChipActive,
                      ]}
                      onPress={() => setClassForm((prev) => ({ ...prev, level: 'primary' }))}
                    >
                      <Text
                        style={[
                          styles.levelSelectorText,
                          classForm.level === 'primary' && styles.levelSelectorTextActive,
                        ]}
                      >
                        ابتدائي (PRIMARY)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3. وصف القسم أو الشعبة */}
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>الوصف والشعبة الدراسية</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="مثال: أولى ثانوي علمي / أدبي"
                    placeholderTextColor="#9C8288"
                    value={classForm.description}
                    onChangeText={(txt) => setClassForm((prev) => ({ ...prev, description: txt }))}
                  />
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={handleSubmitClass}
                  disabled={isSubmittingClass}
                  activeOpacity={0.85}
                >
                  {isSubmittingClass ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalPrimaryBtnText}>
                      {editingClass ? 'حفظ تعديلات القسم' : 'حفظ وإنشاء القسم'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsClassModalOpen(false)}
                  disabled={isSubmittingClass}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalCancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================== */}
      {/* 5. STUDENT DETAILS MODAL INTEGRATION                           */}
      {/* ============================================================== */}
      {selectedStudentForDetails && (
        <StudentDetailsModal
          visible={!!selectedStudentForDetails}
          student={selectedStudentForDetails}
          teachers={teachersList}
          onClose={() => setSelectedStudentForDetails(null)}
          onEdit={() => {
            if (onOpenStudentDossier) {
              onOpenStudentDossier(selectedStudentForDetails);
            }
            setSelectedStudentForDetails(null);
          }}
        />
      )}
    </View>
  );
};

/* ==================================================================== */
/*  STYLES (Prestige Académique matching Web Screenshots 100%)          */
/* ==================================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  /* Top Header Card */
  glassHeaderCard: {
    backgroundColor: '#FCF8F2',
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223, 211, 194, 0.5)',
    paddingBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2022',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#766065',
    textAlign: 'right',
    marginTop: 2,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(123, 30, 58, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Action Buttons in Header */
  headerActionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  mainAddGroupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7B1E3A',
    borderColor: 'rgba(201, 162, 77, 0.45)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#7B1E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  mainAddGroupBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryAddClassBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(123, 30, 58, 0.07)',
    borderColor: 'rgba(123, 30, 58, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryAddClassBtnText: {
    color: '#7B1E3A',
    fontWeight: '700',
    fontSize: 12,
  },

  /* Search & Filters */
  searchBarContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: '#2B2022',
    paddingVertical: 0,
  },
  filterScroll: {
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(123, 30, 58, 0.05)',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    marginLeft: 8,
  },
  filterChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#574549',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Empty State */
  emptyContainer: {
    backgroundColor: '#FCF8F2',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2022',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#766065',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },

  /* Classes Cards List (Screenshot 1 Matching) */
  classesListWrap: {
    gap: 16,
  },
  classCard: {
    backgroundColor: '#FCF8F2',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  classCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223, 211, 194, 0.5)',
    paddingBottom: 10,
  },
  classTitleBlock: {
    alignItems: 'flex-end',
    flex: 1,
  },
  classNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B2022',
    textAlign: 'right',
  },
  levelBadgeContainer: {
    marginTop: 3,
    backgroundColor: 'rgba(123, 30, 58, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7B1E3A',
    letterSpacing: 0.6,
  },
  classActionButtons: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: 'rgba(190, 18, 60, 0.08)',
    borderColor: 'rgba(190, 18, 60, 0.25)',
  },
  classDescriptionText: {
    fontSize: 12,
    color: '#766065',
    textAlign: 'right',
    marginTop: 8,
    lineHeight: 18,
  },

  /* Stats Box inside Class Card (Screenshot 1) */
  classStatsBox: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(223, 211, 194, 0.7)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    gap: 12,
  },
  statColumnStudents: {
    alignItems: 'flex-end',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(223, 211, 194, 0.8)',
    paddingLeft: 12,
    minWidth: 90,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#766065',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2B2022',
    marginTop: 2,
    textAlign: 'right',
  },
  statColumnTeachers: {
    flex: 1,
    alignItems: 'flex-end',
  },
  teachersPillsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  teacherBadgePill: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  teacherBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7B1E3A',
  },
  noItemItalic: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#9C8288',
    textAlign: 'right',
  },

  /* Subgroups Header & Button */
  subGroupsHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  subGroupsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B2022',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addSectionGroupBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderColor: 'rgba(201, 162, 77, 0.35)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  addSectionGroupBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7B1E3A',
  },

  /* Empty Groups */
  emptyGroupsBox: {
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(223, 211, 194, 0.8)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyGroupsText: {
    fontSize: 11,
    color: '#766065',
    fontStyle: 'italic',
  },
  createFirstGroupLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
  },

  /* Nested Groups List (Screenshot 1 Matching) */
  nestedGroupsList: {
    gap: 10,
  },
  nestedGroupCard: {
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: 'rgba(223, 211, 194, 0.8)',
    borderRadius: 12,
    padding: 12,
  },
  nestedGroupTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B2022',
  },
  groupCapAndActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  groupCapacityText: {
    fontSize: 11,
    color: '#766065',
    fontWeight: '600',
  },
  nestedGroupIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FCF8F2',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Progress Bar */
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(223, 211, 194, 0.7)',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Group Subsections */
  groupSectionBlock: {
    marginTop: 4,
  },
  groupSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#766065',
    textAlign: 'right',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  groupPillsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 4,
  },
  groupTeacherPill: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  groupTeacherPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#7B1E3A',
  },
  groupCardDivider: {
    height: 1,
    backgroundColor: 'rgba(223, 211, 194, 0.5)',
    marginVertical: 8,
  },
  groupStudentsHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupStudentsCountBadge: {
    backgroundColor: '#FCF8F2',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  groupStudentsCountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#574549',
  },
  studentPillBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCF8F2',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  studentDotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#C9A24D',
  },
  studentPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2B2022',
    maxWidth: 110,
  },

  /* ============================================================== */
  /*  MODAL STYLES (Screenshots 2 & 3 Matching 100%)                */
  /* ============================================================== */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 32, 34, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FCF8F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 16,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223, 211, 194, 0.6)',
    paddingBottom: 12,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  modalMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2022',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollBody: {
    marginTop: 12,
  },

  /* Fields */
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B2022',
    textAlign: 'right',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#2B2022',
    textAlign: 'right',
  },

  /* Dropdown Selector */
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownSelectorText: {
    fontSize: 13,
    color: '#2B2022',
    textAlign: 'right',
  },
  dropdownMenu: {
    backgroundColor: '#FCF8F2',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.4)',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 180,
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(223, 211, 194, 0.4)',
  },
  dropdownMenuItemSelected: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
  },
  dropdownMenuItemText: {
    fontSize: 12,
    color: '#574549',
    textAlign: 'right',
  },
  dropdownMenuItemTextActive: {
    color: '#7B1E3A',
    fontWeight: '700',
  },

  /* Checklists (Modules & Teachers) */
  modulesChecklistContainer: {
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 12,
    padding: 10,
    maxHeight: 160,
  },
  twoColumnGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  checklistItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    paddingVertical: 5,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#766065',
    backgroundColor: '#FCF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  checklistLabel: {
    fontSize: 11,
    color: '#574549',
    textAlign: 'right',
    flex: 1,
  },
  checklistLabelActive: {
    color: '#7B1E3A',
    fontWeight: '700',
  },

  /* Teachers Checklist */
  teachersChecklistContainer: {
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 12,
    padding: 10,
    maxHeight: 160,
    gap: 8,
  },
  teacherChecklistItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  teacherChecklistLabel: {
    fontSize: 12,
    color: '#2B2022',
    textAlign: 'right',
    flex: 1,
  },
  teacherSubjectSubText: {
    fontSize: 10,
    color: '#766065',
    fontWeight: '400',
  },

  /* Level Selector Row for Class Modal */
  levelSelectorRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  levelSelectorChip: {
    flex: 1,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  levelSelectorChipActive: {
    backgroundColor: '#7B1E3A',
    borderColor: '#7B1E3A',
  },
  levelSelectorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#574549',
  },
  levelSelectorTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Modal Actions Row (Left: Burgundy Save, Right: Light Cancel - Screenshot 3) */
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(223, 211, 194, 0.6)',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FAF4EB',
    borderWidth: 1,
    borderColor: '#DFD3C2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#574549',
  },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: '#7B1E3A',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 77, 0.45)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B1E3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
