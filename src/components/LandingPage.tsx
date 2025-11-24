import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export function LandingPage() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome to Anti
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Your personal task and roadmap manager.
                    </p>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={signInWithGoogle}
                        className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-lg font-medium rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        <LogIn className="w-6 h-6" />
                        <span>Sign in with Google</span>
                    </button>
                </div>

                <p className="text-sm text-muted-foreground">
                    Secure authentication powered by Firebase
                </p>
            </div>
        </div>
    );
}
