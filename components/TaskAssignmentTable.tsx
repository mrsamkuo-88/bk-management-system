
import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    CreditCard,
    Utensils,
    Home,
    Share,
    ExternalLink,
    Archive,
    User,
    Clock,
    CheckCircle,
    AlertTriangle,
    Activity,
    Send,
    Edit2,
    Sparkles,
    Filter,
    Trash2
} from 'lucide-react';
import { VendorTask, Order, Vendor, TaskStatus, VendorRole, PartTimer, PartTimeRole } from '../types';

interface TaskAssignmentTableProps {
    tasks: VendorTask[];
    orders: Order[];
    vendors: Vendor[];
    partTimers: PartTimer[]; // New Prop
    onUpdateTask: (task: VendorTask) => void;
    onUpdateOrder: (order: Order) => void;
    onNavigateToVendor: (taskId: string) => void;
    onArchiveTask: (taskId: string, archive: boolean) => void;
    onDeleteOrder?: (orderId: string) => void;
    setSelectedTaskId: (id: string | null) => void;
    onPublishTask: (taskId: string, e?: React.MouseEvent) => void;
}

// --- CONSTANTS ---
const PAYMENT_OPTIONS = ['未付訂', '已付訂', '已付清', '其他'];
const CATEGORY_OPTIONS = ['西式餐盒', 'Buffet內用', 'Buffet外燴', '點心內用', '點心外燴', '私廚', '客製化餐飲', '無餐飲'];
const SPACE_OPTIONS = ['共享大廳', 'VIP包廂', '派對窩', '街吧', '玻璃屋', '共享廚房'];

const STATUS_OPTIONS: { value: TaskStatus, label: string }[] = [
    { value: TaskStatus.PENDING, label: '草稿 (Pending)' },
    { value: TaskStatus.NOTIFIED, label: '已通知 (Notified)' },
    { value: TaskStatus.CONFIRMED, label: '已確認 (Confirmed)' },
    { value: TaskStatus.WARNING, label: '警告 (Warning)' },
    { value: TaskStatus.EMERGENCY, label: '緊急 (Emergency)' },
    { value: TaskStatus.ISSUE_REPORTED, label: '異常回報 (Issue)' },
];

// --- HELPERS ---
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

