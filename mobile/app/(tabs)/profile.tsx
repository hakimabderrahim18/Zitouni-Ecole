import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'expo-router';
import {
  Camera,
  Trash2,
  Edit3,
  Save,
  Phone,
  Key,
  Mail,
  ShieldAlert,
  LogOut,
  User,
  Check,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { apiClient, API_BASE_URL } from '../../src/api/client';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { theme } from '../../src/theme/tokens';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { NavigationDrawer } from '../../src/components/NavigationDrawer';

const profileSchema = z.object({
  firstName: z.string().min(1, 'الاسم الأول مطلوب'),
  lastName: z.string().min(1, 'اللقب مطلوب'),
  phoneNumber: z.string().optional(),
  password: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuthStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingPic, setIsDeletingPic] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      password: '',
    },
  });

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول لمكتبة الصور لاختيار صورتك الشخصية.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('خطأ', 'تعذر فتح منتقي الصور');
    }
  };

  const uploadAvatar = async (uri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri,
        name: filename,
        type,
      } as any);

      const res = await apiClient.post('/api/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      Alert.alert('نجاح', 'تم تحديث صورتك الشخصية بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل رفع الصورة الشخصية.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = () => {
    Alert.alert('حذف الصورة', 'هل أنت متأكد من رغبتك في حذف صورتك الشخصية واسترجاع الأحرف الأولى؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          setIsDeletingPic(true);
          try {
            await apiClient.delete('/api/auth/profile/avatar');
            updateUser({ profilePic: '' });
            Alert.alert('نجاح', 'تم حذف الصورة الشخصية.');
          } catch {
            Alert.alert('خطأ', 'فشل حذف الصورة.');
          } finally {
            setIsDeletingPic(false);
          }
        },
      },
    ]);
  };

  const onSaveProfile = async (data: ProfileFormData) => {
    try {
      const payload: Record<string, string> = {
        firstName: data.firstName,
        lastName: data.lastName,
      };
      if (data.phoneNumber) payload.phoneNumber = data.phoneNumber;
      if (data.password && data.password.trim()) payload.password = data.password.trim();

      const res = await apiClient.put('/api/auth/profile', payload);
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setIsEditing(false);
      Alert.alert('نجاح', 'تم حفظ وتحديث بيانات حسابك بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.message || 'فشل حفظ التعديلات.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب نهائياً',
      'طبقا لشروط App Store Guideline 5.1.1(v)، سيتم حذف كامل حسابك وبياناتك من خوادم المنصة بشكل دائم. هل توافق على المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، احذف حسابي',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/api/auth/account');
              await logout();
              router.replace('/(auth)/login');
            } catch (err: any) {
              Alert.alert('خطأ', err.response?.data?.message || 'تعذر حذف الحساب.');
            }
          },
        },
      ]
    );
  };

  const avatarUrl = user?.profilePic?.startsWith('http')
    ? user.profilePic
    : user?.profilePic
    ? `${API_BASE_URL}${user.profilePic}`
    : null;

  return (
    <View style={styles.container}>
      {/* 1. Web Parity Dashboard Header */}
      <DashboardHeader
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenProfile={() => {}}
      />

      {/* 2. Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId="profile"
        onSelect={(id) => {
          setIsDrawerOpen(false);
          if (id === 'profile') return;
          if (id === 'chat' || id === 'messages') {
            router.push('/(tabs)/messages');
          } else if (id === 'students') {
            router.push('/(tabs)/students');
          } else if (id === 'exit-passes' || id === 'exit-permits') {
            router.push('/(tabs)/exit-permits');
          } else {
            router.push({ pathname: '/(tabs)', params: { route: id } });
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card Header */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={isUploading}
            style={styles.avatarWrapper}
            accessibilityLabel="تغيير الصورة الشخصية"
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {user?.firstName?.[0] || 'ز'}
                  {user?.lastName?.[0] || 'ب'}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Camera size={13} color="#FFFFFF" />
              <Text style={styles.cameraOverlayText}>
                {isUploading ? 'جاري...' : 'تغيير'}
              </Text>
            </View>
          </TouchableOpacity>

          {user?.profilePic ? (
            <TouchableOpacity
              onPress={handleDeleteAvatar}
              disabled={isDeletingPic}
              style={styles.removePicBtn}
            >
              <Trash2 size={13} color={theme.colors.status.danger} />
              <Text style={styles.removePicBtnText}>إزالة الصورة</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>
            {user?.role === 'school'
              ? 'إدارة المدرسة'
              : user?.role === 'admin'
              ? 'مدير المنصة'
              : user?.role === 'teacher'
              ? 'أستاذ'
              : user?.role === 'parent'
              ? 'ولي أمر'
              : user?.role === 'receptionist'
              ? 'موظف الاستقبال'
              : 'تلميذ'}
          </Text>
        </View>
      </View>

      {/* Mode Tabs */}
      <View style={styles.modeTabsRow}>
        <TouchableOpacity
          onPress={() => setIsEditing(false)}
          style={[styles.modeTab, !isEditing && styles.modeTabActive]}
        >
          <Text style={[styles.modeTabText, !isEditing && styles.modeTabTextActive]}>
            نظرة عامة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsEditing(true)}
          style={[styles.modeTab, isEditing && styles.modeTabActive]}
        >
          <Edit3 size={13} color={isEditing ? '#FFFFFF' : theme.colors.text.muted} />
          <Text style={[styles.modeTabText, isEditing && styles.modeTabTextActive]}>
            تعديل البيانات
          </Text>
        </TouchableOpacity>
      </View>

      {/* Overview View */}
      {!isEditing && (
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>البريد الإلكتروني:</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>رقم الهاتف:</Text>
            <Text style={styles.infoPhoneValue}>{user?.phoneNumber || '0797060052'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>نوع الحساب:</Text>
            <Text style={styles.infoValue}>حساب معتمد ومفعل</Text>
          </View>
        </View>
      )}

      {/* Edit View */}
      {isEditing && (
        <View style={styles.editCard}>
          <Text style={styles.editCardTitle}>تحديث المعلومات الشخصية</Text>

          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="الاسم الأول"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.firstName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="اللقب"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.lastName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="رقم الهاتف"
                placeholder="0797060052"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="كلمة مرور جديدة (اختياري)"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          <View style={styles.editActions}>
            <Button
              label={isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              onPress={handleSubmit(onSaveProfile)}
              isLoading={isSubmitting}
              style={{ flex: 1 }}
            />
            <Button
              label="إلغاء"
              variant="secondary"
              onPress={() => setIsEditing(false)}
              style={{ minWidth: 80 }}
            />
          </View>
        </View>
      )}

      {/* Danger Zone & Logout */}
      <View style={styles.actionFooter}>
        <Button
          label="تسجيل الخروج"
          variant="secondary"
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
          style={styles.logoutBtn}
        />

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.deleteAccountBtn}
        >
          <Text style={styles.deleteAccountText}>
            حذف الحساب نهائياً (App Store 5.1.1(v))
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background, // Beige Crème #F3E9DC
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  profileHeaderCard: {
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.borderGold,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: theme.colors.gold[500],
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: theme.colors.brand[500], // Bordeaux #7B1E3A
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(123, 30, 58, 0.85)',
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  cameraOverlayText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  removePicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.status.dangerBg,
  },
  removePicBtnText: {
    color: theme.colors.status.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  userName: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: 'rgba(123, 30, 58, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(123, 30, 58, 0.2)',
  },
  roleTagText: {
    color: theme.colors.brand[500],
    fontSize: 11,
    fontWeight: '700',
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: theme.colors.brand[500], // Bordeaux #7B1E3A
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  infoPhoneValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.brand[500],
    fontFamily: 'monospace',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(223, 211, 194, 0.4)',
    marginVertical: theme.spacing.sm,
  },
  editCard: {
    backgroundColor: theme.colors.surface.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  editCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.brand[500],
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  actionFooter: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  logoutBtn: {
    width: '100%',
  },
  deleteAccountBtn: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  deleteAccountText: {
    color: theme.colors.status.danger,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
