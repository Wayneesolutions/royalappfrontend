import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import apiService from '../../../services/api';
import CreateDealerModal from '../admin/CreateDealerModal';

interface Dealer {
  _id: string;
  LedgerGUID: string;
  LedgerName: string;
  LedgerParent?: string | null;
  LedgerMobile?: string;
  LedgerContact?: string;
  Email?: string;
  LedgerGSTIN?: string;
  LedgerAddress1?: string;
  LedgerAddress2?: string;
  LedgerState?: string;
  LedgerOpening?: number;
  LedgerOpeningDate?: string;
  LedgerJoinDate?: string;
  cmpcode?: string;
  Cmpguid?: string;
  Remarks?: string;
  Other1?: string;
  Other2?: string;
  Other3?: string;
  Other4?: string;
  Other5?: string;
  other6?: string;
  other7?: string;
  other8?: string;
  groupId?: string | {
    _id: string;
    GroupGUID: string;
    GroupName: string;
  };
  group?: {
    _id: string;
    GroupGUID: string;
    GroupName: string;
  };
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

const DealersListScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    fetchDealers();
  }, [includeInactive]);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const result = await apiService.adminGetAllDealers({ includeInactive });
      if (result?.success && result.data?.dealers) {
        setDealers(result.data.dealers);
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
      Alert.alert('Error', 'Failed to fetch dealers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDealers();
  };

  const handleEdit = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setShowEditModal(true);
  };

  const handleDelete = (dealer: Dealer) => {
    // Check if user created this dealer
    const isCreatedByUser = dealer.createdBy && user?._id && dealer.createdBy.toString() === user._id.toString();
    
    if (!isCreatedByUser) {
      Alert.alert('Access Denied', 'You can only delete dealers you created');
      return;
    }

    Alert.alert(
      'Delete Dealer',
      `Are you sure you want to ${dealer.isActive ? 'deactivate' : 'permanently delete'} "${dealer.LedgerName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: dealer.isActive ? 'Deactivate' : 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await apiService.adminDeleteDealer(dealer._id);
              if (result?.success) {
                Alert.alert('Success', result.message || 'Dealer deleted successfully');
                fetchDealers();
              } else {
                Alert.alert('Error', result?.message || 'Failed to delete dealer');
              }
            } catch (error) {
              console.error('Error deleting dealer:', error);
              Alert.alert('Error', 'Failed to delete dealer');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchDealers();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingDealer(null);
    fetchDealers();
  };

  const filteredDealers = dealers.filter(dealer => {
    const searchLower = searchText.toLowerCase();
    return (
      dealer.LedgerName.toLowerCase().includes(searchLower) ||
      dealer.LedgerGUID.toLowerCase().includes(searchLower) ||
      (dealer.Email && dealer.Email.toLowerCase().includes(searchLower)) ||
      (dealer.LedgerMobile && dealer.LedgerMobile.includes(searchText))
    );
  });

  const renderDealer = ({ item }: { item: Dealer }) => {
    const isCreatedByUser = item.createdBy && user?._id && item.createdBy.toString() === user._id.toString();
    const isAssignedByAdmin = !isCreatedByUser;

    return (
      <View style={styles.dealerCard}>
        <View style={styles.dealerHeader}>
          <View style={styles.dealerInfo}>
            <Text style={styles.dealerName}>{item.LedgerName}</Text>
            <View style={styles.badgeContainer}>
              {isCreatedByUser && (
                <View style={[styles.badge, styles.createdBadge]}>
                  <Text style={styles.badgeText}>Created by Me</Text>
                </View>
              )}
              {isAssignedByAdmin && (
                <View style={[styles.badge, styles.assignedBadge]}>
                  <Text style={styles.badgeText}>Assigned by Admin</Text>
                </View>
              )}
              {!item.isActive && (
                <View style={[styles.badge, styles.inactiveBadge]}>
                  <Text style={styles.badgeText}>Inactive</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.actions}>
            {isCreatedByUser && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(item)}
                >
                  <Ionicons name="pencil" size={20} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.dealerDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>GUID: {item.LedgerGUID}</Text>
          </View>
          {item.Email && (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.Email}</Text>
            </View>
          )}
          {item.LedgerMobile && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.LedgerMobile}</Text>
            </View>
          )}
          {item.LedgerState && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.LedgerState}</Text>
            </View>
          )}
          {item.group && (
            <View style={styles.detailRow}>
              <Ionicons name="folder-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Group: {item.group.GroupName}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dealers...</Text>
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Dealers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dealers..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            You can see dealers assigned by admin and create your own dealers. You can only edit or delete dealers you created.
          </Text>
        </View>

        {/* Dealers List */}
        {filteredDealers.length > 0 ? (
          <FlatList
            data={filteredDealers}
            renderItem={renderDealer}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            ListHeaderComponent={
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{filteredDealers.length}</Text>
                  <Text style={styles.statLabel}>Total Dealers</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {filteredDealers.filter(d => d.createdBy && user?._id && d.createdBy.toString() === user._id.toString()).length}
                  </Text>
                  <Text style={styles.statLabel}>Created by Me</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {filteredDealers.filter(d => !d.createdBy || !user?._id || d.createdBy.toString() !== user._id.toString()).length}
                  </Text>
                  <Text style={styles.statLabel}>Assigned by Admin</Text>
                </View>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No dealers found</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Try adjusting your search' : 'Create your first dealer to get started'}
            </Text>
            {!searchText && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create Dealer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Dealer Modal */}
      <CreateDealerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Dealer Modal */}
      {editingDealer && (
        <CreateDealerModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDealer(null);
          }}
          onSuccess={handleEditSuccess}
          dealer={editingDealer}
        />
      )}
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
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  dealerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dealerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealerInfo: {
    flex: 1,
  },
  dealerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  createdBadge: {
    backgroundColor: '#D1FAE5',
  },
  assignedBadge: {
    backgroundColor: '#DBEAFE',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  dealerDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DealersListScreen;

