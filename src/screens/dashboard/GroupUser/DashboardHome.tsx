import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import apiService from '../../../services/api';

interface Dealer {
  _id: string;
  LedgerName: string;
  LedgerMobile?: string;
  Email?: string;
  LedgerState?: string;
  group?: {
    GroupName?: string;
  };
}


const DashboardHome = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [user?.defaultCompany?._id]);

  const fetchAllData = async () => {
    await fetchDealers();
  };

  const fetchDealers = async () => {
    if (!user?.defaultCompany?._id) return;
    
    try {
      setLoadingDealers(true);
      const result = await apiService.adminGetAllDealers();
      if (result?.success && result?.data?.dealers) {
        setDealers(result.data.dealers);
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
    } finally {
      setLoadingDealers(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderDealer = ({ item }: { item: Dealer }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemIcon}>
        <Ionicons name="storefront" size={20} color="#10B981" />
      </View>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemName}>{item.LedgerName}</Text>
        {item.Email && (
          <Text style={styles.listItemEmail}>{item.Email}</Text>
        )}
        {item.LedgerMobile && (
          <Text style={styles.listItemMobile}>{item.LedgerMobile}</Text>
        )}
        {item.LedgerState && (
          <Text style={styles.listItemState}>{item.LedgerState}</Text>
        )}
        {item.group?.GroupName && (
          <Text style={styles.listItemGroup}>Group: {item.group.GroupName}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {user?.name || 'User'} • {user?.defaultCompany?.companyName || 'Company'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="people" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.welcomeTitle}>Welcome, {user?.name || 'User'}!</Text>
          <Text style={styles.welcomeText}>
            Manage your orders and view company members.
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCreateOrder' as never)}
          >
            <Ionicons name="add-circle" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Create Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminOrderList' as never)}
          >
            <Ionicons name="list" size={32} color="#10B981" />
            <Text style={styles.actionText}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('DealersListScreen' as never)}
          >
            <Ionicons name="storefront" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>My Dealers</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="storefront-outline" size={32} color="#10B981" />
            <Text style={styles.statValue}>{dealers.length}</Text>
            <Text style={styles.statLabel}>Dealers</Text>
          </View>
        </View>

        {/* Dealers Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Dealers</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('DealersListScreen' as never)}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          {loadingDealers && <ActivityIndicator size="small" color="#10B981" style={{ marginBottom: 12 }} />}
          {dealers.length > 0 ? (
            <>
              <FlatList
                data={dealers.slice(0, 5)}
                renderItem={renderDealer}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
              />
              {dealers.length > 5 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => navigation.navigate('DealersListScreen' as never)}
                >
                  <Text style={styles.viewMoreText}>View {dealers.length - 5} more dealers</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No dealers found</Text>
              <TouchableOpacity
                style={styles.createDealerButton}
                onPress={() => navigation.navigate('DealersListScreen' as never)}
              >
                <Text style={styles.createDealerButtonText}>Manage Dealers</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  listItemEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  listItemMobile: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  listItemState: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  listItemGroup: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '500',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  viewMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  createDealerButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createDealerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardHome;

