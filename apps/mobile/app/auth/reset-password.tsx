import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
    const { updatePassword, session, isLoading: authLoading } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        // Wait a bit for Supabase to process the recovery link
        const timer = setTimeout(() => {
            setIsCheckingSession(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleUpdate = async () => {
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        try {
            await updatePassword(password);
            setIsSuccess(true);
            setTimeout(() => {
                router.replace('/auth/login');
            }, 2000);
        } catch (err) {
            // Error is handled in auth context with Alert
        }
    };

    if (isCheckingSession) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.loadingText}>Verifying session...</Text>
            </View>
        );
    }

    if (!session && !isSuccess) {
        return (
            <View style={[styles.container, styles.centered, { padding: 24 }]}>
                <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
                <Text style={styles.title}>Invalid Session</Text>
                <Text style={styles.subtitle}>
                    Your password reset link may have expired or is invalid. Please request a new one.
                </Text>
                <TouchableOpacity
                    style={[styles.primaryButton, { width: '100%', marginTop: 24 }]}
                    onPress={() => router.replace('/auth/forgot-password')}
                >
                    <Text style={styles.primaryButtonText}>Request New Link</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={isSuccess ? "checkmark-circle-outline" : "key-outline"}
                            size={48}
                            color={isSuccess ? "#22c55e" : "#dc2626"}
                        />
                    </View>
                    <Text style={styles.title}>
                        {isSuccess ? "Password Updated" : "New Password"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isSuccess
                            ? "Your password has been changed successfully. You can now sign in with your new password."
                            : "Please enter your new password below. Make sure it's secure."
                        }
                    </Text>
                </View>

                {/* Error Message */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {!isSuccess ? (
                    <>
                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#71717a" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="New Password"
                                placeholderTextColor="#71717a"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                editable={!authLoading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.passwordToggle}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#71717a"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#71717a" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor="#71717a"
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!authLoading}
                            />
                        </View>

                        {/* Update Button */}
                        <TouchableOpacity
                            style={[styles.primaryButton, authLoading && styles.buttonDisabled]}
                            onPress={handleUpdate}
                            disabled={authLoading}
                        >
                            {authLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>Change Password</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/auth/login')}
                    >
                        <Text style={styles.primaryButtonText}>Sign In Now</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#71717a',
        marginTop: 16,
        fontSize: 16,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#71717a',
        textAlign: 'center',
        lineHeight: 24,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#450a0a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#27272a',
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#ffffff',
    },
    passwordToggle: {
        paddingRight: 16,
    },
    primaryButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});
