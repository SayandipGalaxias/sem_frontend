import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

import { useContactsStore } from '@/store/ContactsStore';
import { AppContact } from '../interfaces/Contacts';

import { useRouter } from 'expo-router';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

function ContactCard({
    item,
    isTablet,
}: {
    item: AppContact;
    isTablet: boolean;
}) {
    return (
        <View
            className={`bg-[#dce1ec] dark:bg-zinc-900 rounded-[20px] ${isTablet ? 'p-5' : 'p-4'
                }`}
            style={{
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
            }}
        >
            <View className="flex-row items-center">
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        className="w-14 h-14 rounded-full"
                    />
                ) : (
                    <View className="w-14 h-14 rounded-full bg-[#4a6fa5] items-center justify-center">
                        <Text className="text-white font-bold text-lg">
                            {item.name?.charAt(0)?.toUpperCase()}
                        </Text>
                    </View>
                )}

                <View className="ml-4 flex-1">
                    <Text
                        className="text-black dark:text-white font-semibold text-[15px]"
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>

                    {item.phoneNumbers?.[0] && (
                        <Text
                            className="text-gray-500 dark:text-gray-400 mt-1"
                            numberOfLines={1}
                        >
                            {item.phoneNumbers[0]}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

export default function ContactsScreen() {
    const { width } = useWindowDimensions();

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    const [search, setSearch] = useState('');

    const router = useRouter();

    const {
        contacts,
        setContacts,
        loadContacts,
        loading,
    } = useContactsStore();

    useEffect(() => {
        loadContacts();
    }, []);

    async function backupContacts() {
        if (Platform.OS === 'web') return;

        const { status } = await Contacts.requestPermissionsAsync();

        if (status !== 'granted') return;

        const response = await Contacts.getContactsAsync({
            fields: [
                Contacts.Fields.PhoneNumbers,
                Contacts.Fields.Emails,
                Contacts.Fields.Image,
            ],
        });

        const formatted: AppContact[] = response.data.map((contact) => ({
            id: contact.id,

            name:
                contact.name ||
                `${contact.firstName || ''} ${contact.lastName || ''}`,

            phoneNumbers:
                contact.phoneNumbers?.map((p) => p.number || '') || [],

            emails:
                contact.emails?.map((e) => e.email || '') || [],

            image: contact.imageAvailable
                ? contact.image?.uri
                : undefined,
        }));

        await setContacts(formatted);
    }

    const filteredContacts = useMemo(() => {
        if (!search.trim()) return contacts;

        return contacts.filter((c) =>
            c.name?.toLowerCase().includes(search.toLowerCase()),
        );
    }, [search, contacts]);

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">

            <View
                className={`flex-row items-center justify-between ${isTablet ? 'px-8 py-6' : 'px-5 py-4'
                    }`}
            >
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                        className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center mr-4"
                        style={{
                            shadowColor: '#000',
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 2,
                        }}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color="#4a6fa5"
                        />
                    </TouchableOpacity>

                    <View>
                        <Text className="text-black dark:text-white text-xl font-bold">
                            Contacts Backup
                        </Text>

                        <Text className="text-[#8a93a6] mt-1">
                            {contacts.length} contacts stored
                        </Text>
                    </View>
                </View>

                {Platform.OS !== 'web' && (
                    <TouchableOpacity
                        onPress={backupContacts}
                        activeOpacity={0.85}
                        className="bg-[#4a6fa5] px-5 py-3 rounded-2xl flex-row items-center"
                    >
                        <Ionicons
                            name="cloud-upload-outline"
                            size={18}
                            color="#fff"
                        />

                        <Text className="text-white font-semibold ml-2">
                            Backup
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View className="px-5">
                <View className="flex-row items-center bg-[#dce1ec] dark:bg-zinc-900 rounded-2xl px-4 py-3">
                    <Ionicons
                        name="search"
                        size={18}
                        color="#4a6fa5"
                    />

                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search contacts..."
                        placeholderTextColor="#8a93a6"
                        className="flex-1 ml-3 text-black dark:text-white"
                    />
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4a6fa5" />
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        padding: isTablet ? 24 : 16,
                        gap: 12,
                    }}
                    numColumns={isDesktop ? 2 : 1}
                    columnWrapperStyle={
                        isDesktop
                            ? {
                                gap: 12,
                            }
                            : undefined
                    }
                    renderItem={({ item }) => (
                        <View
                            style={{
                                flex: isDesktop ? 1 : undefined,
                            }}
                        >
                            <ContactCard
                                item={item}
                                isTablet={isTablet}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-24">
                            <View className="w-20 h-20 rounded-full bg-[#4a6fa5]/10 items-center justify-center">
                                <Ionicons
                                    name="people-outline"
                                    size={32}
                                    color="#4a6fa5"
                                />
                            </View>

                            <Text className="text-black dark:text-white text-lg font-semibold mt-5">
                                No Contacts Backup
                            </Text>

                            <Text className="text-[#8a93a6] text-center mt-2 max-w-[240px]">
                                Backup your phone contacts from Android or iPhone.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}