import SignupScreen from '@/Screens/SignupScreen';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Secret } from '../interfaces/Network';
import CreateSecretScreen from '../Screens/CreateSecretScreen';
import DashboardScreen from '../Screens/DashboardScreen';
import LoginScreen from '../Screens/LoginScreen';
import { Screens } from '../utils/const';


export type RootStackParamList = {
    Login: undefined;
    Signup: undefined;
    StartupScreen: undefined;
    Dashboard: undefined;
    CreateSecret: { secretItem?: Secret };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Navigation = () => {
    const Stack = createNativeStackNavigator<RootStackParamList>();

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                initialRouteName={Screens.Login}
                screenOptions={{ headerShown: false, animation: 'ios_from_right' }}
            >
                {/* <Stack.Screen name={Screens.StartupScreen} component={StartupScreen} /> */}
                <Stack.Screen name={Screens.Login} component={LoginScreen} />
                <Stack.Screen name={Screens.Signup} component={SignupScreen} />
                <Stack.Screen name={Screens.Dashboard} component={DashboardScreen} />
                <Stack.Screen name={Screens.CreateSecret} component={CreateSecretScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;
