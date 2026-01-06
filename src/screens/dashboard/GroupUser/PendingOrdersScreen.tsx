import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PendingOrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'purchase'
  const [expandedUsers, setExpandedUsers] = useState({}); // Track expanded users
  const [selectedUser, setSelectedUser] = useState(null); // Track selected user to show orders
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, processing, approved, shipped

  // --- Hierarchical User Data Structure ---
  const USER_HIERARCHY = {
    sales: [
      {
        id: 'user-1',
        name: 'Rajesh Kumar',
        role: 'Regional Manager',
        groupName: 'North Region',
        totalOrders: 15,
        totalValue: '₹ 5,45,000',
        children: [
          {
            id: 'user-1-1',
            name: 'Amit Sharma',
            role: 'Sales Executive',
            groupName: 'Delhi Zone',
            totalOrders: 8,
            totalValue: '₹ 2,80,000',
            children: [
              {
                id: 'user-1-1-1',
                name: 'Priya Singh',
                role: 'Sales Associate',
                groupName: 'Delhi East',
                totalOrders: 3,
                totalValue: '₹ 1,18,000',
                children: []
              }
            ]
          },
          {
            id: 'user-1-2',
            name: 'Neha Gupta',
            role: 'Sales Executive',
            groupName: 'Noida Zone',
            totalOrders: 4,
            totalValue: '₹ 1,47,000',
            children: []
          }
        ]
      },
      {
        id: 'user-2',
        name: 'Suresh Patel',
        role: 'Regional Manager',
        groupName: 'West Region',
        totalOrders: 12,
        totalValue: '₹ 4,25,000',
        children: [
          {
            id: 'user-2-1',
            name: 'Vikram Mehta',
            role: 'Sales Executive',
            groupName: 'Mumbai Zone',
            totalOrders: 7,
            totalValue: '₹ 2,50,000',
            children: []
          }
        ]
      }
    ],
    purchase: [
      {
        id: 'user-3',
        name: 'Anita Desai',
        role: 'Purchase Manager',
        groupName: 'Electronics Division',
        totalOrders: 8,
        totalValue: '₹ 12,50,000',
        children: [
          {
            id: 'user-3-1',
            name: 'Rahul Verma',
            role: 'Purchase Executive',
            groupName: 'Mobile Accessories',
            totalOrders: 4,
            totalValue: '₹ 8,90,000',
            children: []
          }
        ]
      }
    ]
  };

  // --- Order Data for Each User ---
  const ORDERS_BY_USER = {
    'user-1-1-1': [
      {
        id: 'SO-001',
        partyName: 'Abbas Infotech',
        itemName: 'Samsung Galaxy Tab S9',
        date: '12 Dec 25',
        amount: '₹ 1,18,000',
        qty: 10,
        status: 'processing',
        statusLabel: 'Processing',
        color: '#3B82F6',
      }
    ],
    'user-1-1': [
      {
        id: 'SO-002',
        partyName: 'Global Solutions',
        itemName: 'HP Laptop 15s',
        date: '15 Dec 25',
        amount: '₹ 45,500',
        qty: 5,
        status: 'approved',
        statusLabel: 'Approved',
        color: '#10B981',
      },
      {
        id: 'SO-003',
        partyName: 'Tech Innovations',
        itemName: 'Dell Inspiron 3520',
        date: '14 Dec 25',
        amount: '₹ 82,000',
        qty: 8,
        status: 'pending',
        statusLabel: 'Pending',
        color: '#F59E0B',
      }
    ],
    'user-1-2': [
      {
        id: 'SO-004',
        partyName: 'Digital World',
        itemName: 'Lenovo IdeaPad Slim 3',
        date: '13 Dec 25',
        amount: '₹ 67,000',
        qty: 6,
        status: 'processing',
        statusLabel: 'Processing',
        color: '#3B82F6',
      }
    ],
    'user-2-1': [
      {
        id: 'SO-005',
        partyName: 'Mumbai Traders',
        itemName: 'MacBook Air M2',
        date: '11 Dec 25',
        amount: '₹ 1,25,000',
        qty: 12,
        status: 'approved',
        statusLabel: 'Approved',
        color: '#10B981',
      }
    ],
    'user-3-1': [
      {
        id: 'PO-992',
        partyName: 'Samsung Electronics',
        itemName: 'Galaxy S24 Ultra (Bulk)',
        date: '10 Dec 25',
        amount: '₹ 8,90,000',
        qty: 50,
        status: 'shipped',
        statusLabel: 'In Transit',
        color: '#8B5CF6',
      }
    ]
  };

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUserClick = (user) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  // Get unique parties and items for a user
  const getUserPartiesAndItems = (userId) => {
    const orders = ORDERS_BY_USER[userId] || [];
    const parties = [...new Set(orders.map(o => o.partyName))];
    const items = [...new Set(orders.map(o => o.itemName))];
    return { parties, items };
  };

  // Get all parties and items including from children (recursive)
  const getAllPartiesAndItems = (user) => {
    let allParties = [];
    let allItems = [];
    
    // Get this user's parties and items
    const { parties, items } = getUserPartiesAndItems(user.id);
    allParties.push(...parties);
    allItems.push(...items);
    
    // Recursively get from children
    if (user.children && user.children.length > 0) {
      user.children.forEach(child => {
        const childData = getAllPartiesAndItems(child);
        allParties.push(...childData.parties);
        allItems.push(...childData.items);
      });
    }
    
    // Return unique values
    return {
      parties: [...new Set(allParties)],
      items: [...new Set(allItems)]
    };
  };

  // Filter orders based on search and status
  const filterOrders = (orders) => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.itemName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' || 
        order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const renderOrderCard = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderIdText}>#{item.id}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.color + '15' }]}>
          <Text style={[styles.statusText, { color: item.color }]}>{item.statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Party Name and Item Name on Separate Lines */}
      <View style={styles.orderCardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.nameLabel}>Party:</Text>
          <Text style={styles.partyName} numberOfLines={1}>{item.partyName}</Text>
        </View>
        
        <View style={styles.nameRow}>
          <Text style={styles.nameLabel}>Item:</Text>
          <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
        </View>
        
        <View style={styles.qtyRow}>
          <Ionicons name="cube-outline" size={14} color="#6B7280" />
          <Text style={styles.qtyText}>{item.qty} units pending</Text>
        </View>
      </View>

      <View style={styles.orderCardFooter}>
        <Text style={styles.amountLabel}>Pending Value</Text>
        <Text style={styles.amountValue}>{item.amount}</Text>
      </View>
    </View>
  );

  const renderUserNode = (user, level = 0) => {
    const hasChildren = user.children && user.children.length > 0;
    const isExpanded = expandedUsers[user.id];
    const isSelected = selectedUser?.id === user.id;
    const allOrders = ORDERS_BY_USER[user.id] || [];
    const orders = filterOrders(allOrders);
    const { parties, items } = getAllPartiesAndItems(user);

    return (
      <View key={user.id} style={[styles.userNodeContainer, { marginLeft: level * 20 }]}>
        {/* User Card */}
        <TouchableOpacity
          style={[
            styles.userCard,
            isSelected && styles.userCardSelected,
            level === 0 && styles.userCardTopLevel
          ]}
          onPress={() => handleUserClick(user)}
        >
          <View style={styles.userCardLeft}>
            {/* Expand/Collapse Icon for parent nodes */}
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleUserExpansion(user.id)}
                style={styles.expandButton}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            )}

            {/* User Avatar */}
            <View style={[
              styles.userAvatar,
              { backgroundColor: level === 0 ? '#3B82F6' : level === 1 ? '#10B981' : '#F59E0B' }
            ]}>
              <Text style={styles.userAvatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
              <View style={styles.groupBadge}>
                <Ionicons name="people-outline" size={10} color="#6B7280" />
                <Text style={styles.groupName}>{user.groupName}</Text>
              </View>
              
              {/* Party and Item Info */}
              {parties.length > 0 && (
                <View style={styles.userDetailsContainer}>
                  <View style={styles.userDetailRow}>
                    <Text style={styles.userDetailLabel}>Parties:</Text>
                    <Text style={styles.userDetailValue} numberOfLines={1}>
                      {parties.join(', ')}
                    </Text>
                  </View>
                  {items.length > 0 && (
                    <View style={styles.userDetailRow}>
                      <Text style={styles.userDetailLabel}>Items:</Text>
                      <Text style={styles.userDetailValue} numberOfLines={1}>
                        {items.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.userCardRight}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalValue}</Text>
              <Text style={styles.statLabel}>Value</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Show Orders if User is Selected */}
        {isSelected && orders.length > 0 && (
          <View style={styles.ordersContainer}>
            <View style={styles.ordersHeader}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.ordersHeaderText}>
                Pending Orders ({orders.length}{allOrders.length !== orders.length ? ` of ${allOrders.length}` : ''})
              </Text>
            </View>
            {orders.map((order) => (
              <View key={order.id}>
                {renderOrderCard({ item: order })}
              </View>
            ))}
          </View>
        )}

        {/* Show message if no orders match filter */}
        {isSelected && allOrders.length > 0 && orders.length === 0 && (
          <View style={styles.ordersContainer}>
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={40} color="#D1D5DB" />
              <Text style={styles.noResultsText}>No orders match your search or filter</Text>
            </View>
          </View>
        )}

        {/* Render Child Users if Expanded */}
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {user.children.map((child) => renderUserNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderHierarchy = () => {
    const users = USER_HIERARCHY[activeTab] || [];
    return (
      <View style={styles.hierarchyContainer}>
        {users.map((user) => renderUserNode(user, 0))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pending Orders</Text>
        <Text style={styles.subtitle}>Hierarchical view of all pending orders</Text>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => {
            setActiveTab('sales');
            setExpandedUsers({});
            setSelectedUser(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
            SALES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchase' && styles.activeTab]}
          onPress={() => {
            setActiveTab('purchase');
            setExpandedUsers({});
            setSelectedUser(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'purchase' && styles.activeTabText]}>
            PURCHASE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput 
            placeholder="Search by order ID, party, or item..." 
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'all' && styles.filterPillActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterPillText, filterStatus === 'all' && styles.filterPillTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'pending' && styles.filterPillActive]}
          onPress={() => setFilterStatus('pending')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.filterPillText, filterStatus === 'pending' && styles.filterPillTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'processing' && styles.filterPillActive]}
          onPress={() => setFilterStatus('processing')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.filterPillText, filterStatus === 'processing' && styles.filterPillTextActive]}>
            Processing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'approved' && styles.filterPillActive]}
          onPress={() => setFilterStatus('approved')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.filterPillText, filterStatus === 'approved' && styles.filterPillTextActive]}>
            Approved
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.filterPill, filterStatus === 'shipped' && styles.filterPillActive]}
          onPress={() => setFilterStatus('shipped')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={[styles.filterPillText, filterStatus === 'shipped' && styles.filterPillTextActive]}>
            Shipped
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hierarchical User List */}
      <FlatList
        data={[{ key: 'hierarchy' }]}
        renderItem={renderHierarchy}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 10,
    padding: 4
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  activeTabText: { color: '#2563EB' },

  searchSection: { paddingHorizontal: 20, paddingVertical: 10 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 14,
    color: '#111827'
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap'
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6
  },
  filterPillActive: {
    backgroundColor: '#2563EB'
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280'
  },
  filterPillTextActive: {
    color: '#fff'
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  hierarchyContainer: { width: '100%' },

  userNodeContainer: { marginBottom: 12 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  userCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF'
  },
  userCardTopLevel: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },

  userCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expandButton: { marginRight: 8, padding: 4 },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  userAvatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  userRole: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  groupName: { fontSize: 10, color: '#6B7280', marginLeft: 4, fontWeight: '600' },

  userDetailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  userDetailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    minWidth: 48
  },
  userDetailValue: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
    flex: 1
  },

  userCardRight: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 8 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

  childrenContainer: { marginTop: 8 },

  ordersContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  ordersHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 6
  },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  dateText: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },

  orderCardBody: { marginBottom: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  nameLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    minWidth: 42
  },
  partyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  qtyText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB'
  },
  amountLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  amountValue: { fontSize: 15, fontWeight: '800', color: '#111827' },

  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 30
  },
  noResultsText: {
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 13
  },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 14 }
});

export default PendingOrdersScreen;