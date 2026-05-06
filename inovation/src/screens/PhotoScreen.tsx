import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ADMIN_EMAIL, COLORS } from '../config/constants';
import { sendGeoPhotoEmail } from '../services/emailService';
import { uploadGeoPhoto } from '../services/supabaseService';
import type { GeoPhoto } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!place) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const parts = [place.name, place.street, place.city, place.region, place.country].filter(Boolean);
    return parts.join(', ');
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

function formatCoord(value: number, decimals = 6): string {
  return value.toFixed(decimals);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PhotoScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(false);
  const [mediaPermission, setMediaPermission] = useState(false);

  const [facing, setFacing] = useState<CameraType>('back');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(true);

  const [capturedPhoto, setCapturedPhoto] = useState<GeoPhoto | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'uploading' | 'sending'>('idle');

  // ── Request permissions on mount ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { status: loc } = await Location.requestForegroundPermissionsAsync();
      const { status: media } = await MediaLibrary.requestPermissionsAsync();
      setLocationPermission(loc === 'granted');
      setMediaPermission(media === 'granted');
    })();
  }, []);

  // ── Real-time GPS watcher ─────────────────────────────────────────────────
  useEffect(() => {
    if (!locationPermission) return;
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      setIsLocating(true);
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 4000,
          distanceInterval: 5,
        },
        async (loc) => {
          setLocation(loc);
          setIsLocating(false);
          reverseGeocode(loc.coords.latitude, loc.coords.longitude).then(setAddress);
        },
      );
    })();

    return () => { sub?.remove(); };
  }, [locationPermission]);

  // ── Capture photo ─────────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    if (!location) {
      Alert.alert('No GPS fix', 'Please wait for GPS to acquire your position before shooting.');
      return;
    }
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        exif: true,
        skipProcessing: false,
      });
      if (!photo) throw new Error('Camera returned no image.');
      setCapturedPhoto({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        exif: photo.exif as Record<string, unknown> | undefined,
        capturedAt: new Date(),
        location,
        address,
      });
    } catch (err: unknown) {
      Alert.alert('Capture error', (err as Error).message);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, location, address]);

  // ── Submit: save to gallery → then upload to Supabase AND email in parallel ──
  const handleSubmit = useCallback(async () => {
    if (!capturedPhoto || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Step 1 — save to device gallery
      setSubmitStatus('saving');
      if (mediaPermission) {
        await MediaLibrary.createAssetAsync(capturedPhoto.uri);
      }

      // Step 2 — run Supabase upload AND email send simultaneously
      setSubmitStatus('uploading');
      const [uploadOutcome, emailOutcome] = await Promise.allSettled([
        uploadGeoPhoto(capturedPhoto),
        sendGeoPhotoEmail(capturedPhoto),
      ]);

      const uploadOk = uploadOutcome.status === 'fulfilled' && uploadOutcome.value.success;
      const emailOk = emailOutcome.status === 'fulfilled' && emailOutcome.value.success;

      const uploadMsg = uploadOk
        ? 'Saved to cloud database ✓'
        : uploadOutcome.status === 'rejected'
          ? `Cloud error: ${(uploadOutcome.reason as Error).message}`
          : `Cloud failed: ${(uploadOutcome as PromiseFulfilledResult<{ success: boolean; message: string }>).value.message}`;

      const emailMsg = emailOk
        ? `Emailed to ${ADMIN_EMAIL} ✓`
        : emailOutcome.status === 'rejected'
          ? `Email error: ${(emailOutcome.reason as Error).message}`
          : `Email failed: ${(emailOutcome as PromiseFulfilledResult<{ success: boolean; message: string }>).value.message}`;

      Alert.alert(
        uploadOk || emailOk ? 'Submitted!' : 'Submission Failed',
        `${uploadMsg}\n${emailMsg}`,
        [{ text: 'OK', onPress: () => setCapturedPhoto(null) }],
      );
    } catch (err: unknown) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('idle');
    }
  }, [capturedPhoto, isSubmitting, mediaPermission]);

  // ── Permission gate ───────────────────────────────────────────────────────
  if (!cameraPermission) return <PermissionLoading />;

  const allGranted = cameraPermission.granted && locationPermission && mediaPermission;
  if (!allGranted) {
    return (
      <PermissionRequest
        camera={cameraPermission.granted}
        location={locationPermission}
        media={mediaPermission}
        onRequest={async () => {
          await requestCameraPermission();
          const { status: l } = await Location.requestForegroundPermissionsAsync();
          const { status: m } = await MediaLibrary.requestPermissionsAsync();
          setLocationPermission(l === 'granted');
          setMediaPermission(m === 'granted');
        }}
      />
    );
  }

  // ── Preview mode ──────────────────────────────────────────────────────────
  if (capturedPhoto) {
    return (
      <PhotoPreview
        photo={capturedPhoto}
        isSubmitting={isSubmitting}
        submitStatus={submitStatus}
        onRetake={() => setCapturedPhoto(null)}
        onSubmit={handleSubmit}
        insets={insets}
      />
    );
  }

  // ── Camera mode ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Location overlay badge */}
        <View style={[styles.locationBadge, { top: insets.top + 12 }]}>
          <Ionicons name="location" size={13} color={COLORS.white} style={{ marginRight: 4 }} />
          {isLocating ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.locationBadgeText}> Acquiring GPS…</Text>
            </View>
          ) : (
            <Text style={styles.locationBadgeText} numberOfLines={2}>
              {address || 'Location unavailable'}
            </Text>
          )}
        </View>

        {/* Camera controls */}
        <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shutterOuter, isCapturing && styles.disabled]}
            onPress={handleCapture}
            disabled={isCapturing}
            activeOpacity={0.8}
          >
            {isCapturing
              ? <ActivityIndicator size="large" color={COLORS.primary} />
              : <View style={styles.shutterInner} />}
          </TouchableOpacity>

          {/* Balancing spacer */}
          <View style={styles.iconBtn} />
        </View>
      </CameraView>

      {/* Live location panel beneath camera */}
      <View style={styles.livePanel}>
        <View style={styles.livePanelHeader}>
          <Ionicons name="navigate-circle" size={18} color={COLORS.primary} />
          <Text style={styles.livePanelTitle}>Live Location</Text>
          {!isLocating && <View style={styles.liveDot} />}
        </View>

        {isLocating ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.mutedText}>  Getting your position…</Text>
          </View>
        ) : location ? (
          <>
            <Text style={styles.addressText}>{address}</Text>
            <View style={styles.chipsRow}>
              <CoordChip label="LAT" value={formatCoord(location.coords.latitude)} />
              <CoordChip label="LNG" value={formatCoord(location.coords.longitude)} />
              {location.coords.altitude != null && (
                <CoordChip label="ALT" value={`${location.coords.altitude.toFixed(1)}m`} />
              )}
            </View>
            {location.coords.accuracy != null && (
              <Text style={styles.accuracyText}>Accuracy: ±{location.coords.accuracy.toFixed(0)} m</Text>
            )}
          </>
        ) : (
          <Text style={styles.mutedText}>Location unavailable</Text>
        )}
      </View>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function CoordChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.label}>{label}</Text>
      <Text style={chipStyles.value}>{value}</Text>
    </View>
  );
}

