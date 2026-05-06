import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_SIZE = (SCREEN_WIDTH - 48) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GeoPhotoRecord {
  id: string;
  created_at: string;
  image_url: string;
  image_data: string | null;
  storage_path: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  address: string | null;
  captured_at: string | null;
  width: number | null;
  height: number | null;
}

// ─── Colours ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  border: '#334155',
  primary: '#3B82F6',
  accent: '#10B981',
  textPri: '#F1F5F9',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  white: '#FFFFFF',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [photos, setPhotos] = useState<GeoPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('geo_photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw new Error(err.message);
      setPhotos(data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos(true);
  }, [fetchPhotos]);

  // ── Header ─────────────────────────────────────────────────────────────────
  const ListHeader = (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerTitle}>
        <View style={styles.iconBadge}>
          <Ionicons name="images-outline" size={20} color={C.primary} />
        </View>
        <Text style={styles.title}>Images</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{photos.length} records</Text>
      </View>
    </View>
  );

  // ── Empty / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Fetching images from database…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="cloud-offline-outline" size={56} color={C.textMuted} />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPhotos()} activeOpacity={0.8}>
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={56} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No images yet</Text>
            <Text style={styles.emptyMsg}>
              Photos submitted from the client app will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({ pathname: '/image-detail', params: { id: item.id, data: JSON.stringify(item) } })
            }
          >
            <Image
              source={{ uri: item.image_data ? `data:image/jpeg;base64,${item.image_data}` : item.image_url }}
              style={styles.thumb}
              resizeMode="cover"
            />
            <View style={styles.cardBody}>
              <Text style={styles.cardAddress} numberOfLines={2}>
                {item.address ?? 'Unknown location'}
              </Text>
              <Text style={styles.cardDate}>
                {item.captured_at
                  ? new Date(item.captured_at).toLocaleDateString()
                  : new Date(item.created_at).toLocaleDateString()}
              </Text>
              {item.latitude != null && (
                <View style={styles.coordRow}>
                  <Ionicons name="location-outline" size={11} color={C.primary} />
                  <Text style={styles.coordTxt}>
                    {item.latitude.toFixed(4)}, {item.longitude?.toFixed(4)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: C.textPri },
  countBadge: {
    backgroundColor: 'rgba(59,130,246,0.12)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)',
  },
  countText: { fontSize: 12, fontWeight: '600', color: C.primary },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    width: CARD_SIZE, borderRadius: 14, backgroundColor: C.card,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  thumb: { width: '100%', aspectRatio: 1, backgroundColor: C.surface },
  cardBody: { padding: 10 },
  cardAddress: { fontSize: 11, color: C.textSec, lineHeight: 15, marginBottom: 4 },
  cardDate: { fontSize: 10, color: C.textMuted, marginBottom: 4 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coordTxt: { fontSize: 10, color: C.primary, fontFamily: 'monospace' },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textSec },
  errorTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginTop: 16 },
  errorMsg: { fontSize: 13, color: C.textSec, textAlign: 'center', marginTop: 8 },
  retryBtn: { marginTop: 20, backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  retryTxt: { color: C.white, fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginTop: 16 },
  emptyMsg: { fontSize: 13, color: C.textSec, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
