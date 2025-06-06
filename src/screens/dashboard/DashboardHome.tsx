import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Feather, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import Sales from "../../../assets/images/sales performance.png";
import PendingOrder from "../../../assets/images/pending order.png";
import Ledger from "../../../assets/images/blockchain technology.png";
import Outstanding from "../../../assets/images/outstanding.png";
import Receipts from "../../../assets/images/receipt.png";
import SaleOrder from "../../../assets/images/Sale order.png";


import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, 'DashboardHome'>;

const DashboardHome: React.FC<Props> = ({ navigation }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
 

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.softwareName}>Royal Software</Text>
          <Text style={styles.userLabel}>User : Admin</Text>
          <Text style={styles.location}>Area : Model town, ludhiana</Text>
          <Text style={styles.name}>John doe</Text>
        </View>
        <Image
          source={PendingOrder}
          style={styles.avatar}
        />
      </View>

      {/* Card with Tiles */}
      <View style={styles.card}>
        <View style={styles.row}>
          <TileWithDivider image={Sales} label="Sales" />
          <TileWithDivider image={PendingOrder} label="Pending order" subLabel="Balance : 2   ORDER : 56" isLast />
        </View>

        <View style={styles.row}>
          <TileWithDivider image={Ledger} label="Ledger" />
          <TileWithDivider image={Outstanding} label="Outstanding" subLabel="DUE : 45555   OVERDUE : 45555" isLast />
        </View>

        <View style={styles.row}>
          <TileWithDivider image={Receipts} label="Receipts" />
         <TouchableOpacity
            onPress={() => navigation.navigate("SaleOrders")}
            style={{ flex: 1 }}
          >
            <TileWithDivider image={SaleOrder} label="Sale Orders" isLast />
          </TouchableOpacity>
        </View>

      </View>

      {/* Footer */}
      <Text style={styles.footerText}>Pending purchase order</Text>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        {menuOpen && (
          <View style={styles.fabMenu}>
           <MenuOption label="Sale Order" icon="filetext1" onPress={() => navigation.navigate("SaleOrderStart")} />

            <MenuOption label="Receipt" icon="creditcard" />
            <MenuOption label="New Customer" icon="adduser" />
            <MenuOption label="New Visit" icon="enviromento" />
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={toggleMenu}>
          <AntDesign name={menuOpen ? "close" : "plus"} size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
const TileWithDivider = ({ image, label, subLabel, isLast = false }: any) => (
  <View style={styles.tileWrapper}>
    <View style={styles.tile}>
      <Image source={image} style={styles.tileImage} />
      <Text style={styles.tileLabel}>{label}</Text>
      {subLabel && <Text style={styles.tileSubLabel}>{subLabel}</Text>}
    </View>
    {!isLast && <View style={styles.divider} />}
  </View>
);

const Tile = ({ image, label, subLabel }: any) => (
  <View style={styles.tile}>
    <Image source={image} style={styles.tileImage} />
    <Text style={styles.tileLabel}>{label}</Text>
    {subLabel && <Text style={styles.tileSubLabel}>{subLabel}</Text>}
  </View>
);

const MenuOption = ({ label, icon, onPress }: { label: string; icon: keyof typeof AntDesign.glyphMap; onPress?: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <AntDesign name={icon} size={18} color="#fff" />
    <Text style={styles.menuLabel}>{label}</Text>
  </TouchableOpacity>
);



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#077BC3",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 25,
    paddingTop: 56,
  },
  softwareName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 25,
    marginBottom: 6,
  },
  userLabel: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  location: {
    color: "#fff",
    fontSize: 17,
    marginTop: 2,
  },
  name: {
    color: "#fff",
    fontSize: 17,
    marginTop: 2,
  },
  avatar: {
    width: 80,
    height: 70,
    borderRadius: 35,
  },

  card: {
    backgroundColor: "#fff",
    margin: 22,
    borderRadius: 20,
    paddingVertical: 12,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 6,
  },
  tileWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18, // increased size
  },
  tileImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  tileLabel: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 18,
  },
  tileSubLabel: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    color: "#555",
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: "#077BC3",
    alignSelf: "center",
  },

  footerText: {
    margin:25,
    textAlign: "left",
    fontWeight: "600",
    fontSize: 22,
    marginTop: 20,
    marginBottom: 20,
  },
  fabContainer: {
    position: "absolute",
    right: 50,
    bottom: 80,
    alignItems: "flex-end",
  },
  fab: {
    backgroundColor: "#6AA4FF",
    width: 62,
    height: 62,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  fabMenu: {
    backgroundColor: "#077BC3",
    padding: 22,
    borderRadius: 29,
    marginBottom: -22,
    marginRight:15,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuLabel: {
    marginLeft: 12,
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
  }
});

export default DashboardHome;
