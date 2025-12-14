"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    CreditCard,
    Trash2,
    Star,
    Building2,
    Edit2,
    Check,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, BankAccount } from "@/lib/supabase";
import { bankAccountApi } from "@/lib/api/bank-accounts";

export default function FinancialSettingsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        account_name: "",
        account_number: "",
        ifsc_code: "",
        bank_name: "",
        is_default: false,
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push("/owner/auth/login");
                return;
            }

            const data = await bankAccountApi.getByOwner(session.user.id);
            setAccounts(data);
            setIsLoading(false);
        } catch (err: any) {
            console.error('Error loading accounts:', err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            account_name: "",
            account_number: "",
            ifsc_code: "",
            bank_name: "",
            is_default: false,
        });
        setShowAddForm(false);
        setEditingId(null);
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.account_name || !formData.account_number || !formData.ifsc_code || !formData.bank_name) {
            setError("Please fill in all fields");
            return;
        }

        if (formData.ifsc_code.length !== 11) {
            setError("IFSC code must be 11 characters");
            return;
        }

        setIsSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            if (editingId) {
                // Update existing
                await bankAccountApi.update(editingId, formData);
            } else {
                // Create new
                await bankAccountApi.create({
                    ...formData,
                    owner_id: session.user.id,
                });
            }

            await loadAccounts();
            resetForm();
        } catch (err: any) {
            console.error('Error saving account:', err);
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (account: BankAccount) => {
        setFormData({
            account_name: account.account_name,
            account_number: account.account_number,
            ifsc_code: account.ifsc_code,
            bank_name: account.bank_name,
            is_default: account.is_default,
        });
        setEditingId(account.id);
        setShowAddForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bank account?')) return;

        try {
            await bankAccountApi.delete(id);
            await loadAccounts();
        } catch (err: any) {
            console.error('Error deleting account:', err);
            setError(err.message);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await bankAccountApi.setDefault(id);
            await loadAccounts();
        } catch (err: any) {
            console.error('Error setting default:', err);
            setError(err.message);
        }
    };

    // Mask account number for display
    const maskAccountNumber = (num: string) => {
        if (num.length <= 4) return num;
        return '••••' + num.slice(-4);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="bg-white shadow-sm p-4 flex items-center">
                <Link href="/owner/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5 text-brand-slate" />
                    </Button>
                </Link>
                <div className="ml-2">
                    <h1 className="text-xl font-bold text-brand-slate">Financial Settings</h1>
                    <p className="text-sm text-brand-grey">Manage bank accounts for revenue</p>
                </div>
            </header>

            <div className="p-4 space-y-4">
                {/* Add Account Button */}
                {!showAddForm && (
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className="w-full bg-brand-green hover:bg-green-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Bank Account
                    </Button>
                )}

                {/* Add/Edit Form */}
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-brand-slate">
                                        {editingId ? 'Edit Bank Account' : 'Add Bank Account'}
                                    </h2>
                                    <Button variant="ghost" size="icon" onClick={resetForm}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Beneficiary Name"
                                        placeholder="Account holder name"
                                        value={formData.account_name}
                                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    />

                                    <Input
                                        label="Account Number"
                                        placeholder="Enter account number"
                                        value={formData.account_number}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setFormData({ ...formData, account_number: val });
                                        }}
                                    />

                                    <Input
                                        label="IFSC Code"
                                        placeholder="e.g., SBIN0001234"
                                        value={formData.ifsc_code}
                                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                        maxLength={11}
                                    />

                                    <Input
                                        label="Bank Name"
                                        placeholder="e.g., State Bank of India"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    />

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                                        />
                                        <span className="text-sm text-brand-slate">Set as default account</span>
                                    </label>

                                    {error && (
                                        <p className="text-sm text-red-500 text-center">{error}</p>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 bg-brand-green hover:bg-green-700"
                                        >
                                            {isSaving ? 'Saving...' : (editingId ? 'Update' : 'Add Account')}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Accounts List */}
                <div>
                    <h2 className="font-bold text-brand-slate mb-3">Your Bank Accounts</h2>

                    {accounts.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                <p className="text-brand-grey mb-2">No bank accounts added yet</p>
                                <p className="text-sm text-brand-grey">
                                    Add a bank account to receive revenue from ticket sales
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map((account, index) => (
                                <motion.div
                                    key={account.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className={account.is_default ? 'border-2 border-brand-green' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                                        <Building2 className="w-6 h-6 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-brand-slate">{account.account_name}</h3>
                                                            {account.is_default && (
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Star className="w-3 h-3" />
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-brand-grey">{account.bank_name}</p>
                                                        <p className="text-sm text-brand-grey">
                                                            A/C: {maskAccountNumber(account.account_number)} • {account.ifsc_code}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {!account.is_default && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleSetDefault(account.id)}
                                                            className="text-yellow-600 hover:bg-yellow-50"
                                                            title="Set as default"
                                                        >
                                                            <Star className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(account)}
                                                        className="text-blue-500 hover:bg-blue-50"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(account.id)}
                                                        className="text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-700">
                            <strong>💡 Tip:</strong> You can assign different bank accounts to different buses in Fleet Management.
                            Revenue from each bus will be deposited to its assigned account.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
