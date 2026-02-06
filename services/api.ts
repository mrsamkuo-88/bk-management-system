import { supabase } from './supabase';
import { Order, VendorTask, Vendor, PartTimer, User } from '../types';

// Helper to map DB Order to Type Order
const mapOrder = (row: any): Order => ({
    id: row.id,
    clientName: row.client_name,
    eventName: row.event_name,
    eventDate: row.event_date,
    guestCount: row.guest_count,
    location: row.location,
    locationLink: row.location_link,
    siteManager: row.site_manager,
    specialRequests: row.special_requests,
    eventFlow: row.event_flow,
    status: row.status,
    paymentStatus: row.payment_status,
    cateringCategory: row.catering_category,
    space: row.space,
    taxId: row.tax_id,
    financials: row.financials,
    menuItems: row.menu_items,
    logistics: row.logistics,
    executionTeam: row.execution_team
});

// Helper to map DB Vendor to Type Vendor
const mapVendor = (row: any): Vendor => ({
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    email: row.email,
    reliabilityScore: row.reliability_score,
    collaborationMode: row.collaboration_mode,
    profitSharing: row.profit_sharing,
    pricingTerms: row.pricing_terms,
    clientPricingTerms: row.client_pricing_terms,
    description: row.description,
    serviceImages: row.service_images,
    pendingUpdate: row.pending_update,
    lastModifiedFields: row.last_modified_fields
});

// Helper to map DB PartTimer to Type PartTimer
const mapPartTimer = (row: any): PartTimer => ({
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    salaryType: row.salary_type,
    rate: row.rate,
    skills: row.skills
});

// Helper to map DB Task to Type Task
const mapTask = (row: any): VendorTask => ({
    id: row.id,
    orderId: row.order_id,
    vendorId: row.vendor_id,
    status: row.status,
    sentAt: row.sent_at,
    ackAt: row.ack_at,
    ackIp: row.ack_ip,
    aiSummary: row.ai_summary,
    requiredActions: row.required_actions,
    completedActionIndices: row.completed_action_indices || [],
    lastRemindedAt: row.last_reminded_at,
    token: row.token,
    vendorNote: row.vendor_note,
    issueDetails: row.issue_details,
    opsLogs: row.ops_logs,
    isArchived: row.is_archived
});

