import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    Filter,
    Search,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    Download
} from "lucide-react";
import { StatusBadge, SeverityBadge, ConcernStatus } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";

interface Concern {
    id: string;
    dbId: string;
    subject: string;
    category: string;
    status: ConcernStatus;
    severity?: 1 | 2 | 3 | 4 | 5;
    submittedAt: string;
    student_name?: string;
}

const ConcernLibrary = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [concerns, setConcerns] = useState<Concern[]>([]);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        fetchConcerns();
    }, [selectedMonth, statusFilter]);

    const fetchConcerns = async () => {
        setLoading(true);
        try {
            // 1. Get User & Role
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate("/admin"); return; }

            const { data: adminData } = await supabase
                .from('admin_users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!adminData) throw new Error("Role not found");
            setRole(adminData.role);

            // 2. Build Query
            let query = supabase
                .from('concerns')
                .select('*')
                .order('created_at', { ascending: false });

            // Month Filter
            if (selectedMonth) {
                const [year, month] = selectedMonth.split('-');
                const startDate = `${year}-${month}-01`;
                // Calculate end date (next month's 1st day minus 1ms, or just < next month)
                // Simplest: use text search on created_at or range
                // Supabase range:
                const nextMonth = month === '12' ? '01' : String(Number(month) + 1).padStart(2, '0');
                const nextYear = month === '12' ? Number(year) + 1 : year;
                const endDate = `${nextYear}-${nextMonth}-01`;

                query = query.gte('created_at', startDate).lt('created_at', endDate);
            }

            // Status Filter
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            // Role Filter
            if (adminData.role === 'ssc') {
                // SSC sees ONLY assigned concerns
                // We need to fetch assignments first or join.
                // Supabase join syntax:
                // inner join concern_assignments!inner(concern_id)
                // .eq('concern_assignments.admin_id', user.id)

                // Let's use the assignments logic we used in Dashboard for simplicity if RLS doesn't handle it automatically.
                // Assuming RLS might not fully block reading if we want "Library" to be different.
                // But the prompt said: "For SSCs, they should be able to see the concerns they have dealt with."

                // Let's use client-side filtering after grabbing assigned IDs if needed, OR relies on RLS.
                // Let's explicitly filter for safety.
                const { data: myAssignments } = await supabase
                    .from('concern_assignments')
                    .select('concern_id')
                    .eq('admin_id', user.id);

                const myConcernIds = myAssignments?.map(a => a.concern_id) || [];
                if (myConcernIds.length > 0) {
                    query = query.in('id', myConcernIds);
                } else {
                    // No assignments? No concerns.
                    query = query.in('id', ['00000000-0000-0000-0000-000000000000']); // Force empty
                }
            }
            // USC and Faculty see ALL (no extra filter needed on query)

            const { data, error } = await query;
            if (error) throw error;

            if (data) {
                setConcerns(data.map(c => ({
                    id: c.concern_number,
                    dbId: c.id,
                    subject: c.subject,
                    category: c.category,
                    status: c.status as ConcernStatus,
                    severity: c.severity,
                    submittedAt: c.created_at,
                    student_name: c.student_name, // If available
                })));
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load library.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredConcerns = concerns.filter(c =>
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-card border-b sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/dashboard?role=${role}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Concern Library
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {/* Future: Export button */}
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </header>

            <main className="container-wide py-8 space-y-6">
                {/* Filters */}
                <div className="bg-card rounded-lg border p-4 flex flex-wrap gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Month</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="space-y-2 flex-1 min-w-[200px]">
                        <label className="text-sm font-medium">Search</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by ID or Subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="escalated">Escalated</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    <Button variant="secondary" onClick={() => {
                        setSelectedMonth(new Date().toISOString().slice(0, 7));
                        setSearchTerm("");
                        setStatusFilter("all");
                    }}>
                        Clear Filters
                    </Button>
                </div>

                {/* Results */}
                <div className="bg-card rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Severity</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            Loading records...
                                        </td>
                                    </tr>
                                ) : filteredConcerns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No records found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredConcerns.map((concern) => (
                                        <tr key={concern.dbId} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-muted-foreground">{concern.id}</td>
                                            <td className="px-4 py-3 font-medium">{concern.subject}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(concern.submittedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={concern.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                {concern.severity ? <SeverityBadge level={concern.severity} /> : <span className="text-muted-foreground">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link to={`/admin/concern/${concern.id}?role=${role}`}>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                        <ChevronRight className="ml-1 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-muted/30 px-4 py-3 border-t text-xs text-muted-foreground">
                        Showing {filteredConcerns.length} records
                    </div>
                </div>
            </main>
        </div>
    );
};
import { BookOpen } from "lucide-react";

export default ConcernLibrary;
