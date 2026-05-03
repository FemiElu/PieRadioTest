import React, { useState } from 'react';
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
    Linking,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
    const { signUpWithEmail, signInWithGoogle, isLoading } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const validateForm = (): boolean => {
        if (!fullName.trim()) {
            setError('Please enter your full name');
            return false;
        }
        if (!email.trim()) {
            setError('Please enter your email');
            return false;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        setError('');
        try {
            await signUpWithEmail(email, password, fullName);
            // After signup, user needs to verify email
            // Auth context shows Alert with instructions
        } catch (err) {
            // Error is handled in auth context with Alert
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        try {
            await signInWithGoogle();
            router.replace('/(tabs)');
        } catch (err) {
            // Error is handled in auth context with Alert
        }
    };

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
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the Pie Radio community</Text>
                </View>

                {/* Error Message */}
                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#71717a" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#71717a"
                        autoCapitalize="words"
                        autoCorrect={false}
                        value={fullName}
                        onChangeText={setFullName}
                        editable={!isLoading}
                    />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#71717a" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor="#71717a"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                        editable={!isLoading}
                    />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#71717a" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password (min 6 characters)"
                        placeholderTextColor="#71717a"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
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
                        editable={!isLoading}
                    />
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSignup}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Create Account</Text>
                    )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Google Sign Up */}
                <TouchableOpacity
                    style={[styles.socialButton, isLoading && styles.buttonDisabled]}
                    onPress={handleGoogleSignup}
                    disabled={isLoading}
                >
                    <Ionicons name="logo-google" size={20} color="#ffffff" />
                    <Text style={styles.socialButtonText}>Sign up with Google</Text>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.termsText}>
                    By creating an account, you agree to our{' '}
                    <Text
                        style={styles.termsLink}
                        onPress={() => Linking.openURL('https://www.pieradio.co.uk/privacy')}
                        accessibilityRole="link"
                        accessibilityLabel="Terms of Service"
                    >
                        Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text
                        style={styles.termsLink}
                        onPress={() => Linking.openURL('https://www.pieradio.co.uk/privacy')}
                        accessibilityRole="link"
                        accessibilityLabel="Privacy Policy"
                    >
                        Privacy Policy
                    </Text>
                </Text>

                {/* Sign In Link */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Link href="/auth/login" asChild>
                        <TouchableOpacity disabled={isLoading}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f5f8',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    backButton: {
        marginBottom: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#141827',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#5d6476',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#141827',
    },
    passwordToggle: {
        paddingRight: 16,
    },
    primaryButton: {
        backgroundColor: '#dc2626',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        color: '#5d6476',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 12,
    },
    socialButtonText: {
        color: '#141827',
        fontSize: 16,
        fontWeight: '700',
    },
    termsText: {
        color: '#5d6476',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
    },
    termsLink: {
        color: '#dc2626',
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#5d6476',
        fontSize: 14,
        fontWeight: '500',
    },
    footerLink: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '700',
    },
});
