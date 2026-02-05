
import React, { useState, useEffect } from 'react';
import {
    Check,
    AlertCircle,
    MapPin,
    Calendar,
    User,
    ArrowLeft,
    AlertTriangle,
    List,
    Navigation,
    Phone,
    ClipboardList,
    CheckCircle,
    Clock,
    Sparkles,
    Plus,
    Trash2,
    Users,
    CheckSquare,
    Truck,
    Box,
    Utensils,
    X
} from 'lucide-react';
import { VendorTask, Order, Vendor, TaskStatus, EventFlowItem, PartTimer, VendorProfileUpdate, LogisticsTime } from '../types';

import { GeminiService } from '../services/geminiService';
import { LOGISTICS_TEMPLATES } from '../constants/logisticsTemplates';
import { EVENT_FLOW_TEMPLATES } from '../constants/eventFlowTemplates';
import { BookTemplate } from 'lucide-react';

interface VendorConfirmationProps {
    taskData: VendorTask;
    orderData: Order;
    assignee: Vendor | PartTimer;
    allTasks?: VendorTask[];
    vendors?: Vendor[];
    partTimers?: PartTimer[];
    onBack: () => void;
    onSwitchTask?: (taskId: string) => void;
    onUpdateTask?: (task: VendorTask) => void;
    onUpdateOrder?: (order: Order) => void;
    onUpdateProfile?: (vendorId: string, updateData: VendorProfileUpdate) => void;
}