function PhotoPreview({
  photo,
  isSubmitting,
  submitStatus,
  onRetake,
  onSubmit,
  insets,
}: {
  photo: GeoPhoto;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'saving' | 'uploading' | 'sending';
  onRetake: () => void;
  onSubmit: () => void;
  insets: { top: number; bottom: number };
}) {
  const submitLabel =
    submitStatus === 'saving' ? 'Saving to gallery…' :
      submitStatus === 'uploading' ? 'Uploading to cloud…' :
        submitStatus === 'sending' ? 'Sending email…' :
          'Submit';

  return (
    <ScrollView
      style={preview.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo with location watermark */}
      <View style={preview.imgWrap}>
        <Image source={{ uri: photo.uri }} style={preview.img} resizeMode="cover" />
        <View style={preview.watermark}>
          <Ionicons name="location" size={12} color={COLORS.white} />
          <Text style={preview.watermarkText} numberOfLines={1}>{photo.address}</Text>
        </View>
      </View>

      {/* Metadata card */}
      <View style={preview.card}>
        <Text style={preview.cardTitle}>Photo Metadata</Text>
        <MetaRow icon="time-outline" label="Captured At" value={photo.capturedAt.toLocaleString()} />
        <MetaRow icon="location-outline" label="Address" value={photo.address || '—'} />
        <MetaRow
          icon="navigate-outline"
          label="Coordinates"
          value={`${formatCoord(photo.location.coords.latitude)}, ${formatCoord(photo.location.coords.longitude)}`}
        />
        {photo.location.coords.altitude != null && (
          <MetaRow icon="trending-up-outline" label="Altitude" value={`${photo.location.coords.altitude.toFixed(2)} m`} />
        )}
        {photo.location.coords.accuracy != null && (
          <MetaRow icon="radio-button-on-outline" label="GPS Accuracy" value={`±${photo.location.coords.accuracy.toFixed(0)} m`} />
        )}
        <View style={preview.divider} />
        <View style={preview.emailRow}>
          <Ionicons name="mail-outline" size={14} color={COLORS.textSecondary} />
          <Text style={preview.emailText}>Will be sent to: {ADMIN_EMAIL}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={preview.actions}>
        <TouchableOpacity
          style={preview.retakeBtn}
          onPress={onRetake}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
          <Text style={preview.retakeTxt}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[preview.submitBtn, isSubmitting && preview.disabledBtn]}
          onPress={onSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <View style={preview.submitRow}>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={preview.submitTxt}>{submitLabel}</Text>
            </View>
          ) : (
            <View style={preview.submitRow}>
              <Ionicons name="send" size={18} color={COLORS.white} />
              <Text style={preview.submitTxt}>Submit</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={metaRow.row}>
      <View style={metaRow.iconWrap}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={metaRow.content}>
        <Text style={metaRow.label}>{label}</Text>
        <Text style={metaRow.value}>{value}</Text>
      </View>
    </View>
  );
}

