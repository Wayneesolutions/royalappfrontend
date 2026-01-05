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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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


const DashboardHome = () => {
  const { user, logout, switchCompany } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);

  // Get user details from auth context
  const currentCompany = user?.defaultCompany;
  const availableCompanies = user?.companies || [];

  useEffect(() => {
    fetchAllData();
  }, [user?.defaultCompany?._id]);

  const fetchAllData = async () => {
    await fetchDealers();
  };

  const handleCompanySwitch = async (companyId: string) => {
    console.log('handleCompanySwitch called with companyId:', companyId);
    console.log('Current company ID:', currentCompany?._id);

    if (!companyId) {
      console.error('Company ID is missing!');
      Alert.alert('Error', 'Company ID is missing. Please try again.');
      return;
    }

    if (companyId === currentCompany?._id) {
      setShowCompanyDropdown(false);
      return;
    }

    setIsSwitchingCompany(true);
    try {
      console.log('Calling switchCompany with ID:', companyId);
      await switchCompany(companyId);
      setShowCompanyDropdown(false);
      Alert.alert('Success', 'Company switched successfully!');
      // Refresh data after switching
      await fetchAllData();
    } catch (error) {
      console.error('Error switching company:', error);
      Alert.alert('Error', 'Failed to switch company. Please try again.');
    } finally {
      setIsSwitchingCompany(false);
    }
  };

  const fetchDealers = async () => {
    if (!user?.defaultCompany?._id) {
      console.log('⚠️ No default company, skipping dealer fetch');
      return;
    }

    try {
      setLoadingDealers(true);
      console.log('🔄 Fetching dealers for company:', user.defaultCompany._id);
      const result = await apiService.adminGetAllDealers();
      if (result?.success && result?.data?.dealers) {
        console.log('✅ Dealers fetched:', result.data.dealers.length);
        setDealers(result.data.dealers);
      } else {
        console.log('⚠️ No dealers found or fetch failed');
        setDealers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching dealers:', error);
      setDealers([]);
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity
            style={styles.companyButton}
            onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
            disabled={availableCompanies.length <= 1}
          >
            <Text style={styles.companyButtonText}>
              {user?.defaultCompany?.companyName || 'Company'}
            </Text>
            {availableCompanies.length > 1 && (
              <Ionicons
                name={showCompanyDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color="#E0E7FF"
              />
            )}
          </TouchableOpacity>
          <Text style={styles.headerSubtitle}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Company Dropdown Modal */}
      {showCompanyDropdown && availableCompanies.length > 1 && (
        <Modal
          visible={showCompanyDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCompanyDropdown(false)}
        >
          <TouchableOpacity
            style={styles.companyModalOverlay}
            activeOpacity={1}
            onPress={() => setShowCompanyDropdown(false)}
          >
            <View style={styles.companyDropdownContainer}>
              <View style={styles.companyDropdownHeader}>
                <Text style={styles.companyDropdownTitle}>Switch Company</Text>
                <TouchableOpacity onPress={() => setShowCompanyDropdown(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.companyList}>
                {availableCompanies
                  .filter((company: any) => {
                    // Filter out inactive company assignments
                    if (company.isActive === false) return false;

                    // Filter out companies where companyId doesn't exist (deleted company)
                    if (!company.companyId) return false;

                    // Filter out companies where the company itself is inactive
                    if (company.companyId?.isActive === false) return false;

                    return true;
                  })
                  .map((company: any) => {
                    const companyId = company.companyId?._id || company.companyId?.id || company.companyId;
                    const companyName = company.companyId?.companyName || company.companyName || 'Unknown';
                    const companyCode = company.companyId?.companyCode || company.companyCode || '';
                    const isActive = companyId === currentCompany?._id;

                    return (
                      <TouchableOpacity
                        key={companyId}
                        style={[
                          styles.companyItem,
                          isActive && styles.companyItemActive
                        ]}
                        onPress={() => handleCompanySwitch(companyId)}
                        disabled={isSwitchingCompany || isActive}
                      >
                        <View style={styles.companyItemLeft}>
                          <View style={[
                            styles.companyItemIcon,
                            isActive && styles.companyItemIconActive
                          ]}>
                            <Ionicons
                              name="business"
                              size={20}
                              color={isActive ? '#3B82F6' : '#6B7280'}
                            />
                          </View>
                          <View style={styles.companyItemInfo}>
                            <Text style={[
                              styles.companyItemName,
                              isActive && styles.companyItemNameActive
                            ]}>
                              {companyName}
                            </Text>
                            {companyCode && (
                              <Text style={styles.companyItemCode}>{companyCode}</Text>
                            )}
                          </View>
                        </View>
                        {isActive && (
                          <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                        )}
                        {isSwitchingCompany && !isActive && (
                          <ActivityIndicator size="small" color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

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
          {/* Create Order */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminCreateOrder' as never)}
          >
            <Ionicons name="add-circle" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Create Order</Text>
          </TouchableOpacity>

          {/* My Orders */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminOrderList' as never)}
          >
            <Ionicons name="clipboard-outline" size={32} color="#10B981" />
            <Text style={styles.actionText}>My Orders</Text>
          </TouchableOpacity>

          {/* My Dealers */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('DealersListScreen' as never)}
          >
            <Ionicons name="storefront-outline" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>My Dealers</Text>
          </TouchableOpacity>

          {/* Group Hierarchy */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowHierarchy(true)}
          >
            <Ionicons name="git-network-outline" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>Group Hierarchy</Text>
          </TouchableOpacity>

          {/* Ledger Report */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('LedgerReportScreen' as never)}
          >
            <Ionicons name="book-outline" size={32} color="#EF4444" />
            <Text style={styles.actionText}>Ledger Report</Text>
          </TouchableOpacity>

          {/* Outstanding Report */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('OutstandingReportScreen' as never)}
          >
            <Ionicons name="alert-circle-outline" size={32} color="#F97316" />
            <Text style={styles.actionText}>Outstanding Report</Text>
          </TouchableOpacity>

          {/* Pending Orders */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PendingOrdersScreen' as never)}
          >
            <Ionicons name="time-outline" size={32} color="#0EA5E9" />
            <Text style={styles.actionText}>Pending Orders</Text>
          </TouchableOpacity>

          {/* Sales & Stock */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('SalesStockScreen' as never)}
          >
            <Ionicons name="bar-chart-outline" size={32} color="#22C55E" />
            <Text style={styles.actionText}>Sales & Stock</Text>
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
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
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
  hierarchyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hierarchyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hierarchyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  hierarchyCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  hierarchyCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hierarchyCardLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 4,
  },
  headerLeft: {
    flex: 1,
  },
  companyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  companyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E7FF',
  },
  companyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 120,
  },
  companyDropdownContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  companyDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  companyDropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  companyList: {
    maxHeight: 320,
  },
  companyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  companyItemActive: {
    backgroundColor: '#EFF6FF',
  },
  companyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  companyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyItemIconActive: {
    backgroundColor: '#DBEAFE',
  },
  companyItemInfo: {
    flex: 1,
  },
  companyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  companyItemNameActive: {
    color: '#3B82F6',
  },
  companyItemCode: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default DashboardHome;

