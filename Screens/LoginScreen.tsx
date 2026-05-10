import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuthApi } from '../api/Auth/hook';
import '../global.css';
import { Colors } from '../utils/colors';
import { Utility } from '../utils/Utility';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const { login, loading } = useAuthApi();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!Utility.isEmailValid(email)) {
            setError('Invalid email format');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        setError('');
        await login({ email, password });
    };

    return (
        <View className="flex-1 bg-[#e8ecf4] dark:bg-black">
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16, }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View className='items-center gap-5 mb-16'>
                        <View className='w-32 h-32 rounded-[35px]'>
                            <Image source={require('../assets/images/app_icon.png')} style={{ height: "100%", width: "100%", borderRadius: 35 }} resizeMode='contain' />
                        </View>
                        <Text className='text-5xl text-[#0984e3] font-inter font-bold'>
                            iSmart Manager
                        </Text>
                    </View>

                    <View className='w-full lg:w-[700px] bg-white dark:bg-gray-900 rounded-[50px] p-10 gap-5'>
                        <Text className='text-2xl lg:text-xl text-black dark:text-white font-semibold text-center'>
                            Welcome Back to iSmart Manager, Sign In Now!
                        </Text>

                        <View className='gap-7'>
                            <View>
                                <Text className="text-lg lg:text-base font-medium text-black dark:text-gray-200">
                                    Email
                                </Text>
                                <TextInput
                                    className='bg-[#e8ecf4] dark:bg-gray-700 text-black dark:text-gray-200 placeholder:text-gray-400 rounded-[35px] p-4 text-lg lg:text-base'
                                    placeholder='developers@galaxias.com'
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setError('');
                                    }}
                                    autoCapitalize='none'
                                    autoCorrect={false}
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                />
                            </View>

                            <View>
                                <Text className="text-lg lg:text-base font-medium text-black dark:text-gray-200">
                                    Password
                                </Text>
                                <View>
                                    <TextInput
                                        className='bg-[#e8ecf4] dark:bg-gray-700 text-black dark:text-gray-200 placeholder:text-gray-400 rounded-[35px] p-4 text-lg lg:text-base'
                                        placeholder='MySecurePass'
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            setError('');
                                        }}
                                        autoCapitalize='none'
                                        autoCorrect={false}
                                        secureTextEntry={!showPass}
                                        textContentType="password"
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                    />
                                    <View className='absolute right-5 top-1/2 -translate-y-1/2'>
                                        <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color={Colors.black} onPress={() => setShowPass(!showPass)} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {error ? (
                            <Text className='text-red-500 text-center my-2'>{error}</Text>
                        ) : null}

                        <TouchableOpacity className='bg-[#0984e3] rounded-[35px] p-4 items-center mt-4' onPress={handleLogin} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text className='text-white font-bold text-xl lg:text-lg'>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <Text className='text-gray-400 text-center mt-2' onPress={() => router.replace('/register')}>
                            Don't have an account?
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}