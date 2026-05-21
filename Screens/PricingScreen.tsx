import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

const TABLET_WIDTH = 768;
const DESKTOP_WIDTH = 1100;

function FeatureItem({ text }: { text: string }) {
    return (
        <View className="flex-row items-start mt-3">
            <View className="w-6 h-6 rounded-full bg-[#4a6fa5]/10 items-center justify-center mr-3 mt-0.5">
                <Ionicons
                    name="checkmark"
                    size={14}
                    color="#4a6fa5"
                />
            </View>

            <Text className="flex-1 text-[13px] leading-5 text-[#5b6475] dark:text-gray-300">
                {text}
            </Text>
        </View>
    );
}

function PricingCard({
    title,
    subtitle,
    price,
    accent,
    isPrimary,
    features,
    cta,
    badge,
}: {
    title: string;
    subtitle: string;
    price: string;
    accent: string;
    isPrimary?: boolean;
    features: string[];
    cta: string;
    badge?: string;
}) {
    return (
        <View
            className={`flex-1 rounded-[30px] overflow-hidden ${isPrimary
                ? 'bg-[#4a6fa5]'
                : 'bg-[#dce1ec] dark:bg-zinc-900'
                }`}
            style={{
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 4,
            }}
        >
            {badge && (
                <View className="absolute top-5 right-5 bg-white/15 px-3 py-1 rounded-full">
                    <Text className="text-white text-[11px] font-semibold tracking-[0.5px]">
                        {badge}
                    </Text>
                </View>
            )}

            <View className="p-7">
                <View
                    className="w-14 h-14 rounded-[18px] items-center justify-center"
                    style={{
                        backgroundColor: isPrimary
                            ? 'rgba(255,255,255,0.14)'
                            : 'rgba(74,111,165,0.10)',
                    }}
                >
                    <Ionicons
                        name={
                            isPrimary
                                ? 'cloud-upload-outline'
                                : 'shield-checkmark-outline'
                        }
                        size={26}
                        color={isPrimary ? '#fff' : accent}
                    />
                </View>

                <Text
                    className={`mt-5 text-2xl font-bold ${isPrimary
                        ? 'text-white'
                        : 'text-black dark:text-white'
                        }`}
                >
                    {title}
                </Text>

                <Text
                    className={`mt-2 text-[14px] leading-6 ${isPrimary
                        ? 'text-white/75'
                        : 'text-[#7b8496]'
                        }`}
                >
                    {subtitle}
                </Text>

                <View className="flex-row items-end mt-7">
                    <Text
                        className={`text-4xl font-bold ${isPrimary
                            ? 'text-white'
                            : 'text-black dark:text-white'
                            }`}
                    >
                        {price}
                    </Text>

                    {price !== 'Free' && (
                        <Text
                            className={`mb-1 ml-2 ${isPrimary
                                ? 'text-white/70'
                                : 'text-[#7b8496]'
                                }`}
                        >
                            /month
                        </Text>
                    )}
                </View>

                <View className="mt-8">
                    {features.map((feature) => (
                        <FeatureItem
                            key={feature}
                            text={feature}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    className={`mt-10 rounded-2xl py-4 items-center ${isPrimary
                        ? 'bg-white'
                        : 'bg-[#4a6fa5]'
                        }`}
                >
                    <Text
                        className={`font-semibold text-[15px] ${isPrimary
                            ? 'text-[#4a6fa5]'
                            : 'text-white'
                            }`}
                    >
                        {cta}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function PricingScreen() {
    const router = useRouter();

    const { width } = useWindowDimensions();

    const isTablet = width >= TABLET_WIDTH;
    const isDesktop = width >= DESKTOP_WIDTH;

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">
            <View
                className={`absolute top-0 left-0 right-0 z-50 bg-[#e8ecf4] dark:bg-[#262728] flex-row items-center justify-between ${isTablet ? 'px-8 py-6' : 'px-5 py-4'
                    }`}
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(74,111,165,0.08)',
                    backdropFilter: 'blur(12px)',
                }}
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
                            Pricing
                        </Text>

                        <Text className="text-[#8a93a6] mt-1">
                            Choose your privacy model
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: isTablet ? 120 : 100,
                    paddingBottom: 60,
                }}
            >

                <View
                    className={`items-center ${isTablet ? 'px-10 mt-6' : 'px-5 mt-4'
                        }`}
                >
                    <View className="bg-[#4a6fa5]/10 px-4 py-2 rounded-full">
                        <Text className="text-[#4a6fa5] text-[12px] font-semibold tracking-[1px] uppercase">
                            End-To-End Encrypted
                        </Text>
                    </View>

                    <Text
                        className={`text-center font-bold text-black dark:text-white ${isTablet
                            ? 'text-5xl mt-7 leading-[60px]'
                            : 'text-[34px] mt-6 leading-[42px]'
                            }`}
                    >
                        Secure Secrets{"\n"}Without Compromise
                    </Text>

                    <Text
                        className={`text-center text-[#7b8496] mt-6 leading-7 ${isTablet
                            ? 'max-w-[760px] text-[17px]'
                            : 'text-[15px]'
                            }`}
                    >
                        Your secrets remain encrypted on-device. Upgrade anytime
                        for cloud sync, multi-device access, and self-hosted
                        private infrastructure.
                    </Text>
                </View>

                <View
                    className={`mt-12 ${isDesktop
                        ? 'flex-row px-10 gap-6'
                        : 'px-5 gap-5'
                        }`}
                >
                    <PricingCard
                        title="Free"
                        subtitle="Perfect for fully local secure storage."
                        price="Free"
                        accent="#4a6fa5"
                        cta="Continue Free"
                        features={[
                            'Military-grade encrypted local storage',
                            'Secrets stored only on your device',
                            'No server connection required',
                            'Offline-first secure vault',
                            'Biometric authentication support',
                            'No account sync or cloud backup',
                            'Logging out permanently removes secrets',
                            'Uninstalling app deletes all stored data',
                        ]}
                    />

                    <PricingCard
                        title="Pro Secure"
                        subtitle="Cloud sync with optional self-hosted privacy."
                        price="$4.99"
                        accent="#ffffff"
                        isPrimary
                        badge="RECOMMENDED"
                        cta="Upgrade To Pro"
                        features={[
                            'Everything included in Free',
                            'Encrypted sync across devices',
                            'Secure cloud backup',
                            'Connect your own private server',
                            'Multi-device secret access',
                            'Automatic encrypted backups',
                            'Restore secrets after reinstall',
                            'Advanced account recovery',
                            'Priority sync performance',
                            'Maximum privacy with self-hosted infrastructure',
                        ]}
                    />
                </View>

                <View
                    className={`mt-12 ${isTablet ? 'px-10' : 'px-5'
                        }`}
                >
                    <View
                        className="rounded-[30px] bg-[#dce1ec] dark:bg-zinc-900 p-7"
                        style={{
                            shadowColor: '#000',
                            shadowOpacity: 0.05,
                            shadowRadius: 16,
                            shadowOffset: { width: 0, height: 6 },
                            elevation: 2,
                        }}
                    >
                        <View className="flex-row items-center">
                            <View className="w-14 h-14 rounded-[18px] bg-[#4a6fa5]/10 items-center justify-center">
                                <Ionicons
                                    name="server-outline"
                                    size={28}
                                    color="#4a6fa5"
                                />
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="text-black dark:text-white text-[18px] font-bold">
                                    Self-Hosted Infrastructure
                                </Text>

                                <Text className="text-[#7b8496] mt-1 leading-5">
                                    Maximum control for privacy-focused users.
                                </Text>
                            </View>
                        </View>

                        <Text className="text-[#5b6475] dark:text-gray-300 leading-7 mt-6">
                            Pro users can connect their own servers and store
                            encrypted secrets independently. Your encryption
                            keys remain on-device, giving you complete ownership
                            over your infrastructure and data privacy.
                        </Text>

                        <View className="mt-6 flex-row flex-wrap gap-3">
                            {[
                                'Self-hosted',
                                'Zero-knowledge',
                                'Encrypted sync',
                                'Custom backend',
                                'Private infrastructure',
                            ].map((tag) => (
                                <View
                                    key={tag}
                                    className="px-4 py-2 rounded-full bg-[#4a6fa5]/10"
                                >
                                    <Text className="text-[#4a6fa5] text-[12px] font-semibold">
                                        {tag}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}