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
  FontAwesome,
  AntDesign,
  MaterialCommunityIcons,
  Ionicons,
  Feather,
} from '@expo/vector-icons';
import GlobalFAB from "./GlobalFAB"
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types'; // adjust path as needed

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;




const DashboardHome = () => {
 const navigation = useNavigation<NavigationProps>();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  return (
    <View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Feather name="more-vertical" size={24} color="black" />
            <View style={styles.rightIcons}>
              <Feather name="search" size={22} color="black" style={{ marginRight: 12 }} />
              <Feather name="bell" size={22} color="black" />
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              style={styles.profileImage}
            />
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>Royal Softwäre</Text>
              <Text style={styles.profileEmail}>Admin@gmail.com</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#077BC3' }]}>
              <View style={styles.cardTop}>
                <Text style={styles.statValue}>05</Text>
              </View>
              <Text style={styles.statTitle}>Total Companies</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#2CACDF' }]}>
              <View style={styles.cardTop}>
                <Text style={styles.statValue}>10</Text>
              </View>
              <Text style={styles.statTitle}>Total Users</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#2CACDF' }]}>
              <View style={styles.cardTop}>
                <Text style={styles.statValue}>00</Text>
              </View>
              <Text style={styles.statTitle}>Sale Today</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#077BC3' }]}>
              <View style={styles.cardTop}>
                <Text style={styles.statValue}>10</Text>
              </View>
              <Text style={styles.statTitle}>Target Assigned</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <ActionButton
            icon={<MaterialCommunityIcons name="office-building" size={20} />}
            label="Create Company"
            onPress={() => navigation.navigate("Companies")}
          />
          <ActionButton
            icon={<FontAwesome name="users" size={20} />}
            label="Manage Users"
            onPress={() => navigation.navigate("Users")}
          />
          <ActionButton
            icon={<MaterialCommunityIcons name="target" size={20} />}
            label="Assign Sales Target"
            onPress={() => navigation.navigate("Sales")}
          />
          <ActionButton
            icon={<FontAwesome name="file-text" size={20} />}
            label="View Product Report"
            onPress={() => navigation.navigate("Product")}
          />



          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.ledgerButton}>
              <Text style={styles.ledgerText}>Ledger Summary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <GlobalFAB />
    </View>
  );
};

const ActionButton = ({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    {icon}
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);



const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 5,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    zIndex: 10,
  },
  profileCard: {
    marginTop: -40,
    backgroundColor: '#077BC3',
    borderRadius: 12,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    borderRadius: 20,
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statValue: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  statTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -5,
  },
  buttonContainer: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  ledgerButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  ledgerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

});

export default DashboardHome;
