import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

const providers = [
    {
        key: 'aws',
        title: 'AWS',
        subtitle: 'Amazon Web Services',
        icon: 'cloud-outline',
    },
    {
        key: 'gdrive',
        title: 'Google Drive',
        subtitle: 'Cloud Storage',
        icon: 'folder-open-outline',
    },
    {
        key: 'proton',
        title: 'Proton Drive',
        subtitle: 'Privacy Focused',
        icon: 'shield-checkmark-outline',
    },
    {
        key: 'ismart',
        title: 'iSmart Manager',
        subtitle: 'Recommended',
        icon: 'flash-outline',
    },
    {
        key: 'other',
        title: 'Others',
        subtitle: 'Custom Provider',
        icon: 'globe-outline',
    },
];

function ProviderCard({
    item,
    active,
    onPress,
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            className={`rounded-3xl p-4 border ${active
                ? 'bg-[#4a6fa5]/10 border-[#4a6fa5]'
                : 'bg-[#4a6fa5]/10 border-transparent'
                }`}
            style={{
                width: 160,
            }}
        >
            <View className="w-12 h-12 rounded-2xl bg-[#4a6fa5]/10 items-center justify-center">
                <Ionicons
                    name={item.icon}
                    size={22}
                    color="#4a6fa5"
                />
            </View>

            <Text className="mt-4 font-bold text-black dark:text-white text-[15px]">
                {item.title}
            </Text>

            <Text className="mt-1 text-[#7b8496] text-[12px]">
                {item.subtitle}
            </Text>
        </TouchableOpacity>
    );
}

function InputField({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
}) {
    return (
        <View className="mt-5">
            <Text className="text-[13px] font-semibold text-[#5b6475] mb-3">
                {label}
            </Text>

            <View className="rounded-2xl bg-[#e8ecf4] dark:bg-black px-4 py-4 flex-row items-center border border-[rgba(74,111,165,0.12)]">
                <Ionicons
                    name={icon}
                    size={18}
                    color="#4a6fa5"
                />

                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    placeholder={placeholder}
                    placeholderTextColor="#8a93a6"
                    className="flex-1 ml-3 text-black dark:text-white"
                />
            </View>
        </View>
    );
}

