import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { ShieldCheck, CheckCircle2, XCircle, Plus, Clock, User, X } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Button } from '../../src/components/common/Button';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { NavigationDrawer } from '../../src/components/NavigationDrawer';
import { useRouter } from 'expo-router';

interface Permit {
  id: string;
  studentName: string;
  className: string;
  reason: string;
  departureTime: string;
  parentName: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ExitPermitsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newTime, setNewTime] = useState('11:30');

  const [permits, setPermits] = useState<Permit[]>([
    {
      id: 'p1',
      studentName: 'ياسين بن عيسى',
      className: '1AP',
      reason: 'موعد فحص طبي مستعجل برفقة ولي الأمر',
      departureTime: '11:30',
      parentName: 'السيد بن عيسى',
      status: 'approved',
    },
    {
      id: 'p2',
      studentName: 'أمينة زيتوني',
      className: '3AP',
      reason: 'ظرف عائلي طارئ يتطلب المغادرة المبكرة',
      departureTime: '13:00',
      parentName: 'السيد زيتوني',
      status: 'pending',
    },
    {
      id: 'p3',
      studentName: 'أيمن قادري',
      className: '2AP',
      reason: 'طلب خروج غير مبرر بتقرير رسمي',
      departureTime: '14:15',
      parentName: 'السيد قادري',
      status: 'rejected',
    },
  ]);

  const handleApprove = (id: string) => {
    setPermits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );
    Alert.alert('نجاح', 'تم قبول إذن الخروج وإرسال تصريح البوابة لموظف الاستقبال.');
  };

  const handleReject = (id: string) => {
    setPermits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    );
    Alert.alert('تنبيه', 'تم رفض طلب الخروج وإشعار ولي الأمر.');
  };

  const handleCreatePermit = () => {
    if (!newStudentName.trim() || !newReason.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const newPermit: Permit = {
      id: 'p' + (permits.length + 1),
      studentName: newStudentName.trim(),
      className: '1AP',
      reason: newReason.trim(),
      departureTime: newTime.trim() || '12:00',
      parentName: `${user?.firstName || 'ولي'} ${user?.lastName || 'أمر'}`,
      status: 'pending',
    };
    setPermits([newPermit, ...permits]);
    setModalOpen(false);
    setNewStudentName('');
    setNewReason('');
    Alert.alert('نجاح', 'تم إرسال طلب إذن الخروج للإدارة للموافقة عليه.');
  };

  return (
    <View style={styles.container}>
      {/* 1. Web Parity Dashboard Header */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* 2. Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId="exit-permits"
        onSelect={(id) => {
          setIsDrawerOpen(false);
          router.push('/(tabs)');
        }}
      />

      {/* Action Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          style={styles.addRequestBtn}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addRequestBtnText}>طلب إذن خروج جديد</Text>
        </TouchableOpacity>
        <Text style={styles.topBarSummary}>{permits.length} تصاريح مسجلة</Text>
      </View>

      {/* Permits List */}
      <FlatList
        data={permits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isPending = item.status === 'pending';
          const isApproved = item.status === 'approved';

          return (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.badge,
                    isApproved
                      ? styles.badgeApproved
                      : isPending
                      ? styles.badgePending
                      : styles.badgeRejected,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isApproved
                        ? styles.textApproved
                        : isPending
                        ? styles.textPending
                        : styles.textRejected,
                    ]}
                  >
                    {isApproved
                      ? 'مسموح بالخروج'
                      : isPending
                      ? 'قيد الانتظار'
                      : 'مرفوض'}
                  </Text>
                </View>
                <View style={styles.studentNameGroup}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.className}>{item.className}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{item.departureTime}</Text>
                <View style={styles.infoLabelGroup}>
                  <Clock size={13} color={theme.colors.text.muted} />
                  <Text style={styles.infoLabel}>وقت الخروج المطلوب:</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{item.parentName}</Text>
                <View style={styles.infoLabelGroup}>
                  <User size={13} color={theme.colors.text.muted} />
                  <Text style={styles.infoLabel}>مقدم الطلب (الولي):</Text>
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Text style={styles.reasonTitle}>سبب الخروج:</Text>
                <Text style={styles.reasonText}>{item.reason}</Text>
              </View>

              {/* Action buttons for admin/school/receptionist */}
              {isPending && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => handleApprove(item.id)}
                    style={[styles.actionBtn, styles.approveBtn]}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>قبول وتصريح</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(item.id)}
                    style={[styles.actionBtn, styles.rejectBtn]}
                  >
                    <XCircle size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>رفض الطلب</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Modal to Request Exit Permit */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تقديم طلب إذن خروج للتلميذ</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>اسم ولقب التلميذ</Text>
              <TextInput
                value={newStudentName}
                onChangeText={setNewStudentName}
                placeholder="مثال: ياسين بن عيسى"
                placeholderTextColor={theme.colors.text.subtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>وقت الخروج المرجو</Text>
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="11:30"
                placeholderTextColor={theme.colors.text.subtle}
                style={styles.textInput}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>سبب الخروج المبرر</Text>
              <TextInput
                value={newReason}
                onChangeText={setNewReason}
                placeholder="وضح سبب المغادرة المبكرة..."
                placeholderTextColor={theme.colors.text.subtle}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textArea]}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                label="إرسال الطلب للموافقة"
                onPress={handleCreatePermit}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background, // Beige Crème #F3E9DC
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  addRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.brand[500], // Bordeaux #7B1E3A
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.md,
  },
  addRequestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  topBarSummary: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  list: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentNameGroup: {
    alignItems: 'flex-start',
  },
  studentName: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  className: {
    color: theme.colors.gold[600],
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  badgeApproved: { backgroundColor: theme.colors.status.successBg },
  badgePending: { backgroundColor: theme.colors.status.warningBg },
  badgeRejected: { backgroundColor: theme.colors.status.dangerBg },
  badgeText: { fontSize: 11, fontWeight: '800' },
  textApproved: { color: theme.colors.status.success },
  textPending: { color: theme.colors.status.warning },
  textRejected: { color: theme.colors.status.danger },
  divider: {
    height: 1,
    backgroundColor: 'rgba(223, 211, 194, 0.4)',
    marginVertical: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    color: theme.colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  reasonBox: {
    backgroundColor: theme.colors.surface.input,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    marginTop: theme.spacing.xs,
  },
  reasonTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.muted,
    marginBottom: 2,
    textAlign: 'right',
  },
  reasonText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveBtn: { backgroundColor: theme.colors.status.success },
  rejectBtn: { backgroundColor: theme.colors.status.danger },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 32, 34, 0.65)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.borderGold,
    ...theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
    paddingBottom: theme.spacing.xs,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.brand[500],
  },
  formGroup: {
    marginBottom: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textAlign: 'right',
  },
  textInput: {
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    color: theme.colors.text.primary,
    textAlign: 'right',
    fontSize: 13,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  modalActions: {
    marginTop: theme.spacing.md,
  },
});
