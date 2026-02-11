import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const checkAdminStatus = async (userId: string | undefined) => {
        if (!userId) return false;

        const { data, error } = await supabase
            .from("admin_users")
            .select("id")
            .eq("id", userId)
            .single();

        return !!data && !error;
    };

    useEffect(() => {
        let mounted = true;
        let authListener: { unsubscribe: () => void } | null = null;

        const initAuth = async () => {

            try {
                // 1. Check current session immediately
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    const isValidAdmin = await checkAdminStatus(session.user.id);
                    if (mounted) setIsAdmin(isValidAdmin);
                } else {
                    if (mounted) setIsAdmin(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                if (mounted) setIsAdmin(false);
            } finally {
                if (mounted) setLoading(false);
            }

            // 2. Subscribe to changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                // Only react to changes if we are already mounted
                if (!mounted) return;

                if (session) {
                    // Re-verify admin status on session change (e.g. token refresh or sign in)
                    const isValidAdmin = await checkAdminStatus(session.user.id);
                    if (mounted) setIsAdmin(isValidAdmin);
                } else {
                    if (mounted) setIsAdmin(false);
                }

                // Ensure loading is off after any auth event
                if (mounted) setLoading(false);
            });
            authListener = subscription; // Assign to the useEffect scope variable
        };

        initAuth(); // Call initAuth, it no longer returns a cleanup function

        return () => {
            mounted = false;
            if (authListener) {
                authListener.unsubscribe();
            }
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
