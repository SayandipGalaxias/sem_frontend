import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { AppContact } from '../interfaces/Contacts';
import { useUserStore } from './UserStore';

function contactsKey(email: string) {
    return `@contacts_${email}`;
}

interface ContactsStore {
    contacts: AppContact[];
    loading: boolean;
    setContacts: (contacts: AppContact[]) => Promise<void>;
    loadContacts: () => Promise<void>;
    clearContacts: () => Promise<void>;
}

export const useContactsStore = create<ContactsStore>((set, get) => ({
    contacts: [],
    loading: false,

    setContacts: async (contacts: AppContact[]) => {
        const email = useUserStore.getState().user?.email ?? '';
        if (email) {
            await AsyncStorage.setItem(contactsKey(email), JSON.stringify(contacts));
        }
        set({ contacts });
    },

    loadContacts: async () => {
        set({ loading: true });
        try {
            const email = useUserStore.getState().user?.email ?? '';
            if (email) {
                const json = await AsyncStorage.getItem(contactsKey(email));
                if (json) {
                    set({ contacts: JSON.parse(json), loading: false });
                    return;
                }
            }
            set({ contacts: [], loading: false });
        } catch (_) {
            set({ loading: false });
        }
    },

    clearContacts: async () => {
        const email = useUserStore.getState().user?.email ?? '';
        if (email) {
            await AsyncStorage.removeItem(contactsKey(email));
        }
        set({ contacts: [] });
    },
}));