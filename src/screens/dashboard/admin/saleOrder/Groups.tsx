import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Switch,
  FlatList,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../../../context/AuthContext";
import DashboardHeader from "../AdminHeader";
import { useNavigation } from '@react-navigation/native';
import apiService from '../../../../services/api';

interface Group {
  _id: string;
  GroupGUID: string;
  GroupName: string;
  GroupParent: string | null;
  cmpcode: string;
  Remarks: string;
  other1?: string;
  other2?: string;
  other3?: string;
  other4?: string;
  isActive?: boolean;
  userCount: number;
  dealerCount?: number;
  subDealerCount?: number;
  totalCount?: number;
  createdAt: string;
}

interface GroupUser {
  _id: string;
  type?: 'user' | 'subdealer' | 'dealer';
  name: string;
  email?: string;
  mobile?: string;
  role?: string;
  userName?: string;
  isActive: boolean;
  address?: any;
  hierarchy?: {
    parentUser: {
      _id: string;
      name: string;
      email: string;
      role: string;
    } | null;
    level: number | null;
  };
  groupInfo?: {
    groupGUID: string;
    groupName: string;
    assignedAt: string | null;
  } | null;
  createdAt: string;
  // SubDealer fields
  SDName?: string;
  SDType?: string;
  SDContactPerson?: string;
  SDState?: string;
  SDGSTNNumber?: string;
  // Dealer fields
  LedgerName?: string;
  LedgerState?: string;
  LedgerGSTIN?: string;
}

