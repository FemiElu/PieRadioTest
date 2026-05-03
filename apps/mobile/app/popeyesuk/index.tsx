import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Linking,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

// Popeyes brand colours
const POPEYES_ORANGE = '#F96D00';
const DEEP_TEXT = '#141827';

interface WaitlistEntry {
    fullName: string;
    email: string;
}

export default function PopeyesUkScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [agreeToMarketing, setAgreeToMarketing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);

    const validateEmail = (e: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

    const handleSubmit = async () => {
        setFormError('');

        if (!fullName.trim() || fullName.trim().length < 2) {
            setFormError('Please enter your full name.');
            return;
        }
        if (!validateEmail(email)) {
            setFormError('Please enter a valid email address.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('popeyes_waitlist' as any)
                .insert({
                    full_name: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    marketing_consent: agreeToMarketing,
                    source: 'mobile_app',
                });

            if (error) {
                // Duplicate email — treat gracefully
                if (error.code === '23505') {
                    setFormSuccess(true);
                    return;
                }
                throw error;
            }

            setFormSuccess(true);
        } catch (err: any) {
            setFormError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: '',
                    headerStyle: { backgroundColor: DEEP_TEXT },
                    headerTintColor: '#ffffff',
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.headerBack}
                            accessibilityLabel="Go back"
                            accessibilityRole="button"
                        >
                            <Ionicons name="arrow-back" size={22} color="#ffffff" />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Hero ───────────────────────────────────── */}
                <View style={styles.hero}>
                    <Image
                        source={require('../../assets/popeye-3.jpeg')}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                    />
                    {/* Gradient overlay */}
                    <View style={styles.heroOverlay} />

                    {/* Logos */}
                    <View style={styles.logosRow}>
                        <View style={styles.logoBox}>
                            <Ionicons name="radio" size={22} color="#ffffff" />
                            <Text style={styles.logoText}>PIE RADIO</Text>
                        </View>
                        <Text style={styles.logoSeparator}>×</Text>
                        <View style={styles.popeyesTag}>
                            <Text style={styles.popeyesTagText}>POPEYES® UK</Text>
                        </View>
                    </View>

                    {/* Headline */}
                    <View style={styles.heroContent}>
                        <Text style={styles.heroHeadline}>
                            Turning Up the Flavor.{'\n'}
                            <Text style={{ color: POPEYES_ORANGE }}>Turning Up the Volume.</Text>
                        </Text>
                        <Text style={styles.heroSub}>
                            Pie Radio x Popeyes® UK — live music, culture & community at upcoming store openings.
                        </Text>
                    </View>
                </View>

                {/* ── Partnership info ───────────────────────── */}
                <View style={styles.section}>
                    {/* Badge */}
                    <View style={styles.sectionBadge}>
                        <Ionicons name="sparkles" size={12} color={POPEYES_ORANGE} />
                        <Text style={styles.sectionBadgeText}>The Partnership</Text>
                    </View>

                    <Text style={styles.h2}>The Source Radio Show</Text>
                    <Text style={[styles.h3, { color: POPEYES_ORANGE }]}>
                        Powered by Popeyes® UK
                    </Text>

                    <Text style={styles.body}>
                        A brand-new weekly show exploring the sounds, culture and influence of New Orleans — and its connection to Manchester.
                    </Text>

                    <View style={styles.tagRow}>
                        {['Tuesdays', '5 – 6PM', 'DJ G.A.S.K.I.N & ELISHA'].map((tag) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.body}>
                        Our DJs, presenters and special guests will be supplying the soundtrack — including the highly anticipated Wilmslow Road launch featuring Saoirse Marie and DJ G2.
                    </Text>
                    <Text style={[styles.body, { marginTop: 4 }]}>
                        Expect guest DJs, cultural deep dives, and weekly giveaways 🎶🍗
                    </Text>
                </View>

                {/* ── Event info cards ───────────────────────── */}
                <View style={[styles.section, { backgroundColor: '#f8f6f2' }]}>
                    <View style={styles.sectionBadge}>
                        <Ionicons name="star" size={12} color={POPEYES_ORANGE} />
                        <Text style={styles.sectionBadgeText}>Exclusive Event</Text>
                    </View>

                    <Text style={[styles.h2, { fontStyle: 'italic', textTransform: 'uppercase' }]}>
                        Feel The <Text style={{ color: POPEYES_ORANGE }}>Heat</Text>
                    </Text>
                    <Text style={[styles.h3, { color: POPEYES_ORANGE, marginBottom: 20 }]}>
                        PIE Radio x Popeyes® · Exclusive Live Event
                    </Text>

                    {/* Event Flyer */}
                    <View style={styles.flyerContainer}>
                        <Image
                            source={require('../../assets/popeye-3.jpeg')}
                            style={styles.flyer}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Info grid */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <Ionicons name="location" size={18} color={POPEYES_ORANGE} style={{ marginBottom: 6 }} />
                            <Text style={styles.infoLabel}>Venue</Text>
                            <Text style={styles.infoValue}>CUPRA City Garage{'\n'}Manchester, M2 7LG</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Ionicons name="calendar" size={18} color={POPEYES_ORANGE} style={{ marginBottom: 6 }} />
                            <Text style={styles.infoLabel}>Date & Time</Text>
                            <Text style={styles.infoValue}>Friday 22nd May{'\n'}7PM – 11:30PM</Text>
                        </View>
                        <View style={[styles.infoCard, { flex: 0, width: '100%' }]}>
                            <Ionicons name="ticket" size={18} color={POPEYES_ORANGE} style={{ marginBottom: 6 }} />
                            <Text style={styles.infoLabel}>Entry</Text>
                            <Text style={styles.infoValue}>Free Entry (Exclusive Guest List)</Text>
                        </View>
                    </View>
                </View>

                {/* ── Waitlist Form ─────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionBadge}>
                        <Ionicons name="people" size={12} color={POPEYES_ORANGE} />
                        <Text style={styles.sectionBadgeText}>Join the Waitlist</Text>
                    </View>
                    <Text style={styles.h2}>Secure Your Spot</Text>
                    <Text style={styles.body}>
                        Capacity is limited — sign up now to be first in line for event updates.
                    </Text>

                    {formSuccess ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successEmoji}>🎉</Text>
                            <Text style={styles.successTitle}>You&apos;re in!</Text>
                            <Text style={styles.successSub}>
                                We&apos;ll send event updates to {email || fullName}.{'\n'}
                                Stay hungry. Stay vibing.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            {/* Full name */}
                            <Text style={styles.label}>
                                Full name <Text style={{ color: '#dc2626' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, formError && !fullName ? styles.inputError : null]}
                                placeholder="Joe Doe"
                                placeholderTextColor="#a1a1aa"
                                autoCapitalize="words"
                                autoComplete="name"
                                value={fullName}
                                onChangeText={(t) => { setFullName(t); setFormError(''); }}
                                editable={!isSubmitting}
                                accessibilityLabel="Full name"
                            />

                            {/* Email */}
                            <Text style={styles.label}>
                                Email address <Text style={{ color: '#dc2626' }}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, formError && !validateEmail(email) ? styles.inputError : null]}
                                placeholder="you@example.com"
                                placeholderTextColor="#a1a1aa"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                value={email}
                                onChangeText={(t) => { setEmail(t); setFormError(''); }}
                                editable={!isSubmitting}
                                accessibilityLabel="Email address"
                            />

                            {/* Marketing consent */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setAgreeToMarketing(!agreeToMarketing)}
                                activeOpacity={0.7}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: agreeToMarketing }}
                            >
                                <View style={[styles.checkbox, agreeToMarketing && styles.checkboxChecked]}>
                                    {agreeToMarketing && (
                                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                    I agree to receive marketing emails, updates, and special offers from Popeyes® UK.
                                </Text>
                            </TouchableOpacity>

                            {/* Error */}
                            {!!formError && (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={14} color="#dc2626" />
                                    <Text style={styles.errorText}>{formError}</Text>
                                </View>
                            )}

                            {/* Submit */}
                            <TouchableOpacity
                                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                                accessibilityRole="button"
                                accessibilityLabel="Join the Waitlist"
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Join the Waitlist</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── Follow section ────────────────────────── */}
                <View style={[styles.section, { alignItems: 'center', paddingBottom: 40 }]}>
                    <Text style={styles.followTitle}>Stay Connected</Text>
                    <Text style={styles.followSub}>Follow the vibe</Text>
                    <View style={styles.socialRow}>
                        {[
                            { name: 'logo-instagram' as const, url: 'https://www.instagram.com/popeyesuk/', label: 'Instagram' },
                            { name: 'logo-twitter' as const, url: 'https://twitter.com/popeyesuk', label: 'Twitter / X' },
                            { name: 'logo-facebook' as const, url: 'https://www.facebook.com/popeyesuk', label: 'Facebook' },
                        ].map((s) => (
                            <TouchableOpacity
                                key={s.name}
                                style={styles.socialBtn}
                                onPress={() => Linking.openURL(s.url)}
                                accessibilityRole="link"
                                accessibilityLabel={`Follow Popeyes UK on ${s.label}`}
                            >
                                <Ionicons name={s.name} size={22} color={DEEP_TEXT} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    headerBack: { paddingLeft: 4 },

    /* Hero */
    hero: {
        height: 400,
        position: 'relative',
        justifyContent: 'flex-end',
        backgroundColor: DEEP_TEXT,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(20,24,39,0.65)',
    },
    logosRow: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    logoText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
    logoSeparator: { color: 'rgba(255,255,255,0.5)', fontSize: 22, fontWeight: '700' },
    popeyesTag: {
        backgroundColor: POPEYES_ORANGE,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    popeyesTagText: { color: '#ffffff', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
    heroContent: { padding: 20, gap: 10 },
    heroHeadline: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '900',
        lineHeight: 36,
        letterSpacing: -0.5,
    },
    heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, fontWeight: '500' },

    /* Section */
    section: {
        paddingHorizontal: 20,
        paddingVertical: 28,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sectionBadgeText: {
        color: POPEYES_ORANGE,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },

    /* Typography */
    h2: { fontSize: 28, fontWeight: '900', color: DEEP_TEXT, letterSpacing: -0.5, marginBottom: 4 },
    h3: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    body: { color: '#52525b', fontSize: 15, lineHeight: 24, fontWeight: '500' },

    /* Tags */
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
    tag: { backgroundColor: DEEP_TEXT, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
    tagText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

    /* Flyer */
    flyerContainer: {
        width: '100%',
        aspectRatio: 4 / 5,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#f4f4f5',
    },
    flyer: { width: '100%', height: '100%' },

    /* Info grid */
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    infoCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    infoLabel: { fontSize: 9, fontWeight: '800', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    infoValue: { fontSize: 13, fontWeight: '800', color: DEEP_TEXT, lineHeight: 18 },

    /* Form */
    form: { gap: 4 },
    label: { fontSize: 14, fontWeight: '600', color: DEEP_TEXT, marginBottom: 6, marginTop: 12 },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: DEEP_TEXT,
    },
    inputError: { borderColor: '#dc2626' },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 14,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    checkboxChecked: { backgroundColor: POPEYES_ORANGE, borderColor: POPEYES_ORANGE },
    checkboxLabel: { flex: 1, fontSize: 13, color: '#52525b', lineHeight: 18, fontWeight: '500' },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fee2e2',
        borderRadius: 10,
        padding: 12,
        marginTop: 10,
    },
    errorText: { flex: 1, color: '#dc2626', fontSize: 13, fontWeight: '600' },
    submitBtn: {
        backgroundColor: POPEYES_ORANGE,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: POPEYES_ORANGE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },

    /* Success */
    successBox: {
        alignItems: 'center',
        backgroundColor: '#fff7ed',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fed7aa',
        padding: 32,
        marginTop: 8,
    },
    successEmoji: { fontSize: 48, marginBottom: 12 },
    successTitle: { fontSize: 22, fontWeight: '900', color: DEEP_TEXT, marginBottom: 8 },
    successSub: { fontSize: 14, color: '#52525b', textAlign: 'center', lineHeight: 22 },

    /* Follow */
    followTitle: { fontSize: 20, fontWeight: '900', color: DEEP_TEXT, marginBottom: 4 },
    followSub: { fontSize: 12, fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
    socialRow: { flexDirection: 'row', gap: 12 },
    socialBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
