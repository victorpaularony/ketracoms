import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GeoPhotoRecord } from './(tabs)/index';

const SCREEN_WIDTH = Dimensions.get('window').width;

const C = {
    bg: '#0F172A',
    surface: '#1E293B',
    border: '#334155',
    primary: '#3B82F6',
    accent: '#10B981',
    textPri: '#F1F5F9',
    textSec: '#94A3B8',
    textMuted: '#64748B',
    white: '#FFFFFF',
};

function MetaRow({ icon, label, value }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}) {
    return (
        <View style={rows.row}>
            <View style={rows.iconBox}>
                <Ionicons name={icon} size={16} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={rows.label}>{label}</Text>
                <Text style={rows.value}>{value}</Text>
            </View>
        </View>
    );
}

export default function ImageDetailScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { data } = useLocalSearchParams<{ data: string }>();

    let photo: GeoPhotoRecord | null = null;
    try { photo = JSON.parse(data ?? ''); } catch { /* invalid */ }

    if (!photo) {
        return (
            <View style={[styles.center, { paddingTop: insets.top }]}>
                <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
                <Text style={styles.notFoundText}>Record not found.</Text>
            </View>
        );
    }

    const capturedDate = photo.captured_at
        ? new Date(photo.captured_at).toLocaleString()
        : new Date(photo.created_at).toLocaleString();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.bg} />

            {/* Back button */}
            <TouchableOpacity
                style={[styles.backBtn, { top: insets.top + 8 }]}
                onPress={() => router.back()}
                activeOpacity={0.8}
            >
                <Ionicons name="chevron-back" size={22} color={C.white} />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Full-width image */}
                <View style={styles.imageWrap}>
                    <Image
                        source={{ uri: photo.image_data ? `data:image/jpeg;base64,${photo.image_data}` : photo.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {/* Location watermark */}
                    <View style={styles.watermark}>
                        <Ionicons name="location" size={12} color={C.white} />
                        <Text style={styles.watermarkText} numberOfLines={1}>
                            {photo.address ?? 'Unknown location'}
                        </Text>
                    </View>
                </View>

                {/* Metadata card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Photo Metadata</Text>

                    <MetaRow
                        icon="time-outline"
                        label="Captured At"
                        value={capturedDate}
                    />
                    <MetaRow
                        icon="location-outline"
                        label="Address"
                        value={photo.address ?? '—'}
                    />
                    {photo.latitude != null && photo.longitude != null && (
                        <MetaRow
                            icon="navigate-outline"
                            label="Coordinates"
                            value={`${photo.latitude.toFixed(8)}, ${photo.longitude.toFixed(8)}`}
                        />
                    )}
                    {photo.altitude != null && (
                        <MetaRow
                            icon="trending-up-outline"
                            label="Altitude"
                            value={`${photo.altitude.toFixed(2)} m`}
                        />
                    )}
                    {photo.accuracy != null && (
                        <MetaRow
                            icon="radio-button-on-outline"
                            label="GPS Accuracy"
                            value={`±${photo.accuracy.toFixed(0)} m`}
                        />
                    )}
                    {(photo.width != null && photo.height != null) && (
                        <MetaRow
                            icon="resize-outline"
                            label="Resolution"
                            value={`${photo.width} × ${photo.height}`}
                        />
                    )}

                    <View style={styles.divider} />

                    {/* Map link (opens in browser via coordinates) */}
                    {photo.latitude != null && (
                        <View style={styles.mapRow}>
                            <Ionicons name="map-outline" size={14} color={C.textMuted} />
                            <Text style={styles.mapText}>
                                {photo.latitude.toFixed(6)}, {photo.longitude?.toFixed(6)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.idRow}>
                        <Ionicons name="key-outline" size={12} color={C.textMuted} />
                        <Text style={styles.idText}>{photo.id}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { marginTop: 12, fontSize: 16, color: C.textSec },
    backBtn: {
        position: 'absolute', left: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center',
    },
    imageWrap: { width: SCREEN_WIDTH, aspectRatio: 4 / 3, backgroundColor: C.surface, position: 'relative' },
    image: { width: '100%', height: '100%' },
    watermark: {
        position: 'absolute', bottom: 12, left: 12, right: 12,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    },
    watermarkText: { color: C.white, fontSize: 11, fontWeight: '500', marginLeft: 4, flexShrink: 1 },
    card: {
        margin: 16, backgroundColor: C.surface, borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: C.border,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPri, marginBottom: 16 },
    divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
    mapRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    mapText: { fontSize: 12, color: C.textMuted, fontFamily: 'monospace' },
    idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    idText: { fontSize: 11, color: C.textMuted, fontFamily: 'monospace', flexShrink: 1 },
});

const rows = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
    iconBox: {
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: 'rgba(59,130,246,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    label: {
        fontSize: 10, color: C.textMuted, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2,
    },
    value: { fontSize: 13, color: C.textPri, fontWeight: '500', lineHeight: 18 },
});