const Groups = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Create/Edit Group Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    GroupGUID: '',
    GroupName: '',
    GroupParent: '',
    Remarks: '',
    other1: '',
    other2: '',
    other3: '',
    other4: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showParentGroupSelector, setShowParentGroupSelector] = useState(false);
  const [parentGroupSearch, setParentGroupSearch] = useState('');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.adminGetAllGroups() as any;
      if (result && result.success && result.data) {
        setGroups(result.data.groups || []);
      } else {
        setError('Failed to load groups');
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByGroup = async (groupId: string) => {
    try {
      setLoadingUsers(true);
      
      const result = await apiService.adminGetUsersByGroup(groupId) as any;
      if (result && result.success && result.data) {
        // Use members array which includes users, subdealers, and dealers
        setGroupUsers(result.data.members || result.data.users || []);
      } else {
        Alert.alert('Error', 'Failed to load members for this group');
      }
    } catch (err) {
      console.error('Failed to fetch members by group:', err);
      Alert.alert('Error', 'Failed to load members for this group');
    } finally {
      setLoadingUsers(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups();
    if (selectedGroup) {
      await fetchUsersByGroup(selectedGroup._id);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupPress = async (group: Group) => {
    setSelectedGroup(group);
    await fetchUsersByGroup(group._id);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setGroupUsers([]);
    setSearchText('');
  };

  const handleCreateGroup = () => {
    setFormData({
      GroupGUID: '',
      GroupName: '',
      GroupParent: '',
      Remarks: '',
      other1: '',
      other2: '',
      other3: '',
      other4: '',
      isActive: true,
    });
    setShowCreateModal(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      GroupGUID: group.GroupGUID,
      GroupName: group.GroupName,
      GroupParent: group.GroupParent || '',
      Remarks: group.Remarks || '',
      other1: (group as any).other1 || '',
      other2: (group as any).other2 || '',
      other3: (group as any).other3 || '',
      other4: (group as any).other4 || '',
      isActive: group.isActive !== false,
    });
    setShowEditModal(true);
  };

  const handleSelectParentGroup = (group: Group) => {
    setFormData({ ...formData, GroupParent: group.GroupGUID });
    setShowParentGroupSelector(false);
    setParentGroupSearch('');
  };

  const handleRemoveParentGroup = () => {
    setFormData({ ...formData, GroupParent: '' });
  };

  // Helper function to get all descendant groups (to prevent circular references)
  const getDescendantGroups = (parentGUID: string, allGroups: Group[]): string[] => {
    const descendants: string[] = [];
    const findChildren = (guid: string) => {
      const children = allGroups.filter(g => g.GroupParent === guid);
      children.forEach(child => {
        descendants.push(child.GroupGUID);
        findChildren(child.GroupGUID);
      });
    };
    findChildren(parentGUID);
    return descendants;
  };

  // Build hierarchical structure for display
  // Build hierarchical structure for display
  const buildGroupHierarchy = (allGroups: Group[]): (Group & { hierarchyLevel?: number })[] => {
    if (!allGroups || allGroups.length === 0) {
      return [];
    }

    // Create a map for quick lookup
    const groupMap = new Map<string, Group>();
    allGroups.forEach(group => {
      if (group.GroupGUID) {
        groupMap.set(group.GroupGUID, group);
      }
    });

    // Find root groups (groups with no parent or parent not in the list)
    const rootGroups: (Group & { hierarchyLevel?: number })[] = [];
    const processed = new Set<string>();

    const addGroupWithChildren = (group: Group, level: number = 0) => {
      if (!group.GroupGUID || processed.has(group.GroupGUID)) {
        return;
      }
      processed.add(group.GroupGUID);
      
      // Add group with level info
      const groupWithLevel = { ...group, hierarchyLevel: level };
      rootGroups.push(groupWithLevel);

      // Find and add children (check both null and empty string for GroupParent)
      const children = allGroups.filter(g => {
        const parentGUID = g.GroupParent;
        // Check if parentGUID exists, is not empty, and matches current group's GUID
        return parentGUID && typeof parentGUID === 'string' && parentGUID.trim() !== '' && parentGUID === group.GroupGUID;
      });
      
      children.forEach(child => {
        addGroupWithChildren(child, level + 1);
      });
    };

    // Start with root groups (groups with no parent or parent not in the list)
    allGroups.forEach(group => {
      const parentGUID = group.GroupParent;
      // Consider null, undefined, or empty string as no parent
      if (!parentGUID || (typeof parentGUID === 'string' && parentGUID.trim() === '') || !groupMap.has(parentGUID)) {
        addGroupWithChildren(group, 0);
      }
    });

    // Add any remaining groups (orphaned groups - groups whose parent is not in the filtered list)
    allGroups.forEach(group => {
      if (group.GroupGUID && !processed.has(group.GroupGUID)) {
        addGroupWithChildren(group, 0);
      }
    });

    return rootGroups;
  };

  const filteredParentGroups = useMemo(() => {
    // If no groups, return empty array
    if (!groups || groups.length === 0) {
      return [];
    }

    // Get groups to exclude (current group + all its descendants)
    const groupsToExclude = new Set<string>();
    if (editingGroup && editingGroup.GroupGUID) {
      groupsToExclude.add(editingGroup.GroupGUID);
      const descendants = getDescendantGroups(editingGroup.GroupGUID, groups);
      descendants.forEach(guid => groupsToExclude.add(guid));
    }

    // Filter groups
    let filtered = groups.filter(group => {
      // Exclude the current group and its descendants
      if (groupsToExclude.has(group.GroupGUID)) {
        return false;
      }
      
      // Apply search filter
      if (parentGroupSearch && parentGroupSearch.trim()) {
        const searchLower = parentGroupSearch.toLowerCase();
        return (
          group.GroupName.toLowerCase().includes(searchLower) ||
          group.GroupGUID.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });

    // If no filtered groups, return empty array
    if (filtered.length === 0) {
      return [];
    }

    // Try to build hierarchy, but if it fails, just return filtered groups
    let hierarchicalGroups: (Group & { hierarchyLevel?: number })[] = [];
    
    try {
      hierarchicalGroups = buildGroupHierarchy(filtered);
    } catch (error) {
      console.error('Error building hierarchy:', error);
    }
    
    // If hierarchy building failed or returned empty, just return filtered groups with level 0
    if (!hierarchicalGroups || hierarchicalGroups.length === 0) {
      if (filtered.length > 0) {
        // Return filtered groups directly with level 0, sorted by name
        return filtered.map(group => ({ ...group, hierarchyLevel: 0 } as any))
          .sort((a, b) => a.GroupName.localeCompare(b.GroupName));
      }
      return [];
    }
    
    // Sort: root groups first, then by name within each level
    return hierarchicalGroups.sort((a, b) => {
      const levelA = (a as any).hierarchyLevel || 0;
      const levelB = (b as any).hierarchyLevel || 0;
      if (levelA !== levelB) {
        return levelA - levelB;
      }
      return a.GroupName.localeCompare(b.GroupName);
    });
  }, [groups, editingGroup, parentGroupSearch]);

  const handleDeleteGroup = (group: Group) => {
    const totalCount = group.totalCount || group.userCount || 0;
    Alert.alert(
      'Delete Group',
      `Are you sure you want to ${totalCount > 0 ? 'deactivate' : 'delete'} "${group.GroupName}"?${totalCount > 0 ? `\n\nThis group has ${totalCount} member(s) assigned (${group.userCount || 0} users, ${group.dealerCount || 0} dealers, ${group.subDealerCount || 0} subdealers). It will be deactivated instead of deleted.` : ''}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: (group.totalCount || group.userCount || 0) > 0 ? 'Deactivate' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const totalCount = group.totalCount || group.userCount || 0;
              const result = await apiService.adminDeleteGroup(group._id, totalCount === 0) as any;
              if (result && result.success) {
                Alert.alert('Success', result.message || 'Group deleted successfully');
                await fetchGroups();
                if (selectedGroup && selectedGroup._id === group._id) {
                  handleBackToGroups();
                }
              } else {
                Alert.alert('Error', result.message || 'Failed to delete group');
              }
            } catch (err) {
              console.error('Failed to delete group:', err);
              Alert.alert('Error', 'Failed to delete group');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitGroup = async () => {
    if (!formData.GroupName.trim()) {
      Alert.alert('Validation Error', 'Group name is required');
      return;
    }

    try {
      setSubmitting(true);
      let result;
      
      const submitData: any = {
        GroupName: formData.GroupName.trim(),
        GroupParent: formData.GroupParent.trim() || null,
        Remarks: formData.Remarks.trim(),
        other1: formData.other1.trim(),
        other2: formData.other2.trim(),
        other3: formData.other3.trim(),
        other4: formData.other4.trim(),
        isActive: formData.isActive,
      };

      // Only include GroupGUID if provided (for create only)
      if (!showEditModal && formData.GroupGUID.trim()) {
        submitData.GroupGUID = formData.GroupGUID.trim();
      }
      
      if (showEditModal && editingGroup) {
        // Update existing group
        result = await apiService.adminUpdateGroup(editingGroup._id, submitData) as any;
      } else {
        // Create new group
        result = await apiService.adminCreateGroup(submitData) as any;
      }

      if (result && result.success) {
        Alert.alert('Success', result.message || (showEditModal ? 'Group updated successfully' : 'Group created successfully'));
        setShowCreateModal(false);
        setShowEditModal(false);
        setEditingGroup(null);
        setShowParentGroupSelector(false);
        await fetchGroups();
      } else {
        Alert.alert('Error', result.message || (showEditModal ? 'Failed to update group' : 'Failed to create group'));
      }
    } catch (err) {
      console.error('Failed to save group:', err);
      Alert.alert('Error', showEditModal ? 'Failed to update group' : 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingGroup(null);
    setShowParentGroupSelector(false);
    setParentGroupSearch('');
    setFormData({
      GroupGUID: '',
      GroupName: '',
      GroupParent: '',
      Remarks: '',
      other1: '',
      other2: '',
      other3: '',
      other4: '',
      isActive: true,
    });
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'zonal': '#3B82F6',
      'rsm': '#10B981',
      'asm': '#F59E0B',
      'salesman': '#EF4444',
      'dealers': '#8B5CF6',
      'subdealer': '#06B6D4',
      'distibutors': '#84CC16',
    };
    return colors[role] || '#6B7280';
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'zonal': 'Zonal Manager',
      'rsm': 'Regional Sales Manager',
      'asm': 'Area Sales Manager',
      'salesman': 'Salesman',
      'dealers': 'Dealer',
      'subdealer': 'Sub Dealer',
      'distibutors': 'Distributor',
    };
    return roleMap[role] || role.toUpperCase();
  };

  // Build hierarchical groups list with search filter
  const filteredGroups = useMemo(() => {
    // First filter by search text
    let filtered = groups.filter(group =>
      group.GroupName.toLowerCase().includes(searchText.toLowerCase()) ||
      group.GroupGUID.toLowerCase().includes(searchText.toLowerCase())
    );

    // If no search, show all groups in hierarchy
    // Build hierarchy for display
    const hierarchicalGroups = buildGroupHierarchy(filtered);
    
    // Sort: root groups first, then by name within each level
    return hierarchicalGroups.sort((a, b) => {
      const levelA = (a as any).hierarchyLevel || 0;
      const levelB = (b as any).hierarchyLevel || 0;
      if (levelA !== levelB) {
        return levelA - levelB;
      }
      return a.GroupName.localeCompare(b.GroupName);
    });
  }, [groups, searchText]);

  const filteredUsers = groupUsers.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchText.toLowerCase())) ||
    (user.mobile && user.mobile.includes(searchText))
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.mainContainer}>
        <DashboardHeader showNotifications={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0493D2" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </View>
    );
  }

  // Show users list when a group is selected
  if (selectedGroup) {
    return (
      <View style={styles.mainContainer}>
        <DashboardHeader showNotifications={true} />
        
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={handleBackToGroups} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
              <Text style={styles.backButtonText}>Back to Groups</Text>
            </TouchableOpacity>
            <View style={styles.groupHeaderInfo}>
              <Text style={styles.heading}>{selectedGroup.GroupName}</Text>
              <Text style={styles.groupGUID}>GUID: {selectedGroup.GroupGUID}</Text>
              <Text style={styles.userCount}>
                {groupUsers.length} {groupUsers.length === 1 ? 'user' : 'users'}
              </Text>
            </View>
          </View>

          {selectedGroup.Remarks && (
            <View style={styles.remarksContainer}>
              <Text style={styles.remarksLabel}>Remarks:</Text>
              <Text style={styles.remarksText}>{selectedGroup.Remarks}</Text>
            </View>
          )}

          {/* Users List */}
          {loadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0493D2" />
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchUsersByGroup(selectedGroup._id)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No members found in this group</Text>
            </View>
          ) : (
            <View style={styles.usersListContainer}>
              {filteredUsers.map((member) => {
                // Determine member type and render accordingly
                const memberType = member.type || 'user';
                const isUser = memberType === 'user';
                const isSubDealer = memberType === 'subdealer';
                const isDealer = memberType === 'dealer';

                return (
                  <View key={member._id} style={styles.userCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.userInfo}>
                        <Text style={styles.name}>{member.name}</Text>
                        {isUser && member.role && (
                          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
                            <Text style={styles.roleText}>{getRoleLabel(member.role)}</Text>
                          </View>
                        )}
                        {isSubDealer && (
                          <View style={[styles.roleBadge, { backgroundColor: '#F59E0B' }]}>
                            <Text style={styles.roleText}>{member.SDType || 'Sub Dealer'}</Text>
                          </View>
                        )}
                        {isDealer && (
                          <View style={[styles.roleBadge, { backgroundColor: '#8B5CF6' }]}>
                            <Text style={styles.roleText}>Dealer</Text>
                          </View>
                        )}
                        <View style={[styles.typeBadge, { 
                          backgroundColor: isUser ? '#3B82F6' : isSubDealer ? '#F59E0B' : '#8B5CF6' 
                        }]}>
                          <Text style={styles.typeBadgeText}>
                            {isUser ? 'User' : isSubDealer ? 'SubDealer' : 'Dealer'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.userDetails}>
                      {member.email && (
                        <View style={styles.detailRow}>
                          <Ionicons name="mail" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{member.email || 'N/A'}</Text>
                        </View>
                      )}
                      {member.mobile && (
                        <View style={styles.detailRow}>
                          <Ionicons name="call" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{member.mobile || 'N/A'}</Text>
                        </View>
                      )}
                      {isUser && member.hierarchy?.parentUser && (
                        <View style={styles.detailRow}>
                          <Ionicons name="person" size={16} color="#6B7280" />
                          <View style={styles.parentUserContainer}>
                            <Text style={styles.detailText}>{member.hierarchy.parentUser.name}</Text>
                            {member.hierarchy.parentUser.role && (
                              <View style={[styles.parentRoleBadge, { backgroundColor: getRoleColor(member.hierarchy.parentUser.role) }]}>
                                <Text style={styles.parentRoleBadgeText}>
                                  {getRoleLabel(member.hierarchy.parentUser.role)}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                      {isSubDealer && member.SDContactPerson && (
                        <View style={styles.detailRow}>
                          <Ionicons name="person" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>Contact: {member.SDContactPerson}</Text>
                        </View>
                      )}
                      {isSubDealer && member.SDState && (
                        <View style={styles.detailRow}>
                          <Ionicons name="location" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{member.SDState}</Text>
                        </View>
                      )}
                      {isDealer && member.LedgerState && (
                        <View style={styles.detailRow}>
                          <Ionicons name="location" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>{member.LedgerState}</Text>
                        </View>
                      )}
                      {isDealer && member.LedgerGSTIN && (
                        <View style={styles.detailRow}>
                          <Ionicons name="document-text" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>GSTIN: {member.LedgerGSTIN}</Text>
                        </View>
                      )}
                      {isSubDealer && member.SDGSTNNumber && (
                        <View style={styles.detailRow}>
                          <Ionicons name="document-text" size={16} color="#6B7280" />
                          <Text style={styles.detailText}>GSTN: {member.SDGSTNNumber}</Text>
                        </View>
                      )}
                      <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle" size={16} color={member.isActive ? "#10B981" : "#EF4444"} />
                        <Text style={[styles.detailText, { color: member.isActive ? "#10B981" : "#EF4444" }]}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // Show groups list
  return (
    <View style={styles.mainContainer}>
      <DashboardHeader showNotifications={true} />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.heading}>Groups</Text>
              <Text style={styles.subheading}>{groups.length} Total Groups</Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGroup}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Groups List */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchGroups()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No groups found</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Try adjusting your search criteria' : 'Groups will appear here once created'}
            </Text>
          </View>
        ) : (
          <View style={styles.groupsListContainer}>
            {filteredGroups.map((group) => {
              const hierarchyLevel = (group as any).hierarchyLevel || 0;
              const parentGroup = group.GroupParent 
                ? groups.find(g => g.GroupGUID === group.GroupParent)
                : null;
              
              return (
                <View key={group._id} style={styles.groupCard}>
                  <TouchableOpacity
                    style={styles.groupCardContent}
                    onPress={() => handleGroupPress(group)}
                  >
                    <View style={styles.groupCardHeader}>
                      <View style={[
                        styles.groupInfo,
                        hierarchyLevel > 0 && { paddingLeft: hierarchyLevel * 20 }
                      ]}>
                        <View style={styles.groupNameRow}>
                          {hierarchyLevel > 0 && (
                            <View style={styles.hierarchyIndicator}>
                              <Ionicons name="return-down-forward" size={16} color="#9CA3AF" />
                            </View>
                          )}
                          <Ionicons 
                            name={hierarchyLevel === 0 ? "folder" : "folder-outline"} 
                            size={20} 
                            color={hierarchyLevel === 0 ? "#0493D2" : "#6B7280"}
                            style={{ marginRight: 8 }}
                          />
                          <View style={styles.groupNameContainer}>
                            <Text style={styles.groupName}>{group.GroupName}</Text>
                            {hierarchyLevel > 0 && parentGroup && (
                              <View style={styles.parentGroupBadge}>
                                <Ionicons name="arrow-up" size={12} color="#0493D2" />
                                <Text style={styles.parentGroupBadgeText}>
                                  Parent: {parentGroup.GroupName}
                                </Text>
                              </View>
                            )}
                            {group.isActive === false && (
                              <View style={styles.inactiveBadge}>
                                <Text style={styles.inactiveBadgeText}>Inactive</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={styles.groupGUID}>GUID: {group.GroupGUID}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                    </View>
                    
                    <View style={styles.groupCardDetails}>
                      <View style={styles.groupDetailRow}>
                        <Ionicons name="people" size={16} color="#6B7280" />
                        <Text style={styles.groupDetailText}>
                          {group.totalCount || group.userCount || 0} {group.totalCount === 1 || group.userCount === 1 ? 'member' : 'members'}
                          {group.totalCount !== undefined && (
                            <Text style={styles.groupDetailSubText}>
                              {' '}({group.userCount || 0} users, {group.dealerCount || 0} dealers, {group.subDealerCount || 0} subdealers)
                            </Text>
                          )}
                        </Text>
                      </View>
                      {group.Remarks && (
                        <View style={styles.groupDetailRow}>
                          <Ionicons name="document-text" size={16} color="#6B7280" />
                          <Text style={styles.groupDetailText} numberOfLines={1}>
                            {group.Remarks}
                          </Text>
                        </View>
                      )}
                      {hierarchyLevel > 0 && (
                        <View style={styles.groupDetailRow}>
                          <Ionicons name="layers" size={16} color="#0493D2" />
                          <Text style={[styles.groupDetailText, { color: '#0493D2' }]}>
                            Level {hierarchyLevel} {hierarchyLevel === 1 ? 'child' : 'levels'} deep
                          </Text>
                        </View>
                      )}
                      {hierarchyLevel === 0 && (
                        <View style={styles.groupDetailRow}>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <Text style={[styles.groupDetailText, { color: '#F59E0B' }]}>
                            Root Group
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                
                <View style={styles.groupActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditGroup(group)}
                  >
                    <Ionicons name="create-outline" size={18} color="#0493D2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteGroup(group)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={closeModals}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!showEditModal && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Group GUID (Optional)</Text>
                  <Text style={styles.helperText}>Leave empty to auto-generate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Group GUID (e.g., GRP001)"
                    value={formData.GroupGUID}
                    onChangeText={(text) => setFormData({ ...formData, GroupGUID: text })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Group Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter group name"
                  value={formData.GroupName}
                  onChangeText={(text) => setFormData({ ...formData, GroupName: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Parent Group (Optional)</Text>
                <Text style={styles.helperText}>Select a parent group from existing groups</Text>
                {formData.GroupParent ? (
                  <View style={styles.selectedParentContainer}>
                    <View style={styles.selectedParentInfo}>
                      <Ionicons name="folder" size={20} color="#0493D2" />
                      <View style={styles.selectedParentDetails}>
                        <Text style={styles.selectedParentName}>
                          {groups.find(g => g.GroupGUID === formData.GroupParent)?.GroupName || formData.GroupParent}
                        </Text>
                        <Text style={styles.selectedParentGUID}>GUID: {formData.GroupParent}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeParentButton}
                      onPress={handleRemoveParentGroup}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.parentSelectorButton}
                    onPress={() => setShowParentGroupSelector(true)}
                  >
                    <Ionicons name="folder-outline" size={20} color="#6B7280" />
                    <Text style={styles.parentSelectorText}>Select Parent Group</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter remarks"
                  value={formData.Remarks}
                  onChangeText={(text) => setFormData({ ...formData, Remarks: text })}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other1 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other1"
                  value={formData.other1}
                  onChangeText={(text) => setFormData({ ...formData, other1: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other2 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other2"
                  value={formData.other2}
                  onChangeText={(text) => setFormData({ ...formData, other2: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other3 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other3"
                  value={formData.other3}
                  onChangeText={(text) => setFormData({ ...formData, other3: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other4 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other4"
                  value={formData.other4}
                  onChangeText={(text) => setFormData({ ...formData, other4: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Active Status</Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                    trackColor={{ false: '#D1D5DB', true: '#0493D2' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModals}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitGroup}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Group</Text>
              <TouchableOpacity onPress={closeModals}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {!showEditModal && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Group GUID (Optional)</Text>
                  <Text style={styles.helperText}>Leave empty to auto-generate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Group GUID (e.g., GRP001)"
                    value={formData.GroupGUID}
                    onChangeText={(text) => setFormData({ ...formData, GroupGUID: text })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Group Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter group name"
                  value={formData.GroupName}
                  onChangeText={(text) => setFormData({ ...formData, GroupName: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Parent Group (Optional)</Text>
                <Text style={styles.helperText}>Select a parent group from existing groups</Text>
                {formData.GroupParent ? (
                  <View style={styles.selectedParentContainer}>
                    <View style={styles.selectedParentInfo}>
                      <Ionicons name="folder" size={20} color="#0493D2" />
                      <View style={styles.selectedParentDetails}>
                        <Text style={styles.selectedParentName}>
                          {groups.find(g => g.GroupGUID === formData.GroupParent)?.GroupName || formData.GroupParent}
                        </Text>
                        <Text style={styles.selectedParentGUID}>GUID: {formData.GroupParent}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeParentButton}
                      onPress={handleRemoveParentGroup}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.parentSelectorButton}
                    onPress={() => setShowParentGroupSelector(true)}
                  >
                    <Ionicons name="folder-outline" size={20} color="#6B7280" />
                    <Text style={styles.parentSelectorText}>Select Parent Group</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter remarks"
                  value={formData.Remarks}
                  onChangeText={(text) => setFormData({ ...formData, Remarks: text })}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other1 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other1"
                  value={formData.other1}
                  onChangeText={(text) => setFormData({ ...formData, other1: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other2 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other2"
                  value={formData.other2}
                  onChangeText={(text) => setFormData({ ...formData, other2: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other3 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other3"
                  value={formData.other3}
                  onChangeText={(text) => setFormData({ ...formData, other3: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Other4 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Other4"
                  value={formData.other4}
                  onChangeText={(text) => setFormData({ ...formData, other4: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Active Status</Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                    trackColor={{ false: '#D1D5DB', true: '#0493D2' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModals}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitGroup}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Parent Group Selector Modal */}
      <Modal
        visible={showParentGroupSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowParentGroupSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.parentSelectorModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Parent Group</Text>
              <TouchableOpacity onPress={() => setShowParentGroupSelector(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.parentSearchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" />
              <TextInput
                style={styles.parentSearchInput}
                placeholder="Search groups..."
                value={parentGroupSearch}
                onChangeText={setParentGroupSearch}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={{ flex: 1 }}>

            {loading ? (
              <View style={styles.emptyParentContainer}>
                <ActivityIndicator size="large" color="#0493D2" />
                <Text style={styles.emptyParentText}>Loading groups...</Text>
              </View>
            ) : filteredParentGroups.length === 0 ? (
              <View style={styles.emptyParentContainer}>
                <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyParentText}>No groups available</Text>
                <Text style={styles.emptyParentSubtext}>
                  {parentGroupSearch 
                    ? 'Try adjusting your search' 
                    : groups.length === 0 
                      ? 'Create groups first to use as parent'
                      : editingGroup 
                        ? 'All groups are descendants of this group or the group itself'
                        : `No groups available (Total: ${groups.length})`}
                </Text>
                {__DEV__ && (
                  <Text style={[styles.emptyParentSubtext, { marginTop: 8, fontSize: 10, color: '#EF4444' }]}>
                    Debug: groups={groups.length}, filtered={filteredParentGroups.length}, editing={editingGroup?._id || 'none'}
                  </Text>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredParentGroups}
                keyExtractor={(item) => item._id}
                renderItem={({ item: group }) => {
                  const hierarchyLevel = (group as any).hierarchyLevel || 0;
                  const parentGroup = group.GroupParent 
                    ? groups.find(g => g.GroupGUID === group.GroupParent)
                    : null;
                  
                  return (
                    <TouchableOpacity
                      style={[
                        styles.parentGroupItem,
                        hierarchyLevel > 0 && { paddingLeft: 16 + (hierarchyLevel * 24) }
                      ]}
                      onPress={() => handleSelectParentGroup(group)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.parentGroupItemContent}>
                        {hierarchyLevel > 0 && (
                          <Ionicons name="return-down-forward" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                        )}
                        <Ionicons 
                          name={hierarchyLevel === 0 ? "folder" : "folder-outline"} 
                          size={24} 
                          color={hierarchyLevel === 0 ? "#0493D2" : "#6B7280"} 
                        />
                        <View style={styles.parentGroupItemInfo}>
                          <View style={styles.parentGroupItemHeader}>
                            <Text style={styles.parentGroupItemName}>{group.GroupName}</Text>
                            {hierarchyLevel > 0 && parentGroup && (
                              <Text style={styles.parentGroupItemParent}>
                                ← {parentGroup.GroupName}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.parentGroupItemGUID}>GUID: {group.GroupGUID}</Text>
                          {group.Remarks && (
                            <Text style={styles.parentGroupItemRemarks} numberOfLines={1}>
                              {group.Remarks}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  );
                }}
                style={styles.parentGroupList}
                contentContainerStyle={styles.parentGroupListContent}
                ListEmptyComponent={() => (
                  <View style={styles.emptyParentContainer}>
                    <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyParentText}>No groups available</Text>
                    <Text style={styles.emptyParentSubtext}>
                      {parentGroupSearch 
                        ? 'Try adjusting your search' 
                        : groups.length === 0 
                          ? 'Create groups first to use as parent'
                          : editingGroup 
                            ? 'All groups are descendants of this group or the group itself'
                            : `No groups available (Total: ${groups.length})`}
                    </Text>
                  </View>
                )}
              />
            )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 100,
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
  headerSection: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#6B7280',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#0493D2',
    fontWeight: '600',
  },
  groupHeaderInfo: {
    marginTop: 8,
  },
  groupGUID: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  userCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  groupDetailSubText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  remarksContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: '#1E40AF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  groupsListContainer: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupCardDetails: {
    gap: 8,
  },
  groupDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupDetailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  usersListContainer: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  userDetails: {
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
  parentUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  parentRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  parentRoleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0493D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0493D2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupCardContent: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  hierarchyIndicator: {
    marginRight: 4,
  },
  groupNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  parentGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  parentGroupBadgeText: {
    fontSize: 11,
    color: '#0493D2',
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '600',
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    height: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0493D2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  parentSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  parentSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
  },
  selectedParentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  selectedParentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedParentDetails: {
    flex: 1,
  },
  selectedParentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  selectedParentGUID: {
    fontSize: 12,
    color: '#3B82F6',
  },
  removeParentButton: {
    padding: 4,
  },
  parentSelectorModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    height: '90%',
    flex: 1,
  },
  parentSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  parentSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  parentGroupList: {
    flex: 1,
  },
  parentGroupListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexGrow: 1,
  },
  parentGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  parentGroupItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parentGroupItemInfo: {
    flex: 1,
  },
  parentGroupItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  parentGroupItemParent: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  parentGroupItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  parentGroupItemGUID: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  parentGroupItemRemarks: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyParentContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyParentText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyParentSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default Groups;

