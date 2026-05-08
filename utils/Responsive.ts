import { Dimensions, Platform, StatusBar } from 'react-native';

const { height: W_HEIGHT, width: W_WIDTH } = Dimensions.get('window');

export const isIPhoneX =
    Platform.OS === 'ios' && !Platform.isPad
        ? W_HEIGHT === 780 ||
        W_WIDTH === 780 ||
        W_HEIGHT === 812 ||
        W_WIDTH === 812 ||
        W_HEIGHT === 844 ||
        W_WIDTH === 844 ||
        W_HEIGHT === 896 ||
        W_WIDTH === 896 ||
        W_HEIGHT === 926 ||
        W_WIDTH === 926
        : false;

let screenWidth = Dimensions.get('window').width;
let screenHeight = Dimensions.get('window').height;

const { height } = Dimensions.get('screen');

export const widthPx = (widthPercent: number) => {
    const elemWidth = typeof widthPercent === 'number' ? widthPercent : parseFloat(widthPercent);
    return (screenWidth * elemWidth) / 100;
};

export const heightPx = (heightPercent: number) => {
    const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
    return ((screenHeight - Number(getStatusBarHeight().toFixed(0))) * elemHeight) / 100;
};

export const font = (font: number) => {
    const fontSize = typeof font === 'number' ? font : parseFloat(font);
    return moderateScale(fontSize * 4);
};

export const getStatusBarHeight = () => {
    return Platform.select({
        ios: isIPhoneX ? 78 : 20,
        android: StatusBar?.currentHeight ?? 0 > 24 ? 0 : StatusBar.currentHeight,
        default: 0,
    });
};

export const isIPhoneXSeries = () => {
    return Platform.OS === 'android' ? 0 : isIPhoneX ? 34 : 0;
};

export const fullHeight = (heightPercent: number) => {
    const elemHeight = typeof heightPercent === 'number' ? heightPercent : parseFloat(heightPercent);
    return (height * elemHeight) / 100;
};

export const isAndroidNotch =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 >= 24 : false;

// ///////////////////////////////////////////////

export const [shortDimension, longDimension] =
    W_WIDTH < W_HEIGHT ? [W_WIDTH, W_HEIGHT] : [W_HEIGHT, W_WIDTH];

// guideline size
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = (size: number) => (shortDimension / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (longDimension / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;
export const WINDOW_HEIGHT = Dimensions.get('window').height;
export const WINDOW_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('screen').height;
export const SCREEN_WIDTH = Dimensions.get('screen').width;
