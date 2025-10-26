// src/screens/dashboard/ASM/TargetManagementScreen.tsx
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
import type { StackNavigationProp } from '@react-navigation/stack';
import { ASMStackParamList } from '../../../navigation/types';

interface Target {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  targetAmount: number;
  achievedAmount: number;
  targetPeriod: string;
  startDate: string;
  endDate: string;
  status: string;
  achievementPercentage: number;
}

const TargetManagementScreen = () => {
  const { user, getASMTeamPerformance } = useAuth();
  const navigation = useNavigation<StackNavigationProp<ASMStackParamList>>();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const periods = [
    { key: 'current', label: 'Current Period', color: '#F59E0B' },
    { key: 'month', label: 'This Month', color: '#10B981' },
    { key: 'quarter', label: 'This Quarter', color: '#3B82F6' },
    { key: 'year', label: 'This Year', color: '#8B5CF6' },
  ];

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const result = await getASMTeamPerformance({ period: selectedPeriod });
      if (result?.success && result?.data?.targets) {
        setTargets(result.data.targets);
      }
    } catch (error) {
      console.error('Failed to fetch targets:', error);
      Alert.alert('Error', 'Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTargets();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTargets();
  }, [selectedPeriod]);

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'salesman': '#EF4444',
      'dealers': '#8B5CF6',
      'distibutors': '#06B6D4',
      'subdealer': '#84CC16',
    };
    return colors[role] || '#6B7280';
  };

  const getRoleDisplayName = (role: string) => {
    const names: { [key: string]: string } = {
      'salesman': 'Salesman',
      'dealers': 'Dealer',
      'distibutors': 'Distributor',
      'subdealer': 'Sub-dealer',
    };
    return names[role] || role;
  };

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return '#10B981';
    if (percentage >= 75) return '#3B82F6';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getAchievementStatus = (percentage: number) => {
    if (percentage >= 100) return 'Exceeded';
    if (percentage >= 75) return 'On Track';
    if (percentage >= 50) return 'Behind';
    return 'Critical';
  };

  const filteredTargets = targets.filter(target => {
    const matchesSearch = target.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         target.userRole.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderTargetCard = (target: Target) => (
    <View key={target._id} style={styles.targetCard}>
      <View style={styles.targetHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.userAvatar, { backgroundColor: getRoleColor(target.userRole) }]}>
            <Text style={styles.userInitial}>
              {target.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{target.userName}</Text>
            <Text style={styles.userRole}>{getRoleDisplayName(target.userRole)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getAchievementColor(target.achievementPercentage) }]}>
          <Text style={styles.statusText}>{getAchievementStatus(target.achievementPercentage)}</Text>
        </View>
      </View>

      <View style={styles.targetDetails}>
        <View style={styles.targetAmounts}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={styles.targetAmount}>₹{target.targetAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Achieved</Text>
            <Text style={styles.achievedAmount}>₹{target.achievedAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text style={styles.remainingAmount}>
              ₹{(target.targetAmount - target.achievedAmount).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressPercentage, { color: getAchievementColor(target.achievementPercentage) }]}>
              {target.achievementPercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(target.achievementPercentage, 100)}%`,
                  backgroundColor: getAchievementColor(target.achievementPercentage)
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.targetPeriod}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.periodText}>
            {target.targetPeriod} ({new Date(target.startDate).toLocaleDateString()} - {new Date(target.endDate).toLocaleDateString()})
          </Text>
        </View>
      </View>

      <View style={styles.targetActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={16} color="#F59E0B" />
          <Text style={styles.actionText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionText}>Edit Target</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="trending-up-outline" size={16} color="#10B981" />
          <Text style={styles.actionText}>Performance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const totalTarget = targets.reduce((sum, target) => sum + target.targetAmount, 0);
  const totalAchieved = targets.reduce((sum, target) => sum + target.achievedAmount, 0);
  const overallAchievement = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading targets...</Text>
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
        <Text style={styles.headerTitle}>Target Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#F59E0B" />
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

      {/* Period Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
        contentContainerStyle={styles.periodSelectorContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.selectedPeriodButton
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.selectedPeriodButtonText
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Overall Stats */}
      <View style={styles.overallStats}>
        <View style={styles.overallStatCard}>
          <Text style={styles.overallStatValue}>₹{totalTarget.toLocaleString()}</Text>
          <Text style={styles.overallStatLabel}>Total Target</Text>
        </View>
        <View style={styles.overallStatCard}>
          <Text style={styles.overallStatValue}>₹{totalAchieved.toLocaleString()}</Text>
          <Text style={styles.overallStatLabel}>Total Achieved</Text>
        </View>
        <View style={styles.overallStatCard}>
          <Text style={[styles.overallStatValue, { color: getAchievementColor(overallAchievement) }]}>
            {overallAchievement.toFixed(1)}%
          </Text>
          <Text style={styles.overallStatLabel}>Overall Achievement</Text>
        </View>
      </View>

      {/* Targets List */}
      <ScrollView
        style={styles.targetsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTargets.length > 0 ? (
          filteredTargets.map(renderTargetCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="target-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No targets found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No targets set for this period'}
            </Text>
          </View>
        )}
      </ScrollView>
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
  addButton: {
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
  periodSelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  periodSelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedPeriodButton: {
    backgroundColor: '#F59E0B',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
  },
  overallStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  overallStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overallStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  targetsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  targetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  targetDetails: {
    marginBottom: 16,
  },
  targetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  achievedAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  targetActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
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
});

export default TargetManagementScreen;
