
import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    PhoneCall,
    RefreshCcw,
    Activity,
    Menu,
    X,
    MessageSquare,
    Send,
    Calendar as CalendarIcon,
    MapPin,
    TrendingDown,
    Edit2,
    Save,
    Plus,
    Trash2,
    Share,
    Search,
    UserPlus,
    ArrowRight,
    List,
    Archive,
    RotateCcw,
    LayoutGrid,
    Table,
    User as UserIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Users,
    Settings,
    Mail,
    Phone,
    BarChart3,
    LogOut,
    Sparkles,
    Filter,
    ExternalLink,
    CreditCard,
    Home,
    Utensils,
    FileText,
    Briefcase,
    Check,
    DollarSign,
    Coffee,
    Palette,
    Mic,
    Music,
    Truck,
    HardHat,
    ArrowLeft,
    Image as ImageIcon,
    Copy,
    Eye,
    ArrowDown,
    Camera,
    Speaker,
    Shield,
    Database,
    Download,
    Upload,
    ShieldAlert,
    Receipt,
    Calculator,
    CalendarDays,
    CheckSquare,
    ClipboardList
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

import { GeminiService } from '../services/geminiService';
import { VendorTask, TaskStatus, OpsLogEntry, Order, EventFlowItem, Vendor, VendorRole, PartTimer, PartTimeRole, SalaryType, VendorProfileUpdate, User, UserRole, ExecutionStaff } from '../types';
import TaskAssignmentTable from './TaskAssignmentTable';
import { STANDARD_EXECUTION_LIST } from '../constants/checklists';

interface DashboardProps {
    currentUser: User;
    tasks: VendorTask[];
    orders: Order[];
    vendors: Vendor[];
    partTimers: PartTimer[]; // New Prop
    onUpdateTask: (task: VendorTask) => void;
    onUpdateOrder: (order: Order) => void;
    onAddOrder: (order: Order) => void;
    onAddTask: (task: VendorTask) => void;
    onArchiveTask: (taskId: string, archive: boolean) => void;
    onDeleteTask: (taskId: string) => void;
    onDeleteOrder: (orderId: string) => void; // New Prop
    onNavigateToVendor: (taskId: string) => void;
    // Vendor Management Props
    onAddVendor: (vendor: Vendor) => void;
    onUpdateVendor: (vendor: Vendor) => void;
    onDeleteVendor: (vendorId: string) => void;
    // Part Timer Management Props
    onAddPartTimer: (pt: PartTimer) => void;
    onUpdatePartTimer: (pt: PartTimer) => void;
    onDeletePartTimer: (ptId: string) => void;
    // Review Profile
    onReviewVendorProfile: (vendorId: string, approved: boolean) => void;
    // Navigation
    onPreviewClientPage?: (vendorId: string) => void;
    // System Props
    onRestoreData: (data: any) => void;
    onLogout: () => void;
}

// Helper for Calendar
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// Helper for Days Calculation
const calculateDaysUntil = (dateStr: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
};

const getRoleName = (role: string) => {
    switch (role) {
        // Vendors
        case VendorRole.CHEF: return '餐飲廠商';
        case VendorRole.DECOR: return '佈置廠商';
        case VendorRole.PROFESSIONAL: return '專業服務';
        case VendorRole.EQUIPMENT: return '設備廠商';
        // Part Timers
        case PartTimeRole.CONTROL: return '活動場控';
        case PartTimeRole.EXECUTION: return '活動執行';
        case PartTimeRole.OPERATIONS: return '營運兼職';
        case PartTimeRole.OTHER: return '其他兼職';
        default: return role;
    }
};

const Dashboard: React.FC<DashboardProps> = ({
    currentUser,
    tasks,
    orders,
    vendors,
    partTimers,
    onUpdateTask,
    onUpdateOrder,
    onAddOrder,
    onAddTask,
    onArchiveTask,
    onDeleteTask,
    onDeleteOrder, // New Prop
    onNavigateToVendor,
    onAddVendor,
    onUpdateVendor,
    onDeleteVendor,
    onAddPartTimer,
    onUpdatePartTimer,
    onDeletePartTimer,
    onReviewVendorProfile,
    onPreviewClientPage,
    onRestoreData,
    onLogout
}) => {
    const [activeView, setActiveView] = useState<'LIST' | 'CALENDAR' | 'HISTORY' | 'VENDORS' | 'PART_TIMERS' | 'SETTINGS'>('LIST');
    const [selectedVendorDetailId, setSelectedVendorDetailId] = useState<string | null>(null); // New state for vendor detail view

    const [aiInsight, setAiInsight] = useState<string>("正在分析系統狀態...");
    const [loadingAi, setLoadingAi] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    // Drawer & Edit Task State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<VendorTask>>({});
    const [editOrderForm, setEditOrderForm] = useState<Order | null>(null);
    const [logInput, setLogInput] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Create Assignment Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
    const [selectedPartTimerIds, setSelectedPartTimerIds] = useState<string[]>([]); // New selection state for PTs

    // New Order Creation State
    const [newOrderData, setNewOrderData] = useState({
        eventName: '',
        clientName: '',
        eventDate: new Date().toISOString().slice(0, 16) // Default to now
    });

    const [isCreating, setIsCreating] = useState(false);

    // Vendor Management Modal State
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null); // null means creating new
    const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});
    const [pendingReviewResolved, setPendingReviewResolved] = useState(false); // Track if we are approving
    // New state for custom vendor role input
    const [isCustomRole, setIsCustomRole] = useState(false);

    // Vendor Filter
    const [vendorFilter, setVendorFilter] = useState<'ALL' | 'PENDING_REVIEW'>('ALL');

    // Part Timer Modal State
    const [showPTModal, setShowPTModal] = useState(false);
    const [editingPT, setEditingPT] = useState<PartTimer | null>(null);
    const [ptForm, setPtForm] = useState<Partial<PartTimer>>({});

    // Derived state
    const activeTasks = tasks.filter(t => !t.isArchived);
    const historyTasks = tasks.filter(t => t.isArchived);

    // Sorted tasks for LIST view (Priority: EMERGENCY > WARNING > ISSUE > CONFIRMED > NOTIFIED > PENDING)
    const sortedTasks = [...activeTasks].sort((a, b) => {
        const getScore = (s: string) => {
            if (s === 'EMERGENCY') return 10;
            if (s === 'ISSUE_REPORTED') return 9;
            if (s === 'WARNING') return 8;
            if (s === 'PENDING') return 5;
            if (s === 'NOTIFIED') return 2;
            if (s === 'CONFIRMED') return 1;
            return 0;
        };
        return getScore(b.status) - getScore(a.status);
    });

    const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;
    const emergencyCount = activeTasks.filter(t => t.status === TaskStatus.EMERGENCY).length;
    const issueCount = activeTasks.filter(t => t.status === TaskStatus.ISSUE_REPORTED).length;
    const confirmedCount = activeTasks.filter(t => t.status === TaskStatus.CONFIRMED).length;
    const pendingCount = activeTasks.filter(t => t.status === TaskStatus.PENDING).length;
    const vendorPendingUpdateCount = vendors.filter(v => v.pendingUpdate).length;

    const filteredVendors = vendors.filter(v => {
        if (vendorFilter === 'PENDING_REVIEW') return v.pendingUpdate;
        return true;
    });

    // Calendar Helpers
    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const calendarCells: (Date | null)[] = [];
    {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        for (let i = 0; i < firstDay; i++) {
            calendarCells.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            calendarCells.push(new Date(year, month, i));
        }
    }

    // Catering Category Counts
    const buffetOrders = orders.filter(o => o.cateringCategory?.includes('Buffet')).length;
    const lightOrders = orders.filter(o => o.cateringCategory?.includes('點心') || o.cateringCategory?.includes('餐盒')).length;
    const customOrders = orders.filter(o => o.cateringCategory?.includes('私廚') || o.cateringCategory?.includes('客製')).length;
    const spaceOrders = orders.filter(o => o.cateringCategory === '無餐飲').length;

    const refreshAnalysis = async () => {
        setLoadingAi(true);
        const analysis = await GeminiService.getDashboardRiskAnalysis(activeTasks, orders);
        setAiInsight(analysis);
        setLoadingAi(false);
    };

    useEffect(() => {
        refreshAnalysis();
    }, []);

    // Reset drawer state on close/change
    useEffect(() => {
        setIsEditing(false);
        setEditForm({});
        setEditOrderForm(null);
    }, [selectedTaskId]);

    // Handle View Change (Reset Vendor Selection)
    const handleViewChange = (view: any) => {
        setActiveView(view);
        setMobileMenuOpen(false);
        setSelectedVendorDetailId(null);
        setVendorFilter('ALL');
    }

    // Combine Vendors and PartTimers for selection
    const availableStaffOptions = [
        { label: "--- 請選擇人員 ---", value: "", phone: "" },
        ...vendors.map(v => ({ label: `(廠商) ${v.name}`, value: v.id, phone: v.phone })),
        ...partTimers.map(pt => ({ label: `(兼職) ${pt.name}`, value: pt.id, phone: pt.phone }))
    ];

    // --- Handlers (Keep Logic Same, Focus on UI) ---
    const handleOpenVendorModal = (vendor?: Vendor) => {
        setPendingReviewResolved(false);
        if (vendor) {
            setEditingVendor(vendor);
            setVendorForm({ ...vendor });
            // Check if the role is a custom one (not in enum)
            const isStandard = Object.values(VendorRole).includes(vendor.role as VendorRole);
            setIsCustomRole(!isStandard);
        } else {
            setEditingVendor(null);
            setVendorForm({
                role: VendorRole.CHEF,
                reliabilityScore: 80,
                collaborationMode: '長期配合',
                profitSharing: '10%',
                pricingTerms: '',
                clientPricingTerms: ''
            });
            setIsCustomRole(false);
        }
        setShowVendorModal(true);
    };

    const handleLoadPendingData = () => {
        if (!editingVendor?.pendingUpdate) return;

        setVendorForm(prev => ({
            ...prev,
            description: editingVendor.pendingUpdate!.description,
            pricingTerms: editingVendor.pendingUpdate!.pricingTerms, // Load cost into internal field
            serviceImages: editingVendor.pendingUpdate!.serviceImages,
            // Note: We DO NOT auto-overwrite clientPricingTerms. Ops must decide.
        }));
        setPendingReviewResolved(true); // Mark that we intend to resolve the pending status upon save
        alert("已載入廠商提交的資料 (服務描述、圖片、廠商報價)。\n\n請檢視下方內容，並設定最終「客戶報價」，確認無誤後按「儲存並發佈」。");
    };

    const handleOpenPTModal = (pt?: PartTimer) => {
        if (pt) {
            setEditingPT(pt);
            setPtForm({ ...pt });
        } else {
            setEditingPT(null);
            setPtForm({
                role: PartTimeRole.OPERATIONS,
                salaryType: 'HOURLY',
                rate: 200,
                skills: ''
            });
        }
        setShowPTModal(true);
    };

    const handleSaveVendor = () => {
        if (!vendorForm.name || !vendorForm.role) return alert("請輸入廠商名稱與類型");

        const payload: Vendor = {
            id: editingVendor ? editingVendor.id : `v-${Date.now()}`,
            name: vendorForm.name!,
            role: vendorForm.role!,
            phone: vendorForm.phone || '',
            email: vendorForm.email || '',
            reliabilityScore: vendorForm.reliabilityScore || 80,
            collaborationMode: vendorForm.collaborationMode || '',
            profitSharing: vendorForm.profitSharing || '',
            pricingTerms: vendorForm.pricingTerms || '',
            clientPricingTerms: vendorForm.clientPricingTerms || '', // Save client price
            description: vendorForm.description || '',
            serviceImages: vendorForm.serviceImages || [],
            // Important: If we resolved the review, clear pendingUpdate. Otherwise keep it.
            pendingUpdate: pendingReviewResolved ? undefined : editingVendor?.pendingUpdate,
            // Track modified fields for visual indicator
            lastModifiedFields: pendingReviewResolved ? ['clientPricingTerms', 'description'] : editingVendor?.lastModifiedFields
        };

        if (editingVendor) {
            onUpdateVendor(payload);
        } else {
            onAddVendor(payload);
        }
        setShowVendorModal(false);
    };

    const handleSavePT = () => {
        if (!ptForm.name || !ptForm.role) return alert("請輸入人員姓名與類型");

        const payload: PartTimer = {
            id: editingPT ? editingPT.id : `pt-${Date.now()}`,
            name: ptForm.name!,
            role: ptForm.role as PartTimeRole,
            phone: ptForm.phone || '',
            salaryType: ptForm.salaryType || 'HOURLY',
            rate: ptForm.rate || 200,
            skills: ptForm.skills || ''
        };

        if (editingPT) {
            onUpdatePartTimer(payload);
        } else {
            onAddPartTimer(payload);
        }
        setShowPTModal(false);
    };

    const handleDeleteVendorClick = (id: string, name: string) => {
        const hasActiveTasks = tasks.some(t => t.vendorId === id && !t.isArchived);

        let confirmMessage = `確定要刪除廠商「${name}」嗎？此操作無法復原。`;

        if (hasActiveTasks) {
            confirmMessage = `警告：廠商「${name}」尚有未封存的任務。\n強制刪除可能導致相關任務顯示異常。\n\n確定要繼續刪除嗎？`;
        }

        if (window.confirm(confirmMessage)) {
            onDeleteVendor(id);
            setSelectedVendorDetailId(null);
        }
    };

    const handleDeletePTClick = (id: string, name: string) => {
        const hasActiveTasks = tasks.some(t => t.vendorId === id && !t.isArchived);

        let confirmMessage = `確定要刪除兼職人員「${name}」嗎？此操作無法復原。`;

        if (hasActiveTasks) {
            confirmMessage = `警告：人員「${name}」尚有未封存的任務。\n強制刪除可能導致相關任務顯示異常。\n\n確定要繼續刪除嗎？`;
        }

        if (window.confirm(confirmMessage)) { onDeletePartTimer(id); }
    };

    const handleStartEdit = () => {
        if (selectedTask) {
            setEditForm({ aiSummary: selectedTask.aiSummary, requiredActions: [...selectedTask.requiredActions] });
            const relatedOrder = orders.find(o => o.id === selectedTask.orderId);
            if (relatedOrder) {
                // Ensure executionTeam exists for legacy data
                const orderClone = JSON.parse(JSON.stringify(relatedOrder));
                if (!orderClone.executionTeam) orderClone.executionTeam = [];
                setEditOrderForm(orderClone);
            }
            setIsEditing(true);
        }
    };

    const handleSaveEdit = () => {
        if (selectedTask && editForm) {
            onUpdateTask({ ...selectedTask, aiSummary: editForm.aiSummary || selectedTask.aiSummary, requiredActions: editForm.requiredActions || selectedTask.requiredActions, status: TaskStatus.CHANGED });
        }
        if (editOrderForm) { onUpdateOrder(editOrderForm); }
        setIsEditing(false);
    };

    const handlePublish = (taskId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const taskToPublish = tasks.find(t => t.id === taskId);
        if (taskToPublish) {
            if (window.confirm(`確認發送通知？`)) {
                onUpdateTask({ ...taskToPublish, status: TaskStatus.NOTIFIED, sentAt: new Date().toISOString(), opsLogs: [{ timestamp: new Date().toISOString(), action: 'Notification Sent', note: '營運人員手動觸發發送', user: 'Admin' }, ...taskToPublish.opsLogs] });
            }
        }
    };

    const handleAddActionItem = () => setEditForm(prev => ({ ...prev, requiredActions: [...(prev.requiredActions || []), ""] }));
    const handleUpdateActionItem = (index: number, value: string) => { const newActions = [...(editForm.requiredActions || [])]; newActions[index] = value; setEditForm(prev => ({ ...prev, requiredActions: newActions })); };
    const handleDeleteActionItem = (index: number) => { const newActions = [...(editForm.requiredActions || [])]; newActions.splice(index, 1); setEditForm(prev => ({ ...prev, requiredActions: newActions })); };
    const handleAddLog = () => { if (!selectedTask || !logInput.trim()) return; onUpdateTask({ ...selectedTask, opsLogs: [{ timestamp: new Date().toISOString(), action: 'Manual Log', note: logInput, user: currentUser.name }, ...selectedTask.opsLogs] }); setLogInput(""); };

    const openCreateModal = () => {
        setSelectedVendorIds([]);
        setSelectedPartTimerIds([]); // Reset PT selection
        setNewOrderData({ eventName: '', clientName: '', eventDate: new Date().toISOString().slice(0, 16) });
        setShowCreateModal(true);
    };

    const handleCreateAssignment = async () => {
        if (!newOrderData.eventName || !newOrderData.clientName) return alert("請填寫完整的活動資訊");
        if (selectedVendorIds.length === 0 && selectedPartTimerIds.length === 0) return alert("請至少選擇一位廠商或兼職人員");

        setIsCreating(true);
        const newOrderId = `ord-${Date.now()}`;
        const newOrder: Order = {
            id: newOrderId,
            clientName: newOrderData.clientName,
            eventName: newOrderData.eventName,
            eventDate: newOrderData.eventDate,
            guestCount: 0,
            location: '待定',
            siteManager: { name: '待定', phone: '', title: '' },
            specialRequests: '',
            eventFlow: [],
            status: 'ACTIVE',
            paymentStatus: '未付訂',
            financials: {
                budgetPerHead: 0,
                shippingFee: 0,
                serviceFee: 0,
                adjustments: 0,
                deposit: 0,
                taxRate: 0.05,
                isInvoiceRequired: true,
                hasServiceCharge: false
            },
            logistics: [],
            executionTeam: []
        };

        onAddOrder(newOrder);

        // Create tasks for selected Vendors
        selectedVendorIds.forEach(vendorId => {
            const newTask: VendorTask = {
                id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                orderId: newOrderId,
                vendorId: vendorId,
                status: TaskStatus.PENDING,
                sentAt: null,
                ackAt: null,
                ackIp: null,
                aiSummary: `準備 ${newOrder.eventName} 的相關服務。`,
                requiredActions: [...STANDARD_EXECUTION_LIST],
                lastRemindedAt: null,
                token: Math.random().toString(36),
                opsLogs: [{ timestamp: new Date().toISOString(), action: 'Task Created', note: '任務建立', user: currentUser.name }]
            };
            onAddTask(newTask);
        });

        // Create tasks for selected Part-Timers
        selectedPartTimerIds.forEach(ptId => {
            const newTask: VendorTask = {
                id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                orderId: newOrderId,
                vendorId: ptId,
                status: TaskStatus.PENDING,
                sentAt: null,
                ackAt: null,
                ackIp: null,
                aiSummary: `支援 ${newOrder.eventName} 現場執行。`,
                requiredActions: [...STANDARD_EXECUTION_LIST],
                lastRemindedAt: null,
                token: Math.random().toString(36),
                opsLogs: [{ timestamp: new Date().toISOString(), action: 'Task Created', note: '兼職任務建立', user: currentUser.name }]
            };
            onAddTask(newTask);
        });

        setIsCreating(false);
        setShowCreateModal(false);
    };

    // --- SYSTEM FUNCTIONS ---
    const handleBackup = () => {
        const data = {
            tasks,
            orders,
            vendors,
            partTimers,
            backupDate: new Date().toISOString(),
            version: "2.1"
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `streetfun_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (window.confirm(`確認要從備份檔案 (${file.name}) 還原系統資料？\n這將覆蓋當前所有狀態！`)) {
                    onRestoreData(data);
                }
            } catch (err) {
                alert("檔案格式錯誤，無法還原。");
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            {/* ... (Sidebar and Header unchanged) ... */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 shadow-2xl flex flex-col`}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-lg shadow-indigo-500/20">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg tracking-tight">街趣BK& 餐飲活動管理系統</h1>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ops Control v2.1</div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-6 space-y-1">
                    <NavItem
                        icon={<LayoutGrid size={20} />} label="即時監控 (Monitor)"
                        active={activeView === 'LIST'} onClick={() => handleViewChange('LIST')}
                        badge={issueCount > 0 ? issueCount : undefined} badgeColor="bg-red-500"
                    />
                    <NavItem
                        icon={<CalendarIcon size={20} />} label="活動行事曆 (Calendar)"
                        active={activeView === 'CALENDAR'} onClick={() => handleViewChange('CALENDAR')}
                    />
                    <NavItem
                        icon={<Users size={20} />} label="廠商資料庫 (Vendors)"
                        active={activeView === 'VENDORS'} onClick={() => handleViewChange('VENDORS')}
                        badge={vendorPendingUpdateCount > 0 ? vendorPendingUpdateCount : undefined} badgeColor="bg-amber-500"
                    />
                    <NavItem
                        icon={<Briefcase size={20} />} label="兼職資料庫 (Staff)"
                        active={activeView === 'PART_TIMERS'} onClick={() => handleViewChange('PART_TIMERS')}
                    />
                    <NavItem
                        icon={<Archive size={20} />} label="歷史封存 (Archive)"
                        active={activeView === 'HISTORY'} onClick={() => handleViewChange('HISTORY')}
                    />

                    {/* ADMIN ONLY MENU */}
                    {currentUser.role === UserRole.ADMIN && (
                        <>
                            <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Administration</div>
                            <NavItem
                                icon={<Database size={20} />} label="系統設定 (Settings)"
                                active={activeView === 'SETTINGS'} onClick={() => handleViewChange('SETTINGS')}
                            />
                        </>
                    )}
                </nav>

                {/* User Profile / Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${currentUser.role === UserRole.ADMIN ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                            {currentUser.avatar}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-bold text-white truncate">{currentUser.name}</div>
                            <div className="text-xs text-slate-500 truncate">{currentUser.title}</div>
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <LogOut size={14} /> 登出系統
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* ... (Header & Stats unchanged) ... */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-slate-500 hover:text-slate-800"><Menu size={24} /></button>
                        {/* AI Banner - Integrated */}
                        <div className="hidden md:flex items-center gap-3 bg-indigo-50/50 border border-indigo-100 rounded-full pl-1 pr-4 py-1">
                            <div className="bg-indigo-100 text-indigo-600 rounded-full p-1.5"><Sparkles size={14} /></div>
                            <div className="text-xs font-medium text-slate-600 max-w-md truncate">{loadingAi ? "AI 分析中..." : aiInsight.substring(0, 60) + "..."}</div>
                            <button onClick={refreshAnalysis} className="text-indigo-600 hover:text-indigo-800"><RefreshCcw size={12} /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right mr-2">
                            <div className="text-xs text-slate-400 font-medium">{new Date().toLocaleDateString()}</div>
                            <div className="text-sm font-bold text-slate-700">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-1px]"
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">新增任務</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 bg-slate-50">

                    {/* Stats Overview */}
                    {activeView === 'SETTINGS' ? (
                        <div className="p-4 bg-indigo-900 rounded-2xl text-white shadow-lg">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3"><ShieldAlert size={28} /> 系統管理中心</h2>
                            <p className="text-indigo-200 text-sm">您正在使用最高管理權限 (Admin Mode)，所有操作將直接影響資料庫。</p>
                        </div>
                    ) : activeView === 'CALENDAR' ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCardNew label="自助餐 (Buffet)" value={buffetOrders} icon={<Utensils size={20} />} color="text-indigo-600" bg="bg-indigo-50 border-indigo-100" />
                            <StatCardNew label="輕食/餐盒 (Light)" value={lightOrders} icon={<Coffee size={20} />} color="text-amber-600" bg="bg-amber-50 border-amber-100" />
                            <StatCardNew label="私廚/客製 (Custom)" value={customOrders} icon={<Sparkles size={20} />} color="text-rose-600" bg="bg-rose-50 border-rose-100" />
                            <StatCardNew label="純場地 (Space)" value={spaceOrders} icon={<Home size={20} />} color="text-slate-600" bg="bg-white" />
                        </div>
                    ) : activeView === 'VENDORS' ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCardNew label="餐飲廠商" value={vendors.filter(v => v.role === VendorRole.CHEF).length} icon={<Utensils size={20} />} color="text-indigo-600" bg="bg-indigo-50 border-indigo-100" />
                            <StatCardNew label="佈置廠商" value={vendors.filter(v => v.role === VendorRole.DECOR).length} icon={<Palette size={20} />} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" />
                            <StatCardNew label="專業服務" value={vendors.filter(v => v.role === VendorRole.PROFESSIONAL).length} icon={<Mic size={20} />} color="text-purple-600" bg="bg-purple-50 border-purple-100" />
                            <StatCardNew label="設備廠商" value={vendors.filter(v => v.role === VendorRole.EQUIPMENT).length} icon={<Speaker size={20} />} color="text-rose-600" bg="bg-rose-50 border-rose-100" />
                        </div>
                    ) : activeView === 'PART_TIMERS' ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCardNew label="活動場控" value={partTimers.filter(p => p.role === PartTimeRole.CONTROL).length} icon={<Activity size={20} />} color="text-blue-600" bg="bg-blue-50 border-blue-100" />
                            <StatCardNew label="活動執行" value={partTimers.filter(p => p.role === PartTimeRole.EXECUTION).length} icon={<Briefcase size={20} />} color="text-green-600" bg="bg-green-50 border-green-100" />
                            <StatCardNew label="營運兼職" value={partTimers.filter(p => p.role === PartTimeRole.OPERATIONS).length} icon={<Utensils size={20} />} color="text-amber-600" bg="bg-amber-50 border-amber-100" />
                            <StatCardNew label="其他兼職" value={partTimers.filter(p => p.role === PartTimeRole.OTHER).length} icon={<UserIcon size={20} />} color="text-slate-600" bg="bg-white border-slate-200" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCardNew label="待處理 (Pending)" value={pendingCount} icon={<Clock size={20} />} color="text-slate-600" bg="bg-white" />
                            <StatCardNew label="等待確認 (Wait)" value={activeTasks.length - confirmedCount - pendingCount} icon={<Users size={20} />} color="text-amber-500" bg="bg-white" />
                            <StatCardNew label="異常回報 (Issues)" value={issueCount} icon={<AlertTriangle size={20} />} color="text-red-600" bg="bg-red-50 border-red-100" />
                            <StatCardNew label="緊急案件 (Urgent)" value={emergencyCount} icon={<Activity size={20} />} color="text-rose-700" bg="bg-rose-100 border-rose-200" />
                        </div>
                    )}

                    {/* Content Block */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] flex flex-col">
                        {/* ... Toolbar ... */}
                        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {activeView === 'LIST' && <><LayoutGrid size={20} className="text-indigo-500" /> 任務監控中心</>}
                                {activeView === 'CALENDAR' && <><CalendarIcon size={20} className="text-indigo-500" /> 活動行事曆</>}
                                {activeView === 'VENDORS' && <><Users size={20} className="text-indigo-500" /> 廠商資料庫</>}
                                {activeView === 'PART_TIMERS' && <><Briefcase size={20} className="text-indigo-500" /> 兼職資料庫</>}
                                {activeView === 'HISTORY' && <><Archive size={20} className="text-slate-400" /> 歷史封存庫</>}
                                {activeView === 'SETTINGS' && <><Settings size={20} className="text-slate-600" /> 系統設定</>}
                            </h2>

                            <div className="flex items-center gap-2">
                                {activeView === 'LIST' && (
                                    <div className="relative group">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="搜尋活動或廠商..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all" />
                                    </div>
                                )}
                                {activeView === 'VENDORS' && (
                                    <>
                                        <button
                                            onClick={() => setVendorFilter(prev => prev === 'ALL' ? 'PENDING_REVIEW' : 'ALL')}
                                            className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1 ${vendorFilter === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            <AlertTriangle size={16} className={vendorFilter === 'PENDING_REVIEW' ? 'fill-amber-600 text-amber-600' : ''} />
                                            待審核 ({vendorPendingUpdateCount})
                                        </button>
                                        <button onClick={() => handleOpenVendorModal()} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-1">
                                            <Plus size={16} /> 新增
                                        </button>
                                    </>
                                )}
                                {activeView === 'PART_TIMERS' && (
                                    <button onClick={() => handleOpenPTModal()} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-1">
                                        <Plus size={16} /> 新增
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* SETTINGS VIEW (ADMIN ONLY) */}
                        {activeView === 'SETTINGS' && (
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Backup Card */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 flex flex-col items-center text-center hover:border-indigo-300 transition-all">
                                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                                            <Download size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">備份系統資料 (Backup)</h3>
                                        <p className="text-slate-500 text-sm mb-8 max-w-xs">將當前所有訂單、任務、廠商與兼職資料導出為 JSON 檔案，以供日後還原使用。</p>
                                        <button onClick={handleBackup} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
                                            <Download size={18} /> 立即下載備份
                                        </button>
                                    </div>

                                    {/* Restore Card */}
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center text-center hover:border-red-300 transition-all">
                                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
                                            <Upload size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-red-800 mb-2">系統還原 (Restore)</h3>
                                        <p className="text-red-600/70 text-sm mb-8 max-w-xs">警告：此操作將覆蓋當前所有系統資料，且無法復原。請確保您已上傳正確的備份檔。</p>
                                        <label className="px-8 py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all cursor-pointer flex items-center gap-2">
                                            <Upload size={18} /> 選擇備份檔還原
                                            <input type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ... (LIST VIEW unchanged) ... */}
                        {activeView === 'LIST' && (
                            <TaskAssignmentTable
                                tasks={sortedTasks}
                                orders={orders}
                                vendors={vendors}
                                partTimers={partTimers}
                                onUpdateTask={onUpdateTask}
                                onUpdateOrder={onUpdateOrder}
                                onNavigateToVendor={onNavigateToVendor}
                                onArchiveTask={onArchiveTask}
                                setSelectedTaskId={setSelectedTaskId}
                                onPublishTask={handlePublish}
                            />
                        )}

                        {/* ... (VENDORS and other views unchanged) ... */}
                        {activeView === 'VENDORS' && (
                            <div className="flex-1 overflow-x-auto">
                                {selectedVendorDetailId ? (
                                    // VENDOR DETAIL VIEW (Full content restored)
                                    (() => {
                                        const vendor = vendors.find(v => v.id === selectedVendorDetailId);
                                        if (!vendor) return <div>Vendor Not Found</div>;

                                        const vendorTasks = tasks.filter(t => t.vendorId === vendor.id);

                                        return (
                                            <div className="p-6 animate-in slide-in-from-right duration-300">
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => setSelectedVendorDetailId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                                            <ArrowLeft size={24} className="text-slate-500" />
                                                        </button>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h2 className="text-2xl font-bold text-slate-900">{vendor.name}</h2>
                                                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold border border-indigo-100">{getRoleName(vendor.role)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex gap-0.5 text-amber-400">
                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                        <Sparkles key={i} size={12} className={i < Math.round(vendor.reliabilityScore / 20) ? 'fill-current' : 'text-slate-200'} />
                                                                    ))}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-500">{vendor.reliabilityScore}/100 信賴分數</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onPreviewClientPage?.(vendor.id);
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                                                        >
                                                            <ExternalLink size={16} /> 預覽頁面
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const url = `${window.location.origin}/preview/${vendor.id}`;
                                                                navigator.clipboard.writeText(url).then(() => alert(`已複製客戶連結：\n${url}`));
                                                            }}
                                                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Copy size={16} /> 複製連結
                                                        </button>
                                                        <button onClick={() => handleOpenVendorModal(vendor)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                                            <Edit2 size={16} /> 編輯
                                                        </button>
                                                        <button onClick={() => handleDeleteVendorClick(vendor.id, vendor.name)} className="flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                                                            <Trash2 size={16} /> 刪除
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* ... Content truncated for brevity (same as previous) ... */}
                                                <div className="grid grid-cols-3 gap-6 mb-8">
                                                    <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
                                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><UserIcon size={18} className="text-indigo-500" /> 聯絡資訊</h3>
                                                        <div className="space-y-4">
                                                            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Email</label><div className="text-sm font-medium text-slate-700 flex items-center gap-2"><Mail size={14} /> {vendor.email}</div></div>
                                                            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone</label><div className="text-sm font-medium text-slate-700 flex items-center gap-2"><Phone size={14} /> {vendor.phone}</div></div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-6 h-full">
                                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-600" /> 商業合作條款</h3>
                                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                                            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">合作模式</label><div className="text-sm font-bold text-slate-800">{vendor.collaborationMode || '未設定'}</div></div>
                                                            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-1">分潤機制</label><div className="text-sm font-bold text-slate-800">{vendor.profitSharing || '未設定'}</div></div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div><label className="text-xs font-bold text-slate-400 uppercase block mb-2">內部成本 / 廠商報價 (Internal)</label><div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap h-32 overflow-y-auto">{vendor.pricingTerms || "尚無資料"}</div></div>
                                                            <div><label className="text-xs font-bold text-indigo-500 uppercase block mb-2">客戶報價 / 街趣定價 (Client)</label><div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap h-32 overflow-y-auto font-medium">{vendor.clientPricingTerms || "尚未設定對外價格"}</div></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* SERVICE IMAGES GALLERY (Admin View) */}
                                                {vendor.serviceImages && vendor.serviceImages.length > 0 && (
                                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">服務實景 Gallery</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            {vendor.serviceImages.map((img, i) => {
                                                                const isVideo = img.startsWith('data:video');
                                                                return isVideo ? (
                                                                    <video key={i} src={img} className="aspect-video rounded-lg bg-slate-950 border border-slate-200 shadow-sm object-cover" controls />
                                                                ) : (
                                                                    <div key={i} className="aspect-video rounded-lg bg-slate-100 bg-cover bg-center border border-slate-200 shadow-sm" style={{ backgroundImage: `url('${img}')` }}></div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    // GRID VIEW
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                        {filteredVendors.map(vendor => (
                                            <div key={vendor.id} onClick={() => setSelectedVendorDetailId(vendor.id)} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer bg-white flex flex-col relative group hover:border-indigo-300">
                                                {vendor.pendingUpdate && (
                                                    <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 z-10 animate-pulse">
                                                        <AlertTriangle size={12} /> 待審核
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">{vendor.name.charAt(0)}</div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{vendor.name}</h3>
                                                            </div>
                                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 inline-block">{getRoleName(vendor.role)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm text-slate-600 mb-4 flex-1">
                                                    <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {vendor.phone}</div>
                                                    <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {vendor.email}</div>
                                                </div>
                                                <div className="absolute bottom-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenVendorModal(vendor); }} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded shadow-sm"><Settings size={16} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteVendorClick(vendor.id, vendor.name); }} className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded shadow-sm"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredVendors.length === 0 && <div className="col-span-full py-10 text-center text-slate-400">沒有符合條件的廠商</div>}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* (Other Views: PART_TIMERS, CALENDAR, HISTORY - Preserved) */}
                        {activeView === 'PART_TIMERS' && (
                            <div className="flex-1 overflow-x-auto p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {partTimers.map(pt => (
                                        <div key={pt.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col relative group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">{pt.name.charAt(0)}</div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800">{pt.name}</h3>
                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 inline-block">{getRoleName(pt.role)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleOpenPTModal(pt)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Settings size={16} /></button>
                                                    <button onClick={() => handleDeletePTClick(pt.id, pt.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${pt.salaryType === 'SESSION' ? 'text-purple-700 bg-purple-50 border-purple-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
                                                    {pt.salaryType === 'SESSION' ? '場次 (Session)' : '時薪 (Hourly)'}: ${pt.rate?.toLocaleString()}/{pt.salaryType === 'SESSION' ? '場' : 'hr'}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm text-slate-600 mb-4 flex-1">
                                                <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {pt.phone}</div>
                                                <div className="flex items-center gap-2"><Briefcase size={14} className="text-slate-400" /> 技能: {pt.skills}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {partTimers.length === 0 && <EmptyState message="尚無兼職人員資料，請新增。" />}
                                </div>
                            </div>
                        )}

                        {/* Calendar & History views omitted for brevity as they were unchanged */}
                        {activeView === 'CALENDAR' && (
                            <div className="flex-1 flex flex-col p-6">
                                {/* Calendar Implementation */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-2xl font-bold text-slate-800">{currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}</h2>
                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={20} /></button>
                                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={20} /></button>
                                        </div>
                                        <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-indigo-600 hover:underline">回到本月</button>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-7 gap-4">
                                    {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => <div key={d} className="text-center text-sm font-bold uppercase pb-2 border-b-2 text-slate-600 border-slate-200">{d}</div>)}
                                    {calendarCells.map((date, idx) => {
                                        if (!date) return <div key={idx}></div>;
                                        const dayOrders = orders.filter(o => {
                                            const d = new Date(o.eventDate);
                                            return d.getDate() === date.getDate() && d.getMonth() === date.getMonth();
                                        });
                                        return (
                                            <div key={idx} className="min-h-[100px] border border-slate-100 rounded-xl p-2 bg-white hover:shadow-md transition-all">
                                                <div className="text-sm font-bold text-slate-400 mb-2">{date.getDate()}</div>
                                                <div className="space-y-1">
                                                    {dayOrders.map(o => (
                                                        <div key={o.id} className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-700 rounded truncate cursor-pointer" onClick={() => { const task = tasks.find(t => t.orderId === o.id); if (task) setSelectedTaskId(task.id); }}>{o.eventName}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODALS & DRAWERS */}

            {/* 1. NEW: CREATE TASK MODAL (This was missing) */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Plus size={20} className="text-indigo-600" /> 新增指派任務</h3>
                            <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <label className="block text-xs font-bold text-indigo-800 uppercase mb-2">1. 活動資訊 (Event Info)</label>
                                <div className="space-y-3">
                                    <input
                                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="活動名稱 (例如: 科技公司年會)"
                                        value={newOrderData.eventName}
                                        onChange={e => setNewOrderData({ ...newOrderData, eventName: e.target.value })}
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="客戶名稱"
                                            value={newOrderData.clientName}
                                            onChange={e => setNewOrderData({ ...newOrderData, clientName: e.target.value })}
                                        />
                                        <input
                                            type="datetime-local"
                                            className="w-40 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newOrderData.eventDate}
                                            onChange={e => setNewOrderData({ ...newOrderData, eventDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. 選擇指派對象 (Assign To)</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 custom-scrollbar">
                                    <div className="text-xs font-bold text-slate-400 px-2 py-1">廠商 (Vendors)</div>
                                    {vendors.map(v => (
                                        <div key={v.id} onClick={() => {
                                            if (selectedVendorIds.includes(v.id)) setSelectedVendorIds(prev => prev.filter(id => id !== v.id));
                                            else setSelectedVendorIds(prev => [...prev, v.id]);
                                        }} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedVendorIds.includes(v.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedVendorIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                                    {selectedVendorIds.includes(v.id) && <Check size={10} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{v.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{getRoleName(v.role)}</span>
                                        </div>
                                    ))}

                                    <div className="text-xs font-bold text-slate-400 px-2 py-1 mt-2">兼職人員 (Part-Timers)</div>
                                    {partTimers.map(pt => (
                                        <div key={pt.id} onClick={() => {
                                            if (selectedPartTimerIds.includes(pt.id)) setSelectedPartTimerIds(prev => prev.filter(id => id !== pt.id));
                                            else setSelectedPartTimerIds(prev => [...prev, pt.id]);
                                        }} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedPartTimerIds.includes(pt.id) ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedPartTimerIds.includes(pt.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                                                    {selectedPartTimerIds.includes(pt.id) && <Check size={10} className="text-white" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{pt.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{getRoleName(pt.role)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">取消</button>
                            <button
                                onClick={handleCreateAssignment}
                                disabled={isCreating}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreating ? <RefreshCcw size={18} className="animate-spin" /> : <Check size={18} />} 確認建立
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VENDOR MODAL */}
            {showVendorModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* ... (Vendor Modal Content unchanged for brevity, same as previous step) ... */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Settings size={20} className="text-indigo-600" /> {editingVendor ? '編輯廠商' : '新增廠商'}</h3>
                            <button onClick={() => setShowVendorModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">

                            {/* PENDING APPROVAL SECTION */}
                            {editingVendor?.pendingUpdate && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                                        <AlertTriangle size={18} /> 待審核更新申請
                                    </div>
                                    <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                                        <div className="mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase block">廠商提交之成本/價格</span>
                                            <p className="font-medium text-slate-800">{editingVendor.pendingUpdate.pricingTerms}</p>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase block">新服務描述</span>
                                            <p>{editingVendor.pendingUpdate.description}</p>
                                        </div>
                                        {editingVendor.pendingUpdate.serviceImages.length > 0 && (
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">新圖片 ({editingVendor.pendingUpdate.serviceImages.length})</span>
                                                <div className="flex gap-2">
                                                    {editingVendor.pendingUpdate.serviceImages.map((img, i) => (
                                                        <div key={i} className="w-10 h-10 rounded bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url('${img}')` }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { onReviewVendorProfile(editingVendor.id, false); setShowVendorModal(false); }} className="flex-1 py-2 text-red-600 bg-white border border-red-200 rounded-lg text-sm font-bold hover:bg-red-50">退回申請</button>
                                        <button
                                            onClick={handleLoadPendingData}
                                            className="flex-1 py-2 text-white bg-amber-600 rounded-lg text-sm font-bold hover:bg-amber-700 shadow-md flex items-center justify-center gap-2"
                                        >
                                            <ArrowDown size={16} /> 載入資料並修飾
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-amber-600 text-center font-bold">
                                        點擊「載入」後，資料將填入下方表單，供您確認與設定最終客戶價格。
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">名稱</label>
                                <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={vendorForm.name || ''} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} />

                                {/* UPDATED ROLE SELECT */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">類型</label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                            value={vendorForm.role}
                                            onChange={e => setVendorForm({ ...vendorForm, role: e.target.value })}
                                        >
                                            <option value={VendorRole.CHEF}>餐飲廠商</option>
                                            <option value={VendorRole.DECOR}>佈置廠商</option>
                                            <option value={VendorRole.PROFESSIONAL}>專業服務 (主持/表演)</option>
                                            <option value={VendorRole.EQUIPMENT}>設備廠商 (音響/燈光)</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">信賴分數</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={vendorForm.reliabilityScore || ''} onChange={e => setVendorForm({ ...vendorForm, reliabilityScore: parseInt(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                        <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={vendorForm.email || ''} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">電話</label>
                                        <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={vendorForm.phone || ''} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* ... Commercial Terms & Images (Unchanged logic) ... */}
                            <div className={`space-y-4 bg-slate-50 p-4 rounded-xl border ${pendingReviewResolved ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-100'}`}>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <DollarSign size={14} /> 商業合作細節
                                    {pendingReviewResolved && <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-[10px]">編輯中</span>}
                                </h4>
                                {/* ... inputs ... */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">合作模式</label>
                                        <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={vendorForm.collaborationMode || ''} onChange={e => setVendorForm({ ...vendorForm, collaborationMode: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">分潤機制</label>
                                        <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={vendorForm.profitSharing || ''} onChange={e => setVendorForm({ ...vendorForm, profitSharing: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">內部成本 / 廠商報價 (Internal)</label>
                                    <textarea className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} value={vendorForm.pricingTerms || ''} onChange={e => setVendorForm({ ...vendorForm, pricingTerms: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-indigo-600 uppercase mb-1 flex justify-between">
                                        <span>客戶報價 / 街趣定價 (Client Visible)</span>
                                        {pendingReviewResolved && <span className="text-red-500 animate-pulse">請確認此欄位</span>}
                                    </label>
                                    <textarea
                                        className={`w-full bg-white border-2 rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none ${pendingReviewResolved ? 'border-amber-400 focus:ring-amber-500' : 'border-indigo-100 focus:ring-indigo-500'}`}
                                        rows={2}
                                        value={vendorForm.clientPricingTerms || ''}
                                        onChange={e => setVendorForm({ ...vendorForm, clientPricingTerms: e.target.value })}
                                        placeholder="請在此輸入最終顯示給客戶的價格方案..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">目前服務描述 (公開)</h4>
                                <textarea
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    rows={3}
                                    value={vendorForm.description || ''}
                                    onChange={e => setVendorForm({ ...vendorForm, description: e.target.value })}
                                    placeholder="服務內容描述..."
                                />
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">服務示意圖 (URLs)</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {vendorForm.serviceImages?.map((img, i) => {
                                            const isVideo = img.startsWith('data:video');
                                            return (
                                                <div key={i} className="relative w-20 h-20 shrink-0 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                                    {isVideo ? (
                                                        <video src={img} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${img}')` }}></div>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            const newImages = vendorForm.serviceImages?.filter((_, idx) => idx !== i);
                                                            setVendorForm({ ...vendorForm, serviceImages: newImages });
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 text-red-500 shadow-sm border border-slate-100 hover:bg-red-50 z-10"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <input
                                            type="file"
                                            accept="image/*,video/mp4,video/webm"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const isVideo = file.type.startsWith('video/');
                                                    const limit = isVideo ? 10 * 1024 * 1024 : 2 * 1024 * 1024; // 10MB Video, 2MB Image

                                                    if (file.size > limit) {
                                                        alert(isVideo ? '影片過大！請上傳 10MB 以下的影片。' : '圖片過大！請上傳 2MB 以下的圖片。');
                                                        return;
                                                    }

                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        // For video, we don't strip newlines as strictly or it might break large base64 chunks? 
                                                        // Actually safe to strip newlines for data URLs usually.
                                                        const base64String = (reader.result as string).replace(/(\r\n|\n|\r)/gm, "");
                                                        setVendorForm({ ...vendorForm, serviceImages: [...(vendorForm.serviceImages || []), base64String] });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <button
                                            className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Plus size={20} />
                                            <span className="text-[10px] font-bold">上傳</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="p-6 pt-0 flex gap-3 mt-auto">
                            <button onClick={() => setShowVendorModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">取消</button>
                            <button
                                onClick={handleSaveVendor}
                                className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-colors ${pendingReviewResolved ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                            >
                                {pendingReviewResolved ? '儲存並發佈 (核准)' : '儲存'}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* PT MODAL - Update Roles */}
            {
                showPTModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Briefcase size={20} className="text-indigo-600" /> {editingPT ? '編輯兼職人員' : '新增兼職人員'}</h3>
                                <button onClick={() => setShowPTModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">姓名</label>
                                <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={ptForm.name || ''} onChange={e => setPtForm({ ...ptForm, name: e.target.value })} />

                                {/* UPDATED PT ROLE SELECT */}
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">類型</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                    value={ptForm.role}
                                    onChange={e => setPtForm({ ...ptForm, role: e.target.value as PartTimeRole })}
                                >
                                    <option value={PartTimeRole.CONTROL}>活動場控</option>
                                    <option value={PartTimeRole.EXECUTION}>活動執行</option>
                                    <option value={PartTimeRole.OPERATIONS}>營運兼職</option>
                                    <option value={PartTimeRole.OTHER}>其他兼職</option>
                                </select>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">計薪方式</label>
                                        <select className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={ptForm.salaryType || 'HOURLY'} onChange={e => setPtForm({ ...ptForm, salaryType: e.target.value as SalaryType })}>
                                            <option value="HOURLY">時薪</option>
                                            <option value="SESSION">場次</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">費率</label>
                                        <input type="number" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={ptForm.rate || ''} onChange={e => setPtForm({ ...ptForm, rate: parseInt(e.target.value) })} />
                                    </div>
                                </div>

                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">電話</label>
                                <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={ptForm.phone || ''} onChange={e => setPtForm({ ...ptForm, phone: e.target.value })} />

                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">技能備註</label>
                                <textarea className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} value={ptForm.skills || ''} onChange={e => setPtForm({ ...ptForm, skills: e.target.value })} />
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button onClick={() => setShowPTModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">取消</button>
                                <button onClick={handleSavePT} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">儲存</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* TASK DETAIL DRAWER */}
            {
                selectedTask && (
                    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedTaskId(null)}>
                        <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                            {/* ... (Unchanged Drawer Content Header) ... */}
                            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TASK ID: {selectedTask.id}</span>
                                        <StatusBadge status={selectedTask.status} withLabel />
                                    </div>
                                    {(() => {
                                        const taskOrder = orders.find(o => o.id === selectedTask.orderId);
                                        if (taskOrder) {
                                            return (
                                                <>
                                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-1">{taskOrder.eventName}</h2>
                                                    <div className="text-sm font-bold text-slate-500 mb-4">{taskOrder.clientName}</div>
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                                <div className="flex gap-2">
                                    {!isEditing && <button onClick={handleStartEdit} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors shadow-sm"><Edit2 size={18} /></button>}
                                    <button onClick={() => setSelectedTaskId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
                                </div>
                            </div>

                            {/* FULL CONTENT RESTORED */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* AI Summary */}
                                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-800 font-bold text-sm">
                                        <Sparkles size={16} /> AI 任務摘要
                                    </div>
                                    {isEditing ? (
                                        <textarea className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} value={editForm.aiSummary || ''} onChange={e => setEditForm({ ...editForm, aiSummary: e.target.value })} />
                                    ) : (
                                        <p className="text-sm text-indigo-900 leading-relaxed">{selectedTask.aiSummary}</p>
                                    )}
                                </div>

                                {/* Action Checklist */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> 執行清單</h3>
                                        {isEditing && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('確定要帶入標準清單嗎？目前的清單將被覆蓋。')) {
                                                            setEditForm({
                                                                ...editForm,
                                                                requiredActions: [...STANDARD_EXECUTION_LIST],
                                                                completedActionIndices: []
                                                            });
                                                        }
                                                    }}
                                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 flex items-center gap-1"
                                                >
                                                    <ClipboardList size={12} /> 帶入標準清單
                                                </button>
                                                <button onClick={handleAddActionItem} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold hover:bg-emerald-100">新增項目</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {(isEditing ? editForm.requiredActions : selectedTask.requiredActions)?.map((action, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                                                {isEditing ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <input className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm outline-none" value={action} onChange={e => handleUpdateActionItem(i, e.target.value)} />
                                                        <button onClick={() => handleDeleteActionItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-700">{action}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Details (Editable) WITH EVENT FLOW */}
                                {(() => {
                                    const order = isEditing && editOrderForm ? editOrderForm : orders.find(o => o.id === selectedTask.orderId);
                                    if (!order) return null;

                                    // Calculate Financials on the fly
                                    const mealCost = order.guestCount * order.financials.budgetPerHead;
                                    const serviceFee = order.financials.hasServiceCharge
                                        ? Math.round(mealCost * 0.1)
                                        : order.financials.serviceFee;

                                    const subtotal = mealCost + order.financials.shippingFee + serviceFee + (order.financials.adjustments || 0);
                                    const taxAmount = Math.round(subtotal * 0.05); // 5% VAT fixed for Taiwan usually
                                    const totalAmount = subtotal + taxAmount;
                                    const balance = totalAmount - order.financials.deposit;

                                    return (
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-slate-400" /> 訂單細節</h3>
                                                {isEditing && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('確定要刪除整個活動 (訂單) 嗎？\n這將一併刪除所有關聯的任務與資料，且無法復原。')) {
                                                                onDeleteOrder(order.id);
                                                                setSelectedTaskId(null);
                                                            }
                                                        }}
                                                        className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-100 flex items-center gap-1 border border-red-200"
                                                    >
                                                        <Trash2 size={12} /> 刪除活動
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">人數 Guests</label>
                                                    {isEditing ? <input type="number" className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm" value={order.guestCount} onChange={e => setEditOrderForm(prev => prev ? { ...prev, guestCount: parseInt(e.target.value) } : null)} /> : <div className="text-sm font-bold text-slate-800">{order.guestCount} 人</div>}
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">餐標 Budget/Head</label>
                                                    {isEditing ? <input type="number" className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm" value={order.financials.budgetPerHead} onChange={e => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, budgetPerHead: parseInt(e.target.value) } } : null)} /> : <div className="text-sm font-bold text-slate-800">${order.financials.budgetPerHead}</div>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">特殊需求 Special Requests</label>
                                                {isEditing ? <textarea className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm" rows={2} value={order.specialRequests} onChange={e => setEditOrderForm(prev => prev ? { ...prev, specialRequests: e.target.value } : null)} /> : <div className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">{order.specialRequests}</div>}
                                            </div>

                                            {/* --- NEW: EXECUTION TEAM SECTION --- */}
                                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mt-4">
                                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                                        <Users size={16} className="text-indigo-500" /> 執行夥伴與團隊 (Execution Team)
                                                    </h4>
                                                    {isEditing && (
                                                        <button
                                                            onClick={() => {
                                                                const newTeam = [...(order.executionTeam || []), { role: '', name: '', phone: '', isNotified: false }];
                                                                setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                            }}
                                                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 flex items-center gap-1"
                                                        >
                                                            <Plus size={12} /> 新增人員
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    {(order.executionTeam || []).map((staff, idx) => (
                                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                            {isEditing ? (
                                                                <>
                                                                    {/* Role */}
                                                                    <input
                                                                        className="w-full sm:w-24 text-xs font-bold bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                                                                        value={staff.role}
                                                                        placeholder="角色 (如: 外燴)"
                                                                        onChange={(e) => {
                                                                            const newTeam = [...order.executionTeam];
                                                                            newTeam[idx] = { ...newTeam[idx], role: e.target.value };
                                                                            setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                                        }}
                                                                    />
                                                                    {/* Name / Select */}
                                                                    <div className="flex-1 relative">
                                                                        <select
                                                                            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                                                            value={staff.assigneeId || ''}
                                                                            onChange={(e) => {
                                                                                const selectedId = e.target.value;
                                                                                const selectedOption = availableStaffOptions.find(opt => opt.value === selectedId);
                                                                                const newTeam = [...order.executionTeam];
                                                                                newTeam[idx] = {
                                                                                    ...newTeam[idx],
                                                                                    assigneeId: selectedId,
                                                                                    name: selectedOption ? selectedOption.label.replace(/^\(.*\)\s/, '') : '',
                                                                                    phone: selectedOption ? selectedOption.phone : ''
                                                                                };
                                                                                setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                                            }}
                                                                        >
                                                                            {availableStaffOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                                            {/* If simple name was typed previously without ID */}
                                                                            {!staff.assigneeId && staff.name && <option value="" disabled>手動輸入: {staff.name}</option>}
                                                                        </select>
                                                                        {staff.assigneeId === "" && (
                                                                            <input
                                                                                className="absolute inset-0 w-full text-xs bg-white border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500"
                                                                                value={staff.name}
                                                                                placeholder="自訂姓名..."
                                                                                onChange={(e) => {
                                                                                    const newTeam = [...order.executionTeam];
                                                                                    newTeam[idx] = { ...newTeam[idx], name: e.target.value };
                                                                                    setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    {/* Phone */}
                                                                    <input
                                                                        className="w-full sm:w-28 text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1.5 outline-none"
                                                                        value={staff.phone}
                                                                        placeholder="電話"
                                                                        onChange={(e) => {
                                                                            const newTeam = [...order.executionTeam];
                                                                            newTeam[idx] = { ...newTeam[idx], phone: e.target.value };
                                                                            setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                                        }}
                                                                    />
                                                                    {/* Notified Checkbox */}
                                                                    <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer select-none border transition-colors ${staff.isNotified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="hidden"
                                                                            checked={staff.isNotified}
                                                                            onChange={(e) => {
                                                                                const newTeam = [...order.executionTeam];
                                                                                newTeam[idx] = { ...newTeam[idx], isNotified: e.target.checked };
                                                                                setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                                            }}
                                                                        />
                                                                        <CheckSquare size={14} className={staff.isNotified ? 'opacity-100' : 'opacity-50'} />
                                                                        <span className="text-[10px] font-bold">已通知</span>
                                                                    </label>
                                                                    {/* Delete */}
                                                                    <button
                                                                        onClick={() => {
                                                                            const newTeam = order.executionTeam.filter((_, i) => i !== idx);
                                                                            setEditOrderForm(prev => prev ? { ...prev, executionTeam: newTeam } : null);
                                                                        }}
                                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex-1 flex justify-between items-center w-full">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{staff.role}</span>
                                                                        <span className="text-sm font-bold text-slate-800">{staff.name}</span>
                                                                        <a href={`tel:${staff.phone}`} className="text-xs font-mono text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                                                                            <Phone size={10} /> {staff.phone}
                                                                        </a>
                                                                    </div>
                                                                    {staff.isNotified ?
                                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> 已通知</span> :
                                                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> 未通知</span>
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!order.executionTeam || order.executionTeam.length === 0) && (
                                                        <div className="text-center text-xs text-slate-400 py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                                            尚未指派執行團隊人員
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* --- NEW: FINANCIAL SECTION --- */}
                                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mt-4">
                                                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                                    <Receipt size={16} className="text-indigo-500" /> 財務與款項 (Financials)
                                                </h4>

                                                <div className="space-y-3 text-sm">
                                                    {/* Meal Cost */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500">餐費小計 ({order.guestCount}人 x ${order.financials.budgetPerHead})</span>
                                                        <span className="font-medium text-slate-800">${mealCost.toLocaleString()}</span>
                                                    </div>

                                                    {/* Shipping */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500">運費</span>
                                                        {isEditing ? (
                                                            <input type="number" className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm" value={order.financials.shippingFee} onChange={e => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, shippingFee: parseInt(e.target.value) } } : null)} />
                                                        ) : (
                                                            <span className="font-medium text-slate-800">${order.financials.shippingFee.toLocaleString()}</span>
                                                        )}
                                                    </div>

                                                    {/* Service Fee */}
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500">服務費 / 廠商加值</span>
                                                            {isEditing && (
                                                                <label className="flex items-center gap-1 text-[10px] text-indigo-600 cursor-pointer select-none bg-indigo-50 px-2 py-0.5 rounded">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={order.financials.hasServiceCharge}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            setEditOrderForm(prev => {
                                                                                if (!prev) return null;
                                                                                const newServiceFee = checked ? Math.round(prev.guestCount * prev.financials.budgetPerHead * 0.1) : prev.financials.serviceFee;
                                                                                return { ...prev, financials: { ...prev.financials, hasServiceCharge: checked, serviceFee: newServiceFee } };
                                                                            });
                                                                        }}
                                                                    /> 10%
                                                                </label>
                                                            )}
                                                        </div>
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                className={`w-24 text-right border border-slate-200 rounded px-2 py-1 text-sm ${order.financials.hasServiceCharge ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-900'}`}
                                                                value={serviceFee}
                                                                disabled={order.financials.hasServiceCharge}
                                                                onChange={e => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, serviceFee: parseInt(e.target.value) } } : null)}
                                                            />
                                                        ) : (
                                                            <span className="font-medium text-slate-800">${serviceFee.toLocaleString()} {order.financials.hasServiceCharge && <span className="text-[10px] text-slate-400">(10%)</span>}</span>
                                                        )}
                                                    </div>

                                                    {/* Adjustments */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-500">其他調整 (Adjustments)</span>
                                                        {isEditing ? (
                                                            <input type="number" className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm" value={order.financials.adjustments || 0} onChange={e => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, adjustments: parseInt(e.target.value) } } : null)} />
                                                        ) : (
                                                            <span className="font-medium text-slate-800">${(order.financials.adjustments || 0).toLocaleString()}</span>
                                                        )}
                                                    </div>

                                                    <div className="border-t border-slate-100 my-2"></div>

                                                    {/* Subtotal */}
                                                    <div className="flex justify-between items-center text-slate-600">
                                                        <span>銷售額 (未稅)</span>
                                                        <span className="font-bold">${subtotal.toLocaleString()}</span>
                                                    </div>

                                                    {/* Tax */}
                                                    <div className="flex justify-between items-center text-slate-500 text-xs">
                                                        <span>營業稅 (5%)</span>
                                                        <span>${taxAmount.toLocaleString()}</span>
                                                    </div>

                                                    {/* Total */}
                                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mt-1">
                                                        <span className="font-bold text-slate-800">含稅總額</span>
                                                        <span className="font-bold text-indigo-600 text-lg">${totalAmount.toLocaleString()}</span>
                                                    </div>

                                                    {/* Deposit & Balance */}
                                                    <div className="pt-2 space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-500 text-xs font-bold uppercase">訂金 Deposit</span>
                                                                {isEditing ? (
                                                                    <input
                                                                        type="date"
                                                                        className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1"
                                                                        value={order.financials.depositDate || ''}
                                                                        onChange={e => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, depositDate: e.target.value } } : null)}
                                                                    />
                                                                ) : (
                                                                    order.financials.depositDate && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded">{order.financials.depositDate} 已付</span>
                                                                )}
                                                            </div>
                                                            {isEditing ? (
                                                                <input type="number" className="w-24 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-700" value={order.financials.deposit} onChange={e => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, deposit: parseInt(e.target.value) } } : null)} />
                                                            ) : (
                                                                <span className="font-bold text-slate-700">-${order.financials.deposit.toLocaleString()}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2">
                                                            <span className="text-slate-500 text-xs font-bold uppercase">應收尾款 Balance</span>
                                                            <span className="font-bold text-red-600 text-base">${balance.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Invoice Info */}
                                                    <div className="bg-indigo-50/50 rounded-lg p-3 mt-3 border border-indigo-100">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-xs font-bold text-indigo-800 flex items-center gap-1"><Calculator size={12} /> 發票資訊</span>
                                                            {isEditing && (
                                                                <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={order.financials.isInvoiceRequired}
                                                                        onChange={(e) => setEditOrderForm(prev => prev ? { ...prev, financials: { ...prev.financials, isInvoiceRequired: e.target.checked } } : null)}
                                                                    /> 需要開立
                                                                </label>
                                                            )}
                                                        </div>
                                                        {order.financials.isInvoiceRequired ? (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[10px] text-slate-400 block">公司抬頭</label>
                                                                    {isEditing ? <input className="w-full bg-white border border-indigo-100 rounded px-1 py-0.5 text-xs" value={order.clientName} readOnly disabled /> : <div className="text-xs font-medium truncate">{order.clientName}</div>}
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-slate-400 block">統一編號 (Tax ID)</label>
                                                                    {isEditing ? <input className="w-full bg-white border border-indigo-200 rounded px-1 py-0.5 text-xs font-mono" value={order.taxId || ''} onChange={e => setEditOrderForm(prev => prev ? { ...prev, taxId: e.target.value } : null)} placeholder="8碼統編" /> : <div className="text-xs font-mono font-bold text-slate-700">{order.taxId || '未提供'}</div>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-400 text-center py-1">不需要統一發票</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* NEW: Event Flow Section (Unchanged logic, just position shift) */}
                                            <div className="pt-4 border-t border-slate-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-bold text-slate-700">活動流程 (Run-down)</h4>
                                                    {isEditing && (
                                                        <button
                                                            onClick={() => {
                                                                const newFlow = [...(order.eventFlow || []), { time: '00:00', activity: 'New Item', description: '', highlightFor: [] }];
                                                                setEditOrderForm(prev => prev ? { ...prev, eventFlow: newFlow } : null);
                                                            }}
                                                            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 flex items-center gap-1"
                                                        >
                                                            <Plus size={12} /> 新增
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    {(order.eventFlow || []).map((item, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group">
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            className="w-16 text-xs font-mono font-bold border border-slate-200 rounded px-1 py-1"
                                                                            value={item.time}
                                                                            onChange={(e) => {
                                                                                const newFlow = [...order.eventFlow];
                                                                                newFlow[idx] = { ...newFlow[idx], time: e.target.value };
                                                                                setEditOrderForm(prev => prev ? { ...prev, eventFlow: newFlow } : null);
                                                                            }}
                                                                        />
                                                                        <input
                                                                            className="flex-1 text-xs font-bold border border-slate-200 rounded px-1 py-1"
                                                                            value={item.activity}
                                                                            onChange={(e) => {
                                                                                const newFlow = [...order.eventFlow];
                                                                                newFlow[idx] = { ...newFlow[idx], activity: e.target.value };
                                                                                setEditOrderForm(prev => prev ? { ...prev, eventFlow: newFlow } : null);
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newFlow = order.eventFlow.filter((_, i) => i !== idx);
                                                                                setEditOrderForm(prev => prev ? { ...prev, eventFlow: newFlow } : null);
                                                                            }}
                                                                            className="text-red-400 hover:text-red-600 p-1"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                    <input
                                                                        className="w-full text-xs text-slate-500 border border-slate-200 rounded px-1 py-1"
                                                                        value={item.description}
                                                                        onChange={(e) => {
                                                                            const newFlow = [...order.eventFlow];
                                                                            newFlow[idx] = { ...newFlow[idx], description: e.target.value };
                                                                            setEditOrderForm(prev => prev ? { ...prev, eventFlow: newFlow } : null);
                                                                        }}
                                                                        placeholder="描述..."
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-3">
                                                                    <div className="text-xs font-mono font-bold text-slate-400 pt-0.5">{item.time}</div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-800">{item.activity}</div>
                                                                        <div className="text-xs text-slate-500">{item.description}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!order.eventFlow || order.eventFlow.length === 0) && (
                                                        <div className="text-center text-xs text-slate-400 py-2">無流程資料</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Operations Log */}
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Activity size={18} className="text-slate-400" /> 營運紀錄</h3>
                                    <div className="border-l-2 border-slate-100 pl-4 space-y-4">
                                        {selectedTask.opsLogs.map((log, i) => (
                                            <div key={i} className="relative">
                                                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                                <div className="text-xs text-slate-400 mb-0.5">{new Date(log.timestamp).toLocaleString()} • {log.user}</div>
                                                <div className="text-sm font-bold text-slate-700">{log.action}</div>
                                                <div className="text-xs text-slate-500">{log.note}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <input type="text" className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200" placeholder="新增備註..." value={logInput} onChange={e => setLogInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLog()} />
                                        <button onClick={handleAddLog} className="bg-slate-800 text-white p-2 rounded-xl hover:bg-slate-700"><Send size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-50">取消</button>
                                    <button onClick={handleSaveEdit} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">儲存變更</button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

        </div >
    );
};

// ... existing sub-components
const NavItem = ({ icon, label, active, onClick, badge, badgeColor }: any) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 mb-1 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
        <div className="flex items-center gap-3">
            {React.cloneElement(icon, { size: 18, className: active ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-300' })}
            <span className="text-sm font-medium">{label}</span>
        </div>
        {badge && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${badgeColor}`}>{badge}</span>}
    </button>
);

const StatCardNew = ({ label, value, icon, color, bg }: any) => (
    <div className={`${bg} p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow`}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <div className={`p-2 rounded-lg bg-slate-50 ${color}`}>{React.cloneElement(icon, { size: 16 })}</div>
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);

const StatusBadge = ({ status, withLabel }: { status: TaskStatus, withLabel?: boolean }) => {
    let style = "bg-slate-100 text-slate-500 border-slate-200";
    let icon = <Clock size={14} />;
    let label = "等待中";

    if (status === TaskStatus.CONFIRMED) { style = "bg-emerald-100 text-emerald-700 border-emerald-200"; icon = <CheckCircle size={14} />; label = "已確認"; }
    else if (status === TaskStatus.ISSUE_REPORTED) { style = "bg-rose-100 text-rose-700 border-rose-200"; icon = <AlertTriangle size={14} />; label = "異常回報"; }
    else if (status === TaskStatus.EMERGENCY) { style = "bg-red-500 text-white border-red-600 animate-pulse"; icon = <Activity size={14} />; label = "緊急!!"; }
    else if (status === TaskStatus.PENDING) { style = "bg-indigo-50 text-indigo-600 border-indigo-100"; icon = <Edit2 size={14} />; label = "草稿"; }
    else if (status === TaskStatus.NOTIFIED) { style = "bg-blue-50 text-blue-600 border-blue-100"; icon = <Send size={14} />; label = "已通知"; }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
            {icon} {withLabel && label}
        </span>
    );
};


const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Sparkles size={24} className="text-slate-300" /></div>
        <p className="text-slate-400 text-sm font-medium">{message}</p>
    </div>
);

export default Dashboard;