export default function ConnectServer() {
    const router = useRouter();

    const { width } = useWindowDimensions();

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    const [provider, setProvider] = useState('ismart');

    const [serverUrl, setServerUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">

            <View
                className={`absolute top-0 left-0 right-0 z-50 bg-[#e8ecf4] dark:bg-[#262728] flex-row items-center ${isTablet ? 'px-8 py-6' : 'px-5 py-4'
                    }`}
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(74,111,165,0.08)',
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                    className="w-11 h-11 rounded-full bg-[#dce1ec] dark:bg-zinc-900 items-center justify-center mr-4"
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color="#4a6fa5"
                    />
                </TouchableOpacity>

                <View>
                    <Text className="text-xl font-bold text-black dark:text-white">
                        Connect Storage
                    </Text>

                    <Text className="text-[#8a93a6] mt-1">
                        Secure encrypted synchronization
                    </Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: isTablet ? 120 : 100,
                    paddingBottom: 50,
                }}
            >

                <View className="items-center px-5">
                    <View className="bg-[#4a6fa5]/10 px-4 py-2 rounded-full">
                        <Text className="text-[#4a6fa5] text-xs font-bold uppercase">
                            Zero Knowledge Security
                        </Text>
                    </View>

                    <Text className="text-center text-[34px] font-bold text-black dark:text-white mt-6">
                        Choose Your{"\n"}Storage Provider
                    </Text>

                    <Text className="text-center text-[#7b8496] mt-5 leading-7">
                        Keep your encrypted vault synchronized using
                        your preferred cloud infrastructure.
                    </Text>
                </View>

                <View
                    className={`mt-10 ${isDesktop
                        ? 'flex-row px-10 gap-6'
                        : 'px-5 gap-5'
                        }`}
                >

                    <View className="flex-1">
                        <View className="rounded-[30px] bg-[#dce1ec] dark:bg-zinc-900 p-6">
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 rounded-[18px] bg-[#4a6fa5]/10 items-center justify-center">
                                    <Ionicons
                                        name="server-outline"
                                        size={28}
                                        color="#4a6fa5"
                                    />
                                </View>

                                <View className="ml-4">
                                    <Text className="text-[18px] font-bold text-black dark:text-white">
                                        Storage Provider
                                    </Text>

                                    <Text className="text-[#7b8496] mt-1">
                                        Select a provider below
                                    </Text>
                                </View>
                            </View>


                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mt-8"
                            >
                                <View className="flex-row gap-3">
                                    {providers.map((item) => (
                                        <ProviderCard
                                            key={item.key}
                                            item={item}
                                            active={provider === item.key}
                                            onPress={() =>
                                                setProvider(item.key)
                                            }
                                        />
                                    ))}
                                </View>
                            </ScrollView>


                            {(provider === 'aws' ||
                                provider === 'gdrive' ||
                                provider === 'proton' ||
                                provider === 'other') && (
                                    <InputField
                                        label="SERVER URL"
                                        icon="globe-outline"
                                        placeholder="https://server.example.com"
                                        value={serverUrl}
                                        onChangeText={setServerUrl}
                                    />
                                )}

                            {(provider === 'aws' ||
                                provider === 'proton') && (
                                    <InputField
                                        label="ACCESS TOKEN"
                                        icon="key-outline"
                                        placeholder="Enter access token"
                                        value={accessToken}
                                        onChangeText={setAccessToken}
                                        secureTextEntry
                                    />
                                )}

                            {provider === 'other' && (
                                <>
                                    <InputField
                                        label="USER ID"
                                        icon="person-outline"
                                        placeholder="Enter user id"
                                        value={userId}
                                        onChangeText={setUserId}
                                    />

                                    <InputField
                                        label="PASSWORD"
                                        icon="lock-closed-outline"
                                        placeholder="Enter password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </>
                            )}

                            {provider === 'ismart' && (
                                <View className="mt-8 rounded-3xl bg-[#4a6fa5]/10 border border-[#4a6fa5]/20 p-5">
                                    <View className="flex-row items-center">
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color="#10b981"
                                        />

                                        <Text className="ml-2 font-bold text-black dark:text-white">
                                            Ready To Use
                                        </Text>
                                    </View>

                                    <Text className="mt-3 text-[#7b8496] leading-6">
                                        iSmart Manager requires no additional
                                        configuration. Your encrypted vault
                                        will automatically synchronize through
                                        our secure infrastructure.
                                    </Text>

                                    <View className="mt-5 gap-2">
                                        <Text className="text-[#4a6fa5]">
                                            • AES-256 Encryption
                                        </Text>

                                        <Text className="text-[#4a6fa5]">
                                            • Zero-Knowledge Security
                                        </Text>

                                        <Text className="text-[#4a6fa5]">
                                            • Multi Device Sync
                                        </Text>
                                    </View>
                                </View>
                            )}


                            <View className="flex-row gap-3 mt-8">
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    className="flex-1 rounded-2xl py-4 items-center justify-center bg-black/5 dark:bg-white/5"
                                >
                                    <Text className="font-semibold text-black dark:text-white">
                                        Test Connection
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    className="flex-1 rounded-2xl py-4 items-center justify-center bg-[#4a6fa5] flex-row"
                                >
                                    <Ionicons
                                        name="link-outline"
                                        size={18}
                                        color="#fff"
                                    />

                                    <Text className="text-white font-semibold ml-2">
                                        Connect
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>


                    <View
                        className={`${isDesktop ? 'w-[340px]' : ''
                            } gap-4`}
                    >
                        <View className="rounded-3xl bg-[#4a6fa5] p-6">
                            <Ionicons
                                name="shield-checkmark"
                                size={34}
                                color="white"
                            />

                            <Text className="text-white text-xl font-bold mt-5">
                                End-To-End Encryption
                            </Text>

                            <Text className="text-white/80 mt-3 leading-6">
                                Your secrets remain encrypted before
                                leaving your device.
                            </Text>
                        </View>

                        <View className="rounded-3xl bg-[#dce1ec] dark:bg-zinc-900 p-5">
                            <Text className="font-bold text-black dark:text-white">
                                Features
                            </Text>

                            <View className="mt-4 gap-4">
                                <Text className="text-[#7b8496]">
                                    🔒 Zero Knowledge Storage
                                </Text>

                                <Text className="text-[#7b8496]">
                                    ☁️ Cloud Synchronization
                                </Text>

                                <Text className="text-[#7b8496]">
                                    📱 Multi Device Access
                                </Text>

                                <Text className="text-[#7b8496]">
                                    ⚡ Instant Backup
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}