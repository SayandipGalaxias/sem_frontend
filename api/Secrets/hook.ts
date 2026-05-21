import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { SecretsApi } from '.';
import { errorHandler } from '../utils/handlers';
import type { AddSecretRequest, Secret, UpdateSecretRequest } from './types';

export function useSecretsApi() {
    const [loading, setLoading] = useState(false);
    const [secrets, setSecrets] = useState<Secret[]>([]);

    const getList = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { data: res } } = await SecretsApi.getList();
            setSecrets(res.secrets);
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }, []);

    async function addSecret(payload: AddSecretRequest) {
        setLoading(true);
        try {
            await SecretsApi.addSecret(payload);
            await getList();
            Toast.show({ type: 'success', text1: 'Secret added' });
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    async function deleteSecret(id: string) {
        setLoading(true);
        try {
            await SecretsApi.deleteSecret({ id });
            setSecrets((prev) => prev.filter((s) => s.id !== id));
            Toast.show({ type: 'success', text1: 'Secret deleted' });
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    async function updateSecret(payload: UpdateSecretRequest) {
        setLoading(true);
        try {
            await SecretsApi.updateSecret(payload);
            await getList();
            Toast.show({ type: 'success', text1: 'Secret updated' });
        } catch (error) {
            Toast.show({ type: 'error', text1: errorHandler(error) });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { getList(); }, [getList]);

    return { loading, secrets, getList, addSecret, deleteSecret, updateSecret };
}