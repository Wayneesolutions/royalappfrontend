import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuth } from "../../../../context/AuthContext";
import DashboardHeader from "../AdminHeader";
import { useRoute } from '@react-navigation/native';
import apiService from '../../../../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  isActive: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  companies: Array<{
    companyId: {
      _id: string;
      companyName: string;
      companyCode: string;
    };
    isActive: boolean;
  }>;
  groups?: Array<{
    groupId: string | {
      _id: string;
      GroupGUID: string;
      GroupName: string;
      GroupParent?: string | null;
      cmpcode: string;
      Remarks?: string;
      other1?: string;
      other2?: string;
      other3?: string;
      other4?: string;
    };
    groupGUID?: string;
    GroupGUID?: string;
    GroupName?: string;
    GroupParent?: string | null;
    cmpcode?: string;
    Remarks?: string;
    Other1?: string;
    Other2?: string;
    Other3?: string;
    Other4?: string;
    isActive?: boolean;
    assignedBy?: string;
    assignedAt?: string;
  }>;
  primaryGroup?: {
    _id: string;
    GroupGUID: string;
    GroupName: string;
    GroupParent?: string | null;
    cmpcode: string;
    Remarks?: string;
    Other1?: string;
    Other2?: string;
    Other3?: string;
    Other4?: string;
  } | null;
  tallyGroup?: {
    groupId?: string;
    GroupGUID?: string;
    GroupName?: string;
    GroupParent?: string | null;
    cmpcode?: string;
    Remarks?: string;
    Other1?: string;
    Other2?: string;
    Other3?: string;
    Other4?: string;
  } | null;
  hierarchy?: {
    parentUser?: {
      _id: string;
      name: string;
      email: string;
      role: string;
      mobile?: string;
    } | string | null;
    level?: number;
  };
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Group {
  _id: string;
  GroupGUID: string;
  GroupName: string;
  GroupParent: string | null;
  cmpcode: string;
  Remarks: string;
}

