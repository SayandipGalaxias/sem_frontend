import Toast, { BaseToast, BaseToastProps, ErrorToast } from 'react-native-toast-message';
import { Colors } from './colors';
import { scale, verticalScale, widthPx } from './Responsive';
import { Fonts } from './Fonts';
import { CommonStylesFn } from './CommonStyles';
import { Platform } from 'react-native';
import { Screens, ToastType } from './const';
import { ErrorWithMessage } from '../interfaces/Network';
import { revertAll, useUserStore } from '../store/UserStore';


export const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      style={{ borderLeftColor: Colors.green, height: verticalScale(70), width: widthPx(80) }}
      contentContainerStyle={{ paddingHorizontal: scale(10) }}
      text1Style={[
        CommonStylesFn.text(3, Colors.black, Fonts.medium),
        Platform.OS === 'ios' && { marginBottom: verticalScale(5) },
      ]}
      text2Style={CommonStylesFn.text(3.5, Colors.green)}
    />
  ),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      style={{ borderLeftColor: Colors.error, height: verticalScale(70), width: widthPx(80) }}
      contentContainerStyle={{
        paddingHorizontal: scale(10),
      }}
      text1Style={[
        CommonStylesFn.text(3, Colors.black, Fonts.medium),
        Platform.OS === 'ios' && { marginBottom: verticalScale(5) },
      ]}
      text2Style={CommonStylesFn.text(3.5, Colors.error)}
    />
  ),
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      text2NumberOfLines={2}
      style={{ borderLeftColor: Colors.info, height: verticalScale(70) }}
      contentContainerStyle={{ paddingHorizontal: scale(10) }}
      text1Style={[
        CommonStylesFn.text(3, Colors.black, Fonts.medium),
        Platform.OS === 'ios' && { marginBottom: verticalScale(5) },
      ]}
      text2Style={CommonStylesFn.text(3, Colors.black, Fonts.medium)}
    />
  ),
};

export const showToast = (type: ToastType, title: string, subTitle?: string) => {
  return Toast.show({
    type,
    text1: title ?? 'Something went wrong',
    ...(subTitle && { text2: subTitle }),
  });
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
};

const hasErrorKey = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as Record<string, unknown>).error === 'string'
  );
};

const toErrorWithMessage = (maybeError: unknown): ErrorWithMessage => {
  if (isErrorWithMessage(maybeError)) return maybeError;
  if (hasErrorKey(maybeError)) return maybeError;
  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
};

const getErrorMessage = (error: unknown) => {
  return toErrorWithMessage(error).message;
};

const logout = () => {
  // reset({ index: 0, routes: [{ name: Screens.Login }] });
  revertAll();
};

const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 30;
  const lightness = 45 + Math.random() * 15;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getRandomSecret = () => {
  const randomString = `${useUserStore.getState().user?.email}${generateRandomString(10)}`;
  const encryptedSecret = encryptSecret(randomString, randomString);
  return encryptedSecret;
};

const getAccessToken = () => {
  return useUserStore.getState().user;
};

const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }
  return result;
};

export const generateEncryptionKey = async (
  email: string,
  randomString: string,
): Promise<string> => {
  const combined = `${email}${randomString}`;
  // const hashedKey = await AES.sha256(combined);
  const hashedKey = combined;
  return hashedKey;
};

export const encryptSecret = async (plainText: string, encryptionKey: string): Promise<string> => {
  try {
    // const iv = await AES.randomKey(16); // Generate random 16 bytes IV
    // const cipher = await AES.encrypt(plainText, encryptionKey, iv, 'aes-256-cbc');
    const iv = 'randomIV';
    const cipher = plainText;
    return JSON.stringify({ cipher, iv }); // save IV + cipher together
  } catch (error) {
    console.error('Encryption Error:', error);
    throw new Error('Failed to encrypt secret');
  }
};

export const decryptSecret = async (encryptedData: string): Promise<string> => {
  try {
    // const { email } = useUserStore.getState().user;
    // const { randomString } = useEncryptionStore.getState();
    // const generatedEncryptionKey = await generateEncryptionKey(email, randomString);

    const { cipher, iv } = JSON.parse(encryptedData);
    // const plainText = await AES.decrypt(cipher, generatedEncryptionKey, iv, 'aes-256-cbc');
    const plainText = cipher;
    return plainText;
  } catch (error) {
    console.error('Decryption Error:', error);
    throw new Error('Failed to decrypt secret');
  }
};

const isEmailValid = (email: string) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export const Utility = {
  toastConfig,
  showToast,
  getErrorMessage,
  getRandomColor,
  logout,
  getRandomSecret,
  getAccessToken,
  generateRandomString,
  generateEncryptionKey,
  encryptSecret,
  decryptSecret,
  isEmailValid,
};
