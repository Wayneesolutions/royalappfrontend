import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import Profile from '../../../../assets/images/profile.png'
import DashboardHeader from './AdminHeader';
import { useAuth } from '../../../context/AuthContext';
import CreateDealerModal from './CreateDealerModal';

const { width } = Dimensions.get('window');

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

type IconType = 'Ionicons' | 'MaterialCommunityIcons' | 'AntDesign';

interface MenuItem {
  label: string;
  icon: string;
  iconType: IconType;
  navigationScreen: keyof RootStackParamList;
}

// Removed Member interface - no longer showing role-based field members

// Removed getMembers function - no longer showing role-based field members

const menuItems: MenuItem[] = [
  { label: 'User Management', icon: 'people-outline', iconType: 'Ionicons', navigationScreen: 'Users' },
  { label: 'Groups', icon: 'folder-outline', iconType: 'Ionicons', navigationScreen: 'Groups' },
  { label: 'Product Management', icon: 'cube-outline', iconType: 'Ionicons', navigationScreen: 'Product' },
  { label: 'Create Order', icon: 'add-circle-outline', iconType: 'Ionicons', navigationScreen: 'AdminCreateOrder' },
  { label: 'My Orders', icon: 'list-outline', iconType: 'Ionicons', navigationScreen: 'AdminOrderList' },
  { label: 'Order Monitoring', icon: 'eye-outline', iconType: 'Ionicons', navigationScreen: 'SaleOrders' },
  { label: 'Sales Overview', icon: 'trending-up-outline', iconType: 'Ionicons', navigationScreen: 'Sales' },
  { label: 'Outstanding', icon: 'file-document-outline', iconType: 'MaterialCommunityIcons', navigationScreen: 'OutstandingScreen' },
  { label: 'Ledger Report', icon: 'book-outline', iconType: 'Ionicons', navigationScreen: 'LedgerReportScreen' },
  { label: 'Pending Orders', icon: 'time-outline', iconType: 'Ionicons', navigationScreen: 'PendingOrdersScreen' },
  { label: 'Approved Orders', icon: 'checkmark-done-circle-outline', iconType: 'Ionicons', navigationScreen: 'ApprovedOrdersScreen' },
];

// Dealer section menu item (not in navigation, handled separately)
const dealerMenuItem = { label: 'Create Dealer', icon: 'storefront-outline', iconType: 'Ionicons' as IconType };

// Chart data will be fetched from API

