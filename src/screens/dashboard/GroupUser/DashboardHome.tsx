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
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import apiService from '../../../services/api';
import GroupHierarchy from '../../../components/GroupHierarchy';

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

const actionCards = [
  {
    label: 'Create Order',
    icon: 'add-circle-outline',
    iconType: 'Ionicons',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    screen: 'AdminCreateOrder',
  },
  {
    label: 'My Orders',
    icon: 'clipboard-outline',
    iconType: 'Ionicons',
    color: '#10B981',
    bgColor: '#ECFDF5',
    screen: 'AdminOrderList',
  },
  {
    label: 'My Dealers',
    icon: 'storefront-outline',
    iconType: 'Ionicons',
    color: '#8B5CF6',
    bgColor: '#F3E8FF',
    screen: 'DealersListScreen',
  },
  {
    label: 'Pending Orders',
    icon: 'time-outline',
    iconType: 'Ionicons',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    screen: 'PendingOrdersScreen',
  },
  {
    label: 'Ledger Report',
    icon: 'book-outline',
    iconType: 'Ionicons',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    screen: 'LedgerReportScreen',
  },
  {
    label: 'Outstanding',
    icon: 'file-document-outline',
    iconType: 'MaterialCommunityIcons',
    color: '#F97316',
    bgColor: '#FFF7ED',
    screen: 'OutstandingReportScreen',
  },
  {
    label: 'Sales',
    icon: 'trending-up-outline',
    iconType: 'Ionicons',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    screen: 'SalesStockScreen',
  },
  {
    label: 'Stocks',
    icon: 'bar-chart-outline',
    iconType: 'Ionicons',
    color: '#0EA5E9',
    bgColor: '#F0F9FF',
    screen: 'StockSummaryScreen',
  },
];

const DashboardHome = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);

  useEffect(() => {
    fetchDealers();
  }, [user?.defaultCompany?._id]);

  const fetchDealers = async () => {
    if (!user?.defaultCompany?._id) return;
    try {
      setLoadingDealers(true);
      const result = await apiService.adminGetAllDealers();
      if (result?.success && result?.data?.dealers) {
        setDealers(result.data.dealers);
      } else {
        setDealers([]);
      }
    } catch {
      setDealers([]);
    } finally {
      setLoadingDealers(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDealers();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const renderCardIcon = (icon: string, iconType: string, color: string) => {
    if (iconType === 'MaterialCommunityIcons') {
      return <MaterialCommunityIcons name={icon as any} size={30} color={color} />;
    }
    return <Ionicons name={icon as any} size={30} color={color} />;
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={[styles.header, { paddingTop:6 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{user?.name || 'User'}</Text>
            <Text style={styles.headerCompany} numberOfLines={1}>
              {user?.defaultCompany?.companyName || ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Company Overview */}
        {user?.defaultCompany && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Company Overview</Text>
            <View style={styles.sectionCard}>
              <View style={styles.companyRow}>
                <View style={styles.companyIconBox}>
                  <Ionicons name="business" size={24} color="#0493D2" />
                </View>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{user.defaultCompany.companyName}</Text>
                  <Text style={styles.companyCode}>Code: {user.defaultCompany.companyCode}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="storefront-outline" size={20} color="#10B981" />
                  </View>
                  {loadingDealers ? (
                    <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 6 }} />
                  ) : (
                    <Text style={styles.statValue}>{dealers.length}</Text>
                  )}
                  <Text style={styles.statLabel}>My Dealers</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.grid}>
            {actionCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => navigation.navigate(item.screen as never)}
                activeOpacity={0.75}
              >
                <View style={[styles.cardIconBox, { backgroundColor: item.bgColor }]}>
                  {renderCardIcon(item.icon, item.iconType, item.color)}
                </View>
                <Text style={styles.cardLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Group Hierarchy card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => setShowHierarchy(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.cardIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="git-network-outline" size={30} color="#6366F1" />
              </View>
              <Text style={styles.cardLabel}>Group Hierarchy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dealer Management */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dealer Management</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.listRow}
              onPress={() => navigation.navigate('DealersListScreen' as never)}
              activeOpacity={0.7}
            >
              <View style={styles.listRowLeft}>
                <View style={[styles.listIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="storefront-outline" size={22} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.listTitle}>Dealers</Text>
                  <Text style={styles.listSubtitle}>Manage all dealers</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Group Hierarchy Modal */}
      <Modal
        visible={showHierarchy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHierarchy(false)}
      >
        <GroupHierarchy onClose={() => setShowHierarchy(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ecf0fe',
  },
  // Header
  header: {
    backgroundColor: '#fff',
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#486CD6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#486CD6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerCompany: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    maxWidth: 200,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 100,
  },
  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  // Company Overview
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  companyCode: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 28,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  // Action Cards Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  // Dealer List Rows
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  listIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default DashboardHome;
