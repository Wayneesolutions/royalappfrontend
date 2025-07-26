import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions, 
  Image
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  AntDesign,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import Profile from '../../../../assets/images/profile.png'

const { width } = Dimensions.get('window');

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

type IconType = 'Ionicons' | 'MaterialCommunityIcons' | 'AntDesign';

interface MenuItem {
  label: string;
  icon: string;
  iconType: IconType;
  navigationScreen: keyof RootStackParamList;
}

interface Member {
  id: string;
  name: string;
  color: string;
  navigationScreen: keyof RootStackParamList;
}

const members: Member[] = [
  { id: '1', name: 'Zonal', color: '#3B82F6', navigationScreen: 'ZonalScreen' },
  { id: '2', name: 'RSM', color: '#3B82F6', navigationScreen: 'RSMScreen' },
  { id: '3', name: 'ASM', color: '#3B82F6', navigationScreen: 'ASMScreen' },
  { id: '4', name: 'Sales', color: '#3B82F6', navigationScreen: 'SalesScreen' },
  { id: '5', name: 'Dealer', color: '#3B82F6', navigationScreen: 'DealerScreen' },
  { id: '6', name: 'Distributors', color: '#3B82F6', navigationScreen: 'DistributorsScreen' },
];

const menuItems: MenuItem[] = [
  { label: 'Invoice', icon: 'file-document-outline', iconType: 'MaterialCommunityIcons', navigationScreen: 'InvoiceScreen' },
  { label: 'Ledger', icon: 'book-outline', iconType: 'Ionicons', navigationScreen: 'LedgerScreen' },
  { label: 'Target', icon: 'target', iconType: 'MaterialCommunityIcons', navigationScreen: 'TargetScreen' },
  { label: 'Pending Orders', icon: 'time-outline', iconType: 'Ionicons', navigationScreen: 'PendingOrdersScreen' },
  { label: 'Clear Orders', icon: 'checkmark-done-circle-outline', iconType: 'Ionicons', navigationScreen: 'ClearOrdersScreen' },
  { label: 'Setting', icon: 'settings-outline', iconType: 'Ionicons', navigationScreen: 'SettingsScreen' },
];

// Chart data for the sales breakdown
const chartData = [
  { day: 'Mon', safe: 45, pending: 25 },
  { day: 'Tue', safe: 55, pending: 35 },
  { day: 'Wed', safe: 65, pending: 45 },
  { day: 'Thu', safe: 50, pending: 30 },
  { day: 'Fri', safe: 35, pending: 20 },
  { day: 'Sat', safe: 60, pending: 40 },
  { day: 'Sun', safe: 40, pending: 25 },
];

const DashboardHome = () => {
  const navigation = useNavigation<NavigationProps>();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const renderIcon = (name: string, type: IconType, size = 24, color = '#486CD6') => {
    switch (type) {
      case 'Ionicons':
        return <Ionicons name={name as any} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
      case 'AntDesign':
        return <AntDesign name={name as any} size={size} color={color} />;
      default:
        return null;
    }
  };

// Generic navigation helper function
const navigateToScreen = (screenName: string) => {
  try {
    // Check if the screen exists in RootStackParamList
    if (screenName in navigation.getState().routeNames || true) {
      (navigation as any).navigate(screenName);
    } else {
      console.log(`Screen ${screenName} not found in navigation stack`);
    }
  } catch (error) {
    console.log(`Navigation to ${screenName} not available yet`);
    // You can show an alert or toast here if needed
  }
};

// Navigation handler for field members
const handleMemberPress = (member: Member) => {
  setSelectedMember(member.id);
  navigateToScreen(member.navigationScreen);
};

// Navigation handler for menu items
const handleMenuPress = (menuItem: MenuItem) => {
  navigateToScreen(menuItem.navigationScreen);
};

  // Profile press handler
  const handleProfilePress = () => {
    try {
      navigation.navigate('ProfileScreen');
    } catch (error) {
      console.log('Navigation to ProfileScreen not available yet');
    }
  };



  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileHeader} onPress={handleProfilePress} activeOpacity={0.8}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Image 
                  source={Profile} 
                  style={{ width: 32, height: 32, tintColor: 'white' }}
                  resizeMode="contain" 
                />
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Satish Kumar</Text>
              <Text style={styles.profileRole}>Company Admin</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Field Members Section */}
        <View style={styles.fieldMembersSection}>
          <Text style={styles.sectionTitle}>Your Field Members</Text>
          <View style={styles.sectionCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScrollContainer}
            >
              {members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={styles.memberItem}
                  onPress={() => handleMemberPress(member)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.memberCircle, { backgroundColor: "white" }]}>
                    <Ionicons name="person" size={20} color="#486CD6" />
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  {renderIcon(item.icon, item.iconType)}
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Sales Breakdown */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Daily Sales Breakdown</Text>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {chartData.map((data, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barsContainer}>
                    <View
                      style={[
                        styles.barSafe,
                        { height: data.safe }
                      ]}
                    />
                    <View
                      style={[
                        styles.barPending,
                        { height: data.pending }
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{data.day}</Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.chartLegend}>
              <View style={[styles.legendItem, { backgroundColor: '#10B981' }]}>
                <View style={[styles.legendColor, { backgroundColor: '#fff' }]} />
                <Text style={styles.legendText}>Safe Stocks 78.5%</Text>
              </View>
              <View style={[styles.legendItem, { backgroundColor: '#3B82F6' }]}>
                <View style={[styles.legendColor, { backgroundColor: '#fff' }]} />
                <Text style={styles.legendText}>Pending Stocks 75.5%</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scroll: {
    backgroundColor: '#ecf0fe',
  },
  container: {
    paddingBottom: 100,
  },
  profileSection: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0493D2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: 'black',
  },
  fieldMembersSection: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'left',
    paddingLeft: 10
  },
  membersScrollContainer: {
    paddingVertical: 4,
  },
  memberItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  memberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#486CD6',
    shadowColor: '#486CD6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  memberName: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 24,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    justifyContent: 'center',
  },
  barSafe: {
    width: 12,
    backgroundColor: '#10B981',
    marginRight: 2,
    borderRadius: 2,
    minHeight: 4,
  },
  barPending: {
    width: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardHome;