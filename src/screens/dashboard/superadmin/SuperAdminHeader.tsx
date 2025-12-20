import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Alert,
    useWindowDimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../context/AuthContext';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface SuperAdminHeaderProps {
    title?: string;
    subtitle?: string;
}

const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({
    title = 'Super Admin',
    subtitle = 'System Overview',
}) => {
    const navigation = useNavigation<NavigationProps>();
    const { user } = useAuth();
    const [showMenuDropdown, setShowMenuDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { width } = useWindowDimensions();
    const isSmallScreen = width < 380;

    // Get user profile image
    const profileImage = user?.profileImage || null;
    const userName = user?.name || 'Super Admin';

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
            <View style={[
                styles.header,
                isSmallScreen && styles.headerCompact,
            ]}>
                {/* Left Section - Profile */}
                <TouchableOpacity
                    style={[
                        styles.headerLeft,
                        isSmallScreen && styles.headerLeftCompact,
                    ]}
                    onPress={handleProfilePress}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.profileImage,
                        isSmallScreen && styles.profileImageCompact,
                    ]}>
                        {profileImage ? (
                            <Image 
                                source={{ uri: profileImage }} 
                                style={[
                                    styles.profileImageContent,
                                    isSmallScreen && styles.profileImageContentCompact
                                ]} 
                            />
                        ) : (
                            <Ionicons name="person" size={isSmallScreen ? 20 : 24} color="#FFFFFF" />
                        )}
                    </View>
                    <View>
                        <Text
                            style={[
                                styles.headerTitle,
                                isSmallScreen && styles.headerTitleCompact,
                            ]}
                            numberOfLines={1}
                        >
                            {userName}
                        </Text>
                        <Text
                            style={[
                                styles.headerSubtitle,
                                isSmallScreen && styles.headerSubtitleCompact,
                            ]}
                            numberOfLines={1}
                        >
                            {subtitle}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Right Section */}
                <View style={[
                    styles.headerRight,
                    isSmallScreen && styles.headerRightCompact,
                ]}>
                    {/* Three Dot Menu */}
                    <TouchableOpacity
                        style={[
                            styles.menuButton,
                            isSmallScreen && styles.menuButtonCompact,
                        ]}
                        onPress={() => {
                            setShowMenuDropdown(!showMenuDropdown);
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu Dropdown */}
            {showMenuDropdown && (
                <View style={[
                    styles.menuDropdownContainer,
                    isSmallScreen && styles.menuDropdownContainerCompact,
                ]}>
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
            {showMenuDropdown && (
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => {
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
        flexWrap: 'wrap',
        rowGap: 12,
        columnGap: 12,
    },
    headerCompact: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    headerLeftCompact: {
        maxWidth: '70%',
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    profileImageCompact: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    profileImageContent: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    profileImageContentCompact: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerTitleCompact: {
        fontSize: 18,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    headerSubtitleCompact: {
        fontSize: 11,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerRightCompact: {
        width: '100%',
        justifyContent: 'flex-end',
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    menuButtonCompact: {
        width: 36,
        height: 36,
    },
    menuDropdownContainer: {
        position: 'absolute',
        top: 95,
        right: 20,
        zIndex: 1001,
    },
    menuDropdownContainerCompact: {
        top: 88,
        right: 16,
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