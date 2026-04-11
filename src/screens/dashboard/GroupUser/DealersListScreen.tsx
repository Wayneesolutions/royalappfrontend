import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [totalDealers, setTotalDealers] = useState(0);

  useEffect(() => {
    fetchDealers();
  }, [includeInactive]);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const result = await apiService.adminGetAllDealers({ includeInactive });
      if (result?.success && result.data?.dealers) {
        setDealers(result.data.dealers);
        setTotalDealers(result.data.totalDealers ?? result.data.dealers.length);
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

  const myDealersCount = filteredDealers.filter(
    d => d.createdBy && user?._id && d.createdBy.toString() === user._id.toString()
  ).length;
  const assignedCount = filteredDealers.length - myDealersCount;

  const getGroupName = (dealer: Dealer): string | null => {
    if (dealer.group?.GroupName) return dealer.group.GroupName;
    if (dealer.groupId && typeof dealer.groupId === 'object') return dealer.groupId.GroupName;
    return null;
  };

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#F97316'];
  const getAvatarColor = (name: string) =>
    AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

  const renderDealer = ({ item }: { item: Dealer }) => {
    const isCreatedByUser = item.createdBy && user?._id && item.createdBy.toString() === user._id.toString();
    const avatarColor = getAvatarColor(item.LedgerName);

    return (
      <View style={styles.dealerCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(item.LedgerName)}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.dealerName} numberOfLines={1}>{item.LedgerName}</Text>
            <View style={styles.badgeRow}>
              {isCreatedByUser ? (
                <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="person-outline" size={10} color="#065F46" />
                  <Text style={[styles.badgeText, { color: '#065F46' }]}>Created by Me</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="shield-checkmark-outline" size={10} color="#1E40AF" />
                  <Text style={[styles.badgeText, { color: '#1E40AF' }]}>Assigned by Admin</Text>
                </View>
              )}
              {!item.isActive && (
                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: '#991B1B' }]}>Inactive</Text>
                </View>
              )}
            </View>
          </View>
          {isCreatedByUser && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                <Ionicons name="pencil-outline" size={16} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Contact Details */}
        <View style={styles.detailsGrid}>
          {item.LedgerMobile && (
            <View style={styles.detailChip}>
              <View style={[styles.detailIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="call-outline" size={13} color="#10B981" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{item.LedgerMobile}</Text>
            </View>
          )}
          {item.Email && (
            <View style={styles.detailChip}>
              <View style={[styles.detailIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="mail-outline" size={13} color="#3B82F6" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{item.Email}</Text>
            </View>
          )}
          {item.LedgerState && (
            <View style={styles.detailChip}>
              <View style={[styles.detailIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="location-outline" size={13} color="#F59E0B" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{item.LedgerState}</Text>
            </View>
          )}
          {getGroupName(item) && (
            <View style={styles.detailChip}>
              <View style={[styles.detailIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="folder-outline" size={13} color="#8B5CF6" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{getGroupName(item)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9CA3AF"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
        <Text style={styles.infoText}>
          You can see dealers assigned by admin and create your own. You can only edit or delete dealers you created.
        </Text>
      </View>

      {/* Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="storefront-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{filteredDealers.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="person-outline" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{myDealersCount}</Text>
          <Text style={styles.statLabel}>Created by Me</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <View style={[styles.statIconBox, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>{assignedCount}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
      </View>

      {filteredDealers.length > 0 && (
        <Text style={styles.listCount}>{filteredDealers.length} dealer{filteredDealers.length !== 1 ? 's' : ''} found</Text>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop:4 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Dealers</Text>
          {!loading && (
            <Text style={styles.headerSub}>{totalDealers} total</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading dealers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDealers}
          renderItem={renderDealer}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<ListHeader />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No dealers found</Text>
              <Text style={styles.emptySub}>
                {searchText ? 'Try a different search term' : 'Create your first dealer to get started'}
              </Text>
              {!searchText && (
                <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setShowCreateModal(true)}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyCreateText}>Create Dealer</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <CreateDealerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {editingDealer && (
        <CreateDealerModal
          visible={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingDealer(null); }}
          onSuccess={handleEditSuccess}
          dealer={editingDealer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecf0fe' },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 18 },

  // Stats Strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 6 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#F3F4F6' },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', textAlign: 'center' },

  listCount: { fontSize: 12, color: '#9CA3AF', marginBottom: 10, fontWeight: '500' },

  // Dealer Card
  dealerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  cardHeaderInfo: { flex: 1 },
  dealerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 5,
  },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 6 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDivider: { height: 1, backgroundColor: '#F9FAFB', marginVertical: 12 },

  // Details Grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    maxWidth: '48%',
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: { fontSize: 12, color: '#374151', fontWeight: '500', flex: 1 },

  // Empty State
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
    gap: 8,
  },
  emptyCreateText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default DealersListScreen;
