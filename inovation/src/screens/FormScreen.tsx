import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';
import { sendFeedbackEmail } from '../services/emailService';
import { uploadFeedback } from '../services/supabaseService';

export default function FormScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [contact, setContact] = useState('');
  const [county, setCounty] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!contact || !county || !message) {
      Alert.alert('Incomplete Form', 'Please fill in all fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData = {
        contact,
        county,
        message,
        submittedAt: new Date(),
      };

      // Run email and database upload in parallel
      const [emailRes, uploadRes] = await Promise.allSettled([
        sendFeedbackEmail(feedbackData),
        uploadFeedback(feedbackData)
      ]);

      const emailOk = emailRes.status === 'fulfilled' && emailRes.value.success;
      const uploadOk = uploadRes.status === 'fulfilled' && uploadRes.value.success;

      if (emailOk || uploadOk) {
        Alert.alert(
          'Success!',
          'Your feedback has been submitted successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const errorMsg = emailRes.status === 'rejected'
          ? (emailRes.reason as Error).message
          : 'Failed to send feedback. Please try again.';
        Alert.alert('Submission Failed', errorMsg);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Feedback Form</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Detail (Phone/Email)</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0712345678 or name@mail.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={contact}
                  onChangeText={setContact}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>County</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your county"
                  placeholderTextColor={COLORS.textMuted}
                  value={county}
                  onChangeText={setCounty}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your feedback here..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnTxt}>Submit Feedback</Text>
                  <Ionicons name="send" size={18} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 52,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 140,
    height: 'auto',
  },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledBtn: {
    backgroundColor: COLORS.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnTxt: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
});
