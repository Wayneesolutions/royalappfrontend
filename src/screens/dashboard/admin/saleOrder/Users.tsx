import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import GlobalFAB from "./GlobalFAB";

const Users = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Doe",
      address: "New Delhi, India",
      email: "john@example.com",
      contact: "9876543210",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    contact: "",
  });

  const handleAddUser = () => {
    if (!formData.name || !formData.email || !formData.contact) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    const newId = users.length + 1;
    const newUser = { id: newId, ...formData };
    setUsers([...users, newUser]);
    setFormData({ name: "", address: "", email: "", contact: "" });
    setModalVisible(false);
  };

  const handleEditUser = (id: number) => {
    Alert.alert("Edit User", `Edit functionality for user ID: ${id}`);
  };

  const handleDeleteUser = (id: number) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setUsers(users.filter(u => u.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Feather name="more-vertical" size={24} color="black" />
          <View style={styles.rightIcons}>
            <Feather name="search" size={22} color="black" style={{ marginRight: 12 }} />
            <Feather name="bell" size={22} color="black" />
          </View>
        </View>

        {/* Title Row */}
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Users</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <View style={styles.addBtnContent}>
              <Text style={styles.addBtnText}>Add User</Text>
              <MaterialIcons name="add" size={20} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          </TouchableOpacity>
        </View>

        {/* User Cards */}
        {users.map((user) => (
          <View key={user.id} style={styles.card}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.info}>Address : {user.address}</Text>
            <Text style={styles.info}>Email : {user.email}</Text>
            <Text style={styles.info}>Contact : {user.contact}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleEditUser(user.id)}>
                <Feather name="edit-2" size={18} color="#000" style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteUser(user.id)}>
                <Feather name="trash-2" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal for Add User */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add User</Text>

            <TextInput
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              placeholder="Contact Number"
              value={formData.contact}
              onChangeText={(text) => setFormData({ ...formData, contact: text })}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddUser} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Button */}
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative" },
  scroll: { backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 100 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingBottom: 10,
  },
  rightIcons: { flexDirection: "row", alignItems: "center" },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
    marginTop: 20,
  },
  heading: { fontSize: 22, fontWeight: "bold", paddingBottom: 10 },
  addBtn: {
    backgroundColor: "#077BC3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addBtnContent: { flexDirection: "row", alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  name: { fontSize: 16, fontWeight: "bold", paddingBottom: 4 },
  info: { fontSize: 14, color: "#555", marginBottom: 2 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  icon: { marginRight: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelBtn: {
    marginRight: 10,
    padding: 10,
  },
  cancelText: {
    color: "#999",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#077BC3",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default Users;
