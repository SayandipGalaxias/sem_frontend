import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { AppContact } from '../interfaces/Contacts';

interface ContactsState {
    contacts: AppContact[];
    loading: boolean;

    setContacts: (contacts: AppContact[]) => Promise<void>;
    loadContacts: () => Promise<void>;
    clearContacts: () => Promise<void>;
}

const STORAGE_KEY = 'CONTACTS_BACKUP';

export const useContactsStore = create<ContactsState>((set) => ({
    contacts: [],
    loading: false,

    setContacts: async (contacts) => {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));

        set({ contacts });
    },

    loadContacts: async () => {
        try {
            set({ loading: true });

            const raw = await AsyncStorage.getItem(STORAGE_KEY);

            if (raw) {
                set({
                    contacts: JSON.parse(raw),
                });
            }
        } finally {
            set({ loading: false });
        }
    },

    clearContacts: async () => {
        await AsyncStorage.removeItem(STORAGE_KEY);

        set({
            contacts: [],
        });
    },
}));