import { authenticateWithBiometrics } from '@/utils/biometric';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthApi } from '../api/Auth/hook';
import { useSecretsApi } from '../api/Secrets/hook';
import { Secret } from '../api/Secrets/types';
import { useUserStore } from '../store/UserStore';
import { Colors } from '../utils/colors';
import { CommonStylesFn } from '../utils/CommonStyles';
import { Fonts } from '../utils/Fonts';
import { moderateScale, scale, verticalScale } from '../utils/Responsive';

const SecretItem = ({ item, onDelete, onEdit, onView, }: { item: Secret; onDelete: (id: string) => void; onEdit: (item: Secret) => void; onView: (item: Secret) => void; }) => (
    <View className="flex-row items-center justify-between bg-[#dce1ec] dark:bg-zinc-900 rounded-2xl p-5">
        <View className='flex-1'>
            <Text className='text-lg font-bold text-black dark:text-white'>{item.name}</Text>
            <Text className='text-gray-500 dark:text-gray-400'>
                {item.description}
            </Text>
        </View>
        {/* <TouchableOpacity onPress={() => onView(item)} hitSlop={8} style={{ marginRight: scale(12) }}>
            <Ionicons name="eye" size={moderateScale(18)} color={Colors.green} />
        </TouchableOpacity> */}
        {/* <TouchableOpacity onPress={() => onEdit(item)} hitSlop={8} style={{ marginRight: scale(12) }}>
            <Ionicons name="pencil-outline" size={moderateScale(18)} color={Colors.primary} />
        </TouchableOpacity> */}
        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
            <Ionicons name="trash-bin" size={moderateScale(18)} color={Colors.error} />
        </TouchableOpacity>
    </View>
);

const itemStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.cardBackground,
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(14),
    },
});

const ConfirmationModal = ({ visible, title, subTitle, onConfirm, onCancel, }: { visible: boolean; title: string; subTitle: string; onConfirm: () => void; onCancel: () => void; }) => (
    <Modal transparent visible={visible} animationType="fade">
        <View style={modalStyles.overlay}>
            <View style={modalStyles.card}>
                <Text style={CommonStylesFn.text(5, Colors.white, Fonts.bold)}>{title}</Text>
                <Text style={[CommonStylesFn.text(3.5, Colors.textMuted, Fonts.regular), { marginTop: verticalScale(8) }]}>
                    {subTitle}
                </Text>
                <View style={modalStyles.row}>
                    <TouchableOpacity style={modalStyles.cancelBtn} onPress={onCancel}>
                        <Text style={CommonStylesFn.text(3.5, Colors.textMuted, Fonts.medium)}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={modalStyles.confirmBtn} onPress={onConfirm}>
                        <Text style={CommonStylesFn.text(3.5, Colors.white, Fonts.medium)}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '82%',
        backgroundColor: Colors.cardBackground,
        borderRadius: moderateScale(16),
        padding: scale(24),
    },
    row: {
        flexDirection: 'row',
        gap: scale(12),
        marginTop: verticalScale(20),
    },
    cancelBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        borderRadius: moderateScale(8),
        backgroundColor: Colors.surface,
    },
    confirmBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        borderRadius: moderateScale(8),
        backgroundColor: Colors.error,
    },
});

export default function DashboardScreen() {
    const user = useUserStore((s) => s.user);
    const { logout } = useAuthApi();
    const { secrets, loading, getList, deleteSecret } = useSecretsApi();

    const [searchText, setSearchText] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const deleteIdRef = useRef<string>('');

    const router = useRouter();

    useFocusEffect(
        React.useCallback(() => {
            getList();
        }, [getList]),
    );

    const displayedSecrets = searchText.trim()
        ? secrets.filter((s) =>
            s.name?.toLowerCase().includes(searchText.toLowerCase()),
        )
        : secrets;

    const onDeletePress = (id: string) => {
        deleteIdRef.current = id;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        await deleteSecret(deleteIdRef.current);
        setShowDeleteModal(false);
    };

    const onEditPress = (item: Secret) => {
        router.push({
            pathname: '/(create)' as any,
            params: { id: item.id, name: item.name, secret: item.secret, description: item.description, },
        });
    };

    const onViewPress = async (item: Secret) => {
        console.log('PLATFORM:', Platform.OS);
        const authenticated = await authenticateWithBiometrics('Authenticate to view secret');
        console.log('AUTHENTICATED:', authenticated);
        if (!authenticated) return;

        router.push({
            pathname: '/(view)' as any,
            params: {
                id: item.id,
                name: item.name,
                secret: item.secret,
                description: item.description,
            },
        });
    };

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">
            <View className='flex-row items-center justify-between px-5 py-4 bg-[#e8ecf4] dark:bg-black'>
                <TouchableOpacity onPress={() => setShowLogoutModal(true)}>
                    <View className='flex-row items-center gap-2 p-3 rounded-full bg-[#dce1ec] dark:bg-zinc-900'>
                        <Ionicons name="power" size={24} color={Colors.red} />
                    </View>
                </TouchableOpacity>
                <Text className='text-xl font-bold color-black dark:text-gray-200'>
                    {user?.email ?? 'Dashboard'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(create)' as any)}>
                    <View className='flex-row items-center gap-2 p-3 rounded-full bg-[#dce1ec] dark:bg-zinc-900'>
                        <Ionicons name="add" size={24} color={Colors.primary} />
                    </View>
                </TouchableOpacity>
            </View>

            <View className='flex-1 px-4'>
                <View className='flex-row items-center gap-3 mt-4 mb-4 px-3 py-2 rounded-2xl bg-[#dce1ec] dark:bg-zinc-900'>
                    <Ionicons name="search" size={20} color={Colors.primary} />
                    <TextInput value={searchText} placeholder="Search secrets..." className='' onChangeText={setSearchText} placeholderTextColor={Colors.textMuted} />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* <FlatList
                    data={displayedSecrets}
                    renderItem={({ item }) => (
                        <SecretItem item={item} onDelete={onDeletePress} onEdit={onEditPress} onView={onViewPress} />
                    )}
                    keyExtractor={(item) => `secret-${item.id}`}
                    contentContainerStyle={styles.flContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={getList} colors={[Colors.primary]} tintColor={Colors.primary} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {loading ? 'Loading...' : 'No secrets found'}
                        </Text>
                    }
                /> */}

                {
                    displayedSecrets.length === 0 ? (
                        <Text style={styles.emptyText}>
                            {loading ? 'Loading...' : 'No secrets found'}
                        </Text>
                    ) : (
                        displayedSecrets.map((item) => (
                            <SecretItem key={item.id} item={item} onDelete={onDeletePress} onEdit={onEditPress} onView={onViewPress} />
                        ))
                    )   
                }
            </View>

            <ConfirmationModal visible={showLogoutModal} title="Logout" subTitle={'Are you sure you want to logout?\n\nYour session will be terminated.'} onConfirm={() => { setShowLogoutModal(false); logout(); }} onCancel={() => setShowLogoutModal(false)} />

            <ConfirmationModal visible={showDeleteModal} title="Delete Secret" subTitle="Are you sure you want to delete this secret?" onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(16),
        backgroundColor: Colors.cardBackground,
    },
    subContainer: {
        flex: 1,
        paddingHorizontal: scale(16),
    },
    flContent: {
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(80),
        gap: verticalScale(12),
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: verticalScale(12),
        marginBottom: verticalScale(4),
        paddingVertical: verticalScale(4),
        paddingHorizontal: scale(12),
        gap: scale(12),
        borderRadius: moderateScale(8),
        backgroundColor: Colors.cardBackground,
    },
    searchInput: {
        flex: 1,
        color: Colors.white,
        paddingVertical: verticalScale(8),
    },
    emptyText: {
        ...CommonStylesFn.text(3.5, Colors.textMuted, Fonts.regular),
        textAlign: 'center',
        marginTop: verticalScale(40),
    },
});