import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types'; // adjust path as needed

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const MenuOption = ({
    label,
    icon,
    onPress,
}: {
    label: string;
    icon: keyof typeof AntDesign.glyphMap;
    onPress?: () => void;
}) => (
    <>
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <AntDesign name={icon} size={18} color="#fff" />
            <Text style={styles.menuLabel}>{label}</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
    </>
);

const GlobalFAB = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigation = useNavigation<NavigationProps>();

    return (
        <View style={styles.fabContainer}>
            {menuOpen && (
                <View style={styles.fabMenu}>
                    <MenuOption label="Dashboard" icon="dashboard" onPress={() => navigation.navigate('DashboardAdmin')} />
                    <MenuOption label="User Management" icon="team" onPress={() => navigation.navigate('Users')} />
                    <MenuOption label="Order Monitoring" icon="eye" onPress={() => navigation.navigate('SaleOrders')} />
                    <MenuOption label="Sales Overview" icon="line-chart" onPress={() => navigation.navigate('Sales')} />
                    <MenuOption label="Companies" icon="bank" onPress={() => navigation.navigate('Companies')} />
                    <MenuOption label="Ledger" icon="book" onPress={() => navigation.navigate('LedgerScreen')} />
                    <MenuOption label="Zone" icon="environment" onPress={() => navigation.navigate('ZonalScreen')} />
                </View>
            )}
            <TouchableOpacity style={styles.fab} onPress={() => setMenuOpen(!menuOpen)}>
                <AntDesign name={menuOpen ? 'close' : 'plus'} size={28} color="white" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        right: 25,
        bottom: 40,
        alignItems: 'flex-end',
        zIndex: 999,
    },
    fab: {
        backgroundColor: '#077BC3',
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
    fabMenu: {
        backgroundColor: '#077BC3',
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        elevation: 6,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    menuLabel: {
        marginLeft: 10,
        fontSize: 14,
        color: '#fff',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#fff',
        opacity: 0.3,
        marginVertical: 4,
    },
});

export default GlobalFAB;