const Users = () => {
  const { user, getUsersByCompany, createUser, editUser, deleteUser } = useAuth();
  const route = useRoute();
  const routeParams = route.params as { role?: string } | undefined;
  
  // Check if user can create users (admin can, zonal, rsm and asm cannot)
  const canCreateUser = user?.role !== 'zonal' && user?.role !== 'rsm' && user?.role !== 'asm';
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(routeParams?.role || '');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
    parentUserId: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India"
    },
    subdealerDetails: {
      SDName: "",
      SDType: "",
      SDAddress1: "",
      SDAddress2: "",
      SDAddress3: "",
      SDState: "",
      SDCountry: "India",
      SDPincode: "",
      SDContactPerson: "",
      SDMobileNo: "",
      SDEmail: "",
      SDGSTNType: "",
      SDGSTNNumber: ""
    }
  });

  // State for parent user selection (populated from users-by-company API)
  const [allUsersForParent, setAllUsersForParent] = useState<User[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  // State for group selection (Tally groups) - not used anymore, kept for backward compatibility
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const availableRoles = [
    { value: 'zonal', label: 'Zonal Manager', level: 2 },
    { value: 'rsm', label: 'Regional Sales Manager', level: 3 },
    { value: 'asm', label: 'Area Sales Manager', level: 4 },
    { value: 'dealers', label: 'Dealer', level: 6 },
    { value: 'distibutors', label: 'Distributor', level: 6 },
    { value: 'subdealer', label: 'Sub Dealer', level: 7 },
    { value: 'salesman', label: 'Salesman', level: 5 },
  ];

  // All roles that can be selected as parent
  const parentRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'zonal', label: 'Zonal Manager' },
    { value: 'rsm', label: 'Regional Sales Manager' },
    { value: 'asm', label: 'Area Sales Manager' },
    { value: 'dealers', label: 'Dealer' },
    { value: 'subdealer', label: 'Sub Dealer' },
    { value: 'distibutors', label: 'Distributor' },
    { value: 'salesman', label: 'Salesman' },
  ];

  // Role hierarchy order for display
  const roleOrder = ['zonal', 'rsm', 'asm', 'dealers', 'distibutors', 'subdealer', 'salesman'];
  
  // Static mock users for testing parent selection

  // Fetch all users for parent selection from users-by-company API
  const fetchAllUsersForParent = async () => {
    try {
      setLoadingParents(true);
      
      // Fetch users from users-by-company API (with high limit to get all users)
      const result = await getUsersByCompany({ limit: 1000 });
      
      if (result && result.users && Array.isArray(result.users)) {
        // Format users from users-by-company API response
        // The API already returns users in the correct format with groups array
        const formattedUsers: User[] = result.users.map((u: any) => ({
          _id: u._id,
          name: u.name,
          email: u.email || '',
          mobile: u.mobile,
          role: u.role,
          userName: u.userName || '',
          isActive: u.isActive !== false,
          companies: u.companies || [],
          groups: u.groups || [],
          hierarchy: u.hierarchy || { level: null },
          address: u.address,
          createdAt: u.createdAt || new Date().toISOString()
        }));
        
        setAllUsersForParent(formattedUsers);
      } else {
        console.warn('No users returned from backend, using empty list');
        setAllUsersForParent([]);
      }
    } catch (err) {
      console.error('Failed to fetch users for parent selection:', err);
      setAllUsersForParent([]);
      Alert.alert(
        'Error',
        'Failed to load users for parent selection. Please try again.'
      );
    } finally {
      setLoadingParents(false);
    }
  };

  // Fetch all groups for selection (Tally groups)
  const fetchAllGroups = async () => {
    try {
      setLoadingGroups(true);
      const result = await apiService.adminGetGroupsForSelection();
      
      if (result && result.success && result.data) {
        // Extract groups from the response
        const groups: Group[] = [];
        
        if (result.data.groups && Array.isArray(result.data.groups)) {
          result.data.groups.forEach((g: any) => {
            groups.push({
              _id: g._id,
              GroupGUID: g.GroupGUID,
              GroupName: g.GroupName,
              GroupParent: g.GroupParent || null,
              cmpcode: g.cmpcode,
              Remarks: g.Remarks || ''
            });
          });
        }
        
        setAllGroups(groups);
      } else {
        setAllGroups([]);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setAllGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Filter parent users based on search
  const getFilteredParentUsers = () => {
    let filtered = allUsersForParent;
    
    // Filter by search query if any
    if (parentSearchQuery) {
      filtered = filtered.filter((u: User) =>
        u.name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
        u.mobile.includes(parentSearchQuery) ||
        getRoleLabel(u.role).toLowerCase().includes(parentSearchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Filter groups based on search
  const getFilteredGroups = () => {
    let filtered = allGroups;
    
    // Filter by search query if any
    if (groupSearchQuery) {
      filtered = filtered.filter((g: Group) =>
        g.GroupName.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
        g.GroupGUID.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
        (g.Remarks && g.Remarks.toLowerCase().includes(groupSearchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    const roleObj = availableRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role.toUpperCase();
  };

  // Group users by role for main list display
  const groupUsersByRoleForDisplay = () => {
    const grouped: { [key: string]: User[] } = {};
    
    filteredUsers.forEach((user) => {
      if (!grouped[user.role]) {
        grouped[user.role] = [];
      }
      grouped[user.role].push(user);
    });

    // Sort groups by role hierarchy order
    const sortedGroups: { [key: string]: User[] } = {};
    roleOrder.forEach((role) => {
      if (grouped[role]) {
        sortedGroups[role] = grouped[role].sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return sortedGroups;
  };

  // Get group name from user.groups or primaryGroup
  const getGroupName = (user: User): string => {
    try {
      // First check primaryGroup (most reliable)
      if (user.primaryGroup && typeof user.primaryGroup === 'object') {
        return user.primaryGroup.GroupName || user.primaryGroup.groupName || 'Unknown Group';
      }

      // Then check groups array
      if (user.groups && Array.isArray(user.groups) && user.groups.length > 0) {
        const firstGroup = user.groups[0];
        
        // Check if groupId is populated (object)
        if (firstGroup.groupId && typeof firstGroup.groupId === 'object') {
          return firstGroup.groupId.GroupName || firstGroup.groupId.groupName || 'Unknown Group';
        }
        
        // Check for groupName (lowercase) - new format
        if (firstGroup.groupName) {
          return firstGroup.groupName;
        }
        
        // Check for GroupName (uppercase) - old format
        if (firstGroup.GroupName) {
          return firstGroup.GroupName;
        }
      }

      // No group assigned
      return 'No Group';
    } catch (error) {
      console.error('Error in getGroupName:', error, 'for user:', user.name);
      return 'No Group';
    }
  };

  // Fetch users when component mounts or company changes
  useEffect(() => {
    fetchUsers();
  }, [user?.defaultCompany, selectedRole]);

  // Debug: Log users when they change
  useEffect(() => {
    if (__DEV__ && users.length > 0) {
      console.log('Users state updated:', users.length, 'users');
      const firstUserWithGroup = users.find(u => (u.groups && u.groups.length > 0) || u.primaryGroup);
      if (firstUserWithGroup) {
        console.log('First user with group:', {
          name: firstUserWithGroup.name,
          groups: firstUserWithGroup.groups,
          primaryGroup: firstUserWithGroup.primaryGroup
        });
      }
    }
  }, [users]);

  // Fetch all users for parent selection when modal opens
  useEffect(() => {
    if (modalVisible) {
      fetchAllUsersForParent();
    }
  }, [modalVisible]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (selectedRole) {
        params.role = selectedRole;
      }
      
      const result = await getUsersByCompany(params);
      if (__DEV__) {
        console.log('fetchUsers - result:', JSON.stringify(result, null, 2));
        console.log('fetchUsers - first user hierarchy:', result?.users?.[0]?.hierarchy);
      }
      setUsers(result.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.mobile || !formData.password || !formData.role) {
      Alert.alert("Missing Fields", "Please fill in all required fields (Name, Mobile, Password, Role).");
      return;
    }

    if (!formData.parentUserId) {
      Alert.alert("Missing Parent User", "Please select a parent user. Every user must have a parent in the hierarchy.");
      return;
    }

    if (!user?.defaultCompany?._id) {
      Alert.alert("Error", "No company selected. Please select a company first.");
      return;
    }

    setCreatingUser(true);
    try {
      const userData: any = {
        name: formData.name,
        email: formData.email || undefined, // Make email optional
        mobile: formData.mobile,
        password: formData.password,
        role: formData.role,
        parentUserId: formData.parentUserId,
        userName: formData.email || undefined, // Use email as username if provided
        address: {
          street: formData.address.street || "",
          city: formData.address.city || "",
          state: formData.address.state || "",
          pincode: formData.address.pincode || "",
          country: formData.address.country || "India"
        }
      };

      // Group will be automatically created by backend based on parentUserId
      // GroupParent will be set to the parentUserId

      // Add subdealer details if role is subdealer
      if (formData.role === 'subdealer') {
        userData.subdealerDetails = {
          SDName: formData.subdealerDetails.SDName || "",
          SDType: formData.subdealerDetails.SDType || "",
          SDAddress1: formData.subdealerDetails.SDAddress1 || "",
          SDAddress2: formData.subdealerDetails.SDAddress2 || "",
          SDAddress3: formData.subdealerDetails.SDAddress3 || "",
          SDState: formData.subdealerDetails.SDState || "",
          SDCountry: formData.subdealerDetails.SDCountry || "India",
          SDPincode: formData.subdealerDetails.SDPincode || "",
          SDContactPerson: formData.subdealerDetails.SDContactPerson || "",
          SDMobileNo: formData.subdealerDetails.SDMobileNo || "",
          SDEmail: formData.subdealerDetails.SDEmail || "",
          SDGSTNType: formData.subdealerDetails.SDGSTNType || "",
          SDGSTNNumber: formData.subdealerDetails.SDGSTNNumber || ""
        };
      }

      const response = await createUser(userData);
      
      // Show success message with group info if group was auto-created
      if (response?.user?.groups && response.user.groups.length > 0) {
        const group = response.user.groups[0];
        const parentName = allUsersForParent.find(u => u._id === formData.parentUserId)?.name || 'Parent User';
        Alert.alert(
          "Success", 
          `User created successfully!\n\nGroup Details:\n• Name: ${group.groupName || 'N/A'}\n• GUID: ${group.groupGUID || 'N/A'}\n• Company: ${group.cmpcode || 'N/A'}\n• Parent User: ${group.other4 || parentName}`
        );
      } else {
        Alert.alert("Success", "User created successfully!");
      }
      setFormData({ 
        name: "", 
        email: "", 
        mobile: "", 
        password: "", 
        role: "",
        parentUserId: "",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India"
        },
        subdealerDetails: {
          SDName: "",
          SDType: "",
          SDAddress1: "",
          SDAddress2: "",
          SDAddress3: "",
          SDState: "",
          SDCountry: "India",
          SDPincode: "",
          SDContactPerson: "",
          SDMobileNo: "",
          SDEmail: "",
          SDGSTNType: "",
          SDGSTNNumber: ""
        }
      });
      setShowGroupSelector(false);
      setModalVisible(false);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Failed to create user:', err);
      Alert.alert("Error", "Failed to create user. Please try again.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditUser = (userToEdit: User) => {
    console.log('🔍 Editing user:', userToEdit);
    console.log('🔍 User address:', userToEdit.address);
    
    setEditingUser(userToEdit);
    setIsEditMode(true);
    
    // Get parent user ID from hierarchy
    const parentUserId = userToEdit.hierarchy?.parentUser 
      ? (typeof userToEdit.hierarchy.parentUser === 'string' 
          ? userToEdit.hierarchy.parentUser 
          : (userToEdit.hierarchy.parentUser as any)?._id)
      : "";

    setFormData({
      name: userToEdit.name,
      email: userToEdit.email || "",
      mobile: userToEdit.mobile,
      password: "", // Don't pre-fill password for security
      role: userToEdit.role,
      parentUserId: parentUserId,
      address: {
        street: userToEdit.address?.street || "",
        city: userToEdit.address?.city || "",
        state: userToEdit.address?.state || "",
        pincode: userToEdit.address?.pincode || "",
        country: userToEdit.address?.country || "India"
      },
      subdealerDetails: userToEdit.role === 'subdealer' && (userToEdit as any).subdealerDetails ? {
        SDName: (userToEdit as any).subdealerDetails.SDName || "",
        SDType: (userToEdit as any).subdealerDetails.SDType || "",
        SDAddress1: (userToEdit as any).subdealerDetails.SDAddress1 || "",
        SDAddress2: (userToEdit as any).subdealerDetails.SDAddress2 || "",
        SDAddress3: (userToEdit as any).subdealerDetails.SDAddress3 || "",
        SDState: (userToEdit as any).subdealerDetails.SDState || "",
        SDCountry: (userToEdit as any).subdealerDetails.SDCountry || "India",
        SDPincode: (userToEdit as any).subdealerDetails.SDPincode || "",
        SDContactPerson: (userToEdit as any).subdealerDetails.SDContactPerson || "",
        SDMobileNo: (userToEdit as any).subdealerDetails.SDMobileNo || "",
        SDEmail: (userToEdit as any).subdealerDetails.SDEmail || "",
        SDGSTNType: (userToEdit as any).subdealerDetails.SDGSTNType || "",
        SDGSTNNumber: (userToEdit as any).subdealerDetails.SDGSTNNumber || ""
      } : {
        SDName: "",
        SDType: "",
        SDAddress1: "",
        SDAddress2: "",
        SDAddress3: "",
        SDState: "",
        SDCountry: "India",
        SDPincode: "",
        SDContactPerson: "",
        SDMobileNo: "",
        SDEmail: "",
        SDGSTNType: "",
        SDGSTNNumber: ""
      }
    });
    
    // Fetch all users for parent selection when editing
    fetchAllUsersForParent();
    
    setModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!formData.name || !formData.mobile || !formData.role) {
      Alert.alert("Missing Fields", "Please fill in all required fields (Name, Mobile, Role).");
      return;
    }

    if (!formData.parentUserId) {
      Alert.alert("Missing Parent User", "Please select a parent user. Every user must have a parent in the hierarchy.");
      return;
    }

    console.log('🔍 Updating user with data:', {
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      role: formData.role,
      parentUserId: formData.parentUserId,
      address: formData.address
    });

    setCreatingUser(true);
    try {
      const userData: any = {
        name: formData.name,
        email: formData.email || undefined,
        mobile: formData.mobile,
        role: formData.role,
        parentUserId: formData.parentUserId,
        userName: formData.email || undefined,
        isActive: editingUser.isActive,
        address: {
          street: formData.address.street || "",
          city: formData.address.city || "",
          state: formData.address.state || "",
          pincode: formData.address.pincode || "",
          country: formData.address.country || "India"
        }
      };

      // Add subdealer details if role is subdealer
      if (formData.role === 'subdealer') {
        userData.subdealerDetails = {
          SDName: formData.subdealerDetails.SDName || "",
          SDType: formData.subdealerDetails.SDType || "",
          SDAddress1: formData.subdealerDetails.SDAddress1 || "",
          SDAddress2: formData.subdealerDetails.SDAddress2 || "",
          SDAddress3: formData.subdealerDetails.SDAddress3 || "",
          SDState: formData.subdealerDetails.SDState || "",
          SDCountry: formData.subdealerDetails.SDCountry || "India",
          SDPincode: formData.subdealerDetails.SDPincode || "",
          SDContactPerson: formData.subdealerDetails.SDContactPerson || "",
          SDMobileNo: formData.subdealerDetails.SDMobileNo || "",
          SDEmail: formData.subdealerDetails.SDEmail || "",
          SDGSTNType: formData.subdealerDetails.SDGSTNType || "",
          SDGSTNNumber: formData.subdealerDetails.SDGSTNNumber || ""
        };
      }

      console.log('🔍 Sending user data to API:', userData);

      const response = await editUser(editingUser._id, userData);
      
      // Show success message with group details if available
      if (response?.user?.groups && response.user.groups.length > 0) {
        const group = response.user.groups[0];
        Alert.alert(
          "Success", 
          `User updated successfully!\n\nGroup Details:\n• Name: ${group.groupName || 'N/A'}\n• GUID: ${group.groupGUID || 'N/A'}\n• Company: ${group.cmpcode || 'N/A'}\n• Parent User: ${group.other4 || 'N/A'}`
        );
      } else {
        Alert.alert("Success", "User updated successfully!");
      }
      
      setFormData({ 
        name: "", 
        email: "", 
        mobile: "", 
        password: "", 
        role: "",
        parentUserId: "",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India"
        },
        subdealerDetails: {
          SDName: "",
          SDType: "",
          SDAddress1: "",
          SDAddress2: "",
          SDAddress3: "",
          SDState: "",
          SDCountry: "India",
          SDPincode: "",
          SDContactPerson: "",
          SDMobileNo: "",
          SDEmail: "",
          SDGSTNType: "",
          SDGSTNNumber: ""
        }
      });
      setModalVisible(false);
      setEditingUser(null);
      setIsEditMode(false);
      setShowParentSelector(false);
      setParentSearchQuery('');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Failed to update user:', err);
      Alert.alert("Error", "Failed to update user. Please try again.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = (userToDelete: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to permanently delete ${userToDelete.name}?\n\nThis action cannot be undone and will:\n• Remove the user from all companies\n• Delete all user data\n• Remove access to the system\n\nUser Details:\n• Name: ${userToDelete.name}\n• Email: ${userToDelete.email || 'N/A'}\n• Role: ${userToDelete.role.toUpperCase()}\n• Company: ${userToDelete.companies[0]?.companyName || userToDelete.companies[0]?.companyId?.companyName || 'N/A'}`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete User",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(userToDelete._id);
              Alert.alert("Success", `${userToDelete.name} has been deleted successfully!`);
              fetchUsers(); // Refresh the list
            } catch (err: any) {
              console.error('Failed to delete user:', err);
              Alert.alert("Error", err.message || "Failed to delete user. Please try again.");
            }
          }
        }
      ]
    );
  };


  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    user.role.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const renderUserCard = ({ item }: { item: User }) => {
    // Debug: Log the actual item data
    if (__DEV__ && item.name === 'Zsm') {
      console.log('Rendering user card:', {
        name: item.name,
        groups: item.groups,
        primaryGroup: item.primaryGroup
      });
    }
    
    const groupName = getGroupName(item);
    const hasGroup = groupName !== 'No Group' && groupName !== 'Unknown Group' && (item.groups && item.groups.length > 0 || item.primaryGroup);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
              <Text style={styles.roleText}>{getRoleLabel(item.role)}</Text>
            </View>
          </View>
          {canCreateUser && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEditUser(item)} style={styles.actionButton}>
                <Ionicons name="pencil" size={18} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteUser(item)} style={styles.actionButton}>
                <Ionicons name="trash" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.email || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{item.mobile}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons 
              name={hasGroup ? "layers" : "layers-outline"} 
              size={16} 
              color={hasGroup ? "#10B981" : "#9CA3AF"} 
            />
            <View style={styles.parentUserContainer}>
              <Text style={[
                styles.detailText,
                !hasGroup && styles.noGroupText
              ]}>
                {hasGroup ? groupName : 'No Group Assigned'}
              </Text>
              {hasGroup && item.primaryGroup && (
                <View style={styles.groupBadge}>
                  <Text style={styles.groupBadgeText}>Group</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.companies[0]?.companyName || item.companies[0]?.companyId?.companyName || 'No company assigned'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.mainContainer}>
        <DashboardHeader showNotifications={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0493D2" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.heading}>Company Users</Text>
          {canCreateUser && (
            <TouchableOpacity 
              style={styles.addBtn} 
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add User</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
            <TouchableOpacity
              style={[styles.roleFilter, !selectedRole && styles.roleFilterActive]}
              onPress={() => setSelectedRole('')}
            >
              <Text style={[styles.roleFilterText, !selectedRole && styles.roleFilterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {availableRoles.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleFilter, selectedRole === role.value && styles.roleFilterActive]}
                onPress={() => setSelectedRole(role.value)}
              >
                <Text style={[styles.roleFilterText, selectedRole === role.value && styles.roleFilterTextActive]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Users List */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchText ? 'Try adjusting your search criteria' : 'Add users to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.usersListContainer}>
            {Object.keys(groupUsersByRoleForDisplay()).map((role) => {
              const roleUsers = groupUsersByRoleForDisplay()[role];
              return (
                <View key={role} style={styles.roleGroupContainer}>
                  <View style={styles.roleGroupHeader}>
                    <View style={[styles.roleGroupBadge, { backgroundColor: getRoleColor(role) }]}>
                      <Text style={styles.roleGroupBadgeText}>{getRoleLabel(role)}</Text>
                    </View>
                    <Text style={styles.roleGroupCount}>({roleUsers.length} {roleUsers.length === 1 ? 'user' : 'users'})</Text>
                  </View>
                  {roleUsers.map((user) => (
                    <View key={user._id}>
                      {renderUserCard({ item: user })}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add User Sidebar - Bottom to Top */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.sidebarOverlay}
          activeOpacity={1}
          onPress={() => {
            setModalVisible(false);
            setEditingUser(null);
            setIsEditMode(false);
            setShowParentSelector(false);
            setParentSearchQuery('');
            setFormData({ 
              name: "", 
              email: "", 
              mobile: "", 
              password: "", 
              role: "",
              parentUserId: "",
              groupId: "", // Reset group selection
              address: {
                street: "",
                city: "",
                state: "",
                pincode: "",
                country: "India"
              },
              subdealerDetails: {
                SDName: "",
                SDType: "",
                SDAddress1: "",
                SDAddress2: "",
                SDAddress3: "",
                SDState: "",
                SDCountry: "India",
                SDPincode: "",
                SDContactPerson: "",
                SDMobileNo: "",
                SDEmail: "",
                SDGSTNType: "",
                SDGSTNNumber: ""
              }
            });
          }}
        >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sidebarContainer}>
              {/* Drag Handle */}
              <View style={styles.sidebarDragHandle} />
              
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>
                {isEditMode ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setEditingUser(null);
                setIsEditMode(false);
              setShowParentSelector(false);
              setParentSearchQuery('');
              setFormData({ 
                name: "", 
                email: "", 
                mobile: "", 
                password: "", 
                role: "",
                parentUserId: "",
                groupId: "", // Reset group selection
                address: {
                  street: "",
                  city: "",
                  state: "",
                  pincode: "",
                  country: "India"
                },
                  subdealerDetails: {
                    SDName: "",
                    SDType: "",
                    SDAddress1: "",
                    SDAddress2: "",
                    SDAddress3: "",
                    SDState: "",
                    SDCountry: "India",
                    SDPincode: "",
                    SDContactPerson: "",
                    SDMobileNo: "",
                    SDEmail: "",
                    SDGSTNType: "",
                    SDGSTNNumber: ""
                  }
                });
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sidebarContent}
              contentContainerStyle={styles.sidebarContentContainer}
              showsVerticalScrollIndicator={true}
            >
              {/* Show All Users First */}
              <Text style={styles.sectionLabel}>All Users</Text>
              <Text style={styles.helperText}>
                View all users in the system. Select a parent user below to create a grouping.
              </Text>
              
              <View style={styles.allUsersContainer}>
                <ScrollView style={styles.allUsersList} nestedScrollEnabled>
                  {loadingParents ? (
                    <View style={styles.parentLoadingContainer}>
                      <ActivityIndicator size="small" color="#0493D2" />
                      <Text style={styles.parentLoadingText}>Loading users...</Text>
                    </View>
                  ) : (() => {
                    const allUsers = allUsersForParent;
                    return allUsers.length > 0 ? (
                      allUsers.map((user) => (
                        <View key={user._id} style={styles.userListItem}>
                          <View style={styles.userItemInfo}>
                            <Text style={styles.userItemName}>{user.name}</Text>
                            <Text style={styles.userItemDetails}>
                              {user.email || user.mobile} • {getRoleLabel(user.role)}
                            </Text>
                            {(user.primaryGroup?.GroupName || (user.groups && user.groups.length > 0 && user.groups[0]?.GroupName)) && (
                              <Text style={styles.userItemGroup}>
                                Group: {user.primaryGroup?.GroupName || (user.groups && user.groups[0]?.GroupName)}
                              </Text>
                            )}
                            {(!user.primaryGroup && (!user.groups || user.groups.length === 0)) && (
                              <Text style={[styles.userItemGroup, { color: '#9CA3AF', fontStyle: 'italic' }]}>
                                No Group Assigned
                              </Text>
                            )}
                          </View>
                          <View style={[
                            styles.userStatusBadge,
                            user.isActive ? styles.userStatusActive : styles.userStatusInactive
                          ]}>
                            <Text style={[
                              styles.userStatusText,
                              user.isActive ? { color: '#065F46' } : { color: '#991B1B' }
                            ]}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.parentEmptyState}>
                        <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                        <Text style={styles.parentEmptyText}>No users found</Text>
                      </View>
                    );
                  })()}
                </ScrollView>
              </View>

              <TextInput
                placeholder="Full Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
              />
              <TextInput
                placeholder="Email Address (Optional)"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                placeholder="Mobile Number *"
                value={formData.mobile}
                onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                placeholder={isEditMode ? "Password (Leave blank to keep current)" : "Password *"}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                style={styles.input}
              />
              
              <Text style={styles.roleLabel}>Select Role *</Text>
              <View style={styles.roleOptions}>
                {availableRoles.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      formData.role === role.value && styles.roleOptionSelected
                    ]}
                    onPress={() => {
                      setFormData({ 
                        ...formData, 
                        role: role.value,
                        // Clear subdealer details if role changes from subdealer
                        ...(formData.role === 'subdealer' && role.value !== 'subdealer' ? {
                          subdealerDetails: {
                            SDName: "",
                            SDType: "",
                            SDAddress1: "",
                            SDAddress2: "",
                            SDAddress3: "",
                            SDState: "",
                            SDCountry: "India",
                            SDPincode: "",
                            SDContactPerson: "",
                            SDMobileNo: "",
                            SDEmail: "",
                            SDGSTNType: "",
                            SDGSTNNumber: ""
                          }
                        } : {})
                      });
                    }}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      formData.role === role.value && styles.roleOptionTextSelected
                    ]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Select Parent User Section */}
              <Text style={styles.sectionLabel}>Select Parent User *</Text>
              <Text style={styles.helperText}>
                Select any user as parent. Every user must have a parent in the hierarchy. A group will be automatically created with GroupParent set to the selected parent user's ID.
              </Text>
              
              <TouchableOpacity
                style={styles.parentSelectorButton}
                onPress={() => {
                  if (!showParentSelector) {
                    fetchAllUsersForParent();
                  }
                  setShowParentSelector(!showParentSelector);
                }}
              >
                <View style={styles.parentSelectorContent}>
                  <Ionicons name="people" size={20} color="#6B7280" />
                  <Text style={[
                    styles.parentSelectorText,
                    !formData.parentUserId && styles.parentSelectorPlaceholder
                  ]}>
                    {formData.parentUserId
                      ? allUsersForParent.find(u => u._id === formData.parentUserId)?.name || 'Select parent user'
                      : 'Select parent user'}
                  </Text>
                  <Ionicons 
                    name={showParentSelector ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6B7280" 
                  />
                </View>
              </TouchableOpacity>

              {formData.parentUserId && (
                <View style={styles.selectedParentInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.selectedParentText}>
                    Parent: {allUsersForParent.find(u => u._id === formData.parentUserId)?.name} 
                    ({getRoleLabel(allUsersForParent.find(u => u._id === formData.parentUserId)?.role || '')})
                  </Text>
                </View>
              )}

              {showParentSelector && (
                <View style={styles.parentSelectorDropdown}>
                  {/* Search */}
                  <View style={styles.parentSearchContainer}>
                    <Ionicons name="search" size={16} color="#9CA3AF" />
                    <TextInput
                      style={styles.parentSearchInput}
                      placeholder="Search by name, email, mobile, or role..."
                      value={parentSearchQuery}
                      onChangeText={setParentSearchQuery}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  
                  <ScrollView style={styles.parentListContainer} nestedScrollEnabled>
                    {loadingParents ? (
                      <View style={styles.parentLoadingContainer}>
                        <ActivityIndicator size="small" color="#0493D2" />
                        <Text style={styles.parentLoadingText}>Loading users...</Text>
                      </View>
                    ) : (() => {
                      const filteredUsers = getFilteredParentUsers();
                      const hasUsers = filteredUsers.length > 0;
                      
                      return hasUsers ? (
                        filteredUsers.map((parentUser) => {
                          const isSelected = formData.parentUserId === parentUser._id;
                          return (
                            <TouchableOpacity
                              key={parentUser._id}
                              style={[
                                styles.parentUserItem,
                                isSelected && styles.parentUserItemSelected
                              ]}
                              onPress={() => {
                                setFormData({ 
                                  ...formData, 
                                  parentUserId: parentUser._id
                                });
                                setShowParentSelector(false);
                                setParentSearchQuery('');
                              }}
                            >
                              <View style={styles.parentUserInfo}>
                                <Text style={[
                                  styles.parentUserName,
                                  isSelected && styles.parentUserNameSelected
                                ]}>
                                  {parentUser.name}
                                </Text>
                                <View style={styles.parentUserHeaderRow}>
                                  <View style={[styles.parentRoleBadgeInline, { backgroundColor: getRoleColor(parentUser.role) }]}>
                                    <Text style={styles.parentRoleBadgeTextInline}>
                                      {getRoleLabel(parentUser.role)}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.parentUserDetails}>
                                  {parentUser.email || parentUser.mobile}
                                </Text>
                                {parentUser.hierarchy?.parentUser ? (
                                  <View style={styles.parentUserParentInfo}>
                                    <Ionicons name="person-outline" size={12} color="#6B7280" />
                                    <Text style={styles.parentUserParentText}>
                                      Parent: {parentUser.hierarchy.parentUser.name} ({getRoleLabel(parentUser.hierarchy.parentUser.role)})
                                    </Text>
                                  </View>
                                ) : (
                                  <View style={styles.parentUserParentInfo}>
                                    <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                                    <Text style={[styles.parentUserParentText, { color: '#9CA3AF', fontStyle: 'italic' }]}>
                                      No Parent User
                                    </Text>
                                  </View>
                                )}
                                {(parentUser.primaryGroup?.GroupName || (parentUser.groups && parentUser.groups.length > 0 && (parentUser.groups[0]?.GroupName || parentUser.groups[0]?.groupName))) && (
                                  <View style={styles.parentUserGroupInfo}>
                                    <Ionicons name="layers-outline" size={12} color="#10B981" />
                                    <Text style={styles.userItemGroup}>
                                      Group: {parentUser.primaryGroup?.GroupName || (parentUser.groups && parentUser.groups.length > 0 && (parentUser.groups[0]?.GroupName || parentUser.groups[0]?.groupName))}
                                    </Text>
                                  </View>
                                )}
                                {(!parentUser.primaryGroup && (!parentUser.groups || parentUser.groups.length === 0)) && (
                                  <View style={styles.parentUserGroupInfo}>
                                    <Ionicons name="layers-outline" size={12} color="#9CA3AF" />
                                    <Text style={[styles.userItemGroup, { color: '#9CA3AF', fontStyle: 'italic' }]}>
                                      No Group Assigned
                                    </Text>
                                  </View>
                                )}
                              </View>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={20} color="#0493D2" />
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <View style={styles.parentEmptyState}>
                          <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                          <Text style={styles.parentEmptyText}>No users found</Text>
                          <Text style={styles.parentEmptySubtext}>
                            {parentSearchQuery
                              ? 'Try adjusting your search' 
                              : 'No users available for parent selection'}
                          </Text>
                        </View>
                      );
                    })()}
                  </ScrollView>
                </View>
              )}


              {/* Subdealer Specific Fields - Only show when role is subdealer */}
              {formData.role === 'subdealer' && (
                <>
                  <Text style={styles.sectionLabel}>Sub Dealer Information</Text>
                  
                  <TextInput
                    placeholder="Sub Dealer Name *"
                    value={formData.subdealerDetails.SDName}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDName: text }
                    })}
                    style={styles.input}
                  />

                  <Text style={styles.roleLabel}>Sub Dealer Type *</Text>
                  <View style={styles.roleOptions}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.subdealerDetails.SDType === 'Sub Dealer' && styles.roleOptionSelected
                      ]}
                      onPress={() => setFormData({ 
                        ...formData, 
                        subdealerDetails: { ...formData.subdealerDetails, SDType: 'Sub Dealer' }
                      })}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        formData.subdealerDetails.SDType === 'Sub Dealer' && styles.roleOptionTextSelected
                      ]}>
                        Sub Dealer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        formData.subdealerDetails.SDType === 'TSO' && styles.roleOptionSelected
                      ]}
                      onPress={() => setFormData({ 
                        ...formData, 
                        subdealerDetails: { ...formData.subdealerDetails, SDType: 'TSO' }
                      })}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        formData.subdealerDetails.SDType === 'TSO' && styles.roleOptionTextSelected
                      ]}>
                        TSO
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="Address Line 1"
                    value={formData.subdealerDetails.SDAddress1}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDAddress1: text }
                    })}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Address Line 2"
                    value={formData.subdealerDetails.SDAddress2}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDAddress2: text }
                    })}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Address Line 3"
                    value={formData.subdealerDetails.SDAddress3}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDAddress3: text }
                    })}
                    style={styles.input}
                  />

                  <View style={styles.addressRow}>
                    <TextInput
                      placeholder="State"
                      value={formData.subdealerDetails.SDState}
                      onChangeText={(text) => setFormData({ 
                        ...formData, 
                        subdealerDetails: { ...formData.subdealerDetails, SDState: text }
                      })}
                      style={[styles.input, styles.halfInput]}
                    />
                    
                    <TextInput
                      placeholder="Country"
                      value={formData.subdealerDetails.SDCountry}
                      onChangeText={(text) => setFormData({ 
                        ...formData, 
                        subdealerDetails: { ...formData.subdealerDetails, SDCountry: text }
                      })}
                      style={[styles.input, styles.halfInput]}
                    />
                  </View>

                  <TextInput
                    placeholder="Pincode"
                    value={formData.subdealerDetails.SDPincode}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDPincode: text }
                    })}
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Contact Person"
                    value={formData.subdealerDetails.SDContactPerson}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDContactPerson: text }
                    })}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Mobile Number"
                    value={formData.subdealerDetails.SDMobileNo}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDMobileNo: text }
                    })}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="Email Address"
                    value={formData.subdealerDetails.SDEmail}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDEmail: text }
                    })}
                    keyboardType="email-address"
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="GSTN Type"
                    value={formData.subdealerDetails.SDGSTNType}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDGSTNType: text }
                    })}
                    style={styles.input}
                  />

                  <TextInput
                    placeholder="GSTN Number"
                    value={formData.subdealerDetails.SDGSTNNumber}
                    onChangeText={(text) => setFormData({ 
                      ...formData, 
                      subdealerDetails: { ...formData.subdealerDetails, SDGSTNNumber: text }
                    })}
                    style={styles.input}
                  />
                </>
              )}



              {/* Address Section */}
              <Text style={styles.sectionLabel}>Address Information</Text>
              
              <TextInput
                placeholder="Street Address"
                value={formData.address.street}
                onChangeText={(text) => setFormData({ 
                  ...formData, 
                  address: { ...formData.address, street: text }
                })}
                style={styles.input}
              />
              
              <View style={styles.addressRow}>
                <TextInput
                  placeholder="City"
                  value={formData.address.city}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, city: text }
                  })}
                  style={[styles.input, styles.halfInput]}
                />
                
                <TextInput
                  placeholder="State"
                  value={formData.address.state}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, state: text }
                  })}
                  style={[styles.input, styles.halfInput]}
                />
              </View>
              
              <View style={[styles.addressRow, styles.addressRowLast]}>
                <TextInput
                  placeholder="Pincode"
                  value={formData.address.pincode}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, pincode: text }
                  })}
                  keyboardType="numeric"
                  style={[styles.input, styles.halfInput]}
                />
                
                <TextInput
                  placeholder="Country"
                  value={formData.address.country}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    address: { ...formData.address, country: text }
                  })}
                  style={[styles.input, styles.halfInput]}
                />
              </View>
            </ScrollView>

            <View style={styles.sidebarActions}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={isEditMode ? handleUpdateUser : handleCreateUser} 
                style={styles.saveBtn}
                disabled={creatingUser}
              >
                {creatingUser ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>
                    {isEditMode ? 'Update User' : 'Create User'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            </View>
            </TouchableOpacity>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addBtn: {
    backgroundColor: '#0493D2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersSection: {
    marginBottom: 20,
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
  roleFilters: {
    flexDirection: 'row',
  },
  roleFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleFilterActive: {
    backgroundColor: '#0493D2',
    borderColor: '#0493D2',
  },
  roleFilterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleFilterTextActive: {
    color: '#fff',
  },
  card: {
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
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
  noGroupText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  groupBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  parentUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sidebarContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '95%',
    maxHeight: '98%',
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  sidebarDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sidebarContent: {
    flex: 1,
    padding: 24,
  },
  sidebarContentContainer: {
    paddingBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 14,
    marginTop: 4,
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleOptionSelected: {
    backgroundColor: '#0493D2',
    borderColor: '#0493D2',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  sidebarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
    backgroundColor: '#fff',
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 50,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0493D2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 140,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 14,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0493D2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addressRowLast: {
    marginBottom: 0,
  },
  halfInput: {
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  parentSelectorButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  parentSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parentSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  parentSelectorPlaceholder: {
    color: '#9CA3AF',
  },
  selectedParentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  selectedParentText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  parentSelectorDropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 18,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parentSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  parentSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  parentListContainer: {
    maxHeight: 450,
  },
  parentLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  parentLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  parentRoleGroup: {
    marginBottom: 8,
  },
  parentRoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  parentRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  parentRoleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  parentRoleCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  parentUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  parentUserItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  parentUserInfo: {
    flex: 1,
  },
  parentUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  parentUserNameSelected: {
    color: '#0493D2',
    fontWeight: '600',
  },
  parentUserDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  parentUserHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  parentRoleBadgeInline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  parentRoleBadgeTextInline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  parentUserParentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  parentUserParentText: {
    fontSize: 11,
    color: '#6B7280',
  },
  parentUserGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  parentEmptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  parentEmptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  parentEmptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  hierarchyInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  hierarchyInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  parentUserHierarchy: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  parentRoleFilterContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  parentRoleFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  parentRoleFilters: {
    flexDirection: 'row',
  },
  parentRoleFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  parentRoleFilterActive: {
    backgroundColor: '#0493D2',
    borderColor: '#0493D2',
  },
  parentRoleFilterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  parentRoleFilterTextActive: {
    color: '#fff',
  },
  roleGroupContainer: {
    marginBottom: 24,
  },
  roleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  roleGroupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleGroupBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  roleGroupCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  hierarchyRow: {
    marginTop: 8,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  hierarchyChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hierarchyInfo: {
    flex: 1,
  },
  hierarchyLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hierarchyParent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  hierarchyParentName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  hierarchyParentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hierarchyParentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  usersListSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  usersListToggle: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  usersListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usersListTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  usersListContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 400,
    gap: 20,
  },
  userCategorySection: {
    marginBottom: 20,
  },
  userCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userItemDetails: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  userItemGroup: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  userStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userStatusActive: {
    backgroundColor: '#D1FAE5',
  },
  userStatusInactive: {
    backgroundColor: '#FEE2E2',
  },
  userStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  allUsersContainer: {
    maxHeight: 200,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  allUsersList: {
    maxHeight: 200,
  },
  emptyUsersState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyUsersText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default Users;