import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase } from '@/services/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 12;

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
    message?: string | null;
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

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [photos, setPhotos] = useState<GeoPhotoRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination & View Mode
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const fetchPhotos = useCallback(async (isRefreshing = false) => {
        const currentPage = isRefreshing ? 0 : page;
        if (!isRefreshing && currentPage === 0) setLoading(true);

        try {
            const from = currentPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error: err } = await supabase
                .from('geo_photos')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (err) throw err;

            if (isRefreshing) {
                setPhotos(data || []);
                setPage(1);
                setHasMore((data || []).length === PAGE_SIZE);
            } else {
                setPhotos(prev => [...prev, ...(data || [])]);
                setHasMore((data || []).length === PAGE_SIZE);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page]);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPhotos(true);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
            fetchPhotos();
        }
    };

    // ── Responsive Dimensions ──────────────────────────────────────────────────
    const numColumns = viewMode === 'grid' ? (SCREEN_WIDTH > 600 ? 4 : 2) : 1;
    const cardWidth = viewMode === 'grid'
        ? (SCREEN_WIDTH - (numColumns + 1) * 16) / numColumns
        : SCREEN_WIDTH - 32;

    // ── Header ─────────────────────────────────────────────────────────────────
    const ListHeader = (
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerTop}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={C.textPri} />
                    </TouchableOpacity>
                    <View style={styles.headerTitle}>
                        <View style={styles.iconBadge}>
                            <Ionicons name="images-outline" size={20} color={C.primary} />
                        </View>
                        <Text style={styles.title}>Reports</Text>
                    </View>
                </View>

                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('grid')}
                    >
                        <Ionicons name="grid" size={18} color={viewMode === 'grid' ? C.white : C.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Ionicons name="list" size={18} color={viewMode === 'list' ? C.white : C.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.metaRow}>
                <Text style={styles.metaText}>{photos.length} reports total</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: GeoPhotoRecord }) => {
        const isList = viewMode === 'list';

        return (
            <TouchableOpacity
                style={[styles.card, { width: cardWidth }, isList && styles.listCard]}
                activeOpacity={0.85}
                onPress={() =>
                    router.push({ pathname: '/image-detail', params: { id: item.id, data: JSON.stringify(item) } })
                }
            >
                <Image
                    source={{ uri: item.image_data ? `data:image/jpeg;base64,${item.image_data}` : item.image_url }}
                    style={isList ? styles.listThumb : styles.gridThumb}
                    contentFit="cover"
                    transition={300}
                />
                <View style={styles.cardBody}>
                    <Text style={styles.cardAddress} numberOfLines={isList ? 1 : 2}>
                        {item.address ?? 'Unknown location'}
                    </Text>
                    <View style={styles.cardFooter}>
                        <Text style={styles.cardDate}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                        {item.latitude != null && (
                            <View style={styles.coordRow}>
                                <Ionicons name="location-sharp" size={10} color={C.primary} />
                                <Text style={styles.coordTxt}>GPS Fixed</Text>
                            </View>
                        )}
                    </View>
                    {isList && item.message ? (
                        <Text style={styles.listMessage} numberOfLines={2}>{item.message}</Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && photos.length === 0) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loadingText}>Loading reports…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <FlatList
                key={viewMode + numColumns} // Force re-render on grid/list change
                data={photos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: insets.bottom + 24,
                    alignItems: viewMode === 'list' ? 'center' : 'stretch'
                }}
                ListHeaderComponent={ListHeader}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={C.primary}
                    />
                }
                ListFooterComponent={
                    hasMore ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={C.primary} />
                        </View>
                    ) : photos.length > 0 ? (
                        <Text style={styles.footerEnd}>No more reports to show</Text>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="camera-outline" size={64} color={C.textMuted} />
                        <Text style={styles.emptyTitle}>No reports found</Text>
                        <Text style={styles.emptyMsg}>Data submitted from the field will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
    header: { marginBottom: 20 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBadge: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(59,130,246,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 26, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
    toggleRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border },
    toggleBtn: { padding: 6, borderRadius: 8 },
    toggleBtnActive: { backgroundColor: C.primary },
    metaRow: { paddingLeft: 4 },
    metaText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
    gridRow: { justifyContent: 'space-between' },
    card: {
        backgroundColor: C.card, borderRadius: 18,
        overflow: 'hidden', borderWidth: 1, borderColor: C.border,
        marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    listCard: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    gridThumb: { width: '100%', aspectRatio: 1.1 },
    listThumb: { width: 80, height: 80, borderRadius: 12 },
    cardBody: { padding: 12, flex: 1 },
    cardAddress: { fontSize: 13, fontWeight: '600', color: C.textPri, marginBottom: 6 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardDate: { fontSize: 11, color: C.textMuted },
    coordRow: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    coordTxt: { fontSize: 10, color: C.primary, fontWeight: '700' },
    listMessage: { fontSize: 12, color: C.textSec, marginTop: 8, fontStyle: 'italic' },
    loadingText: { marginTop: 16, fontSize: 15, color: C.textSec, fontWeight: '500' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    footerEnd: { paddingVertical: 32, textAlign: 'center', color: C.textMuted, fontSize: 13, fontWeight: '500' },
    empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.textPri, marginTop: 20 },
    emptyMsg: { fontSize: 14, color: C.textSec, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
