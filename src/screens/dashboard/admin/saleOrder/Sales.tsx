import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import GlobalFAB from './GlobalFAB';

const dummyOrders = [
  { id: '#2589641', status: 'Approved', date: 'Today' },
  { id: '#2589641', status: 'Rejected', date: '12 Jun 2025' },
  { id: '#2589641', status: 'Approved', date: 'Today' },
  { id: '#2589641', status: 'Pending', date: '8 Jun 2025' },
  { id: '#2589641', status: 'Rejected', date: 'Today' },
  { id: '#2589641', status: 'Approved', date: 'Today' },
  { id: '#2589641', status: 'Pending', date: 'Today' },
];

const getStatusIcon = (status) => {
  switch (status) {
    case 'Approved':
      return <MaterialIcons name="check-box" size={18} color="green" />;
    case 'Rejected':
      return <MaterialIcons name="cancel" size={18} color="red" />;
    case 'Pending':
    default:
      return (
        <MaterialIcons name="check-box-outline-blank" size={18} color="gray" />
      );
  }
};

const Sales = () => {
  const [filter, setFilter] = useState('All');

  const filteredOrders =
    filter === 'All'
      ? dummyOrders
      : dummyOrders.filter((order) => order.status === filter);

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

        {/* Header */}
        <Text style={styles.title}>Sales Today</Text>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {['All', 'Approved', 'Pending', 'Rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterBtn,
                filter === status && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === status && styles.filterTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table Header */}
        <ScrollView horizontal>
          <View style={[styles.row, styles.headerRow, { minWidth: 600 }]}>
            <Text style={[styles.cell, styles.headerText]}>Orders No</Text>
            <Text style={[styles.cell, styles.headerText]}>Company Name</Text>
            <Text style={[styles.cell, styles.headerText]}>Status</Text>
            <Text style={[styles.cell, styles.headerText]}>Last updates</Text>
          </View>
        </ScrollView>

        {/* Order Rows */}
        <ScrollView horizontal>
          <View style={{ minWidth: 600 }}>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.row, index % 2 === 1 && styles.altRow]}
                  onPress={() => {
                    // Add navigation or action here
                    console.log('Order pressed:', order.id);
                  }}
                >
                  <View style={styles.cell}>{getStatusIcon(order.status)}</View>
                  <Text style={styles.cell}>Satish Infotech</Text>
                  <Text style={[styles.cell, styles[order.status.toLowerCase()]]}>
                    {order.status}
                  </Text>
                  <Text style={styles.cell}>{order.date}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={{ color: '#777' }}>No orders found.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  scroll: { backgroundColor: '#fff' },
  container: { padding: 16, paddingBottom: 100 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  rightIcons: { flexDirection: 'row', alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  filterBtnActive: {
    backgroundColor: '#007bff',
  },
  filterText: {
    fontSize: 12,
    color: '#007bff',
  },
  filterTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: '#d7ecfd',
    borderBottomWidth: 1,
  },
  altRow: {
    backgroundColor: '#f1f8ff',
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#555',
  },
  approved: { color: 'green' },
  rejected: { color: 'red' },
  pending: { color: 'gray' },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Sales;
