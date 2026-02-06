
import { Order, Vendor, VendorTask, VendorRole, TaskStatus, PartTimer, PartTimeRole } from '../types';

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: '美食兄弟外燴',
    role: VendorRole.CHEF,
    phone: '0912-345-678',
    email: 'chef@gourmet.com',
    reliabilityScore: 92,
    collaborationMode: '長期合約',
    profitSharing: '15% 分潤',
    pricingTerms: 'Buffet: $800/人 (低消50人)\nSet Menu: $1200/人',
    clientPricingTerms: '精緻歐式自助餐: $1,080/人 (起)\n主廚特製套餐: $1,680/人',
    description: '專注於歐陸料理的外燴團隊，擁有超過 10 年的高端宴會經驗。食材皆選用當季新鮮農產品。',
    serviceImages: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=400'
    ]
  },
  {
    id: 'v2',
    name: '星光場地佈置',
    role: VendorRole.DECOR,
    phone: '0922-333-444',
    email: 'design@star.com',
    reliabilityScore: 85,
    collaborationMode: '單次專案',
    profitSharing: '無 (實報實銷)',
    pricingTerms: '基礎花藝: $15,000 起\n背板輸出: $8,000',
    clientPricingTerms: '婚禮氛圍花藝組: $22,000 起\n客製化主題背板: $12,000',
    description: '打造夢幻場景的專家，擅長花藝設計與燈光氛圍營造。',
    serviceImages: [
      'https://images.unsplash.com/photo-1519225421980-715cb0202128?auto=format&fit=crop&q=80&w=400'
    ]
  },
  {
    id: 'v3',
    name: '魔術師邁克',
    role: VendorRole.PROFESSIONAL,
    phone: '0933-555-666',
    email: 'mike@magic.com',
    reliabilityScore: 60,
    collaborationMode: '經紀約',
    profitSharing: '20% 經紀費',
    pricingTerms: '近距離魔術: $8,000/hr\n舞台表演: $15,000/30mins',
    clientPricingTerms: '互動近距離魔術秀: $12,000/hr\n豪華舞台魔術 (含道具): $25,000/場',
    description: '互動式近距離魔術，曾在拉斯維加斯進修，擅長與賓客互動創造驚喜。',
    serviceImages: []
  },
  {
    id: 'v4',
    name: '專業音響工程',
    role: VendorRole.EQUIPMENT,
    phone: '0944-777-888',
    email: 'tech@soundpro.com',
    reliabilityScore: 98,
    collaborationMode: '年度配合',
    profitSharing: '月結 (無分潤)',
    pricingTerms: '標準音響組: $12,000/場\n燈光特效組: $8,000/場',
    clientPricingTerms: '商務會議音響方案: $15,000/場\n晚宴燈光音響全套: $28,000/場',
    description: '提供演唱會等級的音響設備與專業控台人員。',
    serviceImages: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400'
    ]
  },
];

