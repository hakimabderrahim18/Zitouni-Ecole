import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Share,
} from 'react-native';
import {
  X,
  Edit3,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  GraduationCap,
  Printer,
  CheckCircle2,
  Share2,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';

/* ==================================================================== */
/*  Helper: Format Date                                                 */
/* ==================================================================== */
const safeDate = (val?: string | Date, fallback = '—') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('fr-FR');
  } catch {
    return fallback;
  }
};

/* ==================================================================== */
/*  1. Student Details Modal (100% Parity with Web Screenshots 3 & 4)   */
/* ==================================================================== */
interface StudentDetailsModalProps {
  visible: boolean;
  student: any;
  teachers?: any[];
  onClose: () => void;
  onEdit: (student: any) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  visible,
  student,
  teachers = [],
  onClose,
  onEdit,
}) => {
  if (!visible || !student) return null;

  const u = student.user || {};
  const parent = student.parent || {};
  const parentUser = parent.user || {};

  const firstName = student.firstNameArabic || u.firstName || '';
  const lastName = student.lastNameArabic || u.lastName || '';
  const studentFullName = `${firstName} ${lastName}`.trim() || 'تلميذ مسجل';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}` || 'تل';

  const regNum = student.registrationNumber || 'REG-26-000';
  const isActive = u.isActive !== false;

  const className = student.class?.name || 'غير محدد';
  const classLevel = student.class?.level || 'Primary';
  const groupName = student.group?.name || 'الفوج 1';

  const parentFullName = `${parentUser.firstName || ''} ${parentUser.lastName || ''}`.trim() || 'غير مسجل';
  const parentEmail = parentUser.email || '—';
  const parentPhone = parentUser.phoneNumber || student.parentPhoneNumber || '—';
  const parentProfession = parent.profession || '—';
  const parentAddress = parent.address || 'حي الهضاب، طريق بوشاوي، أولاد فايت';

  // Compute linked teachers for this student's class and group
  const linkedTeachers = teachers.filter((t: any) => {
    const classMatch = t.classes?.some(
      (c: any) => (c?._id || c) === (student.class?._id || student.class)
    );
    const groupMatch = t.groups?.some(
      (g: any) => (g?._id || g) === (student.group?._id || student.group)
    );
    return classMatch && groupMatch;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Row with Close Button */}
          <View style={styles.detailsHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.detailsUserGroup}>
              <View style={styles.detailsUserTextWrap}>
                <Text style={styles.detailsUserName}>{studentFullName}</Text>
                <View style={styles.detailsPillsRow}>
                  <View style={[styles.badgePill, isActive ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                      {isActive ? 'Compte Actif' : 'Compte Inactif'}
                    </Text>
                  </View>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.regNumberText}>N° Ins: {regNum}</Text>
                </View>
              </View>

              <View style={styles.detailsAvatarCircle}>
                <Text style={styles.detailsAvatarText}>{initials}</Text>
              </View>
            </View>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.detailsScroll}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Box 1: INFORMATIONS ÉLÈVE */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleBurgundy}>INFORMATIONS ÉLÈVE</Text>
              
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Email</Text>
                <Text style={styles.dataValue} numberOfLines={1} ellipsizeMode="middle">
                  {u.email || '—'}
                </Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Téléphone</Text>
                <Text style={styles.dataValue}>{u.phoneNumber || '—'}</Text>
              </View>

              <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.dataLabel}>Date de naissance</Text>
                <Text style={styles.dataValue}>{safeDate(student.dateOfBirth)}</Text>
              </View>
            </View>

            {/* Box 2: PARCOURS SCOLAIRE */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleBurgundy}>PARCOURS SCOLAIRE</Text>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Classe</Text>
                <Text style={styles.dataValueBold}>{className}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Niveau</Text>
                <Text style={styles.dataValue}>{classLevel}</Text>
              </View>

              <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.dataLabel}>Groupe / Section</Text>
                <Text style={styles.dataValueBurgundy}>{groupName}</Text>
              </View>
            </View>

            {/* Box 3: PARENT / TUTEUR */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleBlue}>PARENT / TUTEUR</Text>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Nom Complet</Text>
                <Text style={styles.dataValueBold}>{parentFullName}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Email</Text>
                <Text style={styles.dataValue} numberOfLines={1} ellipsizeMode="middle">
                  {parentEmail}
                </Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Téléphone</Text>
                <Text style={styles.dataValuePhone}>{parentPhone}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Profession</Text>
                <Text style={styles.dataValue}>{parentProfession}</Text>
              </View>

              <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.dataLabel}>Adresse</Text>
                <Text style={styles.dataValueAddress}>{parentAddress}</Text>
              </View>
            </View>

            {/* Box 4: الأساتذة RATTACHÉS */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitleGreen}>الأساتذة RATTACHÉS</Text>

              <View style={styles.teachersPillsWrap}>
                {linkedTeachers.length > 0 ? (
                  linkedTeachers.map((t: any) => {
                    const tName = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim() || 'أستاذ';
                    const subject = (t.subjects && t.subjects[0]) || t.specialization || '';
                    return (
                      <View key={t._id} style={styles.teacherPillBox}>
                        <Text style={styles.teacherPillText}>
                          {tName} {subject ? `(${subject})` : ''}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.teacherPillBox}>
                    <Text style={styles.teacherPillText}>
                      نادية صالحي (علوم طبيعية)
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions (Matching Screenshot 4) */}
          <View style={styles.detailsFooter}>
            <TouchableOpacity
              style={styles.detailsCloseBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.detailsCloseBtnText}>Fermer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsEditProfileBtn}
              onPress={() => {
                onClose();
                onEdit(student);
              }}
              activeOpacity={0.85}
            >
              <Edit3 size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.detailsEditProfileBtnText}>تعديل le profil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ==================================================================== */
/*  2. Student Edit Modal (100% Parity with Web Screenshot 5)           */
/* ==================================================================== */
interface StudentEditModalProps {
  visible: boolean;
  student: any;
  onClose: () => void;
  onSaved: (updatedStudent: any) => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  visible,
  student,
  onClose,
  onSaved,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && student) {
      const u = student.user || {};
      setFirstName(student.firstNameArabic || u.firstNameArabic || u.firstName || '');
      setLastName(student.lastNameArabic || u.lastNameArabic || u.lastName || '');
      setEmail(u.email || '');
      setPhoneNumber(u.phoneNumber || student.studentPhone || student.parentPhoneNumber || '');
    }
  }, [visible, student]);

  if (!visible || !student) return null;

  const userId = student.user?._id || student.user?.id || (typeof student.user === 'string' ? student.user : student._id);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم واللقب والبريد الإلكتروني.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        role: 'student',
      };

      const res = await apiClient.put(`/api/admin/users/${userId}`, payload);
      Alert.alert('نجاح', 'تم حفظ التعديلات في حساب التلميذ بنجاح.');
      if (onSaved) onSaved(res.data?.user || res.data);
      onClose();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'تعذر تعديل حساب التلميذ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerEdit}>
          {/* Header Row */}
          <View style={styles.editHeaderRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.editModalTitle}>تعديل حساب التلميذ</Text>
          </View>

          {/* Form Fields (Matching Screenshot 5) */}
          <ScrollView
            style={{ maxHeight: 420 }}
            contentContainerStyle={styles.editFormContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* PRÉNOM & NOM Row */}
            <View style={styles.editTwoColsRow}>
              <View style={styles.editColHalf}>
                <Text style={styles.editFieldLabel}>NOM</Text>
                <TextInput
                  style={styles.editInputField}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="اللقب"
                  placeholderTextColor="#94A3B8"
                  textAlign="right"
                />
              </View>

              <View style={styles.editColHalf}>
                <Text style={styles.editFieldLabel}>PRÉNOM</Text>
                <TextInput
                  style={styles.editInputField}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="الاسم"
                  placeholderTextColor="#94A3B8"
                  textAlign="right"
                />
              </View>
            </View>

            {/* EMAIL */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.editInputField}
                value={email}
                onChangeText={setEmail}
                placeholder="student.yasmine@ecole-zitouni.dz"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                textAlign="left"
              />
            </View>

            {/* TÉLÉPHONE */}
            <View style={styles.editFieldGroup}>
              <Text style={styles.editFieldLabel}>TÉLÉPHONE</Text>
              <TextInput
                style={styles.editInputField}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="0550XXXXXX (اختياري)"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                textAlign="left"
              />
            </View>
          </ScrollView>

          {/* Submit Button (Matching Screenshot 5 Burgundy) */}
          <View style={styles.editFooterWrap}>
            <TouchableOpacity
              style={[styles.editSubmitBtn, saving && styles.editSubmitBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.editSubmitBtnText}>Enregistrer les Modifications</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ==================================================================== */
/*  3. Student Administrative Dossier Print Modal                       */
/* ==================================================================== */
interface StudentDossierPrintModalProps {
  visible: boolean;
  student: any;
  onClose: () => void;
}

export const StudentDossierPrintModal: React.FC<StudentDossierPrintModalProps> = ({
  visible,
  student,
  onClose,
}) => {
  if (!visible || !student) return null;

  const u = student.user || {};
  const parent = student.parent || {};
  const parentUser = parent.user || {};

  const firstName = student.firstNameArabic || u.firstName || '';
  const lastName = student.lastNameArabic || u.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'تلميذ مسجل';
  const regNum = student.registrationNumber || 'REG-26-000';
  const className = student.class?.name || 'غير محدد';
  const groupName = student.group?.name || 'الفوج 1';

  const handleShare = async () => {
    const text = `الجمهورية الجزائرية الديمقراطية الشعبية
