import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const members = Array(7).fill({
  id: Math.random().toString(),
  name: 'Brijmohan',
  location: 'Model Town, Ludhiana',
  contact: '0125586688',
  licNo: '0403244',
});

const ZonalScreen = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => setSelectedId(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.icons}>
          {selectedId === item.id && (
            <Ionicons name="checkmark-circle" size={20} color="#00ff99" />
          )}
          <MaterialIcons
            name="delete"
            size={20}
            color="white"
            style={{ marginLeft: 10 }}
          />
        </View>
      </View>
      <Text style={styles.text}>Location: {item.location}</Text>
      <Text style={styles.text}>Contact: {item.contact}</Text>
      <Text style={styles.text}>LIC NO: {item.licNo}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="arrow-back" size={20} color="black" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
        <Ionicons name="search" size={20} color="black" />
      </View>
      <Text style={styles.header}>Zonal</Text>

      <FlatList
        data={filteredMembers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fe',
    paddingTop: 50,
    paddingHorizontal: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef3fc',
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  memberCard: {
    backgroundColor: '#0077b6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  text: {
    color: 'white',
    marginTop: 2,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ZonalScreen;
