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
    X,
    BusFront,
    Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, BankAccount, Bus } from "@/lib/supabase";
import { bankAccountApi } from "@/lib/api/bank-accounts";
import { busApi } from "@/lib/api/buses";

export default function FinancialSettingsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'accounts' | 'assignments'>('accounts');

    // Form state
    const [formData, setFormData] = useState({
        account_name: "",
        account_number: "",
        ifsc_code: "",
        bank_name: "",
        is_default: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push("/owner/auth/login");
                return;
            }

            const [accountsData, busesData] = await Promise.all([
                bankAccountApi.getByOwner(session.user.id),
                busApi.getByOwner(session.user.id)
            ]);

            setAccounts(accountsData);
            setBuses(busesData);
            setIsLoading(false);
        } catch (err: any) {
            console.error('Error loading data:', err);
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
                await bankAccountApi.update(editingId, formData);
            } else {
                await bankAccountApi.create({
                    ...formData,
                    owner_id: session.user.id,
                });
            }

            await loadData();
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
        setActiveTab('accounts');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bank account?')) return;
        try {
            await bankAccountApi.delete(id);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await bankAccountApi.setDefault(id);
            await loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAssignAccount = async (busId: string, accountId: string) => {
        try {
            await bankAccountApi.assignToBus(busId, accountId || null);
            setBuses(buses.map(b => b.id === busId ? { ...b, bank_account_id: accountId || null } : b));
        } catch (err: any) {
            console.error('Error assigning account:', err);
            alert('Failed to update assignment');
        }
    };

    const maskAccountNumber = (num: string) => {
        if (num.length <= 4) return num;
        return '•••• •••• •••• ' + num.slice(-4);
    };

    // Card Gradients
    const gradients = [
        "bg-gradient-to-br from-gray-900 to-gray-700",
        "bg-gradient-to-br from-blue-900 to-blue-700",
        "bg-gradient-to-br from-indigo-900 to-purple-800",
        "bg-gradient-to-br from-emerald-900 to-emerald-700",
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading financial data...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="flex items-center mb-4">
                    <Link href="/owner/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5 text-brand-slate" />
                        </Button>
                    </Link>
                    <div className="ml-2">
                        <h1 className="text-xl font-bold text-brand-slate">Financial Management</h1>
                        <p className="text-sm text-brand-grey">Manage accounts & assignments</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('accounts')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'accounts'
                                ? 'bg-white text-brand-slate shadow-sm'
                                : 'text-brand-grey hover:text-brand-slate'
                            }`}
                    >
                        Bank Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'assignments'
                                ? 'bg-white text-brand-slate shadow-sm'
                                : 'text-brand-grey hover:text-brand-slate'
                            }`}
                    >
                        Bus Assignments
                    </button>
                </div>
            </header>

            <div className="p-4 space-y-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'accounts' ? (
                        <motion.div
                            key="accounts"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-4"
                        >
                            {!showAddForm && (
                                <Button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full bg-brand-green hover:bg-green-700 h-12 text-base shadow-sm"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add New Account
                                </Button>
                            )}

                            {showAddForm && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <Card className="border-2 border-brand-green/20 overflow-hidden">
                                        <div className="bg-brand-green/5 p-4 border-b border-brand-green/10 flex justify-between items-center">
                                            <h3 className="font-bold text-brand-green">
                                                {editingId ? 'Edit Account Details' : 'New Account Details'}
                                            </h3>
                                            <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <CardContent className="p-4 pt-6">
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <Input
                                                    label="Beneficiary Name"
                                                    placeholder="e.g. John Doe"
                                                    value={formData.account_name}
                                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                                />
                                                <Input
                                                    label="Account Number"
                                                    placeholder="0000 0000 0000 0000"
                                                    value={formData.account_number}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setFormData({ ...formData, account_number: val });
                                                    }}
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Input
                                                        label="IFSC Code"
                                                        placeholder="SBIN000..."
                                                        value={formData.ifsc_code}
                                                        onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                                        maxLength={11}
                                                    />
                                                    <Input
                                                        label="Bank Name"
                                                        placeholder="SBI"
                                                        value={formData.bank_name}
                                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                    />
                                                </div>

                                                <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.is_default}
                                                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                                        className="w-4 h-4 rounded text-brand-green focus:ring-brand-green border-gray-300"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-brand-slate">Set as Default Account</span>
                                                        <span className="text-xs text-brand-grey">Used automatically for new buses</span>
                                                    </div>
                                                </label>

                                                {error && (
                                                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded text-center">{error}</p>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={isSaving}
                                                    className="w-full bg-brand-slate hover:bg-brand-slate/90"
                                                >
                                                    {isSaving ? 'Saving...' : (editingId ? 'Update Account' : 'Save Account')}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            <div className="space-y-3">
                                {accounts.map((account, index) => (
                                    <motion.div
                                        key={account.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className={`relative rounded-2xl p-5 shadow-lg text-white overflow-hidden ${gradients[index % gradients.length]}`}>
                                            {/* Background Pattern */}
                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
                                            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-black/10 blur-xl"></div>

                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <p className="text-xs font-medium opacity-70 uppercase tracking-wider">Bank Name</p>
                                                        <p className="font-bold text-lg">{account.bank_name}</p>
                                                    </div>
                                                    {account.is_default && (
                                                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mb-6">
                                                    <p className="text-xs font-medium opacity-70 uppercase tracking-wider mb-1">Account Number</p>
                                                    <p className="font-mono text-xl tracking-widest">{maskAccountNumber(account.account_number)}</p>
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-xs font-medium opacity-70 uppercase tracking-wider">Account Holder</p>
                                                        <p className="font-semibold">{account.account_name}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                                                            onClick={() => handleSetDefault(account.id)}
                                                            title="Set as Default"
                                                        >
                                                            <Star className={`w-4 h-4 ${account.is_default ? 'fill-white text-white' : ''}`} />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                                                            onClick={() => handleEdit(account)}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-200 hover:text-red-100 hover:bg-red-500/20"
                                                            onClick={() => handleDelete(account.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {accounts.length === 0 && !showAddForm && (
                                    <div className="text-center py-10 opacity-50">
                                        <CreditCard className="w-16 h-16 mx-auto mb-2 text-brand-slate" />
                                        <p>No accounts added yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="assignments"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-4"
                        >
                            <Card className="bg-blue-50 border-none">
                                <CardContent className="p-4 flex gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full h-fit">
                                        <LinkIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-bold mb-1">Connect Revenue Streams</p>
                                        <p>Select which bank account receives revenue from each bus. Changes save automatically.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {buses.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <BusFront className="w-16 h-16 mx-auto mb-2 text-brand-slate" />
                                    <p>No buses found to assign.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {buses.map((bus) => (
                                        <Card key={bus.id} className="overflow-hidden">
                                            <div className="p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center shrink-0">
                                                    <BusFront className="w-6 h-6 text-brand-green" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-brand-slate truncate">{bus.registration_number}</h3>
                                                    <p className="text-xs text-brand-grey truncate">{bus.route_from} → {bus.route_to}</p>
                                                </div>

                                                <div className="w-1/2">
                                                    <select
                                                        value={bus.bank_account_id || ""}
                                                        onChange={(e) => handleAssignAccount(bus.id, e.target.value)}
                                                        className="w-full text-sm p-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-brand-green truncate"
                                                    >
                                                        <option value="">Select Account...</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>
                                                                {acc.bank_name} - ••••{acc.account_number.slice(-4)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
