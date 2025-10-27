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
  });

  const availableRoles = [
    { value: 'zonal', label: 'Zonal Manager' },
    { value: 'rsm', label: 'Regional Sales Manager' },
    { value: 'asm', label: 'Area Sales Manager' },
    { value: 'salesman', label: 'Salesman' },
    { value: 'dealers', label: 'Dealer' },
    { value: 'subdealer', label: 'Sub Dealer' },
    { value: 'distibutors', label: 'Distributor' },
  ];

  // Fetch users when component mounts or company changes
  useEffect(() => {
    fetchUsers();
  }, [user?.defaultCompany, selectedRole]);

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
        userName: formData.email || undefined, // Use email as username if provided
      };

      await createUser(userData);
      Alert.alert("Success", "User created successfully!");
      setFormData({ name: "", email: "", mobile: "", password: "", role: "" });
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
    setEditingUser(userToEdit);
    setIsEditMode(true);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email || "",
      mobile: userToEdit.mobile,
      password: "", // Don't pre-fill password for security
      role: userToEdit.role,
    });
    setModalVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!formData.name || !formData.mobile || !formData.role) {
      Alert.alert("Missing Fields", "Please fill in all required fields (Name, Mobile, Role).");
      return;
    }

    setCreatingUser(true);
    try {
      const userData = {
        name: formData.name,
        email: formData.email || undefined,
        mobile: formData.mobile,
        role: formData.role,
        userName: formData.email || undefined,
        isActive: editingUser.isActive,
      };

      await editUser(editingUser._id, userData);
      Alert.alert("Success", "User updated successfully!");
      setFormData({ name: "", email: "", mobile: "", password: "", role: "" });
      setModalVisible(false);
      setEditingUser(null);
      setIsEditMode(false);
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

  const renderUserCard = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleEditUser(item)} style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteUser(item)} style={styles.actionButton}>
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="mail" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.mobile}</Text>
        </View>
        {item.hierarchy?.parentUser && (
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Reports to: {item.hierarchy.parentUser.name}</Text>
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
          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add User</Text>
          </TouchableOpacity>
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
          <FlatList
            data={filteredUsers}
            renderItem={renderUserCard}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit User' : 'Add New User'}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setEditingUser(null);
                setIsEditMode(false);
                setFormData({ name: "", email: "", mobile: "", password: "", role: "" });
              }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
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
            </ScrollView>

            <View style={styles.modalActions}>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
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
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0493D2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default Users;