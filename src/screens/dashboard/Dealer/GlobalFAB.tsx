import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
    const navigation = useNavigation();

    return (
        <View style={styles.fabContainer}>
            {menuOpen && (
                <View style={styles.fabMenu}>
                    <MenuOption label="Dashboard" icon="dashboard" />
                    <MenuOption label="My Orders" icon="shoppingcart" />
                    <MenuOption label="My Target" icon="linechart" />
                    <MenuOption label="Ledger" icon="book" />
                    <MenuOption label="Report" icon="barchart" />
                    <MenuOption label="Products" icon="appstore-o" />
                    <MenuOption label="Profile" icon="user" />
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