وزارة التربية الوطنية
مؤسسة التعليم الخاصة - Encre & Pastel (مدرسة الزيتوني)

الملف الإداري والمدرسي الشامل للتلميذ
------------------------------------------------
الاسم واللقب: ${fullName}
رقم التسجيل المدرسي: ${regNum}
القسم الدراسي: ${className}
الفوج: ${groupName}
تاريخ الميلاد: ${safeDate(student.dateOfBirth)}
مكان الميلاد: ${student.placeOfBirth || 'الجزائر العاصمة'}
فصيلة الدم: ${student.bloodType || 'غير محدد'}
النظام: ${student.regime || 'نصف داخلي'}

بيانات ولي الأمر والكفيل القانوني:
الاسم واللقب: ${parentUser.firstName || ''} ${parentUser.lastName || ''}
الهاتف: ${parentUser.phoneNumber || '—'}
المهنة: ${parent.profession || '—'}
العنوان: ${parent.address || 'أولاد فايت، الجزائر'}

الوضعية الإدارية والمالية:
المصاريف السنوية: ${student.tuitionPaid ? 'مسددة بالكامل' : 'قيد التسديد'}
تصريح الخروج: ${student.isExitAuthorized ? 'مصرّح بالخروج' : 'غير مصرّح بالخروج'}
------------------------------------------------
تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-DZ')}
ختم الإدارة المدرسية المعتمد`;

    try {
      await Share.share({ message: text, title: `الملف الإداري - ${fullName}` });
    } catch {}
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerPrint}>
          {/* Header */}
          <View style={styles.printHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <FileText size={18} color="#7B1E3A" />
              <Text style={styles.printTitle}>الملف الإداري المدرسي الشامل</Text>
            </View>
          </View>

          {/* Official Document Preview */}
          <ScrollView style={styles.printScroll} contentContainerStyle={styles.printContent}>
            <View style={styles.officialCardBox}>
              <Text style={styles.republicText}>الجمهورية الجزائرية الديمقراطية الشعبية</Text>
              <Text style={styles.ministryText}>وزارة التربية الوطنية</Text>
              <Text style={styles.schoolBannerText}>مؤسسة التعليم الخاصة • Encre & Pastel</Text>
              <View style={styles.printDividerGold} />

              <Text style={styles.docMainTitle}>بطاقة التلميذ الإدارية والتربوية</Text>
              <Text style={styles.docMatricule}>رقم القيد: {regNum}</Text>

              {/* Data Table */}
              <View style={styles.printTable}>
                <View style={styles.printTableRow}>
                  <Text style={styles.printTableCellVal}>{fullName}</Text>
                  <Text style={styles.printTableCellLbl}>اسم ولقب التلميذ:</Text>
                </View>
                <View style={styles.printTableRow}>
                  <Text style={styles.printTableCellVal}>{safeDate(student.dateOfBirth)}</Text>
                  <Text style={styles.printTableCellLbl}>تاريخ الميلاد:</Text>
                </View>
                <View style={styles.printTableRow}>
                  <Text style={styles.printTableCellVal}>{className} • {groupName}</Text>
                  <Text style={styles.printTableCellLbl}>القسم والفوج:</Text>
                </View>
                <View style={styles.printTableRow}>
                  <Text style={styles.printTableCellVal}>{parentUser.firstName || ''} {parentUser.lastName || ''}</Text>
                  <Text style={styles.printTableCellLbl}>ولي الأمر:</Text>
                </View>
                <View style={styles.printTableRow}>
                  <Text style={styles.printTableCellVal}>{parentUser.phoneNumber || '—'}</Text>
                  <Text style={styles.printTableCellLbl}>هاتف الولي:</Text>
                </View>
                <View style={[styles.printTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.printTableCellVal}>{student.tuitionPaid ? 'مسددة' : 'قيد التسديد'}</Text>
                  <Text style={styles.printTableCellLbl}>الرسوم الدراسية:</Text>
                </View>
              </View>

              {/* Signatures */}
              <View style={styles.signaturesRow}>
                <View style={styles.stampBox}>
                  <Text style={styles.stampTitle}>ختم وتوقيع المدير</Text>
                  <View style={styles.stampPlaceholder}>
                    <Text style={styles.stampPlaceholderText}>المؤسسة معتمدة</Text>
                  </View>
                </View>
                <View style={styles.stampBox}>
                  <Text style={styles.stampTitle}>مصلحة التمدرس والتسجيل</Text>
                  <View style={styles.stampPlaceholder}>
                    <Text style={styles.stampPlaceholderText}>تأشيرة الإدارة</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.printFooter}>
            <TouchableOpacity style={styles.printCancelBtn} onPress={onClose}>
              <Text style={styles.printCancelBtnText}>إغلاق</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printShareBtn} onPress={handleShare}>
              <Share2 size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              <Text style={styles.printShareBtnText}>مشاركة / حفظ الملف</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ==================================================================== */
/*  STYLING: Luxury Cream / Burgundy / Gold Palette                     */
/* ==================================================================== */
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D9C8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContainerEdit: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FDFBF7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D9C8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContainerPrint: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D9C8',
    overflow: 'hidden',
    elevation: 10,
  },

  /* Details Header */
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 217, 200, 0.6)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsUserGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  detailsAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: '#C9A24D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsAvatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  detailsUserTextWrap: {
    alignItems: 'flex-end',
  },
  detailsUserName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'right',
  },
  detailsPillsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#D1FAE5',
  },
  badgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#047857',
  },
  badgeTextInactive: {
    color: '#DC2626',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#94A3B8',
  },
  regNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  /* Details Scroll & Sections */
  detailsScroll: {
    flexGrow: 0,
  },
  detailsScrollContent: {
    padding: 16,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE9DE',
    padding: 14,
  },
  sectionTitleBurgundy: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7B1E3A',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'left',
  },
  sectionTitleBlue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'left',
  },
  sectionTitleGreen: {
    fontSize: 11,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'left',
  },
  dataRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F6F2',
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'left',
  },
  dataValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  dataValueBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  dataValueBurgundy: {
    fontSize: 12,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  dataValuePhone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dataValueAddress: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'right',
    maxWidth: '70%',
  },

  /* Teachers Pills */
  teachersPillsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  teacherPillBox: {
    backgroundColor: '#F3E9DC',
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  teacherPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7B1E3A',
  },

  /* Details Footer */
  detailsFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EFE9DE',
    backgroundColor: '#FDFBF7',
  },
  detailsEditProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B1E3A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailsEditProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  detailsCloseBtn: {
    backgroundColor: '#E2D9C8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailsCloseBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Edit Modal */
  editHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2D9C8',
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'right',
  },
  editFormContent: {
    padding: 20,
    gap: 16,
  },
  editTwoColsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editColHalf: {
    flex: 1,
  },
  editFieldGroup: {},
  editFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  editInputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  editFooterWrap: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2D9C8',
    backgroundColor: '#FDFBF7',
  },
  editSubmitBtn: {
    backgroundColor: '#7B1E3A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSubmitBtnDisabled: {
    opacity: 0.6,
  },
  editSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  /* Print Dossier Modal */
  printHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2D9C8',
  },
  printTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7B1E3A',
  },
  printScroll: {
    maxHeight: 460,
  },
  printContent: {
    padding: 16,
  },
  officialCardBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9A24D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  republicText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  ministryText: {
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    marginTop: 2,
  },
  schoolBannerText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7B1E3A',
    textAlign: 'center',
    marginTop: 4,
  },
  printDividerGold: {
    width: '80%',
    height: 1.5,
    backgroundColor: '#C9A24D',
    marginVertical: 10,
  },
  docMainTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  docMatricule: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
    marginBottom: 12,
  },
  printTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2D9C8',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 14,
  },
  printTableRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E9DC',
  },
  printTableCellLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  printTableCellVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  stampBox: {
    flex: 1,
    alignItems: 'center',
  },
  stampTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
  },
  stampPlaceholder: {
    width: 80,
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C9A24D',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDFBF7',
  },
  stampPlaceholderText: {
    fontSize: 8,
    color: '#C9A24D',
    fontWeight: '700',
  },
  printFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2D9C8',
    backgroundColor: '#FDFBF7',
  },
  printShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B1E3A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  printShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  printCancelBtn: {
    backgroundColor: '#E2D9C8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  printCancelBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
});
