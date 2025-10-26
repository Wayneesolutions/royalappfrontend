// src/screens/dashboard/RSM/TeamManagementScreen.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  salesData?: {
    totalSales: number;
    orderCount: number;
    monthlySales: number;
  };
}

const TeamManagementScreen = () => {
  const { user, getRSMTeamMembers } = useAuth();
  const navigation = useNavigation();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const roles = [
    { key: 'all', label: 'All Roles', color: '#6B7280' },
    { key: 'asm', label: 'ASM', color: '#F59E0B' },
    { key: 'salesman', label: 'Salesman', color: '#EF4444' },
    { key: 'dealers', label: 'Dealers', color: '#8B5CF6' },
    { key: 'distibutors', label: 'Distributors', color: '#06B6D4' },
    { key: 'subdealer', label: 'Sub-dealers', color: '#84CC16' },
  ];

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const result = await getRSMTeamMembers({ limit: 100 });
      if (result?.success && result?.data?.teamMembers) {
        setTeamMembers(result.data.teamMembers);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeamMembers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'asm': '#F59E0B',
      'salesman': '#EF4444',
      'dealers': '#8B5CF6',
      'distibutors': '#06B6D4',
      'subdealer': '#84CC16',
    };
    return colors[role] || '#6B7280';
  };

  const getRoleDisplayName = (role: string) => {
    const names: { [key: string]: string } = {
      'asm': 'Area Sales Manager',
      'salesman': 'Salesman',
      'dealers': 'Dealer',
      'distibutors': 'Distributor',
      'subdealer': 'Sub-dealer',
    };
    return names[role] || role;
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const renderMemberCard = (member: TeamMember) => (
    <View key={member._id} style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={[styles.memberAvatar, { backgroundColor: getRoleColor(member.role) }]}>
          <Text style={styles.memberInitial}>
            {member.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{getRoleDisplayName(member.role)}</Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
          {member.phone && <Text style={styles.memberPhone}>{member.phone}</Text>}
        </View>
        <View style={styles.memberStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: member.isActive ? '#10B981' : '#6B7280' }
          ]} />
          <Text style={styles.statusText}>
            {member.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.memberStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ₹{member.salesData?.totalSales?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {member.salesData?.orderCount || 0}
          </Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ₹{member.salesData?.monthlySales?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {member.lastLogin && (
        <View style={styles.lastLoginContainer}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.lastLoginText}>
            Last active: {formatTimeAgo(member.lastLogin)}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading team members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team Management</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search team members..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{teamMembers.length}</Text>
          <Text style={styles.statLabel}>Total Members</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {teamMembers.filter(m => m.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ₹{teamMembers.reduce((sum, m) => sum + (m.salesData?.totalSales || 0), 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
      </View>

      {/* Team Members List */}
      <ScrollView
        style={styles.membersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredMembers.length > 0 ? (
          filteredMembers.map(renderMemberCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No team members found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No team members available'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Role</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {roles.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[
                  styles.roleOption,
                  selectedRole === role.key && styles.selectedRoleOption
                ]}
                onPress={() => {
                  setSelectedRole(role.key);
                  setShowFilterModal(false);
                }}
              >
                <View style={[styles.roleDot, { backgroundColor: role.color }]} />
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.key && styles.selectedRoleLabel
                ]}>
                  {role.label}
                </Text>
                {selectedRole === role.key && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  memberInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  lastLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastLoginText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for iPhone
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  selectedRoleOption: {
    backgroundColor: '#F3F4F6',
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedRoleLabel: {
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default TeamManagementScreen;
