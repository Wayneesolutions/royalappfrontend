import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface Company {
    id: string;
    name: string;
}

interface SuperAdminHeaderProps {
    title?: string;
    subtitle?: string;
    showCompanySelector?: boolean;
}

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
    title = 'Super Admin',
    subtitle = 'System Overview',
    showCompanySelector = true,
}) => {
    const navigation = useNavigation<NavigationProps>();
    const [selectedCompany, setSelectedCompany] = useState('ALL');
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const companies: Company[] = [
        { id: 'ALL', name: 'All Companies' },
        { id: '1', name: 'Royal Paints Pvt Ltd' },
        { id: '2', name: 'Elite Coatings' },
        { id: '3', name: 'Premium Colors Ltd' },
    ];

    const handleLogout = () => {
        setShowMenuDropdown(false);
        setShowLogoutModal(true);
    };

    const { logout } = useAuth();

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        try {
            await logout();
        } catch (e) {
            // No-op; state purge will still force auth flow
        }
    };

    const handleProfilePress = () => {
        setShowMenuDropdown(false);
        navigation.navigate('ProfileScreen');
    };

    const handleHomePress = () => {
        setShowMenuDropdown(false);
        navigation.navigate('DashboardSuperAdmin');
    };

    return (
        <>
            <View style={styles.header}>
                {/* Left Section - Profile */}
                <TouchableOpacity
                    style={styles.headerLeft}
                    onPress={handleProfilePress}
                    activeOpacity={0.7}
                >
                    <View style={styles.profileImage}>
                        <Ionicons name="person" size={24} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Super Admin</Text>
                        <Text style={styles.headerSubtitle}>{subtitle}</Text>
                    </View>
                </TouchableOpacity>

                {/* Right Section */}
                <View style={styles.headerRight}>
                    {/* Company Selector */}
                    {showCompanySelector && (
                        <TouchableOpacity
                            style={styles.companySelector}
                            onPress={() => {
                                setShowCompanyDropdown(!showCompanyDropdown);
                                setShowMenuDropdown(false);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.companySelectorText} numberOfLines={1}>
                                {companies.find((c) => c.id === selectedCompany)?.name}
                            </Text>
                            <Ionicons
                                name={showCompanyDropdown ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color="#486CD6"
                            />
                        </TouchableOpacity>
                    )}

                    {/* Three Dot Menu */}
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => {
                            setShowMenuDropdown(!showMenuDropdown);
                            setShowCompanyDropdown(false);
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Company Dropdown */}
            {showCompanyDropdown && (
                <View style={styles.dropdownContainer}>
                    <View style={styles.companyDropdown}>
                        {companies.map((company, index) => (
                            <TouchableOpacity
                                key={company.id}
                                style={[
                                    styles.dropdownItem,
                                    index === companies.length - 1 && styles.dropdownItemLast,
                                ]}
                                onPress={() => {
                                    setSelectedCompany(company.id);
                                    setShowCompanyDropdown(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.dropdownText,
                                        selectedCompany === company.id && styles.dropdownTextActive,
                                    ]}
                                >
                                    {company.name}
                                </Text>
                                {selectedCompany === company.id && (
                                    <Ionicons name="checkmark" size={20} color="#486CD6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Menu Dropdown */}
            {showMenuDropdown && (
                <View style={styles.menuDropdownContainer}>
                    <View style={styles.menuDropdown}>
                        <TouchableOpacity
                            style={styles.menuDropdownItem}
                            onPress={handleProfilePress}
                        >
                            <Ionicons name="person-outline" size={20} color="#374151" />
                            <Text style={styles.menuDropdownText}>Profile</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                            style={[styles.menuDropdownItem, styles.menuDropdownItemLast]}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            <Text style={[styles.menuDropdownText, styles.logoutText]}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Logout Confirmation Modal */}
            <Modal
                visible={showLogoutModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLogoutModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="log-out-outline" size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.modalTitle}>Confirm Logout</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to logout? You'll need to sign in again to access
                            your account.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowLogoutModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.logoutButtonText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Backdrop for closing dropdowns */}
            {(showCompanyDropdown || showMenuDropdown) && (
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => {
                        setShowCompanyDropdown(false);
                        setShowMenuDropdown(false);
                    }}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        zIndex: 1000,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    companySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxWidth: 150,
    },
    companySelectorText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginRight: 4,
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    dropdownContainer: {
        position: 'absolute',
        top: 95,
        right: 68,
        zIndex: 1001,
    },
    companyDropdown: {
        backgroundColor: '#FFFFFF',
        minWidth: 200,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemLast: {
        borderBottomWidth: 0,
    },
    dropdownText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    dropdownTextActive: {
        fontWeight: '600',
        color: '#486CD6',
    },
    menuDropdownContainer: {
        position: 'absolute',
        top: 95,
        right: 20,
        zIndex: 1001,
    },
    menuDropdown: {
        backgroundColor: '#FFFFFF',
        minWidth: 160,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    menuDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    menuDropdownItemLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    menuDropdownText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    logoutText: {
        color: '#EF4444',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    logoutButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default SuperAdminHeader;