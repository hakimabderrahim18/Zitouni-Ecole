import React from 'react';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  MessageSquare,
  UserCircle2,
  GraduationCap,
  Baby,
} from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function TabLayout() {
  const { user } = useAuthStore();
  const role = user?.role;

  const getStudentsTabTitle = () => {
    if (role === 'parent') return 'أبنائي';
    if (role === 'teacher') return 'أقسامي';
    if (role === 'student') return 'زملائي';
    if (role === 'receptionist') return 'الزوار';
    return 'التلاميذ';
  };

  const getExitPermitsTabTitle = () => {
    if (role === 'parent') return 'طلب خروج';
    if (role === 'receptionist') return 'البوابة';
    return 'أذونات الخروج';
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.card, // #FCF8F2
          borderTopColor: theme.colors.surface.border, // #DFD3C2
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.brand[500], // Bordeaux #7B1E3A
        tabBarInactiveTintColor: theme.colors.text.subtle, // #9C8288
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          headerTitle: 'مدرسة حبر',
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: getStudentsTabTitle(),
          tabBarIcon: ({ color, size }) =>
            role === 'parent' ? (
              <Baby color={color} size={size} />
            ) : role === 'teacher' ? (
              <GraduationCap color={color} size={size} />
            ) : (
              <Users color={color} size={size} />
            ),
          headerTitle: 'دليل التلاميذ والأقسام',
        }}
      />
      <Tabs.Screen
        name="exit-permits"
        options={{
          title: getExitPermitsTabTitle(),
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          headerTitle: 'أذونات وتصاريح الخروج',
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'المحادثات',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
          headerTitle: 'الرسائل والتواصل',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => <UserCircle2 color={color} size={size} />,
          headerTitle: 'الملف الشخصي',
        }}
      />
    </Tabs>
  );
}
