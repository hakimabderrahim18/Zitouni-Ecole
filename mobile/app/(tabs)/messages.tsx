import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../src/theme/tokens';
import { DashboardHeader } from '../../src/components/DashboardHeader';
import { NavigationDrawer } from '../../src/components/NavigationDrawer';
import { ConversationView } from '../../src/components/chat/ConversationView';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSelectRoute = (id: string) => {
    setIsDrawerOpen(false);
    if (id === 'chat' || id === 'messages') return;
    if (id === 'students') {
      router.push('/(tabs)/students');
    } else if (id === 'exit-passes' || id === 'exit-permits') {
      router.push('/(tabs)/exit-permits');
    } else if (id === 'profile') {
      router.push('/(tabs)/profile');
    } else {
      router.push({ pathname: '/(tabs)', params: { route: id } });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Standard Parity Dashboard Header */}
      <DashboardHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* 2. Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeId="chat"
        onSelect={handleSelectRoute}
      />

      {/* 3. High-Parity Unified Conversation & Messaging Hub */}
      <ConversationView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface.background,
  },
});
