import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'expo-router';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  MapPin,
} from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { storage } from '../../src/utils/secureStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { SchoolLogo } from '../../src/components/SchoolLogo';
import { theme } from '../../src/theme/tokens';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'يرجى إدخال رقم الهاتف أو المعرف أو البريد الإلكتروني'),
  password: z
    .string()
    .min(1, 'يرجى إدخال كلمة المرور'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await apiClient.post('/api/auth/login', {
        identifier: data.identifier.trim(),
        username: data.identifier.trim(),
        email: data.identifier.trim(),
        password: data.password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Save tokens to hardware-backed storage (SecureStore on iOS/Android, localStorage on Web)
      await storage.setAccessToken(accessToken);
      if (refreshToken) await storage.setRefreshToken(refreshToken);
      await storage.setUser(user);
      setUser(user);

      // Navigate to tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'فشل تسجيل الدخول، يرجى التأكد من صحة رقم الهاتف أو كلمة المرور';
      setServerError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('تنبيه', message);
      }
    }
  };

  // Quick helper to fill test accounts with 1 click
  const fillAccount = (id: string, pass: string) => {
    setValue('identifier', id);
    setValue('password', pass);
    setServerError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Prestige School Official Crest / Header */}
        <View style={styles.header}>
          <SchoolLogo size={76} style={styles.logoBadge} />
          <Text style={styles.title}>مدرسة حبر</Text>
          <Text style={styles.frenchSubtitle}>GROUPE SCOLAIRE ENCRE & PASTEL</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.slogan}>« يا نشء أنت رجاؤنا »</Text>
          <Text style={styles.institutionName}>مؤسسة التربية والتعليم حبر وألوان الخاصة</Text>
          <View style={styles.locationBadge}>
            <MapPin size={11} color={theme.colors.gold[600]} />
            <Text style={styles.locationText}>أولاد فايت - الجزائر غرب</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تسجيل الدخول</Text>
          <Text style={styles.cardSubtitle}>
            أدخل رقم هاتفك أو اسم المستخدم وكلمة المرور للمتابعة
          </Text>

          {/* Server Error Alert Banner */}
          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={theme.colors.status.danger} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="المعرّف، البريد أو رقم الهاتف"
                placeholder="مثال: 0797060052 أو admin"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.identifier?.message}
                autoCapitalize="none"
                returnKeyType="next"
              />
            )}
          />

          <View style={styles.passwordWrapper}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="كلمة المرور"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              accessibilityLabel="إظهار أو إخفاء كلمة المرور"
            >
              {showPassword ? (
                <EyeOff size={18} color={theme.colors.text.muted} />
              ) : (
                <Eye size={18} color={theme.colors.text.muted} />
              )}
            </TouchableOpacity>
          </View>

          <Button
            label={isSubmitting ? 'جاري التحقق من الخادم...' : 'تسجيل الدخول'}
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />

          {/* Quick Demo Fill Buttons for Testing Roles */}
          <View style={styles.quickFillSection}>
            <View style={styles.quickFillHeader}>
              <Sparkles size={12} color={theme.colors.gold[500]} />
              <Text style={styles.quickFillTitle}>حسابات تجريبية سريعة للاختبار:</Text>
            </View>
            <View style={styles.quickFillChips}>
              <TouchableOpacity
                onPress={() => fillAccount('admin@ecole-zitouni.dz', 'Admin123!')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>مدير (Admin)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('direction@ecole-zitouni.dz', 'School123!')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>إدارة المدرسة</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('0550111111', '0550111111')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>أستاذ (0550111111)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('0550112233', '0550112233')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>مراقب عام (0550112233)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('0550445566', '0550445566')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>مراقب تربوي</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('0550778899', '0550778899')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>استقبال</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('0550110011', '0550110011')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>ولي أمر</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fillAccount('yanis.m@ecole-zitouni.dz', '2014-03-20')}
                style={styles.roleChip}
              >
                <Text style={styles.roleChipText}>تلميذ (يانيس)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <ShieldCheck size={16} color={theme.colors.gold[500]} />
          <Text style={styles.footerText}>
            متصل مباشرة بالخادم المحلي http://localhost:5055
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background, // Beige Crème #F3E9DC
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface.card,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.brand[500], // Bordeaux #7B1E3A
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  frenchSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.gold[500],
    letterSpacing: 2,
    marginTop: 2,
  },
  goldDivider: {
    width: 44,
    height: 2,
    backgroundColor: theme.colors.gold[500],
    marginVertical: 6,
    borderRadius: 1,
  },
  slogan: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.brand[600],
    textAlign: 'center',
    marginBottom: 2,
  },
  institutionName: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(201, 162, 77, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  locationText: {
    fontSize: 10,
    color: theme.colors.gold[700],
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surface.card, // #FCF8F2
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface.borderGold,
    ...theme.shadows.card,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text.primary, // #2B2022
    textAlign: 'right',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.status.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: theme.colors.status.danger,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    left: 12,
    top: 36,
    padding: 6,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
  quickFillSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(223, 211, 194, 0.5)',
  },
  quickFillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  quickFillTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.muted,
  },
  quickFillChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  roleChip: {
    backgroundColor: theme.colors.surface.input,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brand[500],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: '600',
  },
});
