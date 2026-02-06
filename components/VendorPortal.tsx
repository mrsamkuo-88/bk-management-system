import React, { useEffect, useState } from 'react';
import { Vendor, PartTimer, VendorTask, Order, TaskStatus } from '../types';
import { api } from '../services/api';
import { Calendar, Clock, MapPin, ChevronRight, LogOut, Loader, AlertTriangle, CheckCircle, Bell, User } from 'lucide-react';

interface VendorPortalProps {
    currentUser: Vendor | PartTimer;
    userType: 'VENDOR' | 'PART_TIMER';
    onLogout: () => void;
    onSelectTask: (taskId: string) => void;
}

const VendorPortal: React.FC<VendorPortalProps> = ({ currentUser, userType, onLogout, onSelectTask }) => {
    const [myTasks, setMyTasks] = useState<VendorTask[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get My Tasks using the filtered API
                const tasks = await api.getTasks({ vendorId: currentUser.id });
                setMyTasks(tasks.filter(t => !t.isArchived));

                // 2. Get Related Orders (We need order details like Event Name/Date)
                // In a real optimized API, we might include order data in the task query (join), 
                // but for now we fetch all orders and filter locally or fetch specific. 
                // Let's fetch all for simplicity as per current architecture.
                const allOrders = await api.getOrders();
                setOrders(allOrders);

            } catch (error) {
                console.error("Failed to load portal data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser.id]);

    const getOrder = (orderId: string) => orders.find(o => o.id === orderId);

    const getStatusBadge = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.CONFIRMED:
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> 已確認</span>;
            case TaskStatus.WARNING:
                return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> 請盡快確認</span>;
            case TaskStatus.EMERGENCY:
                return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> 緊急未確認</span>;
            case TaskStatus.ISSUE_REPORTED:
                return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={12} /> 已回報異常</span>;
            case TaskStatus.PENDING:
            case TaskStatus.NOTIFIED:
            default:
                return <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Bell size={12} /> 待確認</span>;
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader className="animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {currentUser.name.substring(0, 1)}
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{currentUser.name}</h1>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                {userType === 'VENDOR' ? '合作廠商' : '兼職人員'} • {currentUser.phone}
                            </div>
                        </div>
                    </div>
                    <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={24} />
                    我的任務 ({myTasks.length})
                </h2>

                <div className="space-y-4">
                    {myTasks.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="text-slate-400" size={32} />
                            </div>
                            <h3 className="text-slate-600 font-bold mb-1">目前沒有任務</h3>
                            <p className="text-slate-400 text-sm">當有新任務指派給您時，會顯示在這裡。</p>
                        </div>
                    ) : (
                        myTasks.map(task => {
                            const order = getOrder(task.orderId);
                            if (!order) return null; // Should not happen

                            const isUrgent = new Date(order.eventDate).getTime() - Date.now() < 86400000 * 2; // < 2 days

                            return (
                                <button
                                    key={task.id}
                                    onClick={() => onSelectTask(task.id)}
                                    className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all text-left group relative overflow-hidden"
                                >
                                    {isUrgent && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full -mr-8 -mt-8"></div>}

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded mb-2 inline-block">
                                            {new Date(order.eventDate).toLocaleDateString()}
                                        </div>
                                        {getStatusBadge(task.status)}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {order.eventName}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} className="text-slate-400" />
                                            {order.eventStartTime && order.eventEndTime ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500">活動時間</span>
                                                    <span className="font-bold text-slate-700 font-mono">
                                                        {order.eventStartTime} ~ {order.eventEndTime}
                                                    </span>
                                                </div>
                                            ) : (
                                                new Date(order.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-slate-400" />
                                            {order.location.split(' ')[0]} {/* Show partial location */}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                        <div className="text-xs text-slate-400">
                                            任務 ID: {task.id.substring(0, 8)}...
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                            查看詳情 <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default VendorPortal;
