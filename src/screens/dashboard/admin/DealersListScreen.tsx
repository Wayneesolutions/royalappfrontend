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
import DashboardHeader from './AdminHeader';
import apiService from '../../../services/api';
import CreateDealerModal from './CreateDealerModal';

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
  SalesMan?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  ASM?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  RSM?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  ZSM?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  isActive: boolean;
  createdAt: string;
}

const DealersListScreen = () => {
  const navigation = useNavigation();
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

  const filteredDealers = dealers.filter(dealer =>
    dealer.LedgerName.toLowerCase().includes(searchText.toLowerCase()) ||
    dealer.LedgerGUID.toLowerCase().includes(searchText.toLowerCase()) ||
    dealer.LedgerMobile?.toLowerCase().includes(searchText.toLowerCase()) ||
    dealer.Email?.toLowerCase().includes(searchText.toLowerCase()) ||
    dealer.LedgerGSTIN?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderDealerCard = ({ item }: { item: Dealer }) => {
    // Safely get group name, handling null/undefined cases
    let groupName = 'No Group';
    if (item.group?.GroupName) {
      groupName = item.group.GroupName;
    } else if (item.groupId && typeof item.groupId === 'object' && item.groupId.GroupName) {
      groupName = item.groupId.GroupName;
    } else if (item.groupId && typeof item.groupId === 'string' && item.groupId.trim() !== '') {
      // If groupId is a string but group is not populated, show "No Group"
      groupName = 'No Group';
    }
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dealerInfo}>
            <Text style={styles.dealerName}>{item.LedgerName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
              <Ionicons name="pencil" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
              <Ionicons name="trash" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dealerDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="key-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>GUID: {item.LedgerGUID}</Text>
          </View>

          {item.LedgerMobile && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.LedgerMobile}</Text>
            </View>
          )}

          {item.Email && (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.Email}</Text>
            </View>
          )}

          {item.LedgerGSTIN && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>GSTIN: {item.LedgerGSTIN}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Group: {groupName}</Text>
          </View>

          {item.LedgerState && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.LedgerState}</Text>
            </View>
          )}

          {item.LedgerOpening !== undefined && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>Opening: ₹{item.LedgerOpening.toFixed(2)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <DashboardHeader showNotifications={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0493D2" />
          <Text style={styles.loadingText}>Loading dealers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader showNotifications={true} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Dealers Management</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#0493D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dealers..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9CA3AF"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !includeInactive && styles.filterButtonActive]}
          onPress={() => setIncludeInactive(false)}
        >
          <Text style={[styles.filterButtonText, !includeInactive && styles.filterButtonTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, includeInactive && styles.filterButtonActive]}
          onPress={() => setIncludeInactive(true)}
        >
          <Text style={[styles.filterButtonText, includeInactive && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredDealers}
        renderItem={renderDealerCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No dealers found</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Try adjusting your search' : 'Create your first dealer'}
            </Text>
          </View>
        }
      />

      {/* Create Dealer Modal */}
      <CreateDealerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchDealers();
        }}
      />

      {/* Edit Dealer Modal */}
      {editingDealer && (
        <CreateDealerModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDealer(null);
          }}
          onSuccess={() => {
            fetchDealers();
            setEditingDealer(null);
          }}
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonActive: {
    backgroundColor: '#0493D2',
    borderColor: '#0493D2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealerInfo: {
    flex: 1,
  },
  dealerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default DealersListScreen;