const DashboardHome = () => {
  const navigation = useNavigation<NavigationProps>();
  // Removed selectedMember state - no longer needed
  const [companyData, setCompanyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed userCounts and recentUsers state - no longer showing role-based sections
  const [stockData, setStockData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showCreateDealerModal, setShowCreateDealerModal] = useState(false);

  const { user, isAuthenticated, getCompanyData, getStockSummary } = useAuth();

  // Removed getRoleColor, fetchUserCounts, and fetchRecentUsers functions - no longer needed

  // Fetch stock data
  const fetchStockData = async () => {
    if (!isAuthenticated || !user?.defaultCompany) return;
    try {
      const result = await getStockSummary();
      if (result?.success && result?.data) {
        setStockData(result.data);
        setChartData(result.data.chartData || []);
      } else if (!result) {
        setStockData(null);
        setChartData([]);
      }
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
    }
  };

  // Fetch company data when component mounts or user changes
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.defaultCompany) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getCompanyData();
        setCompanyData(data);

        if (isAuthenticated) {
          await fetchStockData();
        }
      } catch (err) {
        console.error('Failed to fetch company data:', err);
        setError('Failed to load company data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user?.defaultCompany, getCompanyData]);

  const renderIcon = (name: string, type: IconType, size = 24, color = '#486CD6') => {
    switch (type) {
      case 'Ionicons':
        return <Ionicons name={name as any} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
      case 'AntDesign':
        return <AntDesign name={name as any} size={size} color={color} />;
      default:
        return null;
    }
  };

  // Generic navigation helper function
  const navigateToScreen = (screenName: string) => {
    try {
      // Check if the screen exists in RootStackParamList
      if (screenName in navigation.getState().routeNames || true) {
        (navigation as any).navigate(screenName);
      } else {
        console.log(`Screen ${screenName} not found in navigation stack`);
      }
    } catch (error) {
      console.log(`Navigation to ${screenName} not available yet`);
      // You can show an alert or toast here if needed
    }
  };

  // Removed handleMemberPress - no longer showing field members

  // Navigation handler for menu items
  const handleMenuPress = (menuItem: MenuItem) => {
    navigateToScreen(menuItem.navigationScreen);
  };

  // Profile press handler
  const handleProfilePress = () => {
    try {
      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.log('Navigation to ProfileScreen not available yet');
    }
  };



  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.mainContainer}>
        <DashboardHeader showNotifications={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0493D2" />
          <Text style={styles.loadingText}>Loading company data...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    const isNoCompaniesError = error.includes('No companies assigned');
    
    return (
      <View style={styles.mainContainer}>
        <DashboardHeader showNotifications={true} />
        <View style={styles.errorContainer}>
          <Ionicons 
            name={isNoCompaniesError ? "business-outline" : "alert-circle-outline"} 
            size={48} 
            color={isNoCompaniesError ? "#F59E0B" : "#EF4444"} 
          />
          <Text style={styles.errorText}>{error}</Text>
          {isNoCompaniesError ? (
            <Text style={styles.errorSubtext}>
              Please contact your super admin to assign companies to your account.
            </Text>
          ) : (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                // Retry logic will be handled by useEffect
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <DashboardHeader
        showNotifications={true}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* Company Information Section */}
        {companyData && (
          <View style={styles.companyInfoSection}>
            <Text style={styles.sectionTitle}>Company Overview</Text>
            <View style={styles.sectionCard}>
              <View style={styles.companyHeader}>
                <View style={styles.companyIcon}>
                  <Ionicons name="business" size={24} color="#0493D2" />
                </View>
                <View style={styles.companyDetails}>
                  <Text style={styles.companyName}>{companyData.company?.companyName}</Text>
                  <Text style={styles.companyCode}>Code: {companyData.company?.companyCode}</Text>
                </View>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{companyData.statistics?.totalMembers || companyData.statistics?.totalUsers || 0}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{companyData.statistics?.totalUsers || 0}</Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{companyData.statistics?.totalDealers || 0}</Text>
                  <Text style={styles.statLabel}>Dealers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{companyData.statistics?.totalSubDealers || 0}</Text>
                  <Text style={styles.statLabel}>SubDealers</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Removed Field Members Section - no longer showing role-based members */}

        {/* Users Management Section */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigateToScreen('Users')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#0493D2" />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.usersStatsContainer}>
              <View style={styles.userStatItem}>
                <View style={styles.userStatIcon}>
                  <Ionicons name="people" size={24} color="#3B82F6" />
                </View>
                <View style={styles.userStatInfo}>
                  <Text style={styles.userStatValue}>{companyData?.statistics?.totalMembers || companyData?.statistics?.totalUsers || 0}</Text>
                  <Text style={styles.userStatLabel}>Total Members</Text>
                  <Text style={styles.userStatSubLabel}>
                    {companyData?.statistics?.totalUsers || 0} Users, {companyData?.statistics?.totalDealers || 0} Dealers, {companyData?.statistics?.totalSubDealers || 0} SubDealers
                  </Text>
                </View>
              </View>
              <View style={styles.userStatItem}>
                <View style={styles.userStatIcon}>
                  <Ionicons name="business" size={24} color="#10B981" />
                </View>
                <View style={styles.userStatInfo}>
                  <Text style={styles.userStatValue}>{companyData?.statistics?.maxUsersAllowed || 0}</Text>
                  <Text style={styles.userStatLabel}>Max Allowed</Text>
                </View>
              </View>
              <View style={styles.userStatItem}>
                <View style={styles.userStatIcon}>
                  <Ionicons name="trending-up" size={24} color="#F59E0B" />
                </View>
                <View style={styles.userStatInfo}>
                  <Text style={styles.userStatValue}>{companyData?.statistics?.usagePercentage || 0}%</Text>
                  <Text style={styles.userStatLabel}>Usage</Text>
                </View>
              </View>
            </View>
            
            {/* Removed Users by Role and Recent Users sections - no longer showing role-based information */}
          </View>
        </View>

        {/* Dealer Section */}
        <View style={styles.dealerSection}>
          <Text style={styles.sectionTitle}>Dealer Management</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.dealerCard}
              onPress={() => navigation.navigate('DealersList' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.dealerCardContent}>
                <View style={styles.dealerIconContainer}>
                  {renderIcon(dealerMenuItem.icon, dealerMenuItem.iconType, 28, '#8B5CF6')}
                </View>
                <View style={styles.dealerCardText}>
                  <Text style={styles.dealerCardTitle}>Dealers</Text>
                  <Text style={styles.dealerCardSubtitle}>Manage all dealers</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dealerCard, { marginTop: 12 }]}
              onPress={() => navigation.navigate('SubDealersList' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.dealerCardContent}>
                <View style={[styles.dealerIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  {renderIcon('people-outline', 'Ionicons', 28, '#F59E0B')}
                </View>
                <View style={styles.dealerCardText}>
                  <Text style={styles.dealerCardTitle}>Subdealers</Text>
                  <Text style={styles.dealerCardSubtitle}>Manage all subdealers</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  {renderIcon(item.icon, item.iconType)}
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Sales Breakdown */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Daily Sales Breakdown</Text>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {chartData.map((data, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barsContainer}>
                    <View
                      style={[
                        styles.barSafe,
                        { height: data.safe }
                      ]}
                    />
                    <View
                      style={[
                        styles.barPending,
                        { height: data.pending }
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{data.day}</Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.chartLegend}>
              <View style={[styles.legendItem, { backgroundColor: '#10B981' }]}>
                <View style={[styles.legendColor, { backgroundColor: '#fff' }]} />
                <Text style={styles.legendText}>
                  Safe Stocks {stockData?.percentages?.safe || 0}%
                </Text>
              </View>
              <View style={[styles.legendItem, { backgroundColor: '#3B82F6' }]}>
                <View style={[styles.legendColor, { backgroundColor: '#fff' }]} />
                <Text style={styles.legendText}>
                  Pending Stocks {stockData?.percentages?.pending || 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Dealer Modal */}
      <CreateDealerModal
        visible={showCreateDealerModal}
        onClose={() => setShowCreateDealerModal(false)}
        onSuccess={() => {
          // Refresh data if needed
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scroll: {
    backgroundColor: '#ecf0fe',
  },
  container: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0fe',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0fe',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#0493D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  companyInfoSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  companyCode: {
    fontSize: 12,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  usersSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0493D2',
    fontWeight: '600',
  },
  usersStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  userStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  userStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userStatInfo: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  userStatSubLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  roleStatsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  roleStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  roleStatsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleStatText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  profileSection: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0493D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: 'black',
  },
  fieldMembersSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'left',
    paddingLeft: 6
  },
  membersScrollContainer: {
    paddingVertical: 4,
  },
  memberItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  memberCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: '#486CD6',
    shadowColor: '#486CD6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  memberName: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
  },
  dealerSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 20,
  },
  dealerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dealerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dealerIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dealerCardText: {
    flex: 1,
  },
  dealerCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  dealerCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 24,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    justifyContent: 'center',
  },
  barSafe: {
    width: 12,
    backgroundColor: '#10B981',
    marginRight: 2,
    borderRadius: 2,
    minHeight: 4,
  },
  barPending: {
    width: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New styles for field members with counts
  memberCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  // Recent users styles
  recentUsersContainer: {
    marginTop: 16,
  },
  recentUsersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  recentUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentUserInitial: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  recentUserInfo: {
    flex: 1,
  },
  recentUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  recentUserRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recentUserStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentUserStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
});

export default DashboardHome;