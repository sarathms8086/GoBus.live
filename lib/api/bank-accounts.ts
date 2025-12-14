import { supabase, BankAccount } from '@/lib/supabase';

export const bankAccountApi = {
    /**
     * Get all bank accounts for an owner
     */
    async getByOwner(ownerId: string): Promise<BankAccount[]> {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as BankAccount[];
    },

    /**
     * Get default bank account for an owner
     */
    async getDefault(ownerId: string): Promise<BankAccount | null> {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('owner_id', ownerId)
            .eq('is_default', true)
            .maybeSingle();

        if (error) throw error;
        return data as BankAccount | null;
    },

    /**
     * Create a new bank account
     */
    async create(account: {
        owner_id: string;
        account_name: string;
        account_number: string;
        ifsc_code: string;
        bank_name: string;
        is_default?: boolean;
    }): Promise<BankAccount> {
        const { data, error } = await supabase
            .from('bank_accounts')
            .insert(account)
            .select()
            .single();

        if (error) throw error;
        return data as BankAccount;
    },

    /**
     * Update a bank account
     */
    async update(id: string, updates: Partial<BankAccount>): Promise<BankAccount> {
        const { data, error } = await supabase
            .from('bank_accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as BankAccount;
    },

    /**
     * Delete a bank account
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Set a bank account as default
     */
    async setDefault(id: string): Promise<BankAccount> {
        const { data, error } = await supabase
            .from('bank_accounts')
            .update({ is_default: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as BankAccount;
    },

    /**
     * Assign a bank account to a bus
     */
    async assignToBus(busId: string, bankAccountId: string | null): Promise<void> {
        const { error } = await supabase
            .from('buses')
            .update({ bank_account_id: bankAccountId })
            .eq('id', busId);

        if (error) throw error;
    },
};
