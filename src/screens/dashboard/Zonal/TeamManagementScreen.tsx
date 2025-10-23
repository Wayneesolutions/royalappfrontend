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
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  hierarchy: {
    level: number;
    parentUser?: {
      _id: string;
      name: string;
    };
  };
  salesData: {
    totalSales: number;
    orderCount: number;
  };
}

interface TeamStats {
  totalMembers: number;
  roleCounts: {
    rsm: number;
    asm: number;
    salesman: number;
    dealers: number;
    distibutors: number;
    subdealer: number;
  };
  totalSales: number;
  totalOrders: number;
}

const TeamManagementScreen = () => {
  const { user, getZonalTeamMembers, getZonalDashboardData } = useAuth();
  const navigation = useNavigation();
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMembers: 0,
    roleCounts: {
      rsm: 0,
      asm: 0,
      salesman: 0,
      dealers: 0,
      distibutors: 0,
      subdealer: 0,
    },
    totalSales: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const roles = [
    { key: '', label: 'All Roles', icon: 'people' },
    { key: 'rsm', label: 'RSM', icon: 'person' },
    { key: 'asm', label: 'ASM', icon: 'person-add' },
    { key: 'salesman', label: 'Salesman', icon: 'person-circle' },
    { key: 'dealers', label: 'Dealers', icon: 'business' },
    { key: 'distibutors', label: 'Distributors', icon: 'storefront' },
    { key: 'subdealer', label: 'Sub Dealer', icon: 'store' },
  ];

  const fetchTeamData = async (page = 1, reset = false) => {
    if (!user?.defaultCompany) {
      setLoading(false);
      return;
    }

    try {
      if (page === 1) setLoading(true);
      
      // Fetch team members
      const teamResult = await getZonalTeamMembers({
        page,
        limit: 20,
        role: selectedRole || undefined,
        search: searchQuery || undefined,
      });

      if (teamResult?.success && teamResult?.data) {
        const newMembers = teamResult.data.teamMembers || [];
        
        if (reset || page === 1) {
          setTeamMembers(newMembers);
        } else {
          setTeamMembers(prev => [...prev, ...newMembers]);
        }
        
        setHasMore(teamResult.data.pagination?.hasNext || false);
      }

      // Fetch team stats from dashboard data
      const dashboardResult = await getZonalDashboardData();
      if (dashboardResult?.success && dashboardResult?.data) {
        const data = dashboardResult.data;
        setTeamStats({
          totalMembers: data.teamOverview.totalTeamMembers || 0,
          roleCounts: data.teamOverview.roleCounts || {
            rsm: 0,
            asm: 0,
            salesman: 0,
            dealers: 0,
            distibutors: 0,
            subdealer: 0,
          },
          totalSales: data.salesSummary.totalSales || 0,
          totalOrders: data.salesSummary.totalOrders || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch team data:', error);
      Alert.alert('Error', 'Failed to load team data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamData(1, true);
  }, [user?.defaultCompany, selectedRole, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchTeamData(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchTeamData(nextPage, false);
    }
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    setShowRoleFilter(false);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleViewMemberDetails = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };

  const getRoleIcon = (role: string) => {
    const roleConfig = roles.find(r => r.key === role);
    return roleConfig?.icon || 'person';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      rsm: '#3B82F6',
      asm: '#10B981',
      salesman: '#F59E0B',
      dealers: '#8B5CF6',
      distibutors: '#06B6D4',
      subdealer: '#EF4444',
    };
    return colors[role] || '#6B7280';
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const renderRoleCard = (role: string, count: number) => {
    const roleConfig = roles.find(r => r.key === role);
    if (!roleConfig || count === 0) return null;

    return (
      <TouchableOpacity
        key={role}
        style={[
          styles.roleCard,
          { borderColor: selectedRole === role ? getRoleColor(role) : '#E5E7EB' }
        ]}
        onPress={() => handleRoleFilter(role)}
      >
        <View style={[styles.roleIcon, { backgroundColor: getRoleColor(role) }]}>
          <Ionicons name={roleConfig.icon as any} size={16} color="white" />
        </View>
        <Text style={styles.roleCount}>{count}</Text>
        <Text style={styles.roleLabel}>{roleConfig.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderTeamMember = ({ item }: { item: TeamMember }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => handleViewMemberDetails(item)}
    >
      <View style={styles.memberHeader}>
        <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(item.role) }]}>
          <Ionicons name={getRoleIcon(item.role) as any} size={20} color="white" />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRole}>{item.role.toUpperCase()}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
        <View style={styles.memberStats}>
          <Text style={styles.memberSales}>₹{item.salesData.totalSales.toLocaleString()}</Text>
          <Text style={styles.memberOrders}>{item.salesData.orderCount} orders</Text>
        </View>
      </View>
      <View style={styles.memberFooter}>
        <View style={styles.memberLevel}>
          <Ionicons name="trending-up" size={14} color="#6B7280" />
          <Text style={styles.memberLevelText}>Level {item.hierarchy.level}</Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsBtn}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderMemberDetails = () => (
    <Modal
      visible={showMemberDetails}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Member Details</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowMemberDetails(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {selectedMember && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <View style={[styles.detailAvatar, { backgroundColor: getRoleColor(selectedMember.role) }]}>
                <Ionicons name={getRoleIcon(selectedMember.role) as any} size={32} color="white" />
              </View>
              <Text style={styles.detailName}>{selectedMember.name}</Text>
              <Text style={styles.detailRole}>{selectedMember.role.toUpperCase()}</Text>
              <Text style={styles.detailEmail}>{selectedMember.email}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Performance</Text>
              <View style={styles.detailStats}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>₹{selectedMember.salesData.totalSales.toLocaleString()}</Text>
                  <Text style={styles.detailStatLabel}>Total Sales</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>{selectedMember.salesData.orderCount}</Text>
                  <Text style={styles.detailStatLabel}>Orders</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Hierarchy</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailInfoLabel}>Level</Text>
                <Text style={styles.detailInfoValue}>{selectedMember.hierarchy.level}</Text>
              </View>
              {selectedMember.hierarchy.parentUser && (
                <View style={styles.detailInfo}>
                  <Text style={styles.detailInfoLabel}>Reports To</Text>
                  <Text style={styles.detailInfoValue}>{selectedMember.hierarchy.parentUser.name}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  if (loading && teamMembers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading team data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Management</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Team Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Team Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Members', teamStats.totalMembers, 'people', '#3B82F6')}
            {renderStatCard('Total Sales', `₹${teamStats.totalSales.toLocaleString()}`, 'trending-up', '#10B981')}
            {renderStatCard('Total Orders', teamStats.totalOrders, 'list', '#F59E0B')}
          </View>
        </View>

        {/* Role Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Team by Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScroll}>
            {renderRoleCard('', teamStats.totalMembers)}
            {Object.entries(teamStats.roleCounts).map(([role, count]) => 
              renderRoleCard(role, count)
            )}
          </ScrollView>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search team members..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowRoleFilter(!showRoleFilter)}
          >
            <Ionicons name="filter" size={20} color="#3B82F6" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Team Members List */}
        <View style={styles.membersSection}>
          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>
              Team Members ({teamMembers.length})
            </Text>
            {selectedRole && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => handleRoleFilter('')}
              >
                <Text style={styles.clearFilterText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={teamMembers}
            renderItem={renderTeamMember}
            keyExtractor={(item) => item._id}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No team members found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery || selectedRole ? 'Try adjusting your search or filter' : 'No team members available'}
                </Text>
              </View>
            }
            ListFooterComponent={
              loading && teamMembers.length > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
          />
        </View>
      </ScrollView>

      {renderMemberDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  roleScroll: {
    flexDirection: 'row',
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  roleLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  filterText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  membersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberSales: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  memberOrders: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberLevel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberLevelText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#3B82F6',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeBtn: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  detailRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  detailEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default TeamManagementScreen;
