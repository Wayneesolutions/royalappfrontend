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
  hierarchy?: {
    parentUser?: {
      name: string;
      email: string;
      role: string;
    };
  };
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
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
    }
  });

  // State for parent user selection
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [selectedParentRole, setSelectedParentRole] = useState<string>('');

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
  const getStaticUsers = (): User[] => {
    return [
      {
        _id: 'admin1',
        name: 'John Admin',
        email: 'admin@example.com',
        mobile: '9876543210',
        role: 'admin',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'zonal1',
        name: 'Sarah Zonal',
        email: 'zonal@example.com',
        mobile: '9876543211',
        role: 'zonal',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'zonal2',
        name: 'Mike Zonal Manager',
        email: 'mike.zonal@example.com',
        mobile: '9876543212',
        role: 'zonal',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'rsm1',
        name: 'David RSM',
        email: 'rsm@example.com',
        mobile: '9876543213',
        role: 'rsm',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'rsm2',
        name: 'Lisa Regional Manager',
        email: 'lisa.rsm@example.com',
        mobile: '9876543214',
        role: 'rsm',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'asm1',
        name: 'Robert ASM',
        email: 'asm@example.com',
        mobile: '9876543215',
        role: 'asm',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'asm2',
        name: 'Emma Area Manager',
        email: 'emma.asm@example.com',
        mobile: '9876543216',
        role: 'asm',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'dealer1',
        name: 'Rajesh Dealer',
        email: 'dealer@example.com',
        mobile: '9876543217',
        role: 'dealers',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'dealer2',
        name: 'Priya Dealer',
        email: 'priya.dealer@example.com',
        mobile: '9876543218',
        role: 'dealers',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'subdealer1',
        name: 'Amit Sub Dealer',
        email: 'subdealer@example.com',
        mobile: '9876543219',
        role: 'subdealer',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'subdealer2',
        name: 'Sunita Sub Dealer',
        email: 'sunita.sub@example.com',
        mobile: '9876543220',
        role: 'subdealer',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'dist1',
        name: 'Kumar Distributor',
        email: 'dist@example.com',
        mobile: '9876543221',
        role: 'distibutors',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'salesman1',
        name: 'Vikram Salesman',
        email: 'salesman@example.com',
        mobile: '9876543222',
        role: 'salesman',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'salesman2',
        name: 'Anjali Sales Rep',
        email: 'anjali.sales@example.com',
        mobile: '9876543223',
        role: 'salesman',
        isActive: true,
        companies: [],
        createdAt: new Date().toISOString()
      },
    ];
  };

  // Fetch all users for parent selection
  const fetchAllUsersForParent = async () => {
    try {
      setLoadingParents(true);
      
      // Use static data for testing
      const staticUsers = getStaticUsers();
      let filteredUsers: User[] = [];
      
      // Filter out the user being edited
      filteredUsers = staticUsers.filter((u: User) => {
        const isNotEditingUser = !isEditMode || !editingUser || u._id !== editingUser._id;
        return isNotEditingUser;
      });
      
      // Also try to fetch real users and merge
      try {
        const result = await getUsersByCompany({ limit: 1000 });
        if (result && result.users) {
          const realUsers = result.users.filter((u: User) => {
            const isNotEditingUser = !isEditMode || !editingUser || u._id !== editingUser._id;
            return isNotEditingUser;
          });
          
          // Merge static and real users, avoiding duplicates
          realUsers.forEach((realUser: User) => {
            if (!filteredUsers.some(u => u._id === realUser._id)) {
              filteredUsers.push(realUser);
            }
          });
        }
      } catch (err) {
        console.log('Using static data only:', err);
      }
      
      // Also include current logged-in user if not being edited
      if (user) {
        const isNotEditingUser = !isEditMode || !editingUser || user._id !== editingUser._id;
        const alreadyInList = filteredUsers.some(u => u._id === user._id);
        if (isNotEditingUser && !alreadyInList) {
          filteredUsers.push({
            _id: user._id,
            name: user.name,
            email: user.email || '',
            mobile: user.mobile || '',
            role: user.role,
            isActive: true,
            companies: [],
            createdAt: new Date().toISOString()
          } as User);
        }
      }
      
      setAllUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to fetch users for parent selection:', err);
      // Fallback to static data
      const staticUsers = getStaticUsers();
      setAllUsers(staticUsers);
    } finally {
      setLoadingParents(false);
    }
  };

  // Group parent users by role
  const groupParentUsersByRole = () => {
    const grouped: { [key: string]: User[] } = {};
    
    let filtered = allUsers;
    
    // Filter by selected parent role if any
    if (selectedParentRole) {
      filtered = filtered.filter(u => u.role === selectedParentRole);
    }
    
    // Filter by search query if any
    if (parentSearchQuery) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(parentSearchQuery.toLowerCase()) ||
        u.mobile.includes(parentSearchQuery)
      );
    }
    
    filtered.forEach((user) => {
      if (!grouped[user.role]) {
        grouped[user.role] = [];
      }
      grouped[user.role].push(user);
    });

    // Sort groups by role hierarchy order (all roles)
    const sortedGroups: { [key: string]: User[] } = {};
    roleOrder.forEach((role) => {
      if (grouped[role]) {
        sortedGroups[role] = grouped[role].sort((a, b) => a.name.localeCompare(b.name));
      }
    });
    
    // Also include admin if present
    if (grouped['admin']) {
      sortedGroups['admin'] = grouped['admin'].sort((a, b) => a.name.localeCompare(b.name));
    }

    return sortedGroups;
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

  // Get parent user name from hierarchy
  const getParentUserName = (user: User): string => {
    if (user.hierarchy?.parentUser) {
      const parentUser = user.hierarchy.parentUser;
      if (typeof parentUser === 'string') {
        // If it's just an ID, try to find in allUsers or users list
        const parent = allUsers.find(u => u._id === parentUser) || 
                       users.find(u => u._id === parentUser);
        return parent ? parent.name : 'Unknown';
      } else {
        return parentUser?.name || 'Unknown';
      }
    }
    return 'No Parent';
  };

  // Get parent user role from hierarchy
  const getParentUserRole = (user: User): string => {
    if (user.hierarchy?.parentUser) {
      const parentUser = user.hierarchy.parentUser;
      if (typeof parentUser === 'string') {
        const parent = allUsers.find(u => u._id === parentUser) || 
                       users.find(u => u._id === parentUser);
        return parent ? getRoleLabel(parent.role) : 'Unknown';
      } else {
        return getRoleLabel(parentUser?.role || '');
      }
    }
    return '';
  };

  // Fetch users when component mounts or company changes
  useEffect(() => {
    fetchUsers();
  }, [user?.defaultCompany, selectedRole]);

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
      const userData = {
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

      await createUser(userData);
      Alert.alert("Success", "User created successfully!");
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
        }
      });
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
      const userData = {
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

      console.log('🔍 Sending user data to API:', userData);

      await editUser(editingUser._id, userData);
      Alert.alert("Success", "User updated successfully!");
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
        }
      });
      setModalVisible(false);
      setEditingUser(null);
      setIsEditMode(false);
      setShowParentSelector(false);
      setParentSearchQuery('');
      setSelectedParentRole('');
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
      `Are you sure you want to permanently delete ${userToDelete.name}?\n\nThis action cannot be undone and will:\n• Remove the user from all companies\n• Delete all user data\n• Remove access to the system\n\nUser Details:\n• Name: ${userToDelete.name}\n• Email: ${userToDelete.email || 'N/A'}\n• Role: ${userToDelete.role.toUpperCase()}\n• Company: ${userToDelete.companies[0]?.companyId?.companyName || 'N/A'}`,
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
    const parentName = getParentUserName(item);
    const parentRole = getParentUserRole(item);
    
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
          {parentName !== 'No Parent' && (
            <View style={styles.hierarchyRow}>
              <View style={styles.hierarchyChain}>
                <Ionicons name="arrow-up" size={14} color="#6B7280" />
                <View style={styles.hierarchyInfo}>
                  <Text style={styles.hierarchyLabel}>Reports to:</Text>
                  <View style={styles.hierarchyParent}>
                    <Text style={styles.hierarchyParentName}>{parentName}</Text>
                    {parentRole && (
                      <View style={[styles.hierarchyParentBadge, { backgroundColor: getRoleColor(allUsers.find(u => u._id === (item.hierarchy?.parentUser as any)?._id || u.name === parentName)?.role || users.find(u => u._id === (item.hierarchy?.parentUser as any)?._id || u.name === parentName)?.role || '') }]}>
                        <Text style={styles.hierarchyParentBadgeText}>{parentRole}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.companies[0]?.companyId?.companyName || 'No company assigned'}
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
            setSelectedParentRole('');
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
                setSelectedParentRole('');
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
                    onPress={() => setFormData({ ...formData, role: role.value })}
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

              {/* Parent User Selection */}
              <Text style={styles.roleLabel}>Select Parent User *</Text>
              <Text style={styles.hintText}>
                Select any user as parent. Every user must have a parent in the hierarchy.
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
                      ? allUsers.find(u => u._id === formData.parentUserId)?.name || 'Select parent user'
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
                    Parent: {allUsers.find(u => u._id === formData.parentUserId)?.name} 
                    ({getRoleLabel(allUsers.find(u => u._id === formData.parentUserId)?.role || '')})
                  </Text>
                </View>
              )}

              {showParentSelector && (
                <View style={styles.parentSelectorDropdown}>
                  {/* Parent Role Filter */}
                  <View style={styles.parentRoleFilterContainer}>
                    <Text style={styles.parentRoleFilterLabel}>Filter by Role:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parentRoleFilters}>
                      <TouchableOpacity
                        style={[styles.parentRoleFilter, !selectedParentRole && styles.parentRoleFilterActive]}
                        onPress={() => setSelectedParentRole('')}
                      >
                        <Text style={[styles.parentRoleFilterText, !selectedParentRole && styles.parentRoleFilterTextActive]}>
                          All
                        </Text>
                      </TouchableOpacity>
                      {parentRoles.map((role) => (
                        <TouchableOpacity
                          key={role.value}
                          style={[styles.parentRoleFilter, selectedParentRole === role.value && styles.parentRoleFilterActive]}
                          onPress={() => setSelectedParentRole(role.value)}
                        >
                          <Text style={[styles.parentRoleFilterText, selectedParentRole === role.value && styles.parentRoleFilterTextActive]}>
                            {role.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Search */}
                  <View style={styles.parentSearchContainer}>
                    <Ionicons name="search" size={16} color="#9CA3AF" />
                    <TextInput
                      style={styles.parentSearchInput}
                      placeholder="Search by name, email, or mobile..."
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
                      const groupedUsers = groupParentUsersByRole();
                      const hasUsers = Object.keys(groupedUsers).length > 0;
                      
                      return hasUsers ? (
                        Object.keys(groupedUsers).map((role) => {
                          return (
                            <View key={role} style={styles.parentRoleGroup}>
                              <View style={styles.parentRoleHeader}>
                                <View style={[styles.parentRoleBadge, { backgroundColor: getRoleColor(role) }]}>
                                  <Text style={styles.parentRoleBadgeText}>{getRoleLabel(role)}</Text>
                                </View>
                                <Text style={styles.parentRoleCount}>({groupedUsers[role].length})</Text>
                              </View>
                              {groupedUsers[role].map((parentUser) => {
                                return (
                                  <TouchableOpacity
                                    key={parentUser._id}
                                    style={[
                                      styles.parentUserItem,
                                      formData.parentUserId === parentUser._id && styles.parentUserItemSelected
                                    ]}
                                    onPress={() => {
                                      setFormData({ ...formData, parentUserId: parentUser._id });
                                      setShowParentSelector(false);
                                      setParentSearchQuery('');
                                      setSelectedParentRole('');
                                    }}
                                  >
                                    <View style={styles.parentUserInfo}>
                                      <Text style={[
                                        styles.parentUserName,
                                        formData.parentUserId === parentUser._id && styles.parentUserNameSelected
                                      ]}>
                                        {parentUser.name}
                                      </Text>
                                      <Text style={styles.parentUserDetails}>
                                        {parentUser.email || parentUser.mobile}
                                      </Text>
                                    </View>
                                    {formData.parentUserId === parentUser._id && (
                                      <Ionicons name="checkmark-circle" size={20} color="#0493D2" />
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          );
                        })
                      ) : (
                        <View style={styles.parentEmptyState}>
                          <Ionicons name="people-outline" size={32} color="#9CA3AF" />
                          <Text style={styles.parentEmptyText}>No users found</Text>
                          <Text style={styles.parentEmptySubtext}>
                            {parentSearchQuery || selectedParentRole 
                              ? 'Try adjusting your filters' 
                              : 'No users available for parent selection'}
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
  usersListContainer: {
    gap: 20,
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
});

export default Users;