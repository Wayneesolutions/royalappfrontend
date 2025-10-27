import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    FlatList,
} from 'react-native';
import {
    Ionicons,
    MaterialCommunityIcons,
    AntDesign,
    FontAwesome5,
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import SuperAdminHeader from './SuperAdminHeader';
import { useAuth } from '../../../context/AuthContext';
import { apiService } from '../../../services/api';

const { width } = Dimensions.get('window');

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

interface Company {
    id: string;
    name: string;
    admin: string;
    phone: string;
    sales: string;
    orders: number;
    users: number;
    status: string;
    lastSync: string;
}

interface StatCard {
    label: string;
    value: string;
    icon: string;
    iconType: 'Ionicons' | 'MaterialCommunityIcons' | 'AntDesign' | 'FontAwesome5';
    color: string;
    change: string;
}

interface MenuItem {
    label: string;
    icon: string;
    iconType: 'Ionicons' | 'MaterialCommunityIcons' | 'AntDesign';
    navigationScreen: keyof RootStackParamList;
}

const SuperAdminDashboard = () => {
    const navigation = useNavigation<NavigationProps>();
    const { roleSpecificData, superadminGetSystemStats } = useAuth();
    const [totalCompanies, setTotalCompanies] = React.useState<number | undefined>(roleSpecificData?.dashboard?.totalCompanies);
    const [totalAdmins, setTotalAdmins] = React.useState<number | undefined>(roleSpecificData?.dashboard?.totalAdmins);
    const [totalSales, setTotalSales] = React.useState<number | undefined>(undefined);
    const [totalOrders, setTotalOrders] = React.useState<number | undefined>(undefined);

    // Fetch live counts from backend to avoid stale values from login payload
    React.useEffect(() => {
        (async () => {
            try {
                const systemStatsRes = await superadminGetSystemStats();
                if (systemStatsRes?.success && systemStatsRes.data) {
                    setTotalCompanies(systemStatsRes.data.totalCompanies);
                    setTotalAdmins(systemStatsRes.data.totalAdmins);
                    setTotalSales(systemStatsRes.data.totalSales);
                    setTotalOrders(systemStatsRes.data.totalOrders);
                }
            } catch (error) {
                console.error('Failed to fetch system stats:', error);
                // Fallback to individual API calls
                try {
                    const companiesRes = await apiService.superadminListCompanies({ page: 1, limit: 1 });
                    if (companiesRes?.success && companiesRes.data?.pagination?.totalCompanies !== undefined) {
                        setTotalCompanies(companiesRes.data.pagination.totalCompanies);
                    }
                } catch {}
                try {
                    const adminsRes = await apiService.superadminListAdmins({ page: 1, limit: 1 });
                    if (adminsRes?.success && adminsRes.data?.pagination?.totalAdmins !== undefined) {
                        setTotalAdmins(adminsRes.data.pagination.totalAdmins);
                    }
                } catch {}
            }
        })();
    }, []);

    const stats: StatCard[] = [
        {
            label: 'Total Companies',
            value: typeof totalCompanies === 'number' ? String(totalCompanies) : '--',
            icon: 'business',
            iconType: 'Ionicons',
            color: '#3B82F6',
            change: '',
        },
        {
            label: 'Active Admins',
            value: typeof totalAdmins === 'number' ? String(totalAdmins) : '--',
            icon: 'people',
            iconType: 'Ionicons',
            color: '#10B981',
            change: '',
        },
        {
            label: 'Total Sales',
            value: typeof totalSales === 'number' ? `₹${totalSales.toLocaleString()}` : '--',
            icon: 'trending-up',
            iconType: 'Ionicons',
            color: '#8B5CF6',
            change: '',
        },
        {
            label: 'Total Orders',
            value: typeof totalOrders === 'number' ? String(totalOrders) : '--',
            icon: 'cube-outline',
            iconType: 'Ionicons',
            color: '#F59E0B',
            change: '',
        },
    ];

    const companyData: Company[] = [
        {
            id: '1',
            name: 'Royal Paints Pvt Ltd',
            admin: 'Satish Kumar',
            phone: '+91 98765 43210',
            sales: '₹18.5L',
            orders: 12,
            users: 45,
            status: 'active',
            lastSync: '2h ago',
        },
        {
            id: '2',
            name: 'Elite Coatings',
            admin: 'Rajesh Sharma',
            phone: '+91 98765 43211',
            sales: '₹15.3L',
            orders: 8,
            users: 32,
            status: 'active',
            lastSync: '5h ago',
        },
        {
            id: '3',
            name: 'Premium Colors Ltd',
            admin: 'Amit Verma',
            phone: '+91 98765 43212',
            sales: '₹11.4L',
            orders: 8,
            users: 28,
            status: 'active',
            lastSync: '1h ago',
        },
    ];

    const menuItems: MenuItem[] = [
        {
            label: 'Ledger',
            icon: 'book-outline',
            iconType: 'Ionicons',
            navigationScreen: 'LedgerScreen',
        },
        {
            label: 'Outstanding',
            icon: 'cash-outline',
            iconType: 'Ionicons',
            navigationScreen: 'OutstandingScreen',
        },
        {
            label: 'Pending Orders',
            icon: 'time-outline',
            iconType: 'Ionicons',
            navigationScreen: 'PendingOrdersScreen',
        },
        {
            label: 'Target',
            icon: 'bullseye-arrow',
            iconType: 'MaterialCommunityIcons',
            navigationScreen: 'TargetScreen',
        },
        {
            label: 'Sales Report',
            icon: 'chart-line',
            iconType: 'MaterialCommunityIcons',
            navigationScreen: 'SalesReportScreen',
        },
        {
            label: 'Companies',
            icon: 'business-outline',
            iconType: 'Ionicons',
            navigationScreen: 'CompaniesListScreen',
        },
        {
            label: 'Total Admin',
            icon: 'account-multiple-outline',
            iconType: 'MaterialCommunityIcons',
            navigationScreen: 'AdminsListScreen',
        },
    ];

    const renderIcon = (
        name: string,
        type: 'Ionicons' | 'MaterialCommunityIcons' | 'AntDesign' | 'FontAwesome5',
        size = 24,
        color = '#486CD6'
    ) => {
        switch (type) {
            case 'Ionicons':
                return <Ionicons name={name as any} size={size} color={color} />;
            case 'MaterialCommunityIcons':
                return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
            case 'AntDesign':
                return <AntDesign name={name as any} size={size} color={color} />;
            case 'FontAwesome5':
                return <FontAwesome5 name={name as any} size={size} color={color} />;
            default:
                return null;
        }
    };

    const handleMenuPress = (screen: keyof RootStackParamList) => {
        try {
            navigation.navigate(screen as any);
        } catch (error) {
            console.log(`Navigation to ${screen} not available yet`);
        }
    };

    const renderStatCard = ({ item }: { item: StatCard }) => (
        <View style={styles.statCard}>
            <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: item.color }]}>
                    {renderIcon(item.icon, item.iconType, 20, '#FFFFFF')}
                </View>
                <View style={styles.changeBadge}>
                    <Text style={styles.changeText}>{item.change}</Text>
                </View>
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
        </View>
    );

    const renderCompanyCard = ({ item }: { item: Company }) => (
        <TouchableOpacity 
            style={styles.companyCard}
            onPress={() => navigation.navigate('CompaniesListScreen')}
            activeOpacity={0.7}
        >
            <View style={styles.companyHeader}>
                <View style={styles.companyIconContainer}>
                    <Ionicons name="business" size={20} color="#3B82F6" />
                </View>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{item.name}</Text>
                    <Text style={styles.companyId}>ID: {item.id}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.statusText}>Active</Text>
                </View>
            </View>

            <View style={styles.companyDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Admin:</Text>
                    <Text style={styles.detailValue}>{item.admin}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{item.phone}</Text>
                </View>
                <View style={styles.divider} />
                
                {/* Enhanced Metrics Row */}
                <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                        <Ionicons name="trending-up" size={16} color="#10B981" />
                        <Text style={styles.metricValue}>{item.sales}</Text>
                        <Text style={styles.metricLabel}>Sales</Text>
                    </View>
                    <View style={styles.metric}>
                        <Ionicons name="cube-outline" size={16} color="#F59E0B" />
                        <Text style={styles.metricValue}>{item.orders}</Text>
                        <Text style={styles.metricLabel}>Orders</Text>
                    </View>
                    <View style={styles.metric}>
                        <Ionicons name="people-outline" size={16} color="#3B82F6" />
                        <Text style={styles.metricValue}>{item.users}</Text>
                        <Text style={styles.metricLabel}>Users</Text>
                    </View>
                </View>

                {/* Additional Metrics Row */}
                <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                        <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                        <Text style={styles.metricValue}>{Math.floor(item.orders * 0.2)}</Text>
                        <Text style={styles.metricLabel}>Pending</Text>
                    </View>
                    <View style={styles.metric}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                        <Text style={styles.metricValue}>{Math.floor(item.orders * 0.8)}</Text>
                        <Text style={styles.metricLabel}>Completed</Text>
                    </View>
                    <View style={styles.metric}>
                        <Ionicons name="person-outline" size={16} color="#8B5CF6" />
                        <Text style={styles.metricValue}>{Math.floor(item.users * 0.7)}/{item.users}</Text>
                        <Text style={styles.metricLabel}>Active</Text>
                    </View>
                </View>

                {/* Performance Indicator */}
                <View style={styles.performanceContainer}>
                    <View style={styles.performanceHeader}>
                        <Ionicons name="analytics-outline" size={14} color="#6B7280" />
                        <Text style={styles.performanceLabel}>Performance</Text>
                    </View>
                    <View style={styles.performanceBar}>
                        <View style={[
                            styles.performanceFill, 
                            { 
                                width: `${Math.min(100, Math.max(0, 
                                    (Math.floor(item.users * 0.7) / Math.max(1, item.users)) * 50 +
                                    (Math.floor(item.orders * 0.8) / Math.max(1, item.orders)) * 50
                                ))}%`,
                                backgroundColor: item.orders > 0 ? '#10B981' : '#6B7280'
                            }
                        ]} />
                    </View>
                    <Text style={styles.performanceScore}>
                        {Math.round(
                            (Math.floor(item.users * 0.7) / Math.max(1, item.users)) * 50 +
                            (Math.floor(item.orders * 0.8) / Math.max(1, item.orders)) * 50
                        )}%
                    </Text>
                </View>

                <View style={styles.syncInfo}>
                    <MaterialCommunityIcons name="database-sync" size={14} color="#8B5CF6" />
                    <Text style={styles.syncText}>Last sync: {item.lastSync}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderMenuItem = ({ item }: { item: MenuItem }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.navigationScreen)}
            activeOpacity={0.7}
        >
            <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                    {renderIcon(item.icon, item.iconType, 20, '#486CD6')}
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.mainContainer}>
            {/* Fixed Header */}
            <SuperAdminHeader
                title="Super Admin"
                subtitle="System Overview"
                showCompanySelector={true}
            />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Cards */}
                <View style={styles.section}>
                    <FlatList
                        data={stats}
                        renderItem={renderStatCard}
                        keyExtractor={(item) => item.label}
                        numColumns={2}
                        scrollEnabled={false}
                        columnWrapperStyle={styles.statsRow}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('CompaniesListScreen')}
                    >
                        <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Create New Company</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('AdminsListScreen')}
                    >
                        <Ionicons name="person-add" size={20} color="#FFFFFF" />
                        <Text style={styles.secondaryButtonText}>Create Admin Credentials</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Access</Text>
                    <View style={styles.menuSection}>
                        <FlatList
                            data={menuItems}
                            renderItem={renderMenuItem}
                            keyExtractor={(item) => item.label}
                            scrollEnabled={false}
                        />
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#ecf0fe',
    },
    scroll: {
        flex: 1,
    },
    container: {
        paddingBottom: 100,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    statsRow: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statCard: {
        width: (width - 52) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    changeText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#059669',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    secondaryButton: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    sectionCount: {
        fontSize: 12,
        color: '#6B7280',
    },
    menuSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    companyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    companyIconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#DBEAFE',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    companyId: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
        marginLeft: 4,
    },
    companyDetails: {
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    metric: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 4,
    },
    metricLabel: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 2,
    },
    syncInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F3FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    syncText: {
        fontSize: 11,
        color: '#7C3AED',
        marginLeft: 6,
    },
    performanceContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        marginBottom: 8,
    },
    performanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    performanceLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },
    performanceBar: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    performanceFill: {
        height: '100%',
        borderRadius: 2,
    },
    performanceScore: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },
});

export default SuperAdminDashboard;