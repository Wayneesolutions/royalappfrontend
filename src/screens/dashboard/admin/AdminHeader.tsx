import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import Profile from '../../../../assets/images/profile.png';
import { useAuth } from '../../../context/AuthContext';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface DashboardHeaderProps {
    showNotifications?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    showNotifications = false
}) => {
    const navigation = useNavigation<NavigationProps>();
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
    const [isSwitchingCompany, setIsSwitchingCompany] = useState(false);

    const handleLogout = () => {
        setShowMenuDropdown(false);
        setShowLogoutModal(true);
    };

    const { logout, user, switchCompany } = useAuth();
    
    // Get user details from auth context
    const userName = user?.name || 'Admin User';
    const userRole = user?.role || 'Admin';
    const currentCompany = user?.defaultCompany;
    const availableCompanies = user?.companies || [];

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

    const handleCompanySwitch = async (companyId: string) => {
        if (companyId === currentCompany?._id) {
            setShowCompanyDropdown(false);
            return;
        }

        setIsSwitchingCompany(true);
        try {
            await switchCompany(companyId);
            setShowCompanyDropdown(false);
            Alert.alert('Success', 'Company switched successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to switch company. Please try again.');
        } finally {
            setIsSwitchingCompany(false);
        }
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
                    <View style={styles.profileImageContainer}>
                        <View style={styles.profileImage}>
                            <Image 
                                source={Profile} 
                                style={{ width: 24, height: 24, tintColor: 'white' }}
                                resizeMode="contain" 
                            />
                        </View>
                        <View style={styles.onlineIndicator} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{userName}</Text>
                        <Text style={styles.headerSubtitle}>{userRole}</Text>
                    </View>
                </TouchableOpacity>

                {/* Right Section */}
                <View style={styles.headerRight}>
                    {/* Company Dropdown */}
                    {availableCompanies.length > 0 && (
                        <TouchableOpacity
                            style={styles.companyButton}
                            onPress={() => setShowCompanyDropdown(!showCompanyDropdown)}
                            activeOpacity={0.7}
                            disabled={isSwitchingCompany}
                        >
                            <View style={styles.companyInfo}>
                                <Text style={styles.companyName} numberOfLines={1}>
                                    {currentCompany?.companyName || 'Select Company'}
                                </Text>
                                <Text style={styles.companyCode} numberOfLines={1}>
                                    {currentCompany?.companyCode || ''}
                                </Text>
                            </View>
                            <Ionicons 
                                name={showCompanyDropdown ? "chevron-up" : "chevron-down"} 
                                size={16} 
                                color="#6B7280" 
                            />
                            {isSwitchingCompany && (
                                <ActivityIndicator size="small" color="#0493D2" style={styles.switchLoader} />
                            )}
                        </TouchableOpacity>
                    )}
                    
                    {/* Three Dot Menu */}
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setShowMenuDropdown(!showMenuDropdown)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Company Dropdown */}
            {showCompanyDropdown && availableCompanies.length > 0 && (
                <View style={styles.companyDropdownContainer}>
                    <View style={styles.companyDropdown}>
                        <Text style={styles.companyDropdownTitle}>Switch Company</Text>
                        <View style={styles.companyDivider} />
                        {availableCompanies.map((companyData: any, index: number) => {
                            const company = companyData.companyId;
                            const isCurrentCompany = company._id === currentCompany?._id;
                            return (
                                <TouchableOpacity
                                    key={company._id}
                                    style={[
                                        styles.companyDropdownItem,
                                        index === availableCompanies.length - 1 && styles.companyDropdownItemLast
                                    ]}
                                    onPress={() => handleCompanySwitch(company._id)}
                                    disabled={isCurrentCompany || isSwitchingCompany}
                                >
                                    <View style={styles.companyItemInfo}>
                                        <Text style={[
                                            styles.companyItemName,
                                            isCurrentCompany && styles.currentCompanyText
                                        ]}>
                                            {company.companyName}
                                        </Text>
                                        <Text style={[
                                            styles.companyItemCode,
                                            isCurrentCompany && styles.currentCompanyText
                                        ]}>
                                            {company.companyCode}
                                        </Text>
                                    </View>
                                    {isCurrentCompany && (
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    )}
                                    {isSwitchingCompany && !isCurrentCompany && (
                                        <ActivityIndicator size="small" color="#0493D2" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {/* Menu Dropdown */}
            {showMenuDropdown && (
                <View style={styles.menuDropdownContainer}>
                    <View style={styles.menuDropdown}>
                    
                        <View style={styles.menuDivider} />
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
            {(showMenuDropdown || showCompanyDropdown) && (
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => {
                        setShowMenuDropdown(false);
                        setShowCompanyDropdown(false);
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
    profileImageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0493D2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 18,
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
    companyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: 150,
        gap: 8,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    companyCode: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 1,
    },
    switchLoader: {
        marginLeft: 4,
    },
    notificationButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    companyDropdownContainer: {
        position: 'absolute',
        top: 95,
        right: 20,
        zIndex: 1002,
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
    companyDropdownTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        paddingHorizontal: 16,
        paddingVertical: 12,
        textAlign: 'center',
    },
    companyDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    companyDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    companyDropdownItemLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    companyItemInfo: {
        flex: 1,
    },
    companyItemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    companyItemCode: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    currentCompanyText: {
        color: '#10B981',
        fontWeight: '600',
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

export default DashboardHeader;