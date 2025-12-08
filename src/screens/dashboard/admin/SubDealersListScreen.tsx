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
import CreateSubDealerModal from './CreateSubDealerModal';

interface SubDealer {
  _id: string;
  SDName: string;
  SDType: 'Sub Dealer' | 'TSO';
  SDAddress1?: string;
  SDAddress2?: string;
  SDAddress3?: string;
  SDState?: string;
  SDCountry?: string;
  SDPincode?: string;
  SDContactPerson?: string;
  SDMobileNo?: string;
  SDEmail?: string;
  SDGSTNType?: string;
  SDGSTNNumber?: string;
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
  cmpcode?: string;
  Cmpguid?: string;
  isActive: boolean;
  createdAt: string;
}

const SubDealersListScreen = () => {
  const navigation = useNavigation();
  const [subdealers, setSubDealers] = useState<SubDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubDealer, setEditingSubDealer] = useState<SubDealer | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  useEffect(() => {
    fetchSubDealers();
  }, [includeInactive]);

  const fetchSubDealers = async () => {
    try {
      setLoading(true);
      const result = await apiService.adminGetAllSubDealers({ includeInactive });
      if (result?.success && result.data?.subdealers) {
        setSubDealers(result.data.subdealers);
      }
    } catch (error) {
      console.error('Error fetching subdealers:', error);
      Alert.alert('Error', 'Failed to fetch subdealers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubDealers();
  };

  const handleEdit = (subdealer: SubDealer) => {
    setEditingSubDealer(subdealer);
    setShowEditModal(true);
  };

  const handleDelete = (subdealer: SubDealer) => {
    Alert.alert(
      'Delete Subdealer',
      `Are you sure you want to ${subdealer.isActive ? 'deactivate' : 'permanently delete'} "${subdealer.SDName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: subdealer.isActive ? 'Deactivate' : 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await apiService.adminDeleteSubDealer(subdealer._id);
              if (result?.success) {
                Alert.alert('Success', result.message || 'Subdealer deleted successfully');
                fetchSubDealers();
              } else {
                Alert.alert('Error', result?.message || 'Failed to delete subdealer');
              }
            } catch (error) {
              console.error('Error deleting subdealer:', error);
              Alert.alert('Error', 'Failed to delete subdealer');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredSubDealers = subdealers.filter(subdealer =>
    subdealer.SDName.toLowerCase().includes(searchText.toLowerCase()) ||
    subdealer.SDMobileNo?.toLowerCase().includes(searchText.toLowerCase()) ||
    subdealer.SDEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
    subdealer.SDGSTNNumber?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderSubDealerCard = ({ item }: { item: SubDealer }) => {
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
          <View style={styles.subdealerInfo}>
            <Text style={styles.subdealerName}>{item.SDName}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.SDType}</Text>
            </View>
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

        <View style={styles.subdealerDetails}>
          {item.SDMobileNo && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDMobileNo}</Text>
            </View>
          )}

          {item.SDEmail && (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDEmail}</Text>
            </View>
          )}

          {item.SDContactPerson && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDContactPerson}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Group: {groupName}</Text>
          </View>

          {item.SDState && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>{item.SDState}</Text>
            </View>
          )}

          {item.SDGSTNNumber && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.detailText}>GSTN: {item.SDGSTNNumber}</Text>
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
          <Text style={styles.loadingText}>Loading subdealers...</Text>
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
        <Text style={styles.title}>Subdealers Management</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#0493D2" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subdealers..."
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
        data={filteredSubDealers}
        renderItem={renderSubDealerCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No subdealers found</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Try adjusting your search' : 'Create your first subdealer'}
            </Text>
          </View>
        }
      />

      {/* Create SubDealer Modal */}
      <CreateSubDealerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchSubDealers();
        }}
      />

      {/* Edit SubDealer Modal */}
      {editingSubDealer && (
        <CreateSubDealerModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingSubDealer(null);
          }}
          onSuccess={() => {
            fetchSubDealers();
            setEditingSubDealer(null);
          }}
          subdealer={editingSubDealer}
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
  subdealerInfo: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  subdealerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  statusBadge: {
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
  subdealerDetails: {
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

export default SubDealersListScreen;

