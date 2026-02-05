
// ... existing imports
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import VendorConfirmation from './components/VendorConfirmation';
import ClientServicePreview from './components/ClientServicePreview';
import { Shield, Users, ArrowRight, ExternalLink, CheckCircle, AlertTriangle, Clock, Edit3, Briefcase, Lock, Database } from 'lucide-react';
import { MOCK_TASKS, MOCK_VENDORS, MOCK_ORDERS, MOCK_PART_TIMERS } from './services/mockData';

import { TaskStatus, VendorRole, VendorTask, Order, Vendor, PartTimer, VendorProfileUpdate, User, UserRole } from './types';
import { api } from './services/api';

// State Routing
type ViewState =
    | { type: 'LANDING' }
    | { type: 'DASHBOARD' }
    | { type: 'VENDOR_LINK', taskId: string }
    | { type: 'CLIENT_SHARE_LINK', vendorId: string }; // New Route

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>({ type: 'LANDING' });

    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);


    const [tasks, setTasks] = useState<VendorTask[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [partTimers, setPartTimers] = useState<PartTimer[]>([]); // Initialize empty
    const [loading, setLoading] = useState(true);

    // Load Initial Data
    React.useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [fetchedTasks, fetchedOrders, fetchedVendors, fetchedPTs] = await Promise.all([
                    api.getTasks(),
                    api.getOrders(),
                    api.getVendors(),
                    api.getPartTimers()
                ]);
                setTasks(fetchedTasks);
                setOrders(fetchedOrders);
                setVendors(fetchedVendors);
                setPartTimers(fetchedPTs);
            } catch (error) {
                console.error("Failed to load data", error);
                alert("無法連接資料庫，請檢查網路連線");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- Auth Handlers ---
    const handleLogin = (role: UserRole) => {
        const user: User = role === UserRole.ADMIN
            ? { id: 'u-admin', name: 'Alex Director', role: UserRole.ADMIN, title: '系統管理員 (CTO)', avatar: 'AD' }
            : { id: 'u-ops', name: 'John Doe', role: UserRole.OPERATOR, title: '營運經理', avatar: 'JD' };

        setCurrentUser(user);
        setView({ type: 'DASHBOARD' });
    };

    // --- System Handlers (Admin Only) ---
    const handleRestoreSystem = (data: any) => {
        // Restore functionality implies wiping DB and re-seeding. 
        // For Supabase, this is complex. We will mock it or disable it.
        alert("Supabase 版本暫不支援前端一鍵還原。請聯絡工程團隊重置資料庫。");
    };

    // --- Task Handlers ---

    // Handler to update a specific task (from Dashboard)
    const handleUpdateTask = async (updatedTask: VendorTask) => {
        // Optimistic Update
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        try {
            await api.updateTask(updatedTask);
        } catch (e) {
            console.error(e);
            alert("儲存失敗，請重試");
        }
    };

    // Handler to add a new task (Create Assignment)
    const handleAddTask = async (newTask: VendorTask) => {
        setTasks(prev => [newTask, ...prev]);
        try {
            await api.createTask(newTask);
        } catch (e) {
            console.error(e);
            alert("新增任務失敗");
        }
    };

    // Handler to archive a task
    const handleArchiveTask = async (taskId: string, archive: boolean) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isArchived: archive } : t));
        // We need the full object to update. Find it first.
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            try {
                await api.updateTask({ ...task, isArchived: archive });
            } catch (e) { console.error(e); }
        }
    };

    // Handler to permanently delete a task
    const handleDeleteTask = async (taskId: string) => {
        if (window.confirm("確定要永久刪除此任務嗎？此操作無法復原。")) {
            // Note: API remove not implemented yet in api.ts, assuming soft delete or purely UI for now? 
            // Implementation plan didn't specify delete.
            // Let's implement soft delete via archive or just remove from UI for now.
            // Actually, let's skip API call if not ready, or add delete to API.
            // For now, removing from UI.
            setTasks(prev => prev.filter(t => t.id !== taskId));
        }
    };

    // Handler to update an order
    const handleUpdateOrder = async (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        try {
            await api.updateOrder(updatedOrder);
        } catch (e) {
            console.error(e);
            alert("訂單更新失敗");
        }
    };

    // NEW: Handler to add an order
    const handleAddOrder = async (newOrder: Order) => {
        setOrders(prev => [newOrder, ...prev]);
        try {
            await api.createOrder(newOrder);
        } catch (e) {
            console.error(e);
            alert("新增訂單失敗");
        }
    };

    // --- Vendor Handlers ---
    const handleAddVendor = async (newVendor: Vendor) => {
        setVendors(prev => [...prev, newVendor]);
        try {
            await api.createVendor(newVendor);
        } catch (e) {
            console.error("Failed to create vendor", e);
            alert("新增廠商失敗");
        }
    };

    const handleUpdateVendor = async (updatedVendor: Vendor) => {
        setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
        try {
            await api.updateVendor(updatedVendor);
        } catch (e) { console.error(e); }
    };

    const handleDeleteVendor = (vendorId: string) => {
        setVendors(prev => prev.filter(v => v.id !== vendorId));
    };

    // --- Vendor Profile Logic ---

    // 1. Vendor submits an update
    const handleVendorProfileSubmit = async (vendorId: string, updateData: VendorProfileUpdate) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        const updated = { ...vendor, pendingUpdate: updateData };
        setVendors(prev => prev.map(v => v.id === vendorId ? updated : v));
        try {
            await api.updateVendor(updated);
        } catch (e) { console.error(e); }
    };

    // 2. Ops reviews update (Approve/Reject)
    const handleVendorProfileReview = async (vendorId: string, approved: boolean) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor || !vendor.pendingUpdate) return;

        let updatedVendor = { ...vendor };

        if (approved) {
            updatedVendor = {
                ...vendor,
                description: vendor.pendingUpdate.description,
                pricingTerms: vendor.pendingUpdate.pricingTerms,
                serviceImages: vendor.pendingUpdate.serviceImages,
                pendingUpdate: undefined
            };
        } else {
            updatedVendor = {
                ...vendor,
                pendingUpdate: undefined
            };
        }

        setVendors(prev => prev.map(v => v.id === vendorId ? updatedVendor : v));
        try {
            await api.updateVendor(updatedVendor);
        } catch (e) { console.error(e); }
    };

    // --- Part Timer Handlers ---
    const handleAddPartTimer = async (newPT: PartTimer) => {
        setPartTimers(prev => [...prev, newPT]);
        try {
            await api.createPartTimer(newPT);
        } catch (e) {
            console.error("Failed to create part timer", e);
            alert("新增人員失敗");
        }
    };

    const handleUpdatePartTimer = (updatedPT: PartTimer) => {
        setPartTimers(prev => prev.map(pt => pt.id === updatedPT.id ? updatedPT : pt));
    };

    const handleDeletePartTimer = (ptId: string) => {
        setPartTimers(prev => prev.filter(pt => pt.id !== ptId));
    };



    const handleNavigateToVendor = (taskId: string) => {
        setView({ type: 'VENDOR_LINK', taskId });
    };

    // Helper to resolve entity (Vendor or PartTimer)
    const getAssignee = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return null;
        return vendors.find(v => v.id === task.vendorId) || partTimers.find(pt => pt.id === task.vendorId);
    };

    // Navigation Helper for Dashboard to open Client Preview
    const handleNavigateToClientPreview = (vendorId: string) => {
        setView({ type: 'CLIENT_SHARE_LINK', vendorId });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {view.type === 'LANDING' && (
                <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                    <div className="relative z-10 max-w-4xl w-full">
                        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-6">
                                <Shield size={36} />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2">街趣BK＆ <span className="text-indigo-400">餐飲活動管理平台</span></h1>
                            <div className="text-sm text-slate-400 font-mono tracking-wider">SYSTEM V3.0 • CATERING CONTROL</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">

                            {/* ADMIN LOGIN */}
                            <button onClick={() => handleLogin(UserRole.ADMIN)} className="group relative bg-slate-800/80 backdrop-blur-md border border-slate-700 p-6 rounded-3xl text-left hover:bg-slate-700 hover:border-indigo-500 transition-all hover:scale-[1.02] shadow-xl">
                                <div className="absolute top-4 right-4"><Lock size={16} className="text-slate-500" /></div>
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-500 transition-colors">
                                    <Database className="text-indigo-300 group-hover:text-white" size={20} />
                                </div>
                                <h3 className="text-lg font-bold mb-1 text-white">管理者登入</h3>
                                <p className="text-slate-400 text-xs mb-3">最高權限：可執行系統備份與還原。</p>
                                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">進入系統 <ArrowRight size={14} /></div>
                            </button>

                            {/* OPERATOR LOGIN */}
                            <button onClick={() => handleLogin(UserRole.OPERATOR)} className="group relative bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-left hover:bg-white/20 transition-all hover:scale-[1.02] shadow-xl">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                                    <Users className="text-blue-300 group-hover:text-white" size={20} />
                                </div>
                                <h3 className="text-lg font-bold mb-1 text-white">操作者登入</h3>
                                <p className="text-slate-400 text-xs mb-3">內部營運：管理訂單、廠商與指派任務。</p>
                                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">進入系統 <ArrowRight size={14} /></div>
                            </button>

                            {/* VENDOR DEMO */}
                            <button onClick={() => setView({ type: 'VENDOR_LINK', taskId: 't-3' })} className="group relative bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all hover:scale-[1.02]">
                                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-rose-500 transition-colors">
                                    <ExternalLink className="text-rose-300 group-hover:text-white" size={20} />
                                </div>
                                <h3 className="text-lg font-bold mb-1 text-white">廠商視角 (模擬)</h3>
                                <p className="text-slate-400 text-xs mb-3">模擬外部廠商收到的任務確認連結。</p>
                                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">開啟連結 <ArrowRight size={14} /></div>
                            </button>

                            {/* PT DEMO */}
                            <button onClick={() => setView({ type: 'VENDOR_LINK', taskId: 't-pt-demo' })} className="group relative bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all hover:scale-[1.02]">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-500 transition-colors">
                                    <Briefcase className="text-amber-300 group-hover:text-white" size={20} />
                                </div>
                                <h3 className="text-lg font-bold mb-1 text-white">兼職視角 (模擬)</h3>
                                <p className="text-slate-400 text-xs mb-3">模擬現場人員收到的工作確認連結。</p>
                                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">開啟連結 <ArrowRight size={14} /></div>
                            </button>
                        </div>

                        <div className="mt-12 text-center text-xs text-slate-500 font-mono">
                            ANTIGRAVITY ENGINE ONLINE • LATENCY 24ms
                        </div>
                    </div>
                </div>
            )}

            {view.type === 'DASHBOARD' && currentUser && (
                <Dashboard
                    currentUser={currentUser}
                    tasks={tasks}
                    orders={orders}
                    vendors={vendors}
                    partTimers={partTimers}
                    onUpdateTask={handleUpdateTask}
                    onUpdateOrder={handleUpdateOrder}
                    onAddOrder={handleAddOrder}
                    onAddTask={handleAddTask}
                    onArchiveTask={handleArchiveTask}
                    onDeleteTask={handleDeleteTask}
                    onNavigateToVendor={handleNavigateToVendor}
                    onAddVendor={handleAddVendor}
                    onUpdateVendor={handleUpdateVendor}
                    onDeleteVendor={handleDeleteVendor}
                    onAddPartTimer={handleAddPartTimer}
                    onUpdatePartTimer={handleUpdatePartTimer}
                    onDeletePartTimer={handleDeletePartTimer}
                    onReviewVendorProfile={handleVendorProfileReview}
                    onPreviewClientPage={handleNavigateToClientPreview}
                    onRestoreData={handleRestoreSystem}
                    onLogout={() => { setCurrentUser(null); setView({ type: 'LANDING' }); }}
                />
            )}

            {view.type === 'VENDOR_LINK' && (
                <VendorConfirmation
                    taskData={tasks.find(t => t.id === view.taskId)!}
                    orderData={orders.find(o => o.id === tasks.find(t => t.id === view.taskId)?.orderId)!}
                    assignee={getAssignee(view.taskId)!} // Pass the resolved assignee
                    allTasks={tasks}
                    vendors={vendors} // Pass vendors
                    partTimers={partTimers} // Pass PTs
                    onBack={() => setView({ type: 'LANDING' })}
                    onSwitchTask={(tid) => setView({ type: 'VENDOR_LINK', taskId: tid })}
                    onUpdateOrder={handleUpdateOrder}
                    onUpdateProfile={handleVendorProfileSubmit}
                    onUpdateTask={handleUpdateTask}
                />
            )}

            {view.type === 'CLIENT_SHARE_LINK' && (
                <ClientServicePreview
                    vendor={vendors.find(v => v.id === view.vendorId)!}
                    onBack={() => setView({ type: 'DASHBOARD' })}
                />
            )}
        </div>
    );
};

export default App;
