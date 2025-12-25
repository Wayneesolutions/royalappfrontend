import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../services/api';

interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  role?: string;
}

interface GroupNode {
  groupGUID: string;
  groupName: string;
  level: number;
  users: User[];
  dealers: User[];
  childGroups: GroupNode[];
}

interface GroupHierarchyProps {
  onClose?: () => void;
}

type ViewMode = 'overview' | 'users' | 'dealers';

const GroupHierarchy: React.FC<GroupHierarchyProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<GroupNode[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDealers, setTotalDealers] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<GroupNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching group hierarchy...');
      const result = await apiService.getGroupHierarchy();
      
      if (result?.success && result?.data) {
        console.log('✅ Group hierarchy fetched:', {
          totalGroups: result.data.totalGroups,
          totalUsers: result.data.totalUsers,
          totalDealers: result.data.totalDealers,
          hierarchyCount: result.data.hierarchy?.length
        });
        setHierarchy(result.data.hierarchy || []);
        setTotalGroups(result.data.totalGroups || 0);
        setTotalUsers(result.data.totalUsers || 0);
        setTotalDealers(result.data.totalDealers || 0);
        
        // Auto-expand all levels to show complete hierarchy
        const allGroups = new Set<string>();
        const expandAllGroups = (groups: GroupNode[]) => {
          groups.forEach((group: GroupNode) => {
            allGroups.add(group.groupGUID);
            if (group.childGroups && group.childGroups.length > 0) {
              expandAllGroups(group.childGroups);
            }
          });
        };
        if (result.data.hierarchy) {
          expandAllGroups(result.data.hierarchy);
        }
        setExpandedGroups(allGroups);
      }
    } catch (error) {
      console.error('Error fetching group hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupGUID: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupGUID)) {
        newSet.delete(groupGUID);
      } else {
        newSet.add(groupGUID);
      }
      return newSet;
    });
  };

  const openGroupDetail = (group: GroupNode, mode: ViewMode) => {
    setSelectedGroup(group);
    setViewMode(mode);
    setShowDetailModal(true);
  };

  const getGroupLevel = (level: number): string => {
    if (level === 0) return 'Parent';
    if (level === 1) return 'Child';
    if (level === 2) return 'Sub-Child';
    return `Level ${level}`;
  };

  const renderUser = (user: User, type: 'user' | 'dealer') => (
    <View key={user._id} style={styles.userItem}>
      <Ionicons 
        name={type === 'dealer' ? 'storefront' : 'person'} 
        size={16} 
        color={type === 'dealer' ? '#10B981' : '#3B82F6'} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        {user.mobile && (
          <Text style={styles.userDetail}>📱 {user.mobile}</Text>
        )}
        {user.email && (
          <Text style={styles.userDetail}>✉️ {user.email}</Text>
        )}
        {user.role && type === 'user' && (
          <Text style={styles.userRole}>Role: {user.role}</Text>
        )}
      </View>
    </View>
  );

  const renderGroupNode = (group: GroupNode) => {
    const isExpanded = expandedGroups.has(group.groupGUID);
    const hasChildren = group.childGroups.length > 0;
    const usersCount = group.users.length;
    const dealersCount = group.dealers.length;
    const childrenCount = group.childGroups.length;
    const levelLabel = getGroupLevel(group.level);

    return (
      <View key={group.groupGUID} style={styles.groupNode}>
        <View style={styles.groupNodeContent}>
          <TouchableOpacity
            style={styles.groupCard}
            onPress={() => toggleGroup(group.groupGUID)}
            activeOpacity={0.7}
          >
            {/* Expand/Collapse Icon */}
            <View style={styles.expandIcon}>
              {hasChildren ? (
                <Ionicons
                  name={isExpanded ? 'chevron-down-circle' : 'chevron-forward-circle'}
                  size={22}
                  color="#3B82F6"
                />
              ) : (
                <View style={styles.dotIcon} />
              )}
            </View>

            {/* Group Info */}
            <View style={styles.groupInfo}>
              <View style={styles.groupTitleRow}>
                <Ionicons name="folder" size={18} color="#F59E0B" />
                <Text style={styles.groupName} numberOfLines={1}>{group.groupName}</Text>
              </View>
              
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{levelLabel}</Text>
                </View>
              </View>
              
              <View style={styles.groupStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={12} color="#3B82F6" />
                  <Text style={styles.statText}>{usersCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="storefront" size={12} color="#10B981" />
                  <Text style={styles.statText}>{dealersCount}</Text>
                </View>
                {childrenCount > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="git-branch" size={12} color="#F59E0B" />
                    <Text style={styles.statText}>{childrenCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Action Buttons */}
          {(usersCount > 0 || dealersCount > 0) && (
            <View style={styles.actionButtons}>
              {usersCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonUsers]}
                  onPress={() => openGroupDetail(group, 'users')}
                >
                  <Ionicons name="people-outline" size={12} color="#3B82F6" />
                  <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Users ({usersCount})</Text>
                </TouchableOpacity>
              )}
              {dealersCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDealers]}
                  onPress={() => openGroupDetail(group, 'dealers')}
                >
                  <Ionicons name="storefront-outline" size={12} color="#10B981" />
                  <Text style={[styles.actionButtonText, { color: '#10B981' }]}>Dealers ({dealersCount})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Expanded Child Groups */}
        {isExpanded && hasChildren && (
          <View style={styles.childGroupsContainer}>
            {group.childGroups.map(childGroup => renderGroupNode(childGroup))}
          </View>
        )}
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedGroup) return null;

    const dataToShow = viewMode === 'users' ? selectedGroup.users : selectedGroup.dealers;
    const title = viewMode === 'users' ? 'Users' : 'Dealers';
    const icon = viewMode === 'users' ? 'people' : 'storefront';

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{title} in {selectedGroup.groupName}</Text>
              <Text style={styles.modalSubtitle}>{dataToShow.length} {title.toLowerCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={dataToShow}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.detailUserCard}>
                <View style={styles.detailUserIcon}>
                  <Ionicons 
                    name={icon} 
                    size={24} 
                    color={viewMode === 'users' ? '#3B82F6' : '#10B981'} 
                  />
                </View>
                <View style={styles.detailUserInfo}>
                  <Text style={styles.detailUserName}>{item.name}</Text>
                  {item.mobile && (
                    <Text style={styles.detailUserDetail}>📱 {item.mobile}</Text>
                  )}
                  {item.email && (
                    <Text style={styles.detailUserDetail}>✉️ {item.email}</Text>
                  )}
                  {item.role && viewMode === 'users' && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{item.role}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            contentContainerStyle={styles.detailList}
          />
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading group hierarchy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Group Hierarchy</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No group hierarchy found</Text>
          <Text style={styles.emptySubtext}>Groups will appear here once assigned</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="git-network" size={24} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Group Hierarchy</Text>
            <Text style={styles.subtitle}>
              {totalGroups} Groups • {totalUsers} Users • {totalDealers} Dealers
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={fetchHierarchy} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={18} color="#3B82F6" />
        <Text style={styles.infoText}>
          Tap groups to expand/collapse. Use buttons to view details.
        </Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hierarchy.map(group => renderGroupNode(group))}
      </ScrollView>

      {renderDetailModal()}
    </SafeAreaView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#3B82F6',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  groupNode: {
    marginBottom: 8,
  },
  groupNodeContent: {
    flex: 1,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandIcon: {
    marginRight: 10,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
    flex: 1,
  },
  levelBadgeContainer: {
    marginBottom: 6,
  },
  levelBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    paddingLeft: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonUsers: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionButtonDealers: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  childGroupsContainer: {
    marginTop: 2,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 4,
  },
  userInfo: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  userDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  userRole: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#3B82F6',
    borderBottomWidth: 1,
    borderBottomColor: '#2563EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  detailList: {
    padding: 16,
    paddingBottom: 24,
  },
  detailUserCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailUserIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  detailUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  detailUserDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'capitalize',
  },
});

export default GroupHierarchy;

