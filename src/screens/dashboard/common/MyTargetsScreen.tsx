import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';

interface Target {
  _id: string;
  targetId: string;
  targetType: string;
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number;
  };
  targetAmount: number;
  targetQuantity: number;
  achievedAmount: number;
  achievedQuantity: number;
  achievementPercentage: number;
  status: string;
  notes: string;
  assignedBy: {
    _id: string;
    name: string;
    role: string;
  };
  assignedAt: string;
  lastUpdated: string;
}

const MyTargetsScreen = () => {
  const { getMyTargets } = useAuth();
  
  const [myTargets, setMyTargets] = useState<Target[]>([]);
  const [assignedTargets, setAssignedTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    fetchTargets();
  }, [selectedPeriod]);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (selectedPeriod === 'current') {
        const now = new Date();
        params.year = now.getFullYear();
        params.month = now.getMonth() + 1;
      }
      
      const result = await getMyTargets(params);
      if (result?.success) {
        setMyTargets(result.data.myTargets || []);
        setAssignedTargets(result.data.assignedTargets || []);
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
      Alert.alert('Error', 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTargets();
    setRefreshing(false);
  };

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return '#10B981'; // Green
    if (percentage >= 75) return '#F59E0B'; // Yellow
    if (percentage >= 50) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getAchievementIcon = (percentage: number) => {
    if (percentage >= 100) return 'checkmark-circle';
    if (percentage >= 75) return 'trending-up';
    if (percentage >= 50) return 'trending-up-outline';
    return 'trending-down';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const renderTargetCard = (target: Target, isAssigned: boolean = false) => {
    const achievementColor = getAchievementColor(target.achievementPercentage);
    const achievementIcon = getAchievementIcon(target.achievementPercentage);
    
    return (
      <View key={target._id} style={styles.targetCard}>
        <View style={styles.targetHeader}>
          <View style={styles.targetInfo}>
            <Text style={styles.targetId}>{target.targetId}</Text>
            <Text style={styles.targetPeriod}>
              {getMonthName(target.period.month)} {target.period.year}
            </Text>
          </View>
          <View style={styles.achievementBadge}>
            <Ionicons name={achievementIcon} size={20} color={achievementColor} />
            <Text style={[styles.achievementText, { color: achievementColor }]}>
              {target.achievementPercentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.targetDetails}>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Target Amount:</Text>
            <Text style={styles.targetValue}>₹{target.targetAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Achieved Amount:</Text>
            <Text style={[styles.targetValue, { color: achievementColor }]}>
              ₹{target.achievedAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Target Quantity:</Text>
            <Text style={styles.targetValue}>{target.targetQuantity.toLocaleString()}</Text>
          </View>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Achieved Quantity:</Text>
            <Text style={[styles.targetValue, { color: achievementColor }]}>
              {target.achievedQuantity.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(target.achievementPercentage, 100)}%`,
                  backgroundColor: achievementColor
                }
              ]} 
            />
          </View>
        </View>

        {target.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{target.notes}</Text>
          </View>
        )}

        <View style={styles.targetFooter}>
          <Text style={styles.assignedBy}>
            {isAssigned ? 'Assigned to' : 'Assigned by'}: {target.assignedBy.name}
          </Text>
          <Text style={styles.assignedDate}>
            {formatDate(target.assignedAt)}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(target.status) }]}>
            <Text style={styles.statusText}>{target.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#3B82F6';
      case 'paused': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderPeriodSelector = () => {
    const periods = [
      { key: 'current', label: 'Current Month' },
      { key: 'all', label: 'All Periods' }
    ];

    return (
      <View style={styles.periodSelector}>
        {periods.map(period => (
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
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#077BC3" />
        <Text style={styles.loadingText}>Loading targets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Targets</Text>
        <TouchableOpacity onPress={fetchTargets}>
          <Ionicons name="refresh" size={24} color="#077BC3" />
        </TouchableOpacity>
      </View>

      {renderPeriodSelector()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* My Targets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Targets ({myTargets.length})</Text>
          {myTargets.length > 0 ? (
            myTargets.map(target => renderTargetCard(target, false))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flag" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No targets assigned to you</Text>
            </View>
          )}
        </View>

        {/* Assigned Targets Section */}
        {assignedTargets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Targets I Assigned ({assignedTargets.length})</Text>
            {assignedTargets.map(target => renderTargetCard(target, true))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#077BC3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  targetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetInfo: {
    flex: 1,
  },
  targetId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  targetPeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  targetDetails: {
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  notesContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  targetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignedBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  assignedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default MyTargetsScreen;
