import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/auth-context';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) return null;

  return (
    <TouchableOpacity 
      onPress={() => router.push('/notifications')}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Ionicons name="notifications-outline" size={24} color="#18181b" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#E11D48', // Primary Red
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  }
});
