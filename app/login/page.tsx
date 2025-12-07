'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleGoogleLogin = async () => {
        if (!agreedToTerms) {
            setError('Anda harus menyetujui Kebijakan Privasi dan Syarat & Ketentuan.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // Auth listener in AuthContext will trigger and this page will redirect via useEffect
        } catch (err: any) {
            console.error(err);
            setError('Gagal masuk dengan Google. Silakan coba lagi.');
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreedToTerms) {
            setError('Anda harus menyetujui Kebijakan Privasi dan Syarat & Ketentuan.');
            return;
        }

        setLoading(true);
        setError('');

        // Validation
        if (!email || !password) {
            setError('Email dan password harus diisi.');
            setLoading(false);
            return;
        }

        if (isSignUp && password !== confirmPassword) {
            setError('Password tidak cocok.');
            setLoading(false);
            return;
        }

        if (isSignUp && password.length < 6) {
            setError('Password harus minimal 6 karakter.');
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // Auth listener will handle redirect
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.code === 'auth/email-already-in-use'
                ? 'Email sudah terdaftar.'
                : err.code === 'auth/invalid-email'
                    ? 'Email tidak valid.'
                    : err.code === 'auth/user-not-found'
                        ? 'Pengguna tidak ditemukan.'
                        : err.code === 'auth/wrong-password'
                            ? 'Password salah.'
                            : isSignUp
                                ? 'Gagal mendaftar. Silakan coba lagi.'
                                : 'Gagal masuk. Silakan coba lagi.';
            setError(errorMessage);
            setLoading(false);
        }
    };

    if (authLoading) {
        return <LoadingScreen message="Memeriksa autentikasi..." />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        {isSignUp ? 'Daftar ke Katalis AI' : 'Masuk ke Katalis AI'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {isSignUp
                            ? 'Buat akun baru untuk memulai'
                            : 'Masuk untuk melanjutkan'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleEmailAuth} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nama@contoh.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        {isSignUp && (
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        )}

                        {/* Terms Checkbox */}
                        <div className="flex items-start space-x-3 py-2">
                            <Checkbox
                                id="terms"
                                checked={agreedToTerms}
                                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                                disabled={loading}
                                className="mt-0.5"
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                            >
                                Saya telah membaca dan menyetujui{' '}
                                <Link href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                                    Kebijakan Privasi
                                </Link>
                                {' '}dan{' '}
                                <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                                    Syarat & Ketentuan
                                </Link>
                            </label>
                        </div>

                        <Button type="submit" disabled={loading || !agreedToTerms} className="w-full">
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {isSignUp ? 'Daftar' : 'Masuk'}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Atau lanjutkan dengan</span>
                        </div>
                    </div>

                    <Button variant="outline" onClick={handleGoogleLogin} disabled={loading || !agreedToTerms} className="w-full">
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        Google
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm dark:text-foreground">
                    <p>
                        {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError('');
                                setEmail('');
                                setPassword('');
                                setConfirmPassword('');
                            }}
                            className="text-primary hover:underline font-medium"
                            disabled={loading}
                        >
                            {isSignUp ? 'Masuk' : 'Daftar'}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

