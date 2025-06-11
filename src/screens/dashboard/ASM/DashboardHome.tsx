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
import GlobalFAB from './GlobalFAB';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const DashboardHome = () => {
  const navigation = useNavigation<NavigationProps>();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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
          <Image source={{ uri: 'https://picsum.photos/200/300' }} style={styles.profileImage} />
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>Royal Software</Text>
            <Text style={styles.profileEmail}>Admin@gmail.com</Text>
          </View>
        </View>

        {/* Main Buttons */}
        <View style={styles.rowButtons}>
          <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Region</Text></TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Zone</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.outlineButton}>
          <FontAwesome name="shopping-cart" size={16} />
          <Text style={styles.outlineButtonText}>Sale Summary</Text>
        </TouchableOpacity>

        <View style={styles.rowButtons}>
          <TouchableOpacity style={styles.infoCard}>
            <Text style={styles.cardText}>Active Users in Zone</Text>
            <Text style={styles.cardCount}>10</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoCard}>
            <Text style={styles.cardText}>Target & Achievement</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.outlineButton}>
          <FontAwesome name="list-alt" size={16} />
          <Text style={styles.outlineButtonText}>Order List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineButton}>
          <FontAwesome name="users" size={16} />
          <Text style={styles.outlineButtonText}>User List</Text>
        </TouchableOpacity>
      </ScrollView>

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
    marginBottom: 20,
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
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    gap: 10,
  },
  outlineButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cardCount: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
});

export default DashboardHome;