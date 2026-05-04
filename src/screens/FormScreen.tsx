import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';

export default function FormScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Form Section</Text>
        <Text style={styles.subtitle}>
          This section is under development and will be available in a future update.
        </Text>
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={14} color={COLORS.warning} />
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
});
