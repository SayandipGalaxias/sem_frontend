import {
    ActivityIndicator,
    Image,
    ImageStyle,
    Pressable,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import React from 'react';
import { CommonStylesFn } from '../utils/CommonStyles';
import { Colors } from '../utils/colors';
import { Fonts } from '../utils/Fonts';
import { moderateScale, scale, verticalScale } from '../utils/Responsive';

interface CommonButtonProps {
    label: string;
    textStyle?: TextStyle;
    containerStyle?: ViewStyle | ViewStyle[];
    disabledStyle?: ViewStyle;
    isDisabled?: boolean;
    isLoading?: boolean;
    onPress: () => void;
    leftIcon?: any;
    leftIconStyle?: ImageStyle;
}

const CommonButton = ({
    label = '',
    containerStyle = {},
    textStyle = {},
    isDisabled,
    disabledStyle = {},
    isLoading,
    onPress,
    leftIcon,
    leftIconStyle,
}: CommonButtonProps) => {
    return (
        <View style={[styles.container, containerStyle, isDisabled && disabledStyle]}>
            <Pressable
                style={styles.pressableContainer}
                onPress={onPress}
                disabled={isLoading || isDisabled}
            >
                {leftIcon && <Image source={leftIcon} style={[styles.leftIcon, leftIconStyle]} />}
                {isLoading ? (
                    <ActivityIndicator size={'small'} color={Colors.white} />
                ) : (
                    <Text style={[CommonStylesFn.text(4, Colors.white, Fonts.medium), textStyle]}>
                        {label}
                    </Text>
                )}
            </Pressable>
        </View>
    );
};

export default CommonButton;

const styles = StyleSheet.create({
    container: {
        height: verticalScale(40),
        borderRadius: moderateScale(10),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
    },
    leftIcon: {
        width: moderateScale(20),
        height: moderateScale(20),
    },
    pressableContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: scale(10),
    },
});
