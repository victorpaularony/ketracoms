import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';
import { SUPABASE_BUCKET } from '../config/constants';
import type { GeoPhoto } from '../types';

export interface UploadResult {
    success: boolean;
    message: string;
    imageUrl?: string;
}

/**
 * Reads the photo as base64, uploads the file to Supabase Storage,
 * and inserts metadata + base64 image data into the `geo_photos` table.
 * The admin app reads `image_data` (base64) to render actual images.
 */
export async function uploadGeoPhoto(photo: GeoPhoto): Promise<UploadResult> {
    try {
        // ── 1. Read the image as base64 ───────────────────────────────────────
        const base64Data = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // ── 2. Upload binary to Supabase Storage ──────────────────────────────
        const fileName = `photo_${Date.now()}.jpg`;
        const storagePath = `uploads/${fileName}`;

        // Convert base64 → Uint8Array for the storage upload
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        const { error: uploadError } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(storagePath, bytes, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (uploadError) {
            // Storage failed — still insert with base64 only so admin can display
            console.warn('[supabaseService] Storage upload failed, saving base64 only:', uploadError.message);
        }

        // ── 3. Get public URL (may be empty string if upload failed) ──────────
        const { data: publicUrlData } = supabase.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(storagePath);
        const imageUrl = uploadError ? '' : (publicUrlData?.publicUrl ?? '');

        // ── 4. Insert metadata + base64 into geo_photos ───────────────────────
        const { error: insertError } = await supabase.from('geo_photos').insert({
            image_url: imageUrl,
            image_data: base64Data,          // base64 JPEG — admin renders from this
            storage_path: storagePath,
            latitude: photo.location.coords.latitude,
            longitude: photo.location.coords.longitude,
            altitude: photo.location.coords.altitude ?? null,
            accuracy: photo.location.coords.accuracy ?? null,
            address: photo.address || null,
            captured_at: photo.capturedAt.toISOString(),
            width: photo.width,
            height: photo.height,
        });

        if (insertError) {
            return { success: false, message: `DB insert failed: ${insertError.message}` };
        }

        return { success: true, message: 'Uploaded to Supabase successfully.', imageUrl };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, message: msg };
    }
}