export const api = {
    // --- Auth & Profile ---
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    getUserByEmail: async (email: string): Promise<{ type: 'VENDOR' | 'PART_TIMER' | 'ADMIN', data?: any }> => {
        // 1. Check Vendor
        const { data: vendor } = await supabase.from('vendors').select('*').eq('email', email).single();
        if (vendor) return { type: 'VENDOR', data: mapVendor(vendor) };

        // 2. Check PartTimer
        const { data: pt } = await supabase.from('part_timers').select('*').eq('email', email).single();
        if (pt) return { type: 'PART_TIMER', data: mapPartTimer(pt) };

        // 3. Default to Admin if authenticated but not in vendor/pt tables
        // (Assuming only trusted users exist in Supabase Auth)
        return { type: 'ADMIN' };
    },

    // --- Tasks ---
    getTasks: async (filter?: { vendorId?: string }): Promise<VendorTask[]> => {
        let query = supabase
            .from('vendor_tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (filter?.vendorId) {
            query = query.eq('vendor_id', filter.vendorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
        return (data || []).map(mapTask);
    },

    updateTask: async (task: VendorTask) => {
        const { error } = await supabase
            .from('vendor_tasks')
            .update({
                status: task.status,
                vendor_note: task.vendorNote,
                issue_details: task.issueDetails,
                ops_logs: task.opsLogs,
                is_archived: task.isArchived,
                ack_at: task.ackAt,
                ack_ip: task.ackIp,
                completed_action_indices: task.completedActionIndices
            })
            .eq('id', task.id);

        if (error) throw error;
    },

    createTask: async (task: VendorTask) => {
        // Note: We need to map camel back to snake for insert
        const dbTask = {
            id: task.id,
            order_id: task.orderId,
            vendor_id: task.vendorId,
            status: task.status,
            sent_at: task.sentAt,
            ack_at: task.ackAt,
            ack_ip: task.ackIp,
            ai_summary: task.aiSummary,
            required_actions: task.requiredActions,
            completed_action_indices: task.completedActionIndices || [],
            last_reminded_at: task.lastRemindedAt,
            token: task.token,
            vendor_note: task.vendorNote,
            issue_details: task.issueDetails,
            ops_logs: task.opsLogs,
            is_archived: task.isArchived
        };

        const { error } = await supabase
            .from('vendor_tasks')
            .insert(dbTask);

        if (error) throw error;
    },

    // --- Orders ---
    getOrders: async (): Promise<Order[]> => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('event_date', { ascending: true });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
        return (data || []).map(mapOrder);
    },

    createOrder: async (order: Order) => {
        const dbOrder = {
            id: order.id,
            client_name: order.clientName,
            event_name: order.eventName,
            event_date: order.eventDate,
            guest_count: order.guestCount,
            location: order.location,
            location_link: order.locationLink,
            site_manager: order.siteManager,
            special_requests: order.specialRequests,
            event_flow: order.eventFlow,
            status: order.status,
            payment_status: order.paymentStatus,
            catering_category: order.cateringCategory,
            space: order.space,
            tax_id: order.taxId,
            financials: order.financials,
            menu_items: order.menuItems,
            logistics: order.logistics,
            execution_team: order.executionTeam
        };
        const { error } = await supabase.from('orders').insert(dbOrder);
        if (error) throw error;
    },

    updateOrder: async (order: Order) => {
        // similar to create, but update
        const dbOrder = {
            client_name: order.clientName,
            event_name: order.eventName,
            event_date: order.eventDate,
            guest_count: order.guestCount,
            location: order.location,
            location_link: order.locationLink,
            site_manager: order.siteManager,
            special_requests: order.specialRequests,
            event_flow: order.eventFlow,
            status: order.status,
            payment_status: order.paymentStatus,
            catering_category: order.cateringCategory,
            space: order.space,
            tax_id: order.taxId,
            financials: order.financials,
            menu_items: order.menuItems,
            logistics: order.logistics,
            execution_team: order.executionTeam
        };
        const { error } = await supabase.from('orders').update(dbOrder).eq('id', order.id);
        if (error) throw error;
    },

    // --- Vendors ---
    getVendors: async (): Promise<Vendor[]> => {
        const { data, error } = await supabase
            .from('vendors')
            .select('*');

        if (error) {
            console.error('Error fetching vendors:', error);
            return [];
        }
        return (data || []).map(mapVendor);
    },

    updateVendor: async (vendor: Vendor) => {
        const { error } = await supabase
            .from('vendors')
            .update({
                pricing_terms: vendor.pricingTerms,
                description: vendor.description,
                service_images: vendor.serviceImages,
                pending_update: vendor.pendingUpdate || null
            })
            .eq('id', vendor.id);

        if (error) throw error;
    },

    createVendor: async (vendor: Vendor) => {
        const dbVendor = {
            id: vendor.id,
            name: vendor.name,
            role: vendor.role,
            phone: vendor.phone,
            email: vendor.email,
            reliability_score: vendor.reliabilityScore,
            collaboration_mode: vendor.collaborationMode,
            profit_sharing: vendor.profitSharing,
            pricing_terms: vendor.pricingTerms,
            client_pricing_terms: vendor.clientPricingTerms,
            description: vendor.description,
            service_images: vendor.serviceImages,
            pending_update: vendor.pendingUpdate,
            last_modified_fields: vendor.lastModifiedFields
        };
        const { error } = await supabase.from('vendors').insert(dbVendor);
        if (error) throw error;
    },

    // --- Part Timers ---
    getPartTimers: async (): Promise<PartTimer[]> => {
        const { data, error } = await supabase
            .from('part_timers')
            .select('*');

        if (error) {
            console.error('Error fetching part timers:', error);
            return [];
        }
        return (data || []).map(mapPartTimer);
    },

    createPartTimer: async (pt: PartTimer) => {
        const dbPT = {
            id: pt.id,
            name: pt.name,
            role: pt.role,
            phone: pt.phone,
            salary_type: pt.salaryType,
            rate: pt.rate,
            skills: pt.skills
        };
        const { error } = await supabase.from('part_timers').insert(dbPT);
        if (error) throw error;
    },

    deletePartTimer: async (ptId: string) => {
        const { error } = await supabase.from('part_timers').delete().eq('id', ptId);
        if (error) throw error;
    },

    deleteVendor: async (vendorId: string) => {
        const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
        if (error) throw error;
    },

    deleteTask: async (taskId: string) => {
        const { error } = await supabase.from('vendor_tasks').delete().eq('id', taskId);
        if (error) throw error;
    },

    deleteOrder: async (orderId: string) => {
        // Note: Assuming Supabase has Cascade Delete on tasks.order_id
        // If not, we should delete tasks first. For safety, let's delete tasks first.
        const { error: taskError } = await supabase.from('vendor_tasks').delete().eq('order_id', orderId);
        if (taskError) throw taskError;

        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) throw error;
    }
};
