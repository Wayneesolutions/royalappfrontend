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
  Platform,
  Dimensions,
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

interface Dealer {
  _id: string;
  LedgerGUID: string;
  LedgerName: string;
  LedgerMobile?: string;
  Email?: string;
  LedgerAddress1?: string;
  LedgerAddress2?: string;
  LedgerState?: string;
  isActive: boolean;
}

const Users = () => {
  const { user, getUsersByCompany, createUser, editUser, deleteUser } = useAuth();
  const screenWidth = Dimensions.get('window').width;
  const isWeb = Platform.OS === 'web';
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
    groupId: "",
    dealerIds: [] as string[], // Array for multiple dealers
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India"
    },
  });

  // State for parent user selection (populated from users-by-company API)
  const [allUsersForParent, setAllUsersForParent] = useState<User[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');

  // State for group selection
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  // State for dealer selection
  const [allDealers, setAllDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [showDealerSelector, setShowDealerSelector] = useState(false);
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');

  // State for company assignment
  const [adminCompanies, setAdminCompanies] = useState<Array<{
    _id: string;
    companyName: string;
    companyCode: string;
  }>>([]);
  const [showCompanyAssignModal, setShowCompanyAssignModal] = useState(false);
  const [selectedUserForCompany, setSelectedUserForCompany] = useState<User | null>(null);
  const [assigningToCompany, setAssigningToCompany] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Note: Regular users created by admin don't need roles - they are group users
  // Only superadmin, admin, dealers, and subdealers have roles
  const availableRoles: any[] = []; // Empty - no role selection for regular users

  // All roles that can be selected as parent (dealers and subdealers removed - managed separately)
  const parentRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'zonal', label: 'Zonal Manager' },
    { value: 'rsm', label: 'Regional Sales Manager' },
    { value: 'asm', label: 'Area Sales Manager' },
    { value: 'distibutors', label: 'Distributor' },
    { value: 'salesman', label: 'Salesman' },
  ];

  // Role hierarchy order for display (dealers and subdealers removed - managed separately)
  const roleOrder = ['zonal', 'rsm', 'asm', 'distibutors', 'salesman'];
  
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

  // Fetch all groups for selection
  const fetchAllGroups = async () => {
    try {
      setLoadingGroups(true);
      const result = await apiService.adminGetAllGroups();
      
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

  // Fetch admin's companies for assignment
  useEffect(() => {
    if (user?.companies && Array.isArray(user.companies)) {
      const companies = user.companies
        .filter((c: any) => c.isActive !== false)
        .map((c: any) => {
          const companyId = c.companyId;
          if (typeof companyId === 'object' && companyId !== null) {
            return {
              _id: companyId._id,
              companyName: companyId.companyName || '',
              companyCode: companyId.companyCode || ''
            };
          }
          return null;
        })
        .filter((c: any) => c !== null);
      setAdminCompanies(companies);
    }
  }, [user]);

  // Handle assign user to company
  const handleAssignToCompany = (userToAssign: User) => {
    setSelectedUserForCompany(userToAssign);
    setShowCompanyAssignModal(true);
    setCompanySearchQuery('');
  };

  // Assign user to selected company
  const handleConfirmCompanyAssignment = async (companyId: string) => {
    if (!selectedUserForCompany) return;

    // Check if user already has this company
    const userCompanyIds = selectedUserForCompany.companies
      .filter(c => c.isActive !== false)
      .map(c => {
        const compId = c.companyId;
        return typeof compId === 'object' && compId !== null ? compId._id : compId;
      });

    if (userCompanyIds.includes(companyId)) {
      Alert.alert(
        'Already Assigned',
        'This user is already assigned to the selected company.'
      );
      return;
    }

    setAssigningToCompany(true);
    try {
      const result = await apiService.adminAssignUserToCompany(
        selectedUserForCompany._id,
        companyId
      );

      if (result?.success) {
        Alert.alert('Success', 'User assigned to company successfully!');
        setShowCompanyAssignModal(false);
        setSelectedUserForCompany(null);
        fetchUsers(); // Refresh user list
      } else {
        Alert.alert('Error', result?.message || 'Failed to assign user to company.');
      }
    } catch (error: any) {
      console.error('Error assigning user to company:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to assign user to company. Please try again.'
      );
    } finally {
      setAssigningToCompany(false);
    }
  };

  // Fetch all dealers for selection
  const fetchAllDealers = async () => {
    try {
      setLoadingDealers(true);
      const result = await apiService.adminGetAllDealers({ includeInactive: false });
      
      if (result && result.success && result.data) {
        // Extract dealers from the response
        const dealers: Dealer[] = [];
        
        if (result.data.dealers && Array.isArray(result.data.dealers)) {
          result.data.dealers.forEach((d: any) => {
            dealers.push({
              _id: d._id,
              LedgerGUID: d.LedgerGUID,
              LedgerName: d.LedgerName,
              LedgerMobile: d.LedgerMobile,
              Email: d.Email,
              LedgerAddress1: d.LedgerAddress1,
              LedgerAddress2: d.LedgerAddress2,
              LedgerState: d.LedgerState,
              isActive: d.isActive !== false
            });
          });
        }
        
        setAllDealers(dealers);
      } else {
        setAllDealers([]);
      }
    } catch (err) {
      console.error('Failed to fetch dealers:', err);
      setAllDealers([]);
    } finally {
      setLoadingDealers(false);
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

  // Filter dealers based on search
  const getFilteredDealers = () => {
    let filtered = allDealers;
    
    // Filter by search query if any
    if (dealerSearchQuery) {
      filtered = filtered.filter((d: Dealer) =>
        d.LedgerName.toLowerCase().includes(dealerSearchQuery.toLowerCase()) ||
        d.LedgerGUID.toLowerCase().includes(dealerSearchQuery.toLowerCase()) ||
        (d.LedgerMobile && d.LedgerMobile.includes(dealerSearchQuery)) ||
        (d.Email && d.Email.toLowerCase().includes(dealerSearchQuery.toLowerCase()))
      );
    }
    
    return filtered;
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    // All users are group users
    if (!role || role === 'groupuser' || role === '') {
      return 'Group User';
    }
    // For legacy roles, show as-is
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // All users are group users - no need to group by role
  const groupUsersByRoleForDisplay = () => {
    // Simply return all users as group users
    return { 'groupuser': filteredUsers.sort((a, b) => a.name.localeCompare(b.name)) };
  };

  // Get group name from user.groups or primaryGroup
  const getGroupName = (user: User): string => {
    try {
      // First check primaryGroup (most reliable)
      if (user.primaryGroup && typeof user.primaryGroup === 'object') {
        return user.primaryGroup.GroupName || 'Unknown Group';
      }

      // Then check groups array
      if (user.groups && Array.isArray(user.groups) && user.groups.length > 0) {
        const firstGroup = user.groups[0];
        
        // Check if groupId is populated (object)
        if (firstGroup.groupId && typeof firstGroup.groupId === 'object') {
          return firstGroup.groupId.GroupName || 'Unknown Group';
        }
        
        // Check for GroupName (uppercase)
        if (firstGroup.GroupName) {
          return firstGroup.GroupName;
        }
        
        // Check for groupName (lowercase) - fallback
        if ((firstGroup as any).groupName) {
          return (firstGroup as any).groupName;
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


  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        limit: 1000, // Fetch all users (high limit to get all users in the company)
        page: 1
      };
      if (selectedRole) {
        params.role = selectedRole;
      }
      
      const result = await getUsersByCompany(params);
      if (__DEV__) {
        console.log('fetchUsers - result:', JSON.stringify(result, null, 2));
        console.log('fetchUsers - first user hierarchy:', result?.users?.[0]?.hierarchy);
        console.log('fetchUsers - total users received:', result?.users?.length || 0);
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
    if (!formData.name || !formData.mobile || !formData.password) {
      Alert.alert("Missing Fields", "Please fill in all required fields (Name, Mobile, Password).");
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
        // Note: Regular users don't have roles - they are group users
        // Role will be set to 'groupuser' by backend if not provided
        role: 'groupuser', // Default role for group users
        parentUserId: formData.parentUserId || undefined, // Make parent user optional
        groupId: formData.groupId || undefined, // Group assignment (optional)
        dealerIds: (formData.dealerIds && formData.dealerIds.length > 0) ? formData.dealerIds : undefined, // Multiple dealer assignment (optional)
        userName: formData.email || undefined, // Use email as username if provided
        address: {
          street: formData.address.street || "",
          city: formData.address.city || "",
          state: formData.address.state || "",
          pincode: formData.address.pincode || "",
          country: formData.address.country || "India"
        }
      };

      // If groupId is provided, it will be used
      // Otherwise, group will be automatically created by backend based on parentUserId

      // Note: Dealers and subdealers are now managed separately through Ledger and SubDealer models

      const response = await createUser(userData);
      
      // Show success message with group info if group was auto-created
      if (response?.user?.groups && response.user.groups.length > 0) {
        const group = response.user.groups[0];
        const parentName = allUsersForParent.find(u => u._id === formData.parentUserId)?.name || 'Parent User';
        const groupName = (group as any).GroupName || (group as any).groupName || 'N/A';
        const groupGUID = (group as any).GroupGUID || (group as any).groupGUID || 'N/A';
        Alert.alert(
          "Success", 
          `User created successfully!\n\nGroup Details:\n• Name: ${groupName}\n• GUID: ${groupGUID}\n• Company: ${(group as any).cmpcode || 'N/A'}\n• Parent User: ${(group as any).other4 || parentName}`
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
        groupId: "",
        dealerIds: [],
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India"
        },
      });
      setShowGroupSelector(false);
      setShowDealerSelector(false);
      setGroupSearchQuery('');
      setDealerSearchQuery('');
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

    // Get group ID from user's groups (use first active group if available)
    const userGroupId = userToEdit.groups && userToEdit.groups.length > 0
      ? (typeof userToEdit.groups[0].groupId === 'string'
          ? userToEdit.groups[0].groupId
          : (userToEdit.groups[0].groupId as any)?._id || '')
      : "";

    // Get assigned dealer IDs if available
    const assignedDealerIds: string[] = [];
    console.log('🔍 User assignedDealerIds:', (userToEdit as any).assignedDealerIds);
    if ((userToEdit as any).assignedDealerIds && Array.isArray((userToEdit as any).assignedDealerIds)) {
      assignedDealerIds.push(...(userToEdit as any).assignedDealerIds.map((id: any) => {
        const dealerId = typeof id === 'object' && id !== null ? (id._id || id) : id;
        console.log('🔍 Mapped dealer ID:', dealerId, 'from:', id);
        return dealerId;
      }));
    }
    console.log('🔍 Final assignedDealerIds array:', assignedDealerIds);

    setFormData({
      name: userToEdit.name,
      email: userToEdit.email || "",
      mobile: userToEdit.mobile,
      password: "", // Don't pre-fill password for security
      role: userToEdit.role,
      parentUserId: parentUserId,
      groupId: userGroupId,
      dealerIds: assignedDealerIds, // Initialize dealerIds array
      address: {
        street: userToEdit.address?.street || "",
        city: userToEdit.address?.city || "",
        state: userToEdit.address?.state || "",
        pincode: userToEdit.address?.pincode || "",
        country: userToEdit.address?.country || "India"
      },
    });
    
    // Fetch all groups and dealers for selection when editing
    fetchAllGroups();
    fetchAllDealers(); // Fetch dealers to show existing assignments
    
    setModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!formData.name || !formData.mobile) {
      Alert.alert("Missing Fields", "Please fill in all required fields (Name, Mobile).");
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
        role: 'groupuser', // All users are group users (no role selection)
        parentUserId: formData.parentUserId || undefined, // Make parent user optional
        groupId: formData.groupId || undefined, // Group assignment (optional)
        dealerIds: (formData.dealerIds && formData.dealerIds.length > 0) ? formData.dealerIds : undefined, // Multiple dealer assignment (optional)
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

      // Note: Dealers and subdealers are now managed separately through Ledger and SubDealer models

      console.log('🔍 Sending user data to API:', userData);

      const response = await editUser(editingUser._id, userData);
      
      // Show success message with group details if available
      if (response?.user?.groups && response.user.groups.length > 0) {
        const group = response.user.groups[0];
        Alert.alert(
          "Success", 
          `User updated successfully!\n\nGroup Details:\n• Name: ${group.GroupName || (group as any).groupName || 'N/A'}\n• GUID: ${group.GroupGUID || (group as any).groupGUID || 'N/A'}\n• Company: ${group.cmpcode || 'N/A'}\n• Parent User: ${(group as any).other4 || 'N/A'}`
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
        groupId: "",
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
          country: "India"
        },
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
      `Are you sure you want to permanently delete ${userToDelete.name}?\n\nThis action cannot be undone and will:\n• Remove the user from all companies\n• Delete all user data\n• Remove access to the system\n\nUser Details:\n• Name: ${userToDelete.name}\n• Email: ${userToDelete.email || 'N/A'}\n• Role: ${userToDelete.role.toUpperCase()}\n• Company: ${(userToDelete.companies[0]?.companyId as any)?.companyName || 'N/A'}`,
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

  // Render modal form content (reusable for both web and mobile)
  const renderModalFormContent = () => {
    return (
      <>
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
        
        {/* Group and Dealer Assignment Section */}
        <Text style={styles.sectionLabel}>Group & Dealer Assignment (Optional)</Text>
        <Text style={styles.helperText}>
          You can assign both a group and dealers to the user. If no group is selected, a group will be automatically created based on parent user.
        </Text>
        
        {/* Group Selection */}
        {formData.groupId ? (
          <View style={styles.selectedGroupContainer}>
            <View style={styles.selectedGroupInfo}>
              <Ionicons name="folder" size={20} color="#0493D2" />
              <View style={styles.selectedGroupDetails}>
                <Text style={styles.selectedGroupName}>
                  {allGroups.find(g => g._id === formData.groupId)?.GroupName || 'Selected Group'}
                </Text>
                <Text style={styles.selectedGroupGUID}>
                  GUID: {allGroups.find(g => g._id === formData.groupId)?.GroupGUID || 'N/A'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.removeGroupButton}
              onPress={() => setFormData({ ...formData, groupId: '' })}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.groupSelectorButton}
            onPress={() => {
              if (!showGroupSelector) {
                fetchAllGroups();
              }
              setShowGroupSelector(!showGroupSelector);
            }}
          >
            <View style={styles.groupSelectorContent}>
              <Ionicons name="folder-outline" size={20} color="#6B7280" />
              <Text style={styles.groupSelectorText}>Select Group (Optional)</Text>
              <Ionicons 
                name={showGroupSelector ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#6B7280" 
              />
            </View>
          </TouchableOpacity>
        )}

        {showGroupSelector && (
          <View style={styles.groupSelectorDropdown}>
            <View style={styles.groupSearchContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.groupSearchInput}
                placeholder="Search groups..."
                value={groupSearchQuery}
                onChangeText={setGroupSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <ScrollView 
              style={styles.groupListContainer} 
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {loadingGroups ? (
                <View style={styles.groupLoadingContainer}>
                  <ActivityIndicator size="small" color="#0493D2" />
                  <Text style={styles.groupLoadingText}>Loading groups...</Text>
                </View>
              ) : (() => {
                const filteredGroups = allGroups.filter(group => {
                  const searchLower = groupSearchQuery.toLowerCase();
                  return (
                    group.GroupName.toLowerCase().includes(searchLower) ||
                    group.GroupGUID.toLowerCase().includes(searchLower) ||
                    (group.Remarks && group.Remarks.toLowerCase().includes(searchLower))
                  );
                });
                
                return filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => {
                    const isSelected = formData.groupId === group._id;
                    return (
                      <TouchableOpacity
                        key={group._id}
                        style={[
                          styles.groupItem,
                          isSelected && styles.groupItemSelected
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, groupId: group._id });
                          setShowGroupSelector(false);
                          setGroupSearchQuery('');
                        }}
                      >
                        <View style={styles.groupItemInfo}>
                          <Ionicons name="folder" size={20} color={isSelected ? "#0493D2" : "#6B7280"} />
                          <View style={styles.groupItemDetails}>
                            <Text style={[
                              styles.groupItemName,
                              isSelected && styles.groupItemNameSelected
                            ]}>
                              {group.GroupName}
                            </Text>
                            <Text style={styles.groupItemGUID}>GUID: {group.GroupGUID}</Text>
                            {group.Remarks && (
                              <Text style={styles.groupItemRemarks} numberOfLines={1}>
                                {group.Remarks}
                              </Text>
                            )}
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#0493D2" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.groupEmptyState}>
                    <Ionicons name="folder-outline" size={32} color="#9CA3AF" />
                    <Text style={styles.groupEmptyText}>No groups found</Text>
                    <Text style={styles.groupEmptySubtext}>
                      {groupSearchQuery ? 'Try adjusting your search' : 'Create groups first'}
                    </Text>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        )}

        {/* Dealer Selection - Multiple Dealers */}
        {formData.dealerIds && formData.dealerIds.length > 0 && (
          <View style={styles.selectedDealersContainer}>
            <Text style={styles.selectedDealersHeader}>
              Selected Dealers ({formData.dealerIds.length})
            </Text>
            {formData.dealerIds.map((dealerId) => {
              const dealer = allDealers.find(d => d._id === dealerId);
              if (!dealer) return null;
              return (
                <View key={dealerId} style={styles.selectedGroupContainer}>
                  <View style={styles.selectedGroupInfo}>
                    <Ionicons name="business" size={20} color="#0493D2" />
                    <View style={styles.selectedGroupDetails}>
                      <Text style={styles.selectedGroupName}>
                        {dealer.LedgerName}
                      </Text>
                      <Text style={styles.selectedGroupGUID}>
                        GUID: {dealer.LedgerGUID}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeGroupButton}
                    onPress={() => {
                      setFormData({ 
                        ...formData, 
                        dealerIds: (formData.dealerIds || []).filter(id => id !== dealerId) 
                      });
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        
        <TouchableOpacity
          style={styles.groupSelectorButton}
          onPress={() => {
            if (!showDealerSelector) {
              fetchAllDealers();
            }
            setShowDealerSelector(!showDealerSelector);
          }}
        >
          <View style={styles.groupSelectorContent}>
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <Text style={styles.groupSelectorText}>
              {(formData.dealerIds && formData.dealerIds.length > 0) 
                ? `Add More Dealers (${formData.dealerIds.length} selected)` 
                : 'Select Dealers (Optional - Multiple)'}
            </Text>
            <Ionicons 
              name={showDealerSelector ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6B7280" 
            />
          </View>
        </TouchableOpacity>

        {showDealerSelector && (
          <View style={styles.groupSelectorDropdown}>
            <View style={styles.groupSearchContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={styles.groupSearchInput}
                placeholder="Search dealers..."
                value={dealerSearchQuery}
                onChangeText={setDealerSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <ScrollView 
              style={styles.groupListContainer} 
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {loadingDealers ? (
                <View style={styles.groupLoadingContainer}>
                  <ActivityIndicator size="small" color="#0493D2" />
                  <Text style={styles.groupLoadingText}>Loading dealers...</Text>
                </View>
              ) : (() => {
                const filteredDealers = getFilteredDealers();
                
                return filteredDealers.length > 0 ? (
                  filteredDealers.map((dealer) => {
                    const isSelected = (formData.dealerIds || []).includes(dealer._id);
                    return (
                      <TouchableOpacity
                        key={dealer._id}
                        style={[
                          styles.groupItem,
                          isSelected && styles.groupItemSelected
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            // Remove dealer from selection
                            setFormData({ 
                              ...formData, 
                              dealerIds: (formData.dealerIds || []).filter(id => id !== dealer._id) 
                            });
                          } else {
                            // Add dealer to selection
                            setFormData({ 
                              ...formData, 
                              dealerIds: [...(formData.dealerIds || []), dealer._id] 
                            });
                          }
                          // Don't close selector - allow multiple selections
                        }}
                      >
                        <View style={styles.groupItemInfo}>
                          <Ionicons name="business" size={20} color={isSelected ? "#0493D2" : "#6B7280"} />
                          <View style={styles.groupItemDetails}>
                            <Text style={[
                              styles.groupItemName,
                              isSelected && styles.groupItemNameSelected
                            ]}>
                              {dealer.LedgerName}
                            </Text>
                            <Text style={styles.groupItemGUID}>GUID: {dealer.LedgerGUID}</Text>
                            {dealer.LedgerMobile && (
                              <Text style={styles.groupItemRemarks} numberOfLines={1}>
                                Mobile: {dealer.LedgerMobile}
                              </Text>
                            )}
                          </View>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#0493D2" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.groupEmptyState}>
                    <Ionicons name="business-outline" size={32} color="#9CA3AF" />
                    <Text style={styles.groupEmptyText}>No dealers found</Text>
                    <Text style={styles.groupEmptySubtext}>
                      {dealerSearchQuery ? 'Try adjusting your search' : 'No dealers available'}
                    </Text>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
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
        
        <View style={styles.addressRow}>
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
      </>
    );
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    user.role.toLowerCase().includes(searchText.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    // All users are group users - use a consistent color
    if (!role || role === 'groupuser' || role === '') {
      return '#3B82F6'; // Blue for group users
    }
    // For legacy roles, use gray
    return '#6B7280';
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
              {adminCompanies.length > 1 && (
                <TouchableOpacity 
                  onPress={() => handleAssignToCompany(item)} 
                  style={styles.actionButton}
                >
                  <Ionicons name="business" size={18} color="#F59E0B" />
                </TouchableOpacity>
              )}
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
              {(item.companies[0]?.companyId as any)?.companyName || 'No company assigned'}
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
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
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
          
          {/* Role filters removed - all users created here are group users (no role-based filtering) */}
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
            {/* All users are group users - display in a single list */}
            {filteredUsers.map((user: User) => (
              <View key={user._id}>
                {renderUserCard({ item: user })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add User Modal - Responsive for Mobile and Web */}
      <Modal 
        visible={modalVisible} 
        animationType={isWeb ? 'fade' : 'slide'} 
        transparent={isWeb}
        presentationStyle={isWeb ? undefined : 'pageSheet'}
        onRequestClose={() => {
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
            groupId: "",
            address: {
              street: "",
              city: "",
              state: "",
              pincode: "",
              country: "India"
            },
          });
        }}
      >
        {isWeb ? (
          // Web: Centered Modal
          <View style={styles.webModalOverlay}>
            <TouchableOpacity 
              style={styles.webModalOverlayTouchable}
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
                  groupId: "",
                  address: {
                    street: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "India"
                  },
                });
              }}
            >
              <View style={[styles.webModalContainer, { maxWidth: Math.min(600, screenWidth - 40) }]} onStartShouldSetResponder={() => true}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
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
                        groupId: "",
                        address: {
                          street: "",
                          city: "",
                          state: "",
                          pincode: "",
                          country: "India"
                        },
                      });
                    }}>
                      <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={styles.modalContent}
                    contentContainerStyle={styles.modalContentContainer}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    scrollEnabled={true}
                  >
                    {renderModalFormContent()}
                  </ScrollView>
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
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
                          groupId: "",
                          address: {
                            street: "",
                            city: "",
                            state: "",
                            pincode: "",
                            country: "India"
                          },
                        });
                      }}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, creatingUser && styles.saveBtnDisabled]}
                      onPress={isEditMode ? handleUpdateUser : handleCreateUser}
                      disabled={creatingUser}
                    >
                      {creatingUser ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveText}>
                          {isEditMode ? 'Update' : 'Create'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
            </TouchableOpacity>
          </View>
        ) : (
          // Mobile: Bottom Sheet
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
                groupId: "",
                address: {
                  street: "",
                  city: "",
                  state: "",
                  pincode: "",
                  country: "India"
                },
              });
            }}
          >
            <View style={styles.sidebarContainer} onStartShouldSetResponder={() => true}>
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
                });
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sidebarContent}
              contentContainerStyle={styles.sidebarContentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              alwaysBounceVertical={false}
              scrollEnabled={true}
            >
              {renderModalFormContent()}
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
        )}
      </Modal>

      {/* Company Assignment Modal */}
      <Modal
        visible={showCompanyAssignModal}
        transparent={true}
        animationType={isWeb ? "fade" : "slide"}
        onRequestClose={() => {
          setShowCompanyAssignModal(false);
          setSelectedUserForCompany(null);
          setCompanySearchQuery('');
        }}
      >
        {isWeb ? (
          // Web Modal
          <View style={styles.webModalOverlay}>
            <View style={styles.companyAssignModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Assign User to Company
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCompanyAssignModal(false);
                    setSelectedUserForCompany(null);
                    setCompanySearchQuery('');
                  }}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.companyAssignModalContent}
                contentContainerStyle={styles.companyAssignModalContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {selectedUserForCompany && (
                  <View style={styles.userInfoSection}>
                    <Text style={styles.userInfoLabel}>User:</Text>
                    <Text style={styles.userInfoText}>{selectedUserForCompany.name}</Text>
                    <Text style={styles.userInfoSubtext}>{selectedUserForCompany.email || selectedUserForCompany.mobile}</Text>
                    
                    {/* Show user's current companies */}
                    {selectedUserForCompany.companies && selectedUserForCompany.companies.length > 0 && (
                      <View style={styles.currentCompaniesSection}>
                        <Text style={styles.currentCompaniesLabel}>Current Companies:</Text>
                        {selectedUserForCompany.companies
                          .filter((c: any) => c.isActive !== false)
                          .map((c: any, index: number) => {
                            const compId = c.companyId;
                            const companyName = typeof compId === 'object' && compId !== null 
                              ? compId.companyName 
                              : 'Unknown Company';
                            return (
                              <View key={index} style={styles.currentCompanyItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.currentCompanyText}>{companyName}</Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.companySearchContainer}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.companySearchIcon} />
                  <TextInput
                    style={styles.companySearchInput}
                    placeholder="Search companies..."
                    value={companySearchQuery}
                    onChangeText={setCompanySearchQuery}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {adminCompanies.filter((company) =>
                  company.companyName.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                  company.companyCode.toLowerCase().includes(companySearchQuery.toLowerCase())
                ).length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="business-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>No companies available</Text>
                  </View>
                ) : (
                  adminCompanies
                    .filter((company) =>
                      company.companyName.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                      company.companyCode.toLowerCase().includes(companySearchQuery.toLowerCase())
                    )
                    .map((item) => {
                      const userCompanyIds = selectedUserForCompany?.companies
                        ?.filter((c: any) => c.isActive !== false)
                        .map((c: any) => {
                          const compId = c.companyId;
                          return typeof compId === 'object' && compId !== null ? compId._id : compId;
                        }) || [];
                      
                      const isAlreadyAssigned = userCompanyIds.includes(item._id);
                      const isCurrentCompany = user?.defaultCompany?._id === item._id;

                      return (
                        <TouchableOpacity
                          key={item._id}
                          style={[
                            styles.companyItem,
                            isAlreadyAssigned && styles.companyItemDisabled,
                            isCurrentCompany && styles.companyItemCurrent
                          ]}
                          onPress={() => {
                            if (!isAlreadyAssigned) {
                              handleConfirmCompanyAssignment(item._id);
                            }
                          }}
                          disabled={isAlreadyAssigned || assigningToCompany}
                        >
                          <View style={styles.companyItemContent}>
                            <Text style={styles.companyItemName}>{item.companyName}</Text>
                            <Text style={styles.companyItemCode}>{item.companyCode}</Text>
                          </View>
                          {isAlreadyAssigned && (
                            <View style={styles.assignedBadge}>
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                              <Text style={styles.assignedText}>Assigned</Text>
                            </View>
                          )}
                          {isCurrentCompany && !isAlreadyAssigned && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                          {!isAlreadyAssigned && !isCurrentCompany && (
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                          )}
                        </TouchableOpacity>
                      );
                    })
                )}
              </ScrollView>

              {assigningToCompany && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Assigning user...</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          // Mobile Modal
          <View style={styles.sidebarOverlay}>
            <View style={styles.companyAssignSidebarContainer}>
              <View style={styles.sidebarDragHandle} />
              <View style={styles.sidebarHeader}>
                <Text style={styles.sidebarTitle}>
                  Assign User to Company
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowCompanyAssignModal(false);
                    setSelectedUserForCompany(null);
                    setCompanySearchQuery('');
                  }}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.sidebarContent}
                contentContainerStyle={styles.sidebarContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {selectedUserForCompany && (
                  <View style={styles.userInfoSection}>
                    <Text style={styles.userInfoLabel}>User:</Text>
                    <Text style={styles.userInfoText}>{selectedUserForCompany.name}</Text>
                    <Text style={styles.userInfoSubtext}>{selectedUserForCompany.email || selectedUserForCompany.mobile}</Text>
                    
                    {/* Show user's current companies */}
                    {selectedUserForCompany.companies && selectedUserForCompany.companies.length > 0 && (
                      <View style={styles.currentCompaniesSection}>
                        <Text style={styles.currentCompaniesLabel}>Current Companies:</Text>
                        {selectedUserForCompany.companies
                          .filter((c: any) => c.isActive !== false)
                          .map((c: any, index: number) => {
                            const compId = c.companyId;
                            const companyName = typeof compId === 'object' && compId !== null 
                              ? compId.companyName 
                              : 'Unknown Company';
                            return (
                              <View key={index} style={styles.currentCompanyItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.currentCompanyText}>{companyName}</Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.companySearchContainer}>
                  <Ionicons name="search" size={20} color="#9CA3AF" style={styles.companySearchIcon} />
                  <TextInput
                    style={styles.companySearchInput}
                    placeholder="Search companies..."
                    value={companySearchQuery}
                    onChangeText={setCompanySearchQuery}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {adminCompanies.filter((company) =>
                  company.companyName.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                  company.companyCode.toLowerCase().includes(companySearchQuery.toLowerCase())
                ).length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="business-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>No companies available</Text>
                  </View>
                ) : (
                  adminCompanies
                    .filter((company) =>
                      company.companyName.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                      company.companyCode.toLowerCase().includes(companySearchQuery.toLowerCase())
                    )
                    .map((item) => {
                      const userCompanyIds = selectedUserForCompany?.companies
                        ?.filter((c: any) => c.isActive !== false)
                        .map((c: any) => {
                          const compId = c.companyId;
                          return typeof compId === 'object' && compId !== null ? compId._id : compId;
                        }) || [];
                      
                      const isAlreadyAssigned = userCompanyIds.includes(item._id);
                      const isCurrentCompany = user?.defaultCompany?._id === item._id;

                      return (
                        <TouchableOpacity
                          key={item._id}
                          style={[
                            styles.companyItem,
                            isAlreadyAssigned && styles.companyItemDisabled,
                            isCurrentCompany && styles.companyItemCurrent
                          ]}
                          onPress={() => {
                            if (!isAlreadyAssigned) {
                              handleConfirmCompanyAssignment(item._id);
                            }
                          }}
                          disabled={isAlreadyAssigned || assigningToCompany}
                        >
                          <View style={styles.companyItemContent}>
                            <Text style={styles.companyItemName}>{item.companyName}</Text>
                            <Text style={styles.companyItemCode}>{item.companyCode}</Text>
                          </View>
                          {isAlreadyAssigned && (
                            <View style={styles.assignedBadge}>
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                              <Text style={styles.assignedText}>Assigned</Text>
                            </View>
                          )}
                          {isCurrentCompany && !isAlreadyAssigned && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                          )}
                          {!isAlreadyAssigned && !isCurrentCompany && (
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                          )}
                        </TouchableOpacity>
                      );
                    })
                )}
              </ScrollView>

              {assigningToCompany && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Assigning user...</Text>
                </View>
              )}
            </View>
          </View>
        )}
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
    flexGrow: 1,
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
  infoMessageContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoMessageText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
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
  // Web Modal Styles
  webModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webModalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: Platform.OS === 'web' ? 600 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    maxHeight: 500,
  },
  webModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: Platform.OS === 'web' ? 600 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'column',
  },
  modalContentContainer: {
    padding: 24,
    paddingBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
    backgroundColor: '#fff',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  // Mobile Modal Styles
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
    flexDirection: 'column',
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
    paddingBottom: 0,
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
    maxHeight: 450,
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
    maxHeight: 400,
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
  // Selected dealers container styles
  selectedDealersContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  selectedDealersHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  // Assignment type styles
  assignmentTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  assignmentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  assignmentTypeButtonActive: {
    backgroundColor: '#0493D2',
    borderColor: '#0493D2',
  },
  assignmentTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  assignmentTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Group selector styles
  groupSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  groupSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  groupSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    gap: 12,
  },
  selectedGroupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedGroupDetails: {
    flex: 1,
  },
  selectedGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  selectedGroupGUID: {
    fontSize: 12,
    color: '#3B82F6',
  },
  removeGroupButton: {
    padding: 4,
  },
  groupSelectorDropdown: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  groupSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  groupListContainer: {
    maxHeight: 350,
  },
  groupLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  groupLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  groupItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupItemDetails: {
    flex: 1,
  },
  groupItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  groupItemNameSelected: {
    color: '#0493D2',
    fontWeight: '600',
  },
  groupItemGUID: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  groupItemRemarks: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  groupEmptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  groupEmptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  groupEmptySubtext: {
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
    gap: 20,
    // Removed maxHeight to allow all users to be displayed and scrollable
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
  // Company Assignment Modal Styles
  webModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  companyAssignModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80vh',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  companyAssignModalContent: {
    flex: 1,
  },
  companyAssignModalContentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  companyAssignSidebarContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userInfoSection: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userInfoSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentCompaniesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  currentCompaniesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  currentCompanyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  currentCompanyText: {
    fontSize: 14,
    color: '#374151',
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  companyItemDisabled: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  companyItemCurrent: {
    backgroundColor: '#EFF6FF',
  },
  companyItemContent: {
    flex: 1,
  },
  companyItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  companyItemCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
  },
  assignedText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  companySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  companySearchIcon: {
    marginRight: 12,
  },
  companySearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
});

export default Users;