const VendorConfirmation: React.FC<VendorConfirmationProps> = ({ taskData, orderData, assignee, allTasks = [], vendors = [], partTimers = [], onBack, onSwitchTask, onUpdateTask, onUpdateOrder, onUpdateProfile }) => {
    const [task, setTask] = useState<VendorTask>(taskData);
    const [localOrder, setLocalOrder] = useState<Order>(orderData);
    const [loading, setLoading] = useState(true);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [activeTab, setActiveTab] = useState<'INFO' | 'FLOW' | 'EXECUTE' | 'SCHEDULE' | 'PROFILE'>('INFO');
    const [vendorNote, setVendorNote] = useState('');
    const [reportMode, setReportMode] = useState(false);
    const [issueText, setIssueText] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [profileForm, setProfileForm] = useState<VendorProfileUpdate>({
        pricingTerms: '',
        description: '',
        serviceImages: [],
        submittedAt: ''
    });
    const [checkedUnderstanding, setCheckedUnderstanding] = useState(false);
    const [checkedCapability, setCheckedCapability] = useState(false);
    const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
        show: false, message: '', type: 'success'
    });
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showFlowTemplateModal, setShowFlowTemplateModal] = useState(false);

    const isEditable = !!onUpdateOrder;
    const isVendor = 'pricingTerms' in assignee;

    // Combine Vendors and PartTimers for selection in Exec Team
    const availableStaffOptions = [
        { label: "--- 請選擇人員 ---", value: "", phone: "" },
        ...vendors.map(v => ({ label: `(廠商) ${v.name}`, value: v.id, phone: v.phone })),
        ...partTimers.map(pt => ({ label: `(兼職) ${pt.name}`, value: pt.id, phone: pt.phone }))
    ];

    useEffect(() => {
        if (taskData && orderData) {
            setTask(taskData);
            setLocalOrder(orderData);

            const isDone = !!(taskData.ackAt || taskData.status === TaskStatus.ISSUE_REPORTED);
            setIsSubmitted(isDone);
            setCheckedUnderstanding(isDone);
            setCheckedCapability(isDone);
            setVendorNote(taskData.vendorNote || '');
            setIssueText(taskData.issueDetails || '');
            setReportMode(false);

            if (isVendor) {
                const v = assignee as Vendor;
                setProfileForm({
                    pricingTerms: v.pricingTerms || '',
                    description: v.description || '',
                    serviceImages: v.serviceImages || [],
                    submittedAt: ''
                });
            }

            if (!taskData.aiSummary || taskData.aiSummary.length < 5) {
                if (orderData && assignee) {
                    setGeneratingSummary(true);
                    GeminiService.generateVendorTaskSummary(orderData, assignee.role as any)
                        .then(summary => { setTask(prev => ({ ...prev, aiSummary: summary })); setGeneratingSummary(false); });
                }
            }
            setLoading(false);
        }
    }, [taskData, orderData, assignee]);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const commitOrderChanges = () => {
        if (onUpdateOrder && JSON.stringify(localOrder) !== JSON.stringify(orderData)) {
            onUpdateOrder(localOrder);
            showNotification('訂單資訊已更新', 'success');
        }
    };

    // Immediate commit for array operations
    const updateOrderImmediate = (newOrder: Order) => {
        setLocalOrder(newOrder);
        if (onUpdateOrder) {
            onUpdateOrder(newOrder);
        }
    };

    const handleOrderFieldChange = (field: keyof Order, value: any) => {
        setLocalOrder(prev => ({ ...prev, [field]: value }));
    };

    const handleSiteManagerChange = (field: keyof typeof localOrder.siteManager, value: string) => {
        setLocalOrder(prev => ({
            ...prev,
            siteManager: { ...prev.siteManager, [field]: value }
        }));
    };

    const handleConfirm = () => {
        if (!task) return;
        const updatedTask = { ...task, status: TaskStatus.CONFIRMED, ackAt: new Date().toISOString(), ackIp: '192.168.1.10', vendorNote: vendorNote };
        setTask(updatedTask);
        setIsSubmitted(true);
        if (onUpdateTask) onUpdateTask(updatedTask);
        showNotification('任務已確認成功！', 'success');
    };

    const handleReportIssue = () => {
        if (!task || !issueText) return;
        const updatedTask = { ...task, status: TaskStatus.ISSUE_REPORTED, issueDetails: issueText, ackAt: null };
        setTask(updatedTask);
        setIsSubmitted(true);
        if (onUpdateTask) onUpdateTask(updatedTask);
        showNotification('異常回報已發送，將盡快聯繫您。', 'error');
    };

    const handleProfileSubmit = () => {
        if (onUpdateProfile && isVendor) {
            const payload = { ...profileForm, submittedAt: new Date().toISOString() };
            onUpdateProfile(assignee.id, payload);
            showNotification('服務資料已提交審核，請等待營運通知。', 'success');
        }
    };

    const handleSendReminder = () => {
        if (!onUpdateTask) return;
        const now = new Date().toISOString();
        const newLog = {
            timestamp: now,
            action: 'Manual Reminder',
            note: 'Reminded manually from Vendor View',
            user: 'Ops'
        };

        const updatedTask: VendorTask = {
            ...task,
            lastRemindedAt: now,
            opsLogs: [newLog, ...task.opsLogs],
            status: task.status === TaskStatus.PENDING ? TaskStatus.NOTIFIED : task.status
        };

        setTask(updatedTask);
        onUpdateTask(updatedTask);
        showNotification('已發送提醒通知 (Reminder Sent)', 'success');
    };

    const getRoleDisplayName = (role: string) => {
        if (role === 'CHEF') return '餐飲服務';
        if (role === 'AV') return '音響工程';
        if (role === 'PLATING') return '擺盤人員';
        if (role === 'CONTROL') return '場控人員';
        return assignee.name;
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-400 bg-slate-50">載入中...</div>;
    if (!localOrder || !assignee) return <div className="h-screen flex items-center justify-center text-red-500">連結無效或資料遺失</div>;

    const isPending = !isSubmitted;
    const canSubmit = checkedUnderstanding && checkedCapability;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">

            {/* HEADER */}
            <div className="bg-white px-5 pt-4 pb-2 sticky top-0 z-30 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><ArrowLeft size={18} /></button>
                        <div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">VENDOR PORTAL</div>
                            <div className="text-lg font-bold text-slate-800 leading-none">{getRoleDisplayName(assignee.role)}</div>
                        </div>
                    </div>

                    {isEditable && (
                        <div className="hidden lg:flex flex-1 mx-4 items-center justify-center gap-4">
                            <span className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors underline decoration-dotted underline-offset-4 cursor-pointer">
                                營運編輯模式：所有內容均可直接修改並即時更新
                            </span>
                        </div>
                    )}

                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${task.status === TaskStatus.CONFIRMED ? 'bg-green-100 text-green-700' : task.status === TaskStatus.ISSUE_REPORTED ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {task.status === TaskStatus.CONFIRMED ? <CheckCircle size={14} /> : task.status === TaskStatus.ISSUE_REPORTED ? <AlertTriangle size={14} /> : <Clock size={14} />}
                        {task.status === TaskStatus.PENDING ? '待確認' : task.status === TaskStatus.CONFIRMED ? '已就緒' : '異常'}
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <div className={`h-1.5 flex-1 rounded-full ${activeTab === 'INFO' || activeTab === 'FLOW' || activeTab === 'SCHEDULE' || activeTab === 'EXECUTE' ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${activeTab === 'FLOW' || activeTab === 'SCHEDULE' || activeTab === 'EXECUTE' ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${activeTab === 'SCHEDULE' || activeTab === 'EXECUTE' ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div className={`h-1.5 flex-1 rounded-full ${activeTab === 'EXECUTE' ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
                    <TabButton label="資訊" active={activeTab === 'INFO'} onClick={() => setActiveTab('INFO')} />
                    <TabButton label="流程" active={activeTab === 'FLOW'} onClick={() => setActiveTab('FLOW')} />
                    <TabButton label="排程" active={activeTab === 'SCHEDULE'} onClick={() => setActiveTab('SCHEDULE')} />
                    {isVendor && <TabButton label="我的服務" active={activeTab === 'PROFILE'} onClick={() => setActiveTab('PROFILE')} />}
                    <TabButton label="執行" active={activeTab === 'EXECUTE'} onClick={() => setActiveTab('EXECUTE')} isPrimary />
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto pb-36 px-5 py-6">

                {/* INFO TAB */}
                {activeTab === 'INFO' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-full mb-3">EVENT</div>

                            {isEditable ? (
                                <div className="mb-6 space-y-3">
                                    <label className="block text-xs font-bold text-slate-400 uppercase">活動名稱</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                                        value={localOrder.eventName}
                                        onChange={e => handleOrderFieldChange('eventName', e.target.value)}
                                        onBlur={commitOrderChanges}
                                        placeholder="請輸入活動名稱"
                                    />
                                    <label className="block text-xs font-bold text-slate-400 uppercase">客戶名稱</label>
                                    <input
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300"
                                        value={localOrder.clientName}
                                        onChange={e => handleOrderFieldChange('clientName', e.target.value)}
                                        onBlur={commitOrderChanges}
                                        placeholder="請輸入客戶名稱"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1 leading-tight">{localOrder.eventName}</h1>
                                    <p className="text-slate-500 text-sm mb-6">{localOrder.clientName}</p>
                                </>
                            )}

                            <div className="space-y-5">
                                <DetailRow icon={<Calendar className="text-indigo-500" />} label="時間 Time"
                                    value={isEditable ? (
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={localOrder.eventDate.slice(0, 16)}
                                            onChange={e => handleOrderFieldChange('eventDate', new Date(e.target.value).toISOString())}
                                            onBlur={commitOrderChanges}
                                        />
                                    ) : new Date(localOrder.eventDate).toLocaleString('zh-TW', { dateStyle: 'full', timeStyle: 'short' })}
                                />

                                <DetailRow icon={<MapPin className="text-rose-500" />} label="地點 Location"
                                    value={isEditable ? (
                                        <input
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={localOrder.location}
                                            onChange={e => handleOrderFieldChange('location', e.target.value)}
                                            onBlur={commitOrderChanges}
                                            placeholder="輸入活動地點"
                                        />
                                    ) : localOrder.location}
                                    action={!isEditable && <a href={localOrder.locationLink || '#'} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center justify-center w-full py-2 gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"><Navigation size={14} /> 開啟導航</a>}
                                />
                                <div className="border-t border-slate-100 my-1"></div>
                                <DetailRow icon={<User className="text-emerald-600" />} label="現場負責人 Contact" value={
                                    isEditable ? (
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 space-y-2">
                                            <input
                                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={localOrder.siteManager.name}
                                                onChange={e => handleSiteManagerChange('name', e.target.value)}
                                                onBlur={commitOrderChanges}
                                                placeholder="姓名"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={localOrder.siteManager.title}
                                                    onChange={e => handleSiteManagerChange('title', e.target.value)}
                                                    onBlur={commitOrderChanges}
                                                    placeholder="職稱"
                                                />
                                                <input
                                                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={localOrder.siteManager.phone}
                                                    onChange={e => handleSiteManagerChange('phone', e.target.value)}
                                                    onBlur={commitOrderChanges}
                                                    placeholder="電話"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                                            <div>
                                                <div className="font-bold text-slate-800">{localOrder.siteManager.name}</div>
                                                <div className="text-xs text-slate-500">{localOrder.siteManager.title}</div>
                                            </div>
                                            <a href={`tel:${localOrder.siteManager.phone}`} className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"><Phone size={18} /></a>
                                        </div>
                                    )
                                } />
                            </div>
                        </div>

                        {/* MENU SECTION */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Utensils size={20} className="text-orange-500" /> 活動菜單 (Menu)
                                </h3>
                            </div>
                            {isEditable ? (
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700"
                                    value={localOrder.menuItems || ''}
                                    onChange={(e) => handleOrderFieldChange('menuItems', e.target.value)}
                                    onBlur={commitOrderChanges}
                                    placeholder="請輸入詳細菜單內容，支援換行..."
                                    rows={6}
                                />
                            ) : (
                                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium p-2">
                                    {localOrder.menuItems || "尚未輸入菜單資訊"}
                                </div>
                            )}
                        </div>

                        {/* EXECUTION TEAM SECTION */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={20} className="text-indigo-500" /> 執行夥伴與團隊</h3>
                                {isEditable && (
                                    <button
                                        onClick={() => {
                                            const newTeam = [...(localOrder.executionTeam || []), { role: '', name: '', phone: '', isNotified: false }];
                                            updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                        }}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold hover:bg-indigo-100 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={12} /> 新增人員
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {(localOrder.executionTeam || []).length > 0 ? (
                                    localOrder.executionTeam?.map((staff, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            {isEditable ? (
                                                <>
                                                    {/* Role */}
                                                    <input
                                                        className="w-full sm:w-28 text-xs font-bold bg-white border border-slate-200 rounded px-2 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
                                                        value={staff.role}
                                                        placeholder="角色 (如: 外燴)"
                                                        onChange={(e) => {
                                                            const newTeam = [...localOrder.executionTeam];
                                                            newTeam[idx] = { ...newTeam[idx], role: e.target.value };
                                                            updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                                        }}
                                                    />
                                                    {/* Name / Select */}
                                                    <div className="flex-1 relative">
                                                        <select
                                                            className="w-full text-xs bg-white border border-slate-200 rounded px-2 py-2 outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                                            value={staff.assigneeId || ''}
                                                            onChange={(e) => {
                                                                const selectedId = e.target.value;
                                                                const selectedOption = availableStaffOptions.find(opt => opt.value === selectedId);
                                                                const newTeam = [...localOrder.executionTeam];
                                                                newTeam[idx] = {
                                                                    ...newTeam[idx],
                                                                    assigneeId: selectedId,
                                                                    name: selectedOption ? selectedOption.label.replace(/^\(.*\)\s/, '') : '',
                                                                    phone: selectedOption ? selectedOption.phone : ''
                                                                };
                                                                updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                                            }}
                                                        >
                                                            {availableStaffOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                            {!staff.assigneeId && staff.name && <option value="" disabled>手動輸入: {staff.name}</option>}
                                                        </select>
                                                        {staff.assigneeId === "" && (
                                                            <input
                                                                className="absolute inset-0 w-full text-xs bg-white border border-slate-200 rounded px-2 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
                                                                value={staff.name}
                                                                placeholder="或輸入自訂姓名..."
                                                                onChange={(e) => {
                                                                    const newTeam = [...localOrder.executionTeam];
                                                                    newTeam[idx] = { ...newTeam[idx], name: e.target.value };
                                                                    updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {/* Phone */}
                                                    <input
                                                        className="w-full sm:w-32 text-xs font-mono bg-white border border-slate-200 rounded px-2 py-2 outline-none"
                                                        value={staff.phone}
                                                        placeholder="電話"
                                                        onChange={(e) => {
                                                            const newTeam = [...localOrder.executionTeam];
                                                            newTeam[idx] = { ...newTeam[idx], phone: e.target.value };
                                                            updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                                        }}
                                                    />
                                                    {/* Notified Checkbox */}
                                                    <label className={`flex items-center gap-1 px-3 py-1.5 rounded cursor-pointer select-none border transition-colors ${staff.isNotified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={staff.isNotified}
                                                            onChange={(e) => {
                                                                const newTeam = [...localOrder.executionTeam];
                                                                newTeam[idx] = { ...newTeam[idx], isNotified: e.target.checked };
                                                                updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                                            }}
                                                        />
                                                        <CheckSquare size={14} className={staff.isNotified ? 'opacity-100' : 'opacity-50'} />
                                                        <span className="text-[10px] font-bold whitespace-nowrap">已通知</span>
                                                    </label>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => {
                                                            const newTeam = localOrder.executionTeam.filter((_, i) => i !== idx);
                                                            updateOrderImmediate({ ...localOrder, executionTeam: newTeam });
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex justify-between items-center w-full">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{staff.role}</span>
                                                        <span className="text-sm font-bold text-slate-800">{staff.name}</span>
                                                        {staff.phone && (
                                                            <a href={`tel:${staff.phone}`} className="text-xs font-mono text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                                                                <Phone size={12} /> {staff.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-xs text-slate-400 py-4 border border-dashed border-slate-200 rounded-xl">
                                        {isEditable ? "尚未指派執行團隊，請點擊新增" : "尚未公開執行團隊名單"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* FLOW TAB (Run-down) */}
                {activeTab === 'FLOW' && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <List className="text-indigo-500" /> 活動流程 (Run-down)
                            </h2>
                            {isEditable && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowFlowTemplateModal(true)}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-bold hover:bg-indigo-100 flex items-center gap-1 border border-indigo-100"
                                    >
                                        <BookTemplate size={14} /> 匯入範本
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newFlow = [...(localOrder.eventFlow || []), { time: '00:00', activity: 'New Item', description: '', highlightFor: [] }];
                                            updateOrderImmediate({ ...localOrder, eventFlow: newFlow });
                                        }}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-bold hover:bg-indigo-100 flex items-center gap-1 border border-indigo-100"
                                    >
                                        <Plus size={14} /> 新增
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-slate-100">
                            {localOrder.eventFlow.map((item, idx) => {
                                const isHighlighted = item.highlightFor?.includes(assignee.role);
                                return (
                                    <div key={idx} className={`relative pl-10 ${isHighlighted ? 'opacity-100' : 'opacity-60 grayscale-[0.5] hover:grayscale-0 hover:opacity-100 transition-all'}`}>
                                        <div className={`absolute left-2 top-0 w-4 h-4 rounded-full border-2 bg-white ${isHighlighted ? 'border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)]' : 'border-slate-300'}`}></div>

                                        {isEditable ? (
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        className="w-16 text-sm font-mono font-bold bg-white border border-slate-200 rounded px-2 py-1"
                                                        value={item.time}
                                                        onChange={(e) => {
                                                            const newFlow = [...localOrder.eventFlow];
                                                            newFlow[idx] = { ...newFlow[idx], time: e.target.value };
                                                            updateOrderImmediate({ ...localOrder, eventFlow: newFlow });
                                                        }}
                                                        onBlur={commitOrderChanges}
                                                    />
                                                    <input
                                                        className="flex-1 text-sm font-bold bg-white border border-slate-200 rounded px-2 py-1"
                                                        value={item.activity}
                                                        onChange={(e) => {
                                                            const newFlow = [...localOrder.eventFlow];
                                                            newFlow[idx] = { ...newFlow[idx], activity: e.target.value };
                                                            updateOrderImmediate({ ...localOrder, eventFlow: newFlow });
                                                        }}
                                                        onBlur={commitOrderChanges}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newFlow = localOrder.eventFlow.filter((_, i) => i !== idx);
                                                            updateOrderImmediate({ ...localOrder, eventFlow: newFlow });
                                                        }}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <input
                                                    className="w-full text-xs text-slate-500 bg-white border border-slate-200 rounded px-2 py-1"
                                                    value={item.description}
                                                    placeholder="詳細描述..."
                                                    onChange={(e) => {
                                                        const newFlow = [...localOrder.eventFlow];
                                                        newFlow[idx] = { ...newFlow[idx], description: e.target.value };
                                                        updateOrderImmediate({ ...localOrder, eventFlow: newFlow });
                                                    }}
                                                    onBlur={commitOrderChanges}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                                                    <span className={`font-mono font-bold text-lg ${isHighlighted ? 'text-indigo-600' : 'text-slate-400'}`}>{item.time}</span>
                                                    <span className="font-bold text-slate-800">{item.activity}</span>
                                                </div>
                                                <p className="text-sm text-slate-500">{item.description}</p>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* FLOW TEMPLATE MODAL */}
                        {showFlowTemplateModal && (
                            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 leading-normal">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><BookTemplate size={18} /> 選擇活動流程範本</h3>
                                        <button onClick={() => setShowFlowTemplateModal(false)}><X className="text-slate-400 hover:text-slate-600" size={20} /></button>
                                    </div>
                                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                                        <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
                                            選擇範本將會<b>替換</b>當前的所有流程項目。
                                        </p>
                                        <div className="space-y-2">
                                            {Object.entries(EVENT_FLOW_TEMPLATES).map(([name, items]) => (
                                                <button
                                                    key={name}
                                                    onClick={() => {
                                                        if (confirm(`確定要匯入「${name}」範本嗎？現有流程將被清除。`)) {
                                                            const newFlow = items.map(t => ({ ...t, highlightFor: [] }));
                                                            updateOrderImmediate({ ...localOrder, eventFlow: newFlow });
                                                            setShowFlowTemplateModal(false);
                                                        }
                                                    }}
                                                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-slate-700 text-sm">{name}</span>
                                                    <span className="text-xs text-slate-400 group-hover:text-indigo-500">{items.length} 項目</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SCHEDULE TAB (Logistics) */}
                {activeTab === 'SCHEDULE' && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Truck className="text-amber-500" /> 後勤排程 (Logistics)
                            </h2>
                            {isEditable && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowTemplateModal(true)}
                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded font-bold hover:bg-indigo-100 flex items-center gap-1 border border-indigo-100"
                                    >
                                        <BookTemplate size={14} /> 匯入範本
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newLogistics = [...(localOrder.logistics || []), { time: '00:00', action: 'New Task' }];
                                            updateOrderImmediate({ ...localOrder, logistics: newLogistics });
                                        }}
                                        className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded font-bold hover:bg-amber-100 flex items-center gap-1 border border-amber-100"
                                    >
                                        <Plus size={14} /> 新增
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(localOrder.logistics || []).length > 0 ? (
                                localOrder.logistics?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                        <div className="p-2 bg-white rounded-full text-amber-500 shadow-sm">
                                            <Box size={16} />
                                        </div>
                                        {isEditable ? (
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    className="w-20 text-sm font-mono font-bold bg-white border border-amber-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500"
                                                    value={item.time}
                                                    onChange={(e) => {
                                                        const newLogistics = [...localOrder.logistics];
                                                        newLogistics[idx] = { ...newLogistics[idx], time: e.target.value };
                                                        updateOrderImmediate({ ...localOrder, logistics: newLogistics });
                                                    }}
                                                    onBlur={commitOrderChanges}
                                                />
                                                <input
                                                    className="flex-1 text-sm font-bold bg-white border border-amber-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500"
                                                    value={item.action}
                                                    onChange={(e) => {
                                                        const newLogistics = [...localOrder.logistics];
                                                        newLogistics[idx] = { ...newLogistics[idx], action: e.target.value };
                                                        updateOrderImmediate({ ...localOrder, logistics: newLogistics });
                                                    }}
                                                    onBlur={commitOrderChanges}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newLogistics = localOrder.logistics.filter((_, i) => i !== idx);
                                                        updateOrderImmediate({ ...localOrder, logistics: newLogistics });
                                                    }}
                                                    className="text-amber-400 hover:text-red-500 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex justify-between items-center">
                                                <span className="font-mono text-lg font-bold text-amber-900">{item.time}</span>
                                                <span className="text-sm font-bold text-slate-700">{item.action}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-xs text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl">
                                    尚無建立後勤排程
                                </div>
                            )}
                        </div>

                        {/* TEMPLATE IMPORT MODAL */}
                        {showTemplateModal && (
                            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 leading-normal">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><BookTemplate size={18} /> 選擇後勤排程範本</h3>
                                        <button onClick={() => setShowTemplateModal(false)}><X className="text-slate-400 hover:text-slate-600" size={20} /></button>
                                    </div>
                                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                                        <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
                                            選擇範本將會<b>替換</b>當前的所有排程任務。
                                        </p>
                                        <div className="space-y-2">
                                            {Object.entries(LOGISTICS_TEMPLATES).map(([name, tasks]) => (
                                                <button
                                                    key={name}
                                                    onClick={() => {
                                                        if (confirm(`確定要匯入「${name}」範本嗎？現有排程將被清除。`)) {
                                                            const newLogistics = tasks.map(t => ({ ...t }));
                                                            updateOrderImmediate({ ...localOrder, logistics: newLogistics });
                                                            setShowTemplateModal(false);
                                                        }
                                                    }}
                                                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex justify-between items-center group"
                                                >
                                                    <span className="font-bold text-slate-700 text-sm">{name}</span>
                                                    <span className="text-xs text-slate-400 group-hover:text-indigo-500">{tasks.length} 任務</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* EXECUTE TAB */}
                {
                    activeTab === 'EXECUTE' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* AI Summary */}
                            <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
                                <h3 className="text-indigo-900 font-bold mb-3 flex items-center gap-2"><Sparkles size={18} /> 您的任務摘要 (AI Generated)</h3>
                                {generatingSummary ? (
                                    <div className="animate-pulse flex space-x-4">
                                        <div className="flex-1 space-y-4 py-1">
                                            <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                                            <div className="h-4 bg-indigo-200 rounded"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-700 leading-relaxed text-sm">{task.aiSummary}</p>
                                )}
                            </div>

                            {/* Checklist */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ClipboardList className="text-emerald-500" /> 執行清單</h3>
                                <div className="space-y-3">
                                    <div className="space-y-3">
                                        {task.requiredActions.map((action, idx) => {
                                            const isCompleted = task.completedActionIndices?.includes(idx);
                                            return (
                                                <label key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                        {isCompleted && <Check size={14} className="text-white" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={!!isCompleted}
                                                        onChange={() => {
                                                            const currentIndices = task.completedActionIndices || [];
                                                            let newIndices;
                                                            if (currentIndices.includes(idx)) {
                                                                newIndices = currentIndices.filter(i => i !== idx);
                                                            } else {
                                                                newIndices = [...currentIndices, idx];
                                                            }

                                                            const updatedTask = { ...task, completedActionIndices: newIndices };
                                                            setTask(updatedTask);
                                                            if (onUpdateTask) onUpdateTask(updatedTask);
                                                        }}
                                                    />
                                                    <span className={`text-sm font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{action}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Confirmation Form */}
                            {!isSubmitted && (
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={checkedUnderstanding} onChange={e => setCheckedUnderstanding(e.target.checked)} />
                                        <span className="text-sm font-bold text-slate-700">我已閱讀並理解所有活動細節</span>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={checkedCapability} onChange={e => setCheckedCapability(e.target.checked)} />
                                        <span className="text-sm font-bold text-slate-700">我確認可以如期執行上述任務</span>
                                    </label>

                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="備註 (選填，例如：需要提前進場...)"
                                        rows={3}
                                        value={vendorNote}
                                        onChange={e => setVendorNote(e.target.value)}
                                    />

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setReportMode(!reportMode)}
                                            className="flex-1 py-3 border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors"
                                        >
                                            {reportMode ? '取消回報' : '回報異常'}
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            disabled={!canSubmit}
                                            className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all transform active:scale-95"
                                        >
                                            確認接案
                                        </button>
                                    </div>

                                    {reportMode && (
                                        <div className="animate-in slide-in-from-top-2 duration-200 pt-2">
                                            <textarea
                                                className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none text-red-900 placeholder:text-red-300"
                                                placeholder="請說明遇到的困難或異常狀況..."
                                                rows={3}
                                                value={issueText}
                                                onChange={e => setIssueText(e.target.value)}
                                            />
                                            <button onClick={handleReportIssue} className="w-full mt-2 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">發送異常報告</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }

                {/* PROFILE TAB */}
                {
                    activeTab === 'PROFILE' && isVendor && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                <div className="text-sm text-amber-800">
                                    <p className="font-bold mb-1">資料更新說明</p>
                                    <p>您在此提交的資料（報價、描述、圖片）將經過營運團隊審核。審核通過後才會更新至正式資料庫。</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">服務描述</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        rows={4}
                                        value={profileForm.description}
                                        onChange={e => setProfileForm({ ...profileForm, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">費用/報價說明 (Cost)</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        rows={2}
                                        value={profileForm.pricingTerms}
                                        onChange={e => setProfileForm({ ...profileForm, pricingTerms: e.target.value })}
                                        placeholder="例如：$800/人, 低消20人..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">服務圖片連結 (URLs)</label>
                                    <div className="space-y-2">
                                        {profileForm.serviceImages.map((img, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                                    value={img}
                                                    onChange={e => {
                                                        const newImages = [...profileForm.serviceImages];
                                                        newImages[i] = e.target.value;
                                                        setProfileForm({ ...profileForm, serviceImages: newImages });
                                                    }}
                                                />
                                                <button onClick={() => setProfileForm(prev => ({ ...prev, serviceImages: prev.serviceImages.filter((_, idx) => idx !== i) }))} className="p-2 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => setProfileForm(prev => ({ ...prev, serviceImages: [...prev.serviceImages, ''] }))} className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-2">
                                            <Plus size={12} /> 新增圖片
                                        </button>
                                    </div>
                                </div>

                                <button onClick={handleProfileSubmit} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                                    提交更新審核
                                </button>
                            </div>
                        </div>
                    )
                }

            </div >

            {/* Toast Notification */}
            {
                toast.show && (
                    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl font-bold text-white transition-all animate-in slide-in-from-bottom-2 ${toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}>
                        {toast.message}
                    </div>
                )
            }
        </div >
    );
};

const TabButton = ({ label, active, onClick, isPrimary }: { label: string, active: boolean, onClick: () => void, isPrimary?: boolean }) => (
    <button
        onClick={onClick}
        className={`flex-1 min-w-[80px] py-2 text-sm font-bold rounded-lg transition-all ${active
            ? (isPrimary ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-800 shadow-sm')
            : 'text-slate-500 hover:bg-slate-200 hover:text-slate-600'
            }`}
    >
        {label}
    </button>
);

const DetailRow = ({ icon, label, value, action }: { icon: React.ReactNode, label: string, value: React.ReactNode, action?: React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
            {React.cloneElement(icon as React.ReactElement, { size: 16 })}
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-sm font-medium text-slate-800 break-words">{value}</div>
            {action && <div className="mt-2">{action}</div>}
        </div>
    </div>
);

export default VendorConfirmation;
