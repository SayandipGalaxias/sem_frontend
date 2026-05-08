import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { TabList, TabListProps, TabSlot, TabTrigger, TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, useColorScheme, View, StyleSheet } from "react-native";
import { Colors, MaxContentWidth, Spacing } from "@/constants/theme";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";
import { Button } from "@react-navigation/elements";

export default function AppTabsWeb() {
    return (
        <View style={styles.navbar}>
            <ThemedText>Hello</ThemedText>
            <Button>Log Out</Button>
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        width: '100%',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        paddingHorizontal: Spacing.three,
    }
});