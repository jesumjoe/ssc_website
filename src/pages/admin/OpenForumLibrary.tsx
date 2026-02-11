import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    Search,
    BookOpen,
    Users,
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
    is_open_forum: boolean;
}

const OpenForumLibrary = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [concerns, setConcerns] = useState<Concern[]>([]);

    // Filters
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchConcerns();
    }, [selectedMonth]);

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
                .eq('is_open_forum', true) // FORCE OPEN FORUM
                .order('created_at', { ascending: false });

            // Month Filter
            if (selectedMonth) {
                const [year, month] = selectedMonth.split('-');
                const startDate = `${year}-${month}-01`;
                const nextMonth = month === '12' ? '01' : String(Number(month) + 1).padStart(2, '0');
                const nextYear = month === '12' ? Number(year) + 1 : year;
                const endDate = `${nextYear}-${nextMonth}-01`;

                query = query.gte('created_at', startDate).lt('created_at', endDate);
            }

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
                    student_name: c.student_name,
                    is_open_forum: c.is_open_forum
                })));
            }

        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load open forum history.",
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
                    <div className="flex items-center gap-3">
                        <div className="bg-info/10 p-2 rounded-lg">
                            <Users className="h-6 w-6 text-info" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Open Forum History</h1>
                            <p className="text-xs text-muted-foreground">Concerns selected for monthly open forum</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Minutes
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

                    <Button variant="secondary" onClick={() => {
                        setSelectedMonth(new Date().toISOString().slice(0, 7));
                        setSearchTerm("");
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
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date Selected</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Loading records...
                                        </td>
                                    </tr>
                                ) : filteredConcerns.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            No open forum discussions found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredConcerns.map((concern) => (
                                        <tr key={concern.dbId} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-muted-foreground">{concern.id}</td>
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    {concern.subject}
                                                    <span className="bg-info text-info-foreground text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Forum</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(concern.submittedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={concern.status} />
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

export default OpenForumLibrary;
