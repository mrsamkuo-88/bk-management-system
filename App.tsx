
// ... existing imports
// ... existing imports
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import VendorConfirmation from './components/VendorConfirmation';
import ClientServicePreview from './components/ClientServicePreview';
import LoginForm from './components/LoginForm';
import VendorPortal from './components/VendorPortal';
import { Shield, Users, ArrowRight, ExternalLink, CheckCircle, AlertTriangle, Clock, Edit3, Briefcase, Lock, Database } from 'lucide-react';
import { MOCK_TASKS, MOCK_VENDORS, MOCK_ORDERS, MOCK_PART_TIMERS } from './services/mockData';

import { TaskStatus, VendorRole, VendorTask, Order, Vendor, PartTimer, VendorProfileUpdate, User, UserRole } from './types';
import { api } from './services/api';

// State Routing
type ViewState =
    | { type: 'LANDING' }
    | { type: 'DASHBOARD' }
    | { type: 'VENDOR_PORTAL' }
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

    // Load Initial Data & Auto-Archive Legacy
    React.useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // 1. Restore Session
                const { data: { session } } = await api.supabase.auth.getSession();
                if (session?.user) {
                    console.log("Restoring session for:", session.user.email);
                    // Fetch Profile
                    const { type, data } = await api.getUserByEmail(session.user.email!);

                    if (type === 'ADMIN') {
                        setCurrentUser({ id: session.user.id, name: session.user.email!, role: UserRole.ADMIN, title: '系統管理員', avatar: 'AD' });
                        setView({ type: 'DASHBOARD' });
                    } else if (data) {
                        setCurrentUser({
                            id: data.id,
                            name: data.name,
                            role: type === 'VENDOR' ? UserRole.VENDOR : UserRole.PART_TIMER,
                            title: data.role || (type === 'VENDOR' ? '合作廠商' : '兼職人員'),
                            avatar: data.name.substring(0, 2).toUpperCase()
                        });
                        setView({ type: 'VENDOR_PORTAL' });
                    }
                }

                const [fetchedTasks, fetchedOrders, fetchedVendors, fetchedPTs] = await Promise.all([
                    api.getTasks(),
                    api.getOrders(),
                    api.getVendors(),
                    api.getPartTimers()
                ]);

                // --- AUTO ARCHIVE LOGIC ---
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Start of today

                const pastOrders = fetchedOrders.filter(o => {
                    const evtDate = new Date(o.eventDate);
                    return evtDate < now && o.status === 'ACTIVE'; // Past Active Orders
                });

                let updatedTasks = [...fetchedTasks];
                let updatedOrders = [...fetchedOrders];

                if (pastOrders.length > 0) {
                    console.log(`Auto-archiving ${pastOrders.length} past orders...`);

                    // 1. Mark Orders as COMPLETED
                    const pastOrderIds = pastOrders.map(o => o.id);
                    updatedOrders = updatedOrders.map(o =>
                        pastOrderIds.includes(o.id) ? { ...o, status: 'COMPLETED' } : o
                    );

                    // 2. Archive linked Tasks
                    updatedTasks = updatedTasks.map(t =>
                        pastOrderIds.includes(t.orderId) && !t.isArchived
                            ? { ...t, isArchived: true }
                            : t
                    );

                    // 3. Batch Update DB (Parallel)
                    // Note: Ideally backend function, but frontend-driven here
                    // We only update if changed.
                    const updatePromises = [];

                    // Update Orders
                    pastOrders.forEach(o => {
                        updatePromises.push(api.updateOrder({ ...o, status: 'COMPLETED' }));
                    });

                    // Update Tasks
                    updatedTasks.filter(t => pastOrderIds.includes(t.orderId) && !fetchedTasks.find(ft => ft.id === t.id)?.isArchived).forEach(t => {
                        updatePromises.push(api.updateTask(t));
                    });

                    await Promise.allSettled(updatePromises);
                }

                setTasks(updatedTasks);
                setOrders(updatedOrders);
                setVendors(fetchedVendors);
                setPartTimers(fetchedPTs);
            } catch (error) {
                console.error("Failed to load or archive data", error);
                alert("無法連接資料庫，請檢查網路連線");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- Auth Handlers ---
    const handleLoginSuccess = (supabaseUser: any, roleType: 'VENDOR' | 'PART_TIMER' | 'ADMIN', profileData?: any) => {
        let user: User;

        if (roleType === 'ADMIN') {
            user = {
                id: supabaseUser.id,
                name: supabaseUser.email || 'Admin',
                role: UserRole.ADMIN,
                title: '系統管理員',
                avatar: 'AD'
            };
            setView({ type: 'DASHBOARD' });
        } else {
            // Vendor or PT
            user = {
                id: profileData.id,
                name: profileData.name,
                role: roleType === 'VENDOR' ? UserRole.VENDOR : UserRole.PART_TIMER,
                title: profileData.role || (roleType === 'VENDOR' ? '合作廠商' : '兼職人員'),
                avatar: profileData.name.substring(0, 2).toUpperCase()
            };
            setView({ type: 'VENDOR_PORTAL' });
        }
        setCurrentUser(user);
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
            setTasks(prev => prev.filter(t => t.id !== taskId));
            try {
                await api.deleteTask(taskId);
            } catch (e) {
                console.error(e);
                alert("刪除失敗，請重試");
            }
        }
    };

    // Handler to permanently delete an order (and linked tasks)
    const handleDeleteOrder = async (orderId: string) => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setTasks(prev => prev.filter(t => t.orderId !== orderId)); // Cascade delete local tasks
        try {
            await api.deleteOrder(orderId);
        } catch (e) {
            console.error(e);
            alert("刪除失敗，請重試");
        }
    };

    // Handler to update an order
    const handleUpdateOrder = async (updatedOrder: Order) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        try {
            await api.updateOrder(updatedOrder);
        } catch (e) {
            console.error("Update Order Failed:", e);
            alert(`訂單更新失敗: ${e instanceof Error ? e.message : 'Unknown Error'}`);
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

    const handleDeleteVendor = async (vendorId: string) => {
        if (!window.confirm("確定要刪除此廠商嗎？")) return;
        setVendors(prev => prev.filter(v => v.id !== vendorId));
        try {
            await api.deleteVendor(vendorId);
        } catch (e) {
            console.error(e);
            alert("刪除失敗，請重試");
            // Revert would require re-fetching or keeping prev state, skipping simple revert for now as this is rare
        }
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

    const handleDeletePartTimer = async (ptId: string) => {
        if (!window.confirm("確定要刪除此人員嗎？")) return;
        setPartTimers(prev => prev.filter(pt => pt.id !== ptId));
        try {
            await api.deletePartTimer(ptId);
        } catch (e) {
            console.error(e);
            alert("刪除失敗");
        }
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

                        <div className="flex flex-col items-center justify-center w-full">
                            {/* Unified Login Form */}
                            <LoginForm onLoginSuccess={handleLoginSuccess} />
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
                    onDeleteOrder={handleDeleteOrder}
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

            {view.type === 'VENDOR_PORTAL' && currentUser && (
                <VendorPortal
                    currentUser={vendors.find(v => v.id === currentUser.id) || partTimers.find(pt => pt.id === currentUser.id) || { id: currentUser.id, name: currentUser.name, phone: '', role: currentUser.role as any, description: 'User Profile' } as any}
                    userType={currentUser.role === UserRole.VENDOR ? 'VENDOR' : 'PART_TIMER'}
                    onLogout={() => { setCurrentUser(null); setView({ type: 'LANDING' }); }}
                    onSelectTask={(taskId) => setView({ type: 'VENDOR_LINK', taskId })}
                />
            )}

            {view.type === 'VENDOR_LINK' && (() => {
                // Resolution Logic with Mock Fallback
                const taskId = view.taskId;

                // 1. Try Live Data
                let task = tasks.find(t => t.id === taskId);
                let order = task ? orders.find(o => o.id === task.orderId) : undefined;
                let assignee = task ? getAssignee(taskId) : undefined;

                // 2. Fallback to Mocks (for Landing Page Demos)
                if (!task) {
                    task = MOCK_TASKS.find(t => t.id === taskId);
                    order = task ? MOCK_ORDERS.find(o => o.id === task.orderId) : undefined;
                    // Mock Assignee Resolution
                    if (task) {
                        assignee = MOCK_VENDORS.find(v => v.id === task.vendorId) ||
                            MOCK_PART_TIMERS.find(pt => pt.id === task.vendorId);
                    }
                }

                if (!task || !order || !assignee) {
                    return (
                        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 flex-col gap-4">
                            <AlertTriangle size={48} className="text-yellow-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-700">找不到模擬任務</h3>
                                <p className="text-sm">任務 ID ({taskId}) 不存在或資料已遺失。</p>
                            </div>
                            <button onClick={() => setView({ type: 'LANDING' })} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                                返回首頁
                            </button>
                        </div>
                    );
                }

                // Navigation Logic
                const handleBack = () => {
                    if (currentUser) {
                        if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OPERATOR) {
                            setView({ type: 'DASHBOARD' });
                        } else {
                            setView({ type: 'VENDOR_PORTAL' });
                        }
                    } else {
                        setView({ type: 'LANDING' });
                    }
                };

                return (
                    <VendorConfirmation
                        taskData={task}
                        orderData={order}
                        assignee={assignee}
                        allTasks={tasks.length > 0 ? tasks : MOCK_TASKS}
                        vendors={vendors.length > 0 ? vendors : MOCK_VENDORS}
                        partTimers={partTimers.length > 0 ? partTimers : MOCK_PART_TIMERS}
                        onBack={handleBack}
                        onSwitchTask={(tid) => setView({ type: 'VENDOR_LINK', taskId: tid })}
                        onUpdateOrder={handleUpdateOrder}
                        onUpdateProfile={handleVendorProfileSubmit}
                        onUpdateTask={handleUpdateTask}
                    />
                );
            })()}

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
