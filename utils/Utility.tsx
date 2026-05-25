import { useEncryptionStore } from "@/store/EncryptionStore";
import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import React from "react";
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import Toast, { BaseToast, BaseToastProps, ErrorToast } from 'react-native-toast-message';
import { ErrorWithMessage } from '../interfaces/Network';
import { revertAll, useUserStore } from '../store/UserStore';
import { Colors } from './colors';
import { CommonStylesFn } from './CommonStyles';
import { ToastType } from './const';
import { Fonts } from './Fonts';
import { scale, verticalScale, widthPx } from './Responsive';

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
  });};

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

const getRandomSecret = async (): Promise<string> => {
  const email = useUserStore.getState().user?.email ?? '';
  const randomString = generateRandomString(10);
  const encryptionKey = generateEncryptionKey(email, randomString);
  const encryptedSecret = await encryptSecret(randomString, encryptionKey);
  return encryptedSecret;
};

const getAccessToken = () => {
  return useUserStore.getState().user;
};

export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }
  return result;
};

export const generateEncryptionKey = (
  email: string,
  randomString: string,
): string => {
  const salt = CryptoJS.enc.Utf8.parse(email);
  const key = CryptoJS.PBKDF2(randomString, salt, {
    keySize: 256 / 32,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA256,
  });
  return key.toString();
};

export const encryptSecret = async (
  plainText: string,
  encryptionKey: string
): Promise<string> => {
  try {
    const ivBytes = Crypto.getRandomValues(new Uint8Array(16));
    const iv = CryptoJS.lib.WordArray.create(ivBytes as unknown as number[]);
    const key = CryptoJS.enc.Hex.parse(encryptionKey);

    const cipher = CryptoJS.AES.encrypt(plainText, key, { iv });

    return JSON.stringify({
      cipher: cipher.toString(),
      iv: Array.from(ivBytes),
    });
  } catch (error) {
    console.error('Encryption Error:', error);
    throw new Error('Failed to encrypt secret');
  }
};

export const decryptSecret = async (encryptedData: string): Promise<string> => {
  try {
    const user = useUserStore.getState().user;
    const email = user?.email.toString() || '';
    const { randomString } = useEncryptionStore.getState();

    const generatedEncryptionKey = generateEncryptionKey(email, randomString);
    const key = CryptoJS.enc.Hex.parse(generatedEncryptionKey);

    const { cipher, iv: ivStored } = JSON.parse(encryptedData);
    const iv = CryptoJS.lib.WordArray.create(new Uint8Array(ivStored) as unknown as number[]);

    const decrypted = CryptoJS.AES.decrypt(cipher, key, { iv });

    // console.log('Decrypted sigBytes:', decrypted.sigBytes);

    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plainText) throw new Error('Empty result — key mismatch or corrupted data');

    // console.log('Decrypted data (text):', plainText);
    return plainText;
  } catch (error) {
    // console.error('Decryption Error:', error);
    // throw new Error('Failed to decrypt secret');
    showToast(ToastType.error, 'Decryption Failed', 'May be this secret was encrypted on another device.');
    return 'Decryption Failed';
  }
};

export const decryptSecretWithKey = async (
  encryptedData: string,
  encryptionKey: string,
): Promise<string> => {
  try {
    const key = CryptoJS.enc.Hex.parse(encryptionKey);
    const parsed = JSON.parse(encryptedData);
    // console.log('decryptSecretWithKey — parsed:', parsed);
    // console.log('decryptSecretWithKey — key length:', encryptionKey.length);
    const { cipher, iv: ivStored } = parsed;
    const iv = CryptoJS.lib.WordArray.create(
      new Uint8Array(ivStored) as unknown as number[],
    );
    const decrypted = CryptoJS.AES.decrypt(cipher, key, { iv });
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    // console.log('decryptSecretWithKey — plainText length:', plainText.length);
    if (!plainText) throw new Error('Empty result — key mismatch or corrupted data');
    return plainText;
  } catch (error) {
    console.error('decryptSecretWithKey REAL ERROR:', error);
    showToast(ToastType.error, 'Decryption Failed', 'Secret may have been encrypted on another device.');
    return 'Decryption Failed';
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
  decryptSecretWithKey,
  isEmailValid,
};