export const MOCK_PART_TIMERS: PartTimer[] = [
  {
    id: 'pt-1',
    name: '張小明',
    role: PartTimeRole.OPERATIONS,
    phone: '0988-111-222',
    salaryType: 'HOURLY',
    rate: 200,
    skills: '細心、有西餐經驗'
  },
  {
    id: 'pt-2',
    name: '李大華',
    role: PartTimeRole.CONTROL,
    phone: '0988-333-444',
    salaryType: 'SESSION',
    rate: 2500,
    skills: '反應快、有駕照'
  },
  {
    id: 'pt-3',
    name: '王小美',
    role: PartTimeRole.EXECUTION,
    phone: '0988-555-666',
    salaryType: 'HOURLY',
    rate: 220,
    skills: '親切、英文流利'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-101',
    clientName: '科技股份有限公司',
    eventName: '年度慶祝晚宴',
    eventDate: new Date(Date.now() + 86400000 * 2).toISOString(), // T+2
    eventStartTime: '18:00',
    eventEndTime: '21:30',
    guestCount: 20, // Adjusted to match prompt example roughly
    location: '君悅酒店 3F 凱悅廳',
    locationLink: 'https://maps.google.com/?q=Grand+Hyatt+Taipei',
    siteManager: { name: '陳小美', phone: '0900-111-222', title: '活動總召' },
    specialRequests: 'CEO 對花生嚴重過敏。頒獎典禮需要戲劇性的燈光效果。',
    eventFlow: [
      { time: '16:00', activity: '廠商進場', description: '所有廠商進場設置，音響測試', highlightFor: [VendorRole.EQUIPMENT, VendorRole.DECOR, PartTimeRole.CONTROL] },
      { time: '18:00', activity: '迎賓雞尾酒', description: '提供 finger food 與無酒精飲料', highlightFor: [VendorRole.CHEF] },
      { time: '18:30', activity: '晚宴開始', description: '主持人開場，燈光全暗轉聚光燈', highlightFor: [VendorRole.PROFESSIONAL, VendorRole.EQUIPMENT] },
      { time: '19:00', activity: '主菜上桌', description: '牛排與海鮮拼盤', highlightFor: [VendorRole.CHEF, PartTimeRole.OPERATIONS] },
      { time: '20:00', activity: '頒獎典禮', description: '需搭配氣勢磅礴的音樂', highlightFor: [VendorRole.EQUIPMENT, VendorRole.PROFESSIONAL] },
      { time: '21:30', activity: '活動結束', description: '廠商撤場', highlightFor: [VendorRole.DECOR, VendorRole.EQUIPMENT, PartTimeRole.EXECUTION] },
    ],
    status: 'ACTIVE',
    paymentStatus: '已付訂',
    cateringCategory: 'Buffet外燴',
    space: 'VIP包廂',
    taxId: '88123456',
    financials: {
      budgetPerHead: 800,
      shippingFee: 1200,
      serviceFee: 2000,
      adjustments: 0,
      deposit: 3840,
      depositDate: '2023-10-15',
      taxRate: 0.05,
      isInvoiceRequired: true,
      hasServiceCharge: false // Manually set to 2000
    },
    menuItems: `胡麻野菜沙拉\n日式卷壽司拼盤\n凱撒雞肉沙拉\n泰式涼拌海鮮\n甘蔗雞肉玉子燒\n爐烤自製豬五花\n爐烤舒肥牛排\n義式番茄海鮮湯\n松露蘆筍海鮮燉飯`,
    logistics: [
      { time: '17:00', action: '擺盤完成' },
      { time: '21:30', action: '收餐' }
    ],
    executionTeam: [
      { role: '外燴廠商', name: '美食兄弟外燴', phone: '0912-345-678', isNotified: true, assigneeId: 'v1' },
      { role: '現場執行', name: '張小明', phone: '0988-111-222', isNotified: true, assigneeId: 'pt-1' },
      { role: '音響工程', name: '專業音響工程', phone: '0944-777-888', isNotified: false, assigneeId: 'v4' }
    ]
  },
  {
    id: 'ord-102',
    clientName: '莎拉與約翰婚禮',
    eventName: '花園婚禮',
    eventDate: new Date(Date.now() + 86400000 * 0.8).toISOString(), // T+0.8 (Tomorrow, urgent)
    eventStartTime: '16:00',
    eventEndTime: '20:00',
    guestCount: 150,
    location: '台北花園別墅 戶外草地區',
    locationLink: 'https://maps.google.com/?q=Taipei+Garden+Villa',
    siteManager: { name: '李大同', phone: '0900-333-444', title: '婚顧督導' },
    specialRequests: '戶外場地，必須準備雨天備案。',
    eventFlow: [
      { time: '14:00', activity: '戶外佈置', description: '帳棚與拱門搭建', highlightFor: [VendorRole.DECOR] },
      { time: '16:00', activity: '魔術暖場', description: '賓客入場時進行近距離魔術', highlightFor: [VendorRole.PROFESSIONAL] },
      { time: '17:00', activity: '證婚儀式', description: '交換誓詞', highlightFor: [VendorRole.PROFESSIONAL] },
    ],
    status: 'ACTIVE',
    paymentStatus: '已付清',
    cateringCategory: '客製化餐飲',
    space: '玻璃屋',
    financials: {
      budgetPerHead: 1500,
      shippingFee: 3000,
      serviceFee: 22500, // 10%
      adjustments: 5000, // Tent setup extra
      deposit: 100000,
      depositDate: '2023-11-01',
      taxRate: 0.05,
      isInvoiceRequired: true,
      hasServiceCharge: true
    },
    menuItems: '婚禮特製蛋糕\n粉紅香檳塔\n法式小點心\n現切火腿區',
    logistics: [
      { time: '13:00', action: '進場佈置' },
      { time: '18:00', action: '撤場' }
    ],
    executionTeam: [
      { role: '場地佈置', name: '星光場地佈置', phone: '0922-333-444', isNotified: true, assigneeId: 'v2' },
      { role: '魔術表演', name: '魔術師邁克', phone: '0933-555-666', isNotified: true, assigneeId: 'v3' },
      { role: '場控', name: '李大華', phone: '0988-333-444', isNotified: false, assigneeId: 'pt-2' }
    ]
  },
  {
    id: 'ord-103',
    clientName: '新創發布會',
    eventName: '產品展示交流會',
    eventDate: new Date(Date.now() + 86400000 * 5).toISOString(), // T+5
    guestCount: 50,
    location: 'WeWork 信義計畫區',
    locationLink: 'https://maps.google.com/?q=WeWork+Xinyi',
    siteManager: { name: '王經理', phone: '0900-555-666', title: '場地負責人' },
    specialRequests: '僅提供手指食物 (Finger food)。',
    eventFlow: [
      { time: '13:00', activity: '餐點佈置', description: '擺放精緻點心台', highlightFor: [VendorRole.CHEF] },
      { time: '14:00', activity: '媒體接待', description: '', highlightFor: [] },
    ],
    status: 'ACTIVE',
    paymentStatus: '未付訂',
    cateringCategory: '點心內用',
    space: '共享大廳',
    financials: {
      budgetPerHead: 500,
      shippingFee: 1200,
      serviceFee: 2500,
      adjustments: 0,
      deposit: 0,
      taxRate: 0.05,
      isInvoiceRequired: true,
      hasServiceCharge: true
    },
    logistics: [
      { time: '12:30', action: '擺盤完成' },
      { time: '16:00', action: '收餐' }
    ],
    executionTeam: []
  }
];

