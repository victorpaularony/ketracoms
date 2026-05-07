import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';

export default function ReportMessageScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [message, setMessage] = useState('');

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>Report Detail</Text>
                            <Text style={styles.subtitle}>Step 1 of 3</Text>
                        </View>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                            <Text style={styles.infoText}>Please provide a brief description of the issue you are reporting.</Text>
                        </View>

                        <Text style={styles.label}>Message / Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter details about your report here..."
                            placeholderTextColor={COLORS.textMuted}
                            multiline
                            numberOfLines={8}
                            textAlignVertical="top"
                            value={message}
                            onChangeText={setMessage}
                        />

                        <TouchableOpacity
                            style={[styles.nextBtn, !message.trim() && styles.disabledBtn]}
                            onPress={() => navigation.navigate('Photo', { reportMessage: message })}
                            disabled={!message.trim()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.nextBtnTxt}>Next: Capture Photo</Text>
                            <Ionicons name="camera-outline" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        gap: 16,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.primaryLight,
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.primaryDark,
        lineHeight: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
        marginLeft: 4,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 180,
        textAlignVertical: 'top',
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    nextBtn: {
        marginTop: 32,
        backgroundColor: COLORS.primary,
        borderRadius: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    disabledBtn: {
        backgroundColor: COLORS.textMuted,
        shadowOpacity: 0,
        elevation: 0,
    },
    nextBtnTxt: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    }
});