function PermissionLoading() {
  return (
    <View style={perm.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={perm.text}>Checking permissions…</Text>
    </View>
  );
}

function PermissionRequest({
  camera, location, media, onRequest,
}: {
  camera: boolean; location: boolean; media: boolean; onRequest: () => void;
}) {
  return (
    <View style={perm.container}>
      <Ionicons name="shield-checkmark-outline" size={56} color={COLORS.primary} />
      <Text style={perm.title}>Permissions Required</Text>
      <Text style={perm.subtitle}>
        This app needs camera, location, and photo-library access.
      </Text>
      <View style={perm.list}>
        <PermItem label="Camera" granted={camera} />
        <PermItem label="Location" granted={location} />
        <PermItem label="Photo Library" granted={media} />
      </View>
      <TouchableOpacity style={perm.btn} onPress={onRequest} activeOpacity={0.85}>
        <Text style={perm.btnTxt}>Grant Permissions</Text>
      </TouchableOpacity>
    </View>
  );
}

function PermItem({ label, granted }: { label: string; granted: boolean }) {
  return (
    <View style={perm.item}>
      <Ionicons
        name={granted ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={granted ? COLORS.accent : COLORS.danger}
      />
      <Text style={perm.itemTxt}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  camera: { flex: 1, minHeight: SCREEN_WIDTH * 1.15 },
  row: { flexDirection: 'row', alignItems: 'center' },
  locationBadge: {
    position: 'absolute', left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  locationBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '500', flexShrink: 1 },
  cameraControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 40, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
  },
  shutterInner: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 2.5, borderColor: COLORS.primary, backgroundColor: COLORS.white,
  },
  disabled: { opacity: 0.55 },
  livePanel: {
    backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  livePanelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  livePanelTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.textPrimary,
    marginLeft: 6, letterSpacing: 0.3, flex: 1,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  addressText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  accuracyText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  mutedText: { fontSize: 13, color: COLORS.textSecondary },
});

const chipStyles = StyleSheet.create({
  chip: {
    backgroundColor: COLORS.primaryLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.primaryDark, letterSpacing: 0.5 },
  value: {
    fontSize: 11, color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

const preview = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  imgWrap: { width: '100%', aspectRatio: 3 / 4, backgroundColor: COLORS.black, position: 'relative' },
  img: { width: '100%', height: '100%' },
  watermark: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
  },
  watermarkText: { color: COLORS.white, fontSize: 11, fontWeight: '500', marginLeft: 4, flexShrink: 1 },
  card: {
    margin: 16, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emailText: { fontSize: 12, color: COLORS.textSecondary, flexShrink: 1 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  retakeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface,
  },
  retakeTxt: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  submitBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary,
  },
  disabledBtn: { opacity: 0.65 },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitTxt: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});

const metaRow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  content: { flex: 1 },
  label: {
    fontSize: 11, color: COLORS.textMuted, fontWeight: '600',
    letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2,
  },
  value: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', lineHeight: 18 },
});

const perm = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.background },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  list: { width: '100%', marginBottom: 32, gap: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  itemTxt: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  btnTxt: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  text: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
});
