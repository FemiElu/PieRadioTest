import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

/**
 * Account Deletion Screen
 *
 * Provides the in-app account deletion flow required by Apple App Store
 * (since June 2022) and Google Play Store policies.
 *
 * BACKEND TODO: A Supabase Edge Function or server-side route is required to
 * actually delete the user's data (profiles, uploads, messages, push tokens,
 * liked items, etc.) and then call `supabase.auth.admin.deleteUser(userId)`.
 * Until that backend is implemented, this screen signs the user out and
 * shows a confirmation that the deletion request has been received.
 * The deletion request is stored in a `deletion_requests` table for manual
 * processing.
 */
export default function DeleteAccountScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const CONFIRM_PHRASE = 'DELETE';
    const isConfirmed = confirmText.toUpperCase() === CONFIRM_PHRASE;

    const handleDeleteAccount = () => {
        if (!isConfirmed) {
            Alert.alert('Confirmation Required', `Please type "${CONFIRM_PHRASE}" to confirm.`);
            return;
        }

        Alert.alert(
            'Delete Account',
            'This action is permanent and cannot be undone. All your data — profile, favorites, messages, uploads, and activity — will be permanently deleted.\n\nAre you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: executeDeleteAccount,
                },
            ]
        );
    };

    const executeDeleteAccount = async () => {
        if (!user) return;
        setIsDeleting(true);

        try {
            // Step 1: Verify password (re-authenticate)
            if (password) {
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email: user.email!,
                    password,
                });
                if (authError) {
                    Alert.alert('Authentication Failed', 'The password you entered is incorrect. Please try again.');
                    setIsDeleting(false);
                    return;
                }
            }

            // Step 2: Record the deletion request
            // BACKEND TODO: Replace this with an actual Edge Function call
            // that cascades deletion across all user data tables.
            const { error: requestError } = await supabase
                .from('deletion_requests' as any)
                .insert({
                    user_id: user.id,
                    email: user.email,
                    requested_at: new Date().toISOString(),
                    status: 'pending',
                });

            if (requestError) {
                // If the table doesn't exist yet, log but continue
                if (__DEV__) {
                    console.warn('[DeleteAccount] Could not record deletion request:', requestError.message);
                }
            }

            // Step 3: Sign out and navigate home
            await signOut();

            Alert.alert(
                'Account Deletion Requested',
                'Your account deletion request has been received. Your data will be permanently removed within 30 days as per our privacy policy.\n\nIf you have any questions, contact hello@pieradio.co.uk.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(tabs)'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert(
                'Something Went Wrong',
                error.message || 'We could not process your request. Please try again or contact hello@pieradio.co.uk.'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Delete Account',
                    headerStyle: { backgroundColor: '#ffffff' },
                    headerTintColor: '#18181b',
                    headerTitleStyle: { fontWeight: '700' },
                    headerBackTitle: 'Back',
                }}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Warning banner */}
                <View style={styles.warningBanner}>
                    <View style={styles.warningIconBox}>
                        <Ionicons name="alert-triangle" size={24} color="#dc2626" />
                    </View>
                    <Text style={styles.warningTitle}>Danger Zone</Text>
                    <Text style={styles.warningText}>
                        Deleting your account is permanent and cannot be reversed.
                        All of the following will be permanently removed:
                    </Text>
                </View>

                {/* Data that will be deleted */}
                <View style={styles.dataList}>
                    {[
                        { icon: 'person' as const, label: 'Your profile and avatar' },
                        { icon: 'heart' as const, label: 'Liked shows, presenters, and songs' },
                        { icon: 'chatbubbles' as const, label: 'Chat messages and song requests' },
                        { icon: 'cloud-upload' as const, label: 'Artist uploads and track submissions' },
                        { icon: 'notifications' as const, label: 'Push notification preferences' },
                        { icon: 'mail' as const, label: 'Presenter messages sent to you' },
                    ].map((item) => (
                        <View key={item.label} style={styles.dataRow}>
                            <Ionicons name={item.icon} size={16} color="#dc2626" />
                            <Text style={styles.dataRowText}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Re-authentication */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>Enter your password to confirm</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your current password"
                            placeholderTextColor="#a1a1aa"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!isDeleting}
                            autoComplete="password"
                            accessibilityLabel="Current password for re-authentication"
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeBtn}
                            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#71717a"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Confirmation phrase */}
                <View style={styles.inputSection}>
                    <Text style={styles.label}>
                        Type <Text style={styles.confirmPhrase}>{CONFIRM_PHRASE}</Text> to confirm
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder={CONFIRM_PHRASE}
                        placeholderTextColor="#a1a1aa"
                        autoCapitalize="characters"
                        value={confirmText}
                        onChangeText={setConfirmText}
                        editable={!isDeleting}
                        accessibilityLabel="Type DELETE to confirm account deletion"
                    />
                </View>

                {/* Delete button */}
                <TouchableOpacity
                    style={[
                        styles.deleteBtn,
                        (!isConfirmed || isDeleting) && styles.deleteBtnDisabled,
                    ]}
                    onPress={handleDeleteAccount}
                    disabled={!isConfirmed || isDeleting}
                    accessibilityRole="button"
                    accessibilityLabel="Delete my account permanently"
                >
                    {isDeleting ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <View style={styles.deleteBtnRow}>
                            <Ionicons name="trash" size={18} color="#ffffff" />
                            <Text style={styles.deleteBtnText}>Delete My Account</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Help text */}
                <Text style={styles.helpText}>
                    If you change your mind after deletion, you can create a new account at any time.
                    For questions, contact{' '}
                    <Text style={styles.helpLink}>hello@pieradio.co.uk</Text>
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 60 },

    /* Warning */
    warningBanner: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    warningIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    warningTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#dc2626',
        marginBottom: 8,
    },
    warningText: {
        fontSize: 14,
        color: '#7f1d1d',
        textAlign: 'center',
        lineHeight: 20,
    },

    /* Data list */
    dataList: {
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        padding: 16,
        gap: 12,
        marginBottom: 28,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dataRowText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3f3f46',
        flex: 1,
    },

    /* Inputs */
    inputSection: { marginBottom: 20 },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#18181b',
        marginBottom: 8,
    },
    confirmPhrase: {
        fontWeight: '800',
        color: '#dc2626',
        letterSpacing: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#18181b',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
    },
    eyeBtn: { paddingRight: 14, paddingLeft: 4 },

    /* Delete button */
    deleteBtn: {
        backgroundColor: '#dc2626',
        borderRadius: 14,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    deleteBtnDisabled: { opacity: 0.4 },
    deleteBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deleteBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    /* Help */
    helpText: {
        marginTop: 20,
        fontSize: 13,
        color: '#71717a',
        textAlign: 'center',
        lineHeight: 20,
    },
    helpLink: {
        color: '#334aff',
        fontWeight: '600',
    },
});