export const MOCK_TASKS: VendorTask[] = [
  // Order 101 - Healthy State with Vendor Note
  {
    id: 't-1',
    orderId: 'ord-101',
    vendorId: 'v1', // Chef
    status: TaskStatus.CONFIRMED,
    sentAt: new Date(Date.now() - 100000).toISOString(),
    ackAt: new Date(Date.now() - 50000).toISOString(),
    ackIp: '203.145.2.1',
    aiSummary: '準備 20 人份客製化菜單。VIP 嚴格禁止花生 (NO PEANUTS) 協議。',
    requiredActions: [
      '確認食材清單無花生製品 (No Peanuts)',
      '準備 20 人份餐具與備用餐具',
      '16:00 前抵達現場開始備餐',
      '提供素食者專屬餐盒 5 份'
    ],
    completedActionIndices: [],
    lastRemindedAt: null,
    token: 'hash-1',
    vendorNote: '已收到，主廚已特別標註花生過敏需求，當天會分開製作。',
    opsLogs: [],
    issueDetails: undefined
  },
  {
    id: 't-2',
    orderId: 'ord-101',
    vendorId: 'v4', // AV (Now EQUIPMENT)
    status: TaskStatus.ISSUE_REPORTED, // ISSUE!
    sentAt: new Date(Date.now() - 80000).toISOString(),
    ackAt: null,
    ackIp: null,
    aiSummary: '設置舞台中央聚光燈。確保頒獎典禮使用的無線麥克風運作正常。',
    requiredActions: [
      '攜帶 4 支無線麥克風與備用電池',
      '設置舞台聚光燈系統',
      '配合主持人進行彩排 (17:30)',
      '準備頒獎典禮背景音樂'
    ],
    completedActionIndices: [],
    lastRemindedAt: null,
    token: 'hash-2',
    vendorNote: undefined,
    issueDetails: '君悅飯店告知當天下午 3 點前無法進場，這樣設燈光時間不夠，請協調。',
    opsLogs: [
      { timestamp: new Date(Date.now() - 4000).toISOString(), action: 'Viewed', note: '營運人員已讀取異常', user: 'JD' }
    ]
  },
  // PT Task for Simulation
  {
    id: 't-pt-demo',
    orderId: 'ord-101',
    vendorId: 'pt-1', // Zhang Xiao Ming (Plating -> Operations)
    status: TaskStatus.NOTIFIED,
    sentAt: new Date().toISOString(),
    ackAt: null,
    ackIp: null,
    aiSummary: '協助晚宴擺盤與出餐。需穿著黑色正式服裝。',
    requiredActions: [
      '16:00 準時打卡',
      '確認餐具擦拭乾淨',
      '協助主廚擺盤 (冷前菜)',
      '維持出餐動線暢通'
    ],
    completedActionIndices: [],
    lastRemindedAt: null,
    token: 'hash-pt-demo',
    opsLogs: [],
    issueDetails: undefined
  },

  // Order 102 - EMERGENCY STATE (T-1, Unconfirmed)
  {
    id: 't-3',
    orderId: 'ord-102',
    vendorId: 'v2', // Decor
    status: TaskStatus.EMERGENCY, // KILL SWITCH
    sentAt: new Date(Date.now() - 172800000).toISOString(), // Sent 2 days ago
    ackAt: null,
    ackIp: null,
    aiSummary: '需要搭建戶外帳棚。請立即重新確認雨天應急計畫。',
    requiredActions: [
      '搭建 10x10 戶外白色帳棚',
      '準備雨天備案：透明遮雨簾',
      '佈置婚禮拱門 (鮮花)',
      '14:00 前完成所有搭建工程'
    ],
    completedActionIndices: [],
    lastRemindedAt: new Date(Date.now() - 3600000).toISOString(), // Reminded 1 hour ago
    token: 'hash-3',
    opsLogs: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Auto-Call', note: '系統自動撥號無人接聽', user: 'System' }
    ],
    issueDetails: undefined
  },
  {
    id: 't-4',
    orderId: 'ord-102',
    vendorId: 'v3', // Magician (Now PROFESSIONAL)
    status: TaskStatus.CONFIRMED,
    sentAt: new Date(Date.now() - 172800000).toISOString(),
    ackAt: new Date(Date.now() - 160000000).toISOString(),
    ackIp: '114.32.1.55',
    aiSummary: '雞尾酒時段 (18:00-19:00) 進行近距離魔術表演。',
    requiredActions: [
      '準備近距離魔術道具',
      '穿著正式西裝',
      '17:30 抵達現場準備'
    ],
    completedActionIndices: [],
    lastRemindedAt: null,
    token: 'hash-4',
    opsLogs: [],
    issueDetails: undefined
  },

  // Order 103 - Future
  {
    id: 't-5',
    orderId: 'ord-103',
    vendorId: 'v1',
    status: TaskStatus.PENDING,
    sentAt: null,
    ackAt: null,
    ackIp: null,
    aiSummary: '50 人份手指食物菜單。方便站立食用。',
    requiredActions: [
      '準備 5 種 Finger Foods',
      '提供雞尾酒餐巾紙',
      '12:30 抵達現場擺盤'
    ],
    completedActionIndices: [],
    lastRemindedAt: null,
    token: 'hash-5',
    opsLogs: [],
    issueDetails: undefined
  }
];

export const MOCK_WEEKLY_STATS = [
  { day: '週一', responseTime: 5.2, label: '5.2h' },
  { day: '週二', responseTime: 4.1, label: '4.1h' },
  { day: '週三', responseTime: 3.8, label: '3.8h' },
  { day: '週四', responseTime: 2.4, label: '2.4h' },
  { day: '週五', responseTime: 2.1, label: '2.1h' },
  { day: '週六', responseTime: 1.5, label: '1.5h' },
  { day: '週日', responseTime: 1.2, label: '1.2h' },
];
