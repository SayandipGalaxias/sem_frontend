import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Utility } from '../utils/Utility';
import { ToastType } from '../utils/const';
import { moderateScale, scale, verticalScale, widthPx } from '../utils/Responsive';
import { CommonStylesFn } from '../utils/CommonStyles';
import { Fonts } from '../utils/Fonts';
import { Colors } from '../utils/colors';

export default function ViewSecretScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        id?: string;
        name?: string;
        secret?: string;
        description?: string;
    }>();

    const [secretVisible, setSecretVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(params.secret ?? '');
        setCopied(true);
        Utility.showToast(ToastType.success, 'Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={moderateScale(24)} color={Colors.white} />
                </TouchableOpacity>
                <Text style={CommonStylesFn.text(5, Colors.white, Fonts.bold)}>View Secret</Text>
                <View style={{ width: moderateScale(24) }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Name</Text>
                        <View style={styles.valueRow}>
                            <Text style={styles.value}>{params.name}</Text>
                        </View>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Description</Text>
                        <View style={styles.valueRow}>
                            <Text style={styles.value}>{params.description}</Text>
                        </View>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Secret</Text>
                        <View style={styles.valueRow}>
                            <Text style={[styles.value, { flex: 1 }]}>
                                {secretVisible ? params.secret : '••••••••••••••••'}
                            </Text>
                            <TouchableOpacity onPress={() => setSecretVisible(v => !v)} style={styles.iconBtn}>
                                <Ionicons name={secretVisible ? 'eye-off-outline' : 'eye-outline'} size={moderateScale(18)} color={Colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCopy} style={styles.iconBtn}>
                                <Ionicons name={copied ? 'checkmark-done-outline' : 'copy-outline'} size={moderateScale(18)} color={copied ? Colors.green : Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: verticalScale(32),
        paddingBottom: verticalScale(40),
    },
    card: {
        width: widthPx(90),
        backgroundColor: Colors.cardBackground,
        borderRadius: moderateScale(16),
        paddingHorizontal: scale(24),
        paddingVertical: verticalScale(24),
        gap: verticalScale(24),
    },
    fieldContainer: {
        gap: verticalScale(8),
    },
    label: {
        ...CommonStylesFn.text(3, Colors.textMuted, Fonts.regular),
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: moderateScale(10),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(14),
        gap: scale(8),
    },
    value: {
        ...CommonStylesFn.text(3.5, Colors.textPrimary, Fonts.regular),
        flex: 1,
    },
    iconBtn: {
        padding: scale(4),
    },
});