'use client';

import { useEffect, useRef, useState } from 'react';
import { Banknote, ShoppingCart, HandCoins, Wallet, Package, Tag, Mic, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to get consistent styling for transaction types
const getTypeStyle = (type: string) => {
    switch (type) {
        case 'sale': return { icon: Banknote, label: 'Penjualan', color: 'text-sale', bg: 'bg-sale/10', border: 'border-sale/20' };
        case 'purchase': return { icon: ShoppingCart, label: 'Pembelian', color: 'text-purchase', bg: 'bg-purchase/10', border: 'border-purchase/20' };
        case 'debt_add': return { icon: HandCoins, label: 'Hutang Baru', color: 'text-debt', bg: 'bg-debt/10', border: 'border-debt/20' };
        case 'debt_payment': return { icon: Wallet, label: 'Bayar Hutang', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
        case 'stock_add': return { icon: Package, label: 'Tambah Stok', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
        case 'stock_check': return { icon: Package, label: 'Cek Stok', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-muted' };
        case 'price_update': return { icon: Tag, label: 'Update Harga', color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' };
        default: return { icon: Banknote, label: 'Transaksi', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
    }
};

function formatRupiah(amount: number | null | undefined) {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

interface ParsedResult {
    type: string;
    transactions?: Array<{
        item_name: string | null;
        quantity: number | null;
        unit: string | null;
        price_per_unit: number | null;
        total_amount: number | null;
    }>;
    debt?: {
        debtor_name: string | null;
        amount: number | null;
        original_amount?: number | null;
    } | null;
    stock?: {
        item_name: string | null;
        quantity: number | null;
        unit: string | null;
        modal_per_unit?: number | null;
        sell_per_unit?: number | null;
        [key: string]: unknown;
    } | null;
    confidence: number;
}

export default function TestPage() {
    const [transcript, setTranscript] = useState('Jual rokok sempurna 2 bungkus, sama jisamso 1 bungkus, totalnya 65 ribu');
    const [result, setResult] = useState<{ transcript: string; parsed: ParsedResult; raw_response?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRaw, setShowRaw] = useState(false);

    // Collapsible states
    const [showBasic, setShowBasic] = useState(false);
    const [showComplex, setShowComplex] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const resultRef = useRef<HTMLDivElement | null>(null);

    // Sorted from Simple (Single Intent) to Complex (Multi Intent/Params)
    const testCases = [
        // Level 1: Simple Single Actions
        'Jual Indomie 3 bungkus',
        'Bu Tejo ngutang 50 ribu',
        'Tambah stok beras 20 kg',
        'Kurangi stok telur 5 kg',
        'Ganti harga jual Indomie goreng jadi 3500',

        // Level 2: More params (price input)
        'Beli telur 10 kg, 10 ribu per kg',

        // Level 3: Contextual / History
        'Mas Budi yang kemarin hutang 50 ribu, sekarang bayar 25 ribu',

        // Level 4: Simple Multi-item
        'Jual rokok sempurna 2 bungkus, sama jisamso 1 bungkus, totalnya 65 ribu',
    ];

    const complexTestCases = [
        // Level 5: Complex Purchase w/ Details
        'Beli Indomie goreng 1 kardus harga 115 ribu, isinya 40 bungkus',

        // Level 6: Debt with Immediate Payment
        'Pak Yono hutang belanjaan 150 ribu, tapi langsung bayar 50 ribu',

        // Level 7: Multiple Price Updates
        'Ganti harga beli beras jadi 13 ribu, sama harga jualnya naik jadi 15 ribu',

        // Level 8: Complex Multi-item with decimals/units
        'Jual beras 2 kilo, gula pasir 1 kilo, sama minyak goreng 2 liter, total semuanya 75 ribu',
        'Jual telur setengah kilo, tepung terigu 250 gram, sama santan kara 2 bungkus'
    ];

    const scrollToInput = () => {
        if (inputRef.current) {
            inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            inputRef.current.focus({ preventScroll: true });
        }
    };

    const handleCaseSelect = (value: string) => {
        setTranscript(value);
        scrollToInput();
    };

    const handleTest = async () => {
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const response = await fetch('/api/voice-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript })
            });
            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setResult(data);
            }
        } catch (err) {
            setError(String(err));
        }
        setLoading(false);
    };

    useEffect(() => {
        if (result && resultRef.current) {
            resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [result]);

    const style = result ? getTypeStyle(result.parsed.type) : getTypeStyle('sale');
    const TypeIcon = style.icon;

    const totalAmount = result?.parsed.transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        || result?.parsed.debt?.amount
        || 0;

    return (
        <div className="min-h-screen bg-background p-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">🧪 AI Prompt Tester</h1>
                    <p className="text-muted-foreground text-sm">Test voice parsing logic without recording</p>
                </div>

                {/* Quick Test Cases */}
                <div className="card-transaction bg-card border border-border overflow-hidden">
                    <button
                        onClick={() => setShowBasic(!showBasic)}
                        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
                    >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Scenarios</p>
                        {showBasic ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {showBasic && (
                        <div className="p-5 pt-0 border-t border-border/50 bg-muted/20">
                            <div className="grid gap-2 pt-4">
                                {testCases.map((tc, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleCaseSelect(tc)}
                                        className="text-xs px-4 py-3 rounded-xl bg-background hover:bg-accent hover:text-accent-foreground transition-all border border-border text-left shadow-sm truncate"
                                        title={tc}
                                    >
                                        <span className="font-mono text-muted-foreground mr-2">0{i + 1}.</span>
                                        {tc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Complex Test Cases */}
                <div className="card-transaction bg-card border border-border overflow-hidden">
                    <button
                        onClick={() => setShowComplex(!showComplex)}
                        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
                    >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Complex Scenarios</p>
                        {showComplex ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {showComplex && (
                        <div className="p-5 pt-0 border-t border-border/50 bg-muted/20">
                            <div className="grid gap-2 pt-4">
                                {complexTestCases.map((tc, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleCaseSelect(tc)}
                                        className="text-xs px-4 py-3 rounded-xl bg-background hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all border border-border text-left shadow-sm"
                                    >
                                        <span className="font-mono text-muted-foreground mr-2">0{i + 1}.</span>
                                        {tc}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="card-transaction bg-card border border-border p-5 space-y-4">
                    <label className="block text-sm font-medium text-foreground">
                        <Mic className="w-4 h-4 inline mr-2 text-primary" />
                        Transcript Input
                    </label>
                    <textarea
                        ref={inputRef}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="w-full p-4 rounded-xl bg-muted/50 border border-input text-foreground focus:ring-2 focus:ring-ring focus:border-input resize-none transition-all"
                        rows={3}
                        placeholder="Ketik simulasi perintah suara di sini..."
                    />
                    <button
                        onClick={handleTest}
                        disabled={loading || !transcript.trim()}
                        className={cn(
                            'w-full py-3 rounded-xl font-medium text-primary-foreground shadow-lg transition-all',
                            'bg-primary hover:bg-primary/90 active:scale-[0.98]',
                            loading && 'opacity-70 cursor-not-allowed'
                        )}
                    >
                        {loading ? 'Processing...' : 'Test Parsing Logic'}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex gap-3 text-destructive">
                        <XCircle className="w-5 h-5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold">Error Occurred</p>
                            <p className="opacity-90">{error}</p>
                        </div>
                    </div>
                )}

                {/* Result Preview Card */}
                {result && (
                    <div ref={resultRef} className="card-transaction bg-card border border-border overflow-hidden p-0">
                        {/* Card Header */}
                        <div className="p-5 border-b border-border bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm', style.bg)}>
                                    <TypeIcon className={cn('w-6 h-6', style.color)} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground leading-tight">{style.label}</h3>
                                    <p className="text-sm text-muted-foreground">Konfirmasi transaksi</p>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-full border border-border shadow-sm">
                                        {result.parsed.confidence >= 0.8 ? (
                                            <CheckCircle className="w-3.5 h-3.5 text-success" />
                                        ) : (
                                            <XCircle className="w-3.5 h-3.5 text-warning" />
                                        )}
                                        <span className={cn('text-xs font-bold', result.parsed.confidence >= 0.8 ? 'text-success' : 'text-warning')}>
                                            {Math.round(result.parsed.confidence * 100)}%
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1">Confidence</span>
                                </div>
                            </div>
                        </div>

                        {/* Transcript Display */}
                        <div className="px-5 py-4 bg-muted/30 border-b border-border/50">
                            <div className="flex gap-3">
                                <Mic className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground/80 italic leading-relaxed">&quot;{result.transcript}&quot;</p>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-5 space-y-4">
                            {/* Transactions List */}
                            {result.parsed.transactions?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-foreground">{item.item_name || 'Item tidak dikenal'}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                                {item.quantity || 0} {item.unit || 'pcs'}
                                            </span>
                                            {item.price_per_unit && (
                                                <span>x {formatRupiah(item.price_per_unit)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn('font-bold tabular-nums', item.total_amount ? 'text-foreground' : 'text-muted-foreground/50')}>
                                            {formatRupiah(item.total_amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Debt Info */}
                            {result.parsed.debt?.debtor_name && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                                    <div>
                                        <p className="font-semibold text-foreground">{result.parsed.debt.debtor_name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {result.parsed.type === 'debt_payment' ? 'Pembayaran Hutang' : 'Pencatatan Hutang'}
                                            {result.parsed.debt.original_amount && (
                                                <span className="ml-1 text-xs">• Total tagihan: {formatRupiah(result.parsed.debt.original_amount)}</span>
                                            )}
                                        </p>
                                    </div>
                                    <p className="font-bold text-foreground tabular-nums">
                                        {formatRupiah(result.parsed.debt.amount)}
                                    </p>
                                </div>
                            )}

                            {/* Stock Info */}
                            {result.parsed.stock?.item_name && (
                                <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Nama Barang</span>
                                        <span className="font-semibold text-foreground">{result.parsed.stock.item_name}</span>
                                    </div>
                                    {result.parsed.stock.quantity !== null && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Perubahan Stok</span>
                                            <span className={cn(
                                                'text-sm font-bold px-2 py-0.5 rounded',
                                                (result.parsed.stock.quantity || 0) > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                            )}>
                                                {(result.parsed.stock.quantity || 0) > 0 ? '+' : ''}{result.parsed.stock.quantity} {result.parsed.stock.unit}
                                            </span>
                                        </div>
                                    )}
                                    {/* Price Updates */}
                                    {(result.parsed.stock.sell_per_unit || result.parsed.stock.modal_per_unit) && (
                                        <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-4">
                                            {result.parsed.stock.modal_per_unit && (
                                                <div>
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Harga Beli Baru</span>
                                                    <p className="font-semibold text-foreground">{formatRupiah(result.parsed.stock.modal_per_unit)}</p>
                                                </div>
                                            )}
                                            {result.parsed.stock.sell_per_unit && (
                                                <div className="text-right">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Harga Jual Baru</span>
                                                    <p className="font-semibold text-foreground">{formatRupiah(result.parsed.stock.sell_per_unit)}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Total Section */}
                        {totalAmount > 0 && (
                            <div className={cn('px-5 py-4 border-t border-border flex items-center justify-between', style.bg)}>
                                <span className="font-semibold text-foreground/80">Total Transaksi</span>
                                <span className={cn('text-2xl font-black tabular-nums', style.color)}>
                                    {formatRupiah(totalAmount)}
                                </span>
                            </div>
                        )}

                        {/* Raw JSON Toggle */}
                        <div className="px-5 py-3 bg-muted/50 border-t border-border">
                            <button
                                onClick={() => setShowRaw(!showRaw)}
                                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                                {showRaw ? 'Hide Raw JSON' : 'Show Raw JSON Debug'}
                            </button>
                            {showRaw && (
                                <div className="mt-3 relative">
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <pre className="p-4 rounded-xl bg-background border border-border text-[10px] font-mono text-foreground/70 overflow-auto max-h-60 shadow-inner">
                                        {JSON.stringify(result.parsed, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
