import LottieView from 'lottie-react-native';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
    onFinish: () => void;
}

export default function CustomSplash({ onFinish }: Props) {
    const animation = useRef<LottieView>(null);

    return (
        <View style={styles.container}>
            <LottieView
                ref={animation}
                source={require('../assets/animations/splash.json')}
                autoPlay
                loop={false}
                onAnimationFinish={onFinish}
                style={styles.lottie}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottie: {
        width: 200,
        height: 200,
    },
});