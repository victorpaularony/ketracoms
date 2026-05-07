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
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_SIZE = 15;

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
    textPri: '#F1F5F9',
    textSec: '#94A3B8',
    textMuted: '#64748B',
    white: '#FFFFFF',
};

export default function FeedbackScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [records, setRecords] = useState<FeedbackRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination & View Mode
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const fetchFeedback = useCallback(async (isRefreshing = false) => {
        const currentPage = isRefreshing ? 0 : page;
        if (!isRefreshing && currentPage === 0) setLoading(true);

        try {
            const from = currentPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error: err } = await supabase
                .from('feedback_forms')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (err) throw err;

            if (isRefreshing) {
                setRecords(data || []);
                setPage(1);
                setHasMore((data || []).length === PAGE_SIZE);
            } else {
                setRecords(prev => [...prev, ...(data || [])]);
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
        fetchFeedback();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchFeedback(true);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
            fetchFeedback();
        }
    };

    // ── Responsive Dimensions ──────────────────────────────────────────────────
    const numColumns = viewMode === 'grid' ? (SCREEN_WIDTH > 600 ? 3 : 1) : 1;
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
                            <Ionicons name="chatbubbles-outline" size={20} color={C.accent} />
                        </View>
                        <Text style={styles.title}>Feedback</Text>
                    </View>
                </View>

                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Ionicons name="list" size={18} color={viewMode === 'list' ? C.white : C.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
                        onPress={() => setViewMode('grid')}
                    >
                        <Ionicons name="grid" size={18} color={viewMode === 'grid' ? C.white : C.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.metaText}>{records.length} responses received</Text>
        </View>
    );

    const renderItem = ({ item }: { item: FeedbackRecord }) => {
        const isGrid = viewMode === 'grid';

        return (
            <View style={[styles.card, { width: cardWidth }, isGrid && styles.gridCard]}>
                <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.nameSection}>
                        <Text style={styles.nameText} numberOfLines={1}>{item.name || 'Anonymous'}</Text>
                        {item.email ? <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text> : null}
                    </View>
                    <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>


                <Text style={styles.messageText} numberOfLines={isGrid ? 4 : undefined}>
                    {item.message || 'No written feedback provided.'}
                </Text>
            </View>
        );
    };

    if (loading && records.length === 0) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={styles.loadingText}>Loading feedback…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <FlatList
                key={viewMode}
                data={records}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                columnWrapperStyle={viewMode === 'grid' && numColumns > 1 ? styles.gridRow : undefined}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
                ListHeaderComponent={ListHeader}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={C.accent}
                    />
                }
                ListFooterComponent={
                    hasMore ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={C.accent} />
                        </View>
                    ) : records.length > 0 ? (
                        <Text style={styles.footerEnd}>End of feedback records</Text>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="chatbubble-ellipses-outline" size={64} color={C.textMuted} />
                        <Text style={styles.emptyTitle}>No feedback yet</Text>
                        <Text style={styles.emptyMsg}>Customer feedback will appear here once submitted.</Text>
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
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBadge: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(16,185,129,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 26, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
    toggleRow: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border },
    toggleBtn: { padding: 6, borderRadius: 8 },
    toggleBtnActive: { backgroundColor: C.accent },
    metaText: { fontSize: 13, color: C.textMuted, fontWeight: '600', marginLeft: 4 },
    gridRow: { justifyContent: 'space-between' },
    card: {
        backgroundColor: C.card, borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: C.border, marginBottom: 12,
    },
    gridCard: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: C.primary, fontWeight: '700', fontSize: 16 },
    nameSection: { flex: 1 },
    nameText: { fontSize: 14, fontWeight: '700', color: C.textPri },
    emailText: { fontSize: 11, color: C.textMuted },
    dateText: { fontSize: 11, color: C.textMuted },
    messageText: { fontSize: 14, color: C.textSec, lineHeight: 22 },
    loadingText: { marginTop: 16, fontSize: 15, color: C.textSec, fontWeight: '500' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' },
    footerEnd: { paddingVertical: 32, textAlign: 'center', color: C.textMuted, fontSize: 13, fontWeight: '500' },
    empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.textPri, marginTop: 20 },
    emptyMsg: { fontSize: 14, color: C.textSec, textAlign: 'center', marginTop: 10, lineHeight: 22 },
});