const TaskAssignmentTable: React.FC<TaskAssignmentTableProps> = ({
    tasks,
    orders,
    vendors,
    partTimers,
    onUpdateTask,
    onUpdateOrder,
    onNavigateToVendor,
    onArchiveTask,
    onDeleteOrder,
    setSelectedTaskId,
    onPublishTask
}) => {
    const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

    const updateOrderField = (orderId: string, field: keyof Order, value: any) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            onUpdateOrder({ ...order, [field]: value });
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (paymentFilter === 'ALL') return true;
        const order = orders.find(o => o.id === task.orderId);
        return order?.paymentStatus === paymentFilter;
    });

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Sparkles size={24} className="text-slate-300" /></div>
                <p className="text-slate-400 text-sm font-medium">目前沒有活躍任務，請點擊上方指派按鈕。</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Filter Toolbar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Filter size={14} /> 付款狀態篩選
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPaymentFilter('ALL')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${paymentFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        全部
                    </button>
                    {PAYMENT_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            onClick={() => setPaymentFilter(opt)}
                            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${paymentFilter === opt ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-4 rounded-tl-2xl">狀態 (可編輯)</th>
                            <th className="px-4 py-4 min-w-[140px]">活動/客戶 (可編輯)</th>
                            <th className="px-4 py-4">距離活動</th>
                            <th className="px-4 py-4">付款狀態</th>
                            <th className="px-4 py-4 min-w-[140px]">餐飲/空間</th>
                            <th className="px-4 py-4">廠商/人員</th>
                            <th className="px-4 py-4">摘要</th>
                            <th className="px-4 py-4 text-right rounded-tr-2xl">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTasks.length > 0 ? filteredTasks.map(task => {
                            const order = orders.find(o => o.id === task.orderId);
                            const vendor = vendors.find(v => v.id === task.vendorId);
                            const pt = partTimers.find(p => p.id === task.vendorId); // Look up in PT list if not in vendors
                            const assignee = vendor || pt;

                            if (!order || !assignee) return null;
                            return (
                                <tr key={task.id} onClick={() => setSelectedTaskId(task.id)} className="group hover:bg-slate-50/80 transition-colors cursor-pointer">
                                    <td className="px-4 py-4 align-top" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <StatusSelect
                                                status={task.status}
                                                onChange={(newStatus) => onUpdateTask({ ...task, status: newStatus })}
                                            />
                                        </div>
                                    </td>

                                    {/* Event & Client Column */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="font-bold text-slate-800 text-sm mb-1">{order.eventName}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                            <div className="relative group/date" onClick={e => e.stopPropagation()}>
                                                <CalendarIcon size={12} className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none pl-4 py-0.5 text-xs text-slate-500 font-medium transition-colors w-[110px]"
                                                    value={(() => {
                                                        try {
                                                            if (!order.eventDate) return '';
                                                            return new Date(order.eventDate).toISOString().split('T')[0];
                                                        } catch (e) {
                                                            return '';
                                                        }
                                                    })()}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (!val) return;
                                                        try {
                                                            const isoDate = new Date(val).toISOString();
                                                            updateOrderField(order.id, 'eventDate', isoDate);
                                                        } catch (err) {
                                                            console.error("Invalid date selected", val);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {/* Editable Client Name */}
                                        <div onClick={e => e.stopPropagation()} className="relative">
                                            <User size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                                value={order.clientName}
                                                onChange={(e) => updateOrderField(order.id, 'clientName', e.target.value)}
                                                placeholder="輸入客戶名稱"
                                            />
                                        </div>
                                    </td>

                                    {/* Days Until Column */}
                                    <td className="px-4 py-4 align-top">
                                        {(() => {
                                            const days = calculateDaysUntil(order.eventDate);
                                            let colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                                            let text = `${days} 天`;

                                            if (days <= 0) {
                                                colorClass = "bg-red-50 text-red-700 border border-red-200 font-bold";
                                                text = days === 0 ? "今天" : `已過 ${Math.abs(days)} 天`;
                                            } else if (days <= 3) {
                                                colorClass = "bg-orange-50 text-orange-700 border border-orange-200 font-bold";
                                                text = `${days} 天`;
                                            }

                                            return (
                                                <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs ${colorClass}`}>
                                                    {text}
                                                </div>
                                            );
                                        })()}
                                    </td>

                                    {/* Payment Status Column */}
                                    <td className="px-4 py-4 align-top" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <CreditCard size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                            <select
                                                className={`w-full pl-6 pr-2 py-1.5 rounded text-xs font-bold outline-none border cursor-pointer appearance-none ${order.paymentStatus === '已付清' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    order.paymentStatus === '已付訂' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-slate-50 text-slate-600 border-slate-200'
                                                    }`}
                                                value={order.paymentStatus || '未付訂'}
                                                onChange={(e) => updateOrderField(order.id, 'paymentStatus', e.target.value)}
                                            >
                                                {PAYMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </td>

                                    {/* Category & Space Column */}
                                    <td className="px-4 py-4 align-top space-y-2" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <Utensils size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                            <select
                                                className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                                                value={order.cateringCategory || '無餐飲'}
                                                onChange={(e) => updateOrderField(order.id, 'cateringCategory', e.target.value)}
                                            >
                                                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <Home size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                            <select
                                                className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                                                value={order.space || '共享大廳'}
                                                onChange={(e) => updateOrderField(order.id, 'space', e.target.value)}
                                            >
                                                {SPACE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    </td>

                                    {/* Vendor Column */}
                                    <td className="px-4 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${pt ? 'bg-amber-200 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {assignee.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-900">{assignee.name}</div>
                                                <div className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 inline-block mt-0.5">{getRoleName(assignee.role)}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Summary Column */}
                                    <td className="px-4 py-4 max-w-xs align-top">
                                        <div className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                            {task.issueDetails ? <span className="text-red-600 font-bold bg-red-50 px-1 rounded">異常：{task.issueDetails}</span> : task.aiSummary}
                                        </div>
                                    </td>

                                    {/* Actions Column */}
                                    <td className="px-4 py-4 text-right align-top">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {task.status === TaskStatus.PENDING ? (
                                                <button onClick={(e) => onPublishTask(task.id, e)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="發送通知"><Share size={16} /></button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); onNavigateToVendor(task.id); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors" title="開啟連結"><ExternalLink size={16} /></button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); onArchiveTask(task.id, true); }} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:text-slate-600 transition-colors" title="封存"><Archive size={16} /></button>

                                            {/* Delete Event Button */}
                                            {onDeleteOrder && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('警告：確定要刪除整個活動 (Event) 嗎？\n此操作將一併刪除該活動的所有任務，且無法復原。')) {
                                                            onDeleteOrder(order.id);
                                                        }
                                                    }}
                                                    className="p-2 bg-red-50 text-red-300 rounded-lg hover:bg-red-100 hover:text-red-500 transition-colors"
                                                    title="刪除整個活動"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={8} className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Filter size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm font-medium">沒有符合「{paymentFilter}」的任務</p>
                                        <button onClick={() => setPaymentFilter('ALL')} className="mt-2 text-xs text-indigo-600 font-bold hover:underline">清除篩選</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatusSelect = ({ status, onChange }: { status: TaskStatus, onChange: (s: TaskStatus) => void }) => {
    let style = "bg-slate-100 text-slate-600 border-slate-200";
    if (status === TaskStatus.CONFIRMED) style = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (status === TaskStatus.ISSUE_REPORTED) style = "bg-rose-50 text-rose-700 border-rose-200";
    else if (status === TaskStatus.EMERGENCY) style = "bg-red-500 text-white border-red-600";
    else if (status === TaskStatus.PENDING) style = "bg-indigo-50 text-indigo-700 border-indigo-200";
    else if (status === TaskStatus.NOTIFIED) style = "bg-blue-50 text-blue-700 border-blue-200";

    return (
        <select
            value={status}
            onChange={(e) => onChange(e.target.value as TaskStatus)}
            className={`w-full appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border outline-none cursor-pointer ${style}`}
        >
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value} className="bg-white text-slate-800">{opt.label}</option>)}
        </select>
    );
};

export default TaskAssignmentTable;
