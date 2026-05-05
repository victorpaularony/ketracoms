import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeedbackRecord {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  message: string | null;
  rating: number | null;
}

// ─── Colours ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  white: '#FFFFFF',
};

const STAR_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981'];

function StarRating({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  const color = STAR_COLORS[Math.min(rating - 1, 4)] ?? C.textMuted;
  return (
    <View style={star.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color={i <= rating ? color : C.textMuted}
        />
      ))}
      <Text style={[star.label, { color }]}>{rating}/5</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('feedback_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      setRecords(data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeedback(true);
  }, [fetchFeedback]);

  // ── Header ─────────────────────────────────────────────────────────────────
  const ListHeader = (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerTitle}>
        <View style={styles.iconBadge}>
          <Ionicons name="chatbubbles-outline" size={20} color={C.accent} />
        </View>
        <Text style={styles.title}>Feedback</Text>
      </View>
      <View style={[styles.countBadge, { borderColor: 'rgba(16,185,129,0.25)', backgroundColor: 'rgba(16,185,129,0.12)' }]}>
        <Text style={[styles.countText, { color: C.accent }]}>{records.length} responses</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.loadingText}>Fetching feedback from database…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={56} color={C.textMuted} />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchFeedback()} activeOpacity={0.8}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={56} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No feedback yet</Text>
            <Text style={styles.emptyMsg}>
              Feedback submitted from the client app will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {(item.name ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{item.name ?? 'Anonymous'}</Text>
                {item.email ? (
                  <Text style={styles.emailText}>{item.email}</Text>
                ) : null}
              </View>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            {/* Rating */}
            <StarRating rating={item.rating} />

            {/* Message */}
            {item.message ? (
              <Text style={styles.messageText}>{item.message}</Text>
            ) : (
              <Text style={styles.noMessageText}>No message provided.</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingBottom: 16,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: C.textPri },
  countBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  countText: { fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: C.primary },
  nameText: { fontSize: 14, fontWeight: '600', color: C.textPri },
  emailText: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  dateText: { fontSize: 11, color: C.textMuted },
  messageText: { fontSize: 13, color: C.textSec, lineHeight: 20, marginTop: 10 },
  noMessageText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic', marginTop: 10 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textSec },
  errorTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginTop: 16 },
  errorMsg: { fontSize: 13, color: C.textSec, textAlign: 'center', marginTop: 8 },
  retryBtn: { marginTop: 20, backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  retryTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginTop: 16 },
  emptyMsg: { fontSize: 13, color: C.textSec, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

const star = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
});
