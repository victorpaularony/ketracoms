import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabaseClient';

const { width } = Dimensions.get('window');

const C = {
    bg: '#0F172A',
    surface: '#1E293B',
    primary: '#3B82F6',
    accent: '#10B981',
    textPri: '#F1F5F9',
    textSec: '#94A3B8',
    border: '#334155',
};

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [stats, setStats] = useState({ photos: 0, feedback: 0 });

    useEffect(() => {
        async function fetchStats() {
            const [{ count: pCount }, { count: fCount }] = await Promise.all([
                supabase.from('geo_photos').select('*', { count: 'exact', head: true }),
                supabase.from('feedback_forms').select('*', { count: 'exact', head: true }),
            ]);
            setStats({ photos: pCount || 0, feedback: fCount || 0 });
        }
        fetchStats();
    }, []);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Admin Panel</Text>
                <Text style={styles.subtitle}>Welcome back, administrator</Text>
            </View>

            <View style={styles.statsRow}>
                <StatCard
                    label="Total Reports"
                    value={stats.photos}
                    icon="images"
                    color={C.primary}
                />
                <StatCard
                    label="Feedback"
                    value={stats.feedback}
                    icon="chatbubbles"
                    color={C.accent}
                />
            </View>

            <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>Main Menu</Text>

                <MenuButton
                    title="Images Report"
                    desc="View and manage all geo-tagged reports with multi-view support."
                    icon="images-outline"
                    color={C.primary}
                    count={stats.photos}
                    onPress={() => router.push('/reports')}
                />

                <MenuButton
                    title="Feedback Center"
                    desc="Review user suggestions and contact details from the field."
                    icon="chatbubble-ellipses-outline"
                    color={C.accent}
                    count={stats.feedback}
                    onPress={() => router.push('/feedback')}
                />
            </View>
        </ScrollView>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function MenuButton({ title, desc, icon, color, count, onPress }: any) {
    return (
        <TouchableOpacity style={styles.menuBtn} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIconWrap, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={28} color={color} />
            </View>
            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuDesc}>{desc}</Text>
            </View>
            <View style={styles.menuBadge}>
                <Text style={[styles.menuBadgeText, { color }]}>{count}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.textSec} style={{ marginLeft: 4 }} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 24, marginBottom: 32 },
    title: { fontSize: 32, fontWeight: '800', color: C.textPri, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: C.textSec, marginTop: 4 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 40 },
    statCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: C.border,
    },
    statIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statValue: { fontSize: 24, fontWeight: '700', color: C.textPri, marginBottom: 2 },
    statLabel: { fontSize: 13, color: C.textSec, fontWeight: '500' },
    menuSection: { paddingHorizontal: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginBottom: 20, marginLeft: 4 },
    menuBtn: {
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.border,
    },
    menuIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    menuContent: { flex: 1, marginLeft: 16, marginRight: 8 },
    menuTitle: { fontSize: 18, fontWeight: '700', color: C.textPri, marginBottom: 4 },
    menuDesc: { fontSize: 13, color: C.textSec, lineHeight: 18 },
    menuBadge: { flexDirection: 'row', alignItems: 'center' },
    menuBadgeText: { fontSize: 15, fontWeight: '700' },
});
