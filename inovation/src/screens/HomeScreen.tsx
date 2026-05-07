import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Main Menu</Text>
                <Text style={styles.subtitle}>Select an option below to proceed</Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('ReportMessage')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconWrap, { backgroundColor: COLORS.primaryLight }]}>
                        <Ionicons name="camera" size={32} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Report</Text>
                        <Text style={styles.cardDesc}>Capture and submit a geo-tagged report</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Feedback')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconWrap, { backgroundColor: '#D1FAE5' }]}>
                        <Ionicons name="document-text" size={32} color="#059669" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Feedback Form</Text>
                        <Text style={styles.cardDesc}>Share your thoughts and suggestions</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Inovation App v1.1.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 48,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 8,
        lineHeight: 22,
    },
    buttonContainer: {
        gap: 20,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    iconWrap: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    cardDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});
