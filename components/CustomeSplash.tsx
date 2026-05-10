import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

type Props = {
    onFinish: () => void;
};

export default function CustomSplash({ onFinish }: Props) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.delay(1200),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onFinish();
        });
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-black">
            <Animated.View style={{ opacity }}>
                <Text className="dark:text-white text-black text-4xl font-bold">
                    iSmart
                </Text>
            </Animated.View>
        </View>
    );
}