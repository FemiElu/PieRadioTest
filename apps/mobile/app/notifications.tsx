import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, Notification } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { notifications, loading, refresh, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.link_url) {
      // Handle deep linking within the app
      // Basic implementation: if it's a valid route, push it
      try {
        router.push(notification.link_url as any);
      } catch (e) {
        console.warn('Invalid link in notification:', notification.link_url);
      }
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'track_update': return 'musical-note';
      case 'song_request': return 'mic';
      case 'presenter_message': return 'mail';
      case 'show_alert': return 'radio';
      case 'news': return 'newspaper';
      default: return 'notifications';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationItem, 
        !item.is_read && styles.unreadItem
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        !item.is_read ? styles.unreadIconContainer : styles.readIconContainer
      ]}>
        <Ionicons 
          name={getIconName(item.type)} 
          size={20} 
          color={!item.is_read ? '#E11D48' : '#71717a'} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[
            styles.title,
            !item.is_read && styles.unreadTitle
          ]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.timeText}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </Text>
        </View>
        <Text style={[
          styles.message,
          !item.is_read && styles.unreadMessage
        ]} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: 'Notifications',
          headerBackTitle: 'Back',
          headerRight: () => (
            unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Mark all read</Text>
              </TouchableOpacity>
            )
          )
        }} 
      />

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#E11D48" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E11D48" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={48} color="#e4e4e7" />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>We'll let you know when something important happens.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#fff1f2', // Very light red
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadIconContainer: {
    backgroundColor: '#ffe4e6',
  },
  readIconContainer: {
    backgroundColor: '#f4f4f5',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#18181b',
  },
  timeText: {
    fontSize: 10,
    color: '#a1a1aa',
  },
  message: {
    fontSize: 13,
    color: '#71717a',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#3f3f46',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E11D48',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerButton: {
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: '#E11D48',
    fontSize: 13,
    fontWeight: '600',
  }
});
