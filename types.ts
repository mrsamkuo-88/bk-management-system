
export enum VendorRole {
  CHEF = 'CHEF',             // 1. 餐飲廠商
  DECOR = 'DECOR',           // 2. 佈置廠商
  PROFESSIONAL = 'PROFESSIONAL', // 3. 專業服務 (主持, 表演, 攝影等)
  EQUIPMENT = 'EQUIPMENT'    // 4. 設備廠商 (音響, 燈光, 租賃)
}

export enum PartTimeRole {
  CONTROL = 'CONTROL',       // 1. 活動場控
  EXECUTION = 'EXECUTION',   // 2. 活動執行
  OPERATIONS = 'OPERATIONS', // 3. 營運兼職 (原擺盤、服務生)
  OTHER = 'OTHER'            // 4. 其他兼職
}

// --- NEW: Permission Roles ---
export enum UserRole {
  ADMIN = 'ADMIN',       // 最高權限：可備份還原、管理所有
  OPERATOR = 'OPERATOR',  // 內部操作：可管理訂單任務、不可備份還原
  VENDOR = 'VENDOR',      // 外部廠商：僅查看自己任務
  PART_TIMER = 'PART_TIMER' // 兼職人員：僅查看自己任務
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar?: string;
}

export type SalaryType = 'HOURLY' | 'SESSION';

export enum TaskStatus {
  PENDING = 'PENDING',       // Just created
  NOTIFIED = 'NOTIFIED',     // Sent to vendor (T-3, T-2)
  CONFIRMED = 'CONFIRMED',   // Vendor clicked link
  WARNING = 'WARNING',       // T-1 and not confirmed
  EMERGENCY = 'EMERGENCY',   // <24h and not confirmed (Kill Switch)
  ISSUE_REPORTED = 'ISSUE_REPORTED', // Vendor reported a problem
  CHANGED = 'CHANGED'        // Order changed recently
}

// New Interface for Pending Updates
export interface VendorProfileUpdate {
  pricingTerms: string; // Vendor's proposed cost
  description: string;
  serviceImages: string[];
  submittedAt: string;
  lastModifiedFields?: string[]; // Array of field names that were modified
}

export interface Vendor {
  id: string;
  name: string;
  role: string; // Changed from VendorRole to string to support custom types
  phone: string;
  email: string;
  reliabilityScore: number; // 0-100 based on past ack times

  // Commercial Terms (Approved Version)
  collaborationMode?: string; // e.g., "長期配合", "單次", "獨家"
  profitSharing?: string;     // e.g., "10%", "固定費"

  // --- PRICING SPLIT ---
  pricingTerms?: string;      // VENDOR COST (Internal use only): e.g., "Cost $800/head"
  clientPricingTerms?: string;// CLIENT PRICE (Public shareable): e.g., "Price $1000/head"

  // Profile Content (Approved Version)
  description?: string;       // Public description of services
  serviceImages?: string[];   // Array of image URLs

  // Pending Changes
  pendingUpdate?: VendorProfileUpdate; // If present, means an update is waiting for Ops approval

  // Tracking
  lastModifiedFields?: string[]; // Fields modified in the last approved update (for UI badges)
}

export interface PartTimer {
  id: string;
  name: string;
  role: PartTimeRole;
  phone: string;
  salaryType: SalaryType; // New: determines how the rate is applied
  rate: number;           // New: generic rate value
  skills?: string;        // e.g. "Basic English", "Heavy Lifting"
}

export interface EventFlowItem {
  time: string;
  activity: string;
  description: string;
  highlightFor?: string[]; // Changed to string array
}

export interface SiteManager {
  name: string;
  phone: string;
  title: string;
}

// New: Execution Staff for Order Management
export interface ExecutionStaff {
  role: string;       // e.g. "擺盤人員", "司機", "主持人"
  name: string;       // The assigned person's name
  phone: string;      // Auto-filled but editable
  isNotified: boolean; // Ops check
  assigneeId?: string; // Link to Vendor or PT ID if applicable
}

export type PaymentStatus = '未付訂' | '已付訂' | '已付清' | '其他';
export type CateringCategory = '西式餐盒' | 'Buffet內用' | 'Buffet外燴' | '點心內用' | '點心外燴' | '私廚' | '客製化餐飲' | '無餐飲';
export type Space = '共享大廳' | 'VIP包廂' | '派對窩' | '街吧' | '玻璃屋' | '共享廚房';

// New Financial Interface
export interface OrderFinancials {
  budgetPerHead: number; // 餐標
  shippingFee: number;   // 運費
  serviceFee: number;    // 精緻型服務費 (可手動或10%)
  adjustments: number;   // 廠商加值/其他調整
  deposit: number;       // 訂金
  depositDate?: string;  // 訂金支付日
  finalPayment?: number; // 尾款 (通常自動計算)
  taxRate: number;       // e.g., 0.05
  isInvoiceRequired: boolean; // 是否需要發票
  hasServiceCharge: boolean;  // 是否收 10% 服務費
}

export interface LogisticsTime {
  time: string;
  action: string; // '擺盤完成', '收餐', '出餐', etc.
}

export interface Order {
  id: string;
  clientName: string;
  eventName: string;
  eventDate: string; // ISO Date string (Date part)
  eventStartTime?: string; // e.g. "18:00"
  eventEndTime?: string;   // e.g. "21:30"
  guestCount: number;
  location: string;
  locationLink?: string; // Google Maps Link
  siteManager: SiteManager; // The "Who" internal contact
  specialRequests: string;
  eventFlow: EventFlowItem[]; // The Run of Show
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  // Basic Fields
  paymentStatus?: PaymentStatus;
  cateringCategory?: CateringCategory;
  space?: Space;
  taxId?: string; // 統編

  // Extended Details
  financials: OrderFinancials;
  menuItems?: string; // Text block for menu
  logistics: LogisticsTime[]; // Changed to array for dynamic addition
  executionTeam: ExecutionStaff[]; // New: The team list
  updatedAt?: string; // New: Track last update time
  latestChangeSummary?: string; // New: Text summary of changes
  executionNote?: string; // New: Notes for execution team
}

export interface OpsLogEntry {
  timestamp: string;
  action: string; // e.g., "Called Vendor", "Resolved Issue"
  note: string;
  user: string; // Ops User Name
}

export interface VendorTask {
  id: string;
  orderId: string;
  vendorId: string; // Can be Vendor ID OR PartTimer ID
  status: TaskStatus;
  sentAt: string | null;
  ackAt: string | null;
  ackIp: string | null;
  aiSummary: string; // Generated by Gemini
  requiredActions: string[]; // Specific checklist items (The "What")
  completedActionIndices?: number[]; // Indices of checked items
  lastRemindedAt: string | null;
  token: string; // The "hash" for the link

  // New fields for interaction
  vendorNote?: string; // Note left by vendor upon confirmation
  issueDetails?: string; // If status is ISSUE_REPORTED
  opsLogs: OpsLogEntry[]; // History of ops actions

  // Archive Management
  isArchived?: boolean;
}

export interface DashboardStats {
  totalActive: number;
  pendingConfirmation: number;
  emergencyCount: number;
  avgResponseTimeHours: number;
}
