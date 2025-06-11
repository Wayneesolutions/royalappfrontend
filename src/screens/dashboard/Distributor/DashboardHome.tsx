import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import {
  Feather,
  FontAwesome,
  AntDesign,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import GlobalFAB from './GlobalFAB';

const DashboardHome = () => {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Feather name="more-vertical" size={24} color="black" />
          <View style={styles.rightIcons}>
            <Feather name="search" size={22} color="black" style={{ marginRight: 12 }} />
            <Feather name="bell" size={22} color="black" />
          </View>
        </View>

        {/* Profile */}
        <View style={styles.profileWrapper}>
          <Image
            source={{ uri: 'https://picsum.photos/200/300' }}
            style={styles.profileImage}
          />
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>Royal Software</Text>
            <Text style={styles.profileEmail}>Admin@gmail.com</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#077BC3' }]}>
            <Text style={styles.statTitle}>Assignment{'\n'}Target</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#2CACDF' }]}>
            <Text style={styles.statTitle}>Order{'\n'}Placed</Text>
            <Text style={styles.statValue}>2</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="lock" size={18} />
            <Text style={styles.actionLabel}>Order Products</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <AntDesign name="clockcircleo" size={18} />
            <Text style={styles.actionLabel}>Order Status History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="chart-bar" size={20} />
            <Text style={styles.actionLabel}>Sale  Performenence Bar</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.orderSummaryButton}>
            <Text style={styles.orderSummaryText}>Order Summary</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <GlobalFAB />
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  profileCard: {
    backgroundColor: '#077BC3',
    marginTop: -40,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileEmail: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 10,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 6,
  },
  actionSection: {
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  actionLabel: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'flex-start',
  },
  orderSummaryButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
  },
  orderSummaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardHome;
