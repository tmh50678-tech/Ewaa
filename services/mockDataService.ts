import { User, PurchaseRequest, RequestStatus, Supplier, Branch } from '../types';
import { ROLES } from '../constants';

export const MOCK_BRANCHES: Branch[] = [
  { id: 'branch-1', name: 'Riyadh Branch', city: 'Riyadh' },
  { id: 'branch-2', name: 'Jeddah Branch', city: 'Jeddah' },
  { id: 'branch-3', name: 'Dammam Branch', city: 'Dammam' },
  { id: 'branch-4', name: 'Tabuk Branch', city: 'Tabuk' },
  { id: 'branch-5', name: 'Abha-Khamis Branch', city: 'Abha' },
  { id: 'branch-6', name: 'Al-Qassim Branch', city: 'Buraidah' },
  { id: 'branch-7', name: 'Al-Jouf Branch', city: 'Sakaka' },
  { id: 'branch-8', name: 'Jizan Branch', city: 'Jizan' },
];

const BRANCH_IDS = {
    RIYADH: 'branch-1',
    JEDDAH: 'branch-2',
    DAMMAM: 'branch-3',
    TABUK: 'branch-4',
    ABHA: 'branch-5',
    QASSIM: 'branch-6',
    JOUF: 'branch-7',
    JIZAN: 'branch-8',
};
const ALL_BRANCH_IDS = Object.values(BRANCH_IDS);

export const INITIAL_USERS: User[] = [
  { id: 1, name: 'Alice (Requester)', email: 'alice@ewaa.com', password: 'password123', role: ROLES.REQUESTER, branches: ['branch-1', 'branch-2'] },
  { id: 2, name: 'Bob (Hotel Manager)', email: 'bob@ewaa.com', password: 'password123', role: ROLES.HOTEL_MANAGER, branches: ['branch-1'] },
  { id: 3, name: 'Charlie (Purchasing Rep)', email: 'charlie@ewaa.com', password: 'password123', role: ROLES.PURCHASING_REP, branches: ALL_BRANCH_IDS },
  { id: 4, name: 'Diana (Purchasing Manager)', email: 'diana@ewaa.com', password: 'password123', role: ROLES.PURCHASING_MANAGER, branches: ALL_BRANCH_IDS },
  { id: 5, name: 'Eve (Accountant)', email: 'eve@ewaa.com', password: 'password123', role: ROLES.ACCOUNTANT, branches: ['branch-1'] },
  { id: 6, name: 'Frank (Accounting Manager)', email: 'frank@ewaa.com', password: 'password123', role: ROLES.ACCOUNTING_MANAGER, branches: ['branch-1', 'branch-2'] },
  { id: 7, name: 'Grace (Auditor)', email: 'grace@ewaa.com', password: 'password123', role: ROLES.AUDITOR, branches: [] },
  { id: 8, name: 'Admin User', email: 't.m.h5.0.678@gmail.com', password: '12341234', role: ROLES.ADMIN, branches: [] },
  { id: 9, name: 'Ivy (Quality Supervisor)', email: 'ivy@ewaa.com', password: 'password123', role: ROLES.QUALITY_SUPERVISOR, branches: ['branch-3'] },
  { id: 10, name: 'Jack (Quality Manager)', email: 'jack@ewaa.com', password: 'password123', role: ROLES.QUALITY_MANAGER, branches: ['branch-3'] },
  { id: 11, name: 'Leo (Projects Accountant)', email: 'leo@ewaa.com', password: 'password123', role: ROLES.PROJECTS_ACCOUNTANT, branches: ['branch-3'] },
  { id: 12, name: 'Mia (Final Approver)', email: 'mia@ewaa.com', password: 'password123', role: ROLES.FINAL_APPROVER, branches: ['branch-1', 'branch-2', 'branch-3'] },
  { id: 13, name: 'Noah (Bank Rounds Officer)', email: 'noah@ewaa.com', password: 'password123', role: ROLES.BANK_ROUNDS_OFFICER, branches: ['branch-1', 'branch-2'] },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
    // OCR Parsed & Merged Suppliers from Document
    { name: 'المنجم للأغذية (موحد)', contact: '920029855 / +966114755555', category: 'F&B', representatives: [], branches: ALL_BRANCH_IDS, website: 'almunajemfoods.com', notes: 'موزع أغذية وطني وشبكة توزيع وطنية، مكتب رئيسي بالرياض' },
    { name: 'فرسان برو (Forsan Pro)', contact: '+966 549132222 (رسائل فقط)', category: 'F&B', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'forsan.com.sa', notes: 'توريد للمطاعم' },
    { name: 'شركة الرياض للصناعات الغذائية (Riyadh Foods)', contact: '+966593030305', category: 'F&B', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'riyadhfoods.com', notes: 'مصنع / مورد' },
    { name: 'المراعي PRO – قطاع المطاعم', contact: '800 11 90004 / 966581760464 (واتساب)', category: 'F&B', representatives: [], branches: ALL_BRANCH_IDS, website: 'almarai.com', notes: 'تغطية وطنية' },
    { name: 'مؤسسة إبراهيم السكاكر التجارية', contact: '0503987727', category: 'F&B', representatives: [], branches: [BRANCH_IDS.RIYADH, BRANCH_IDS.JEDDAH, BRANCH_IDS.QASSIM], website: 'alsakakir.com', notes: 'خضار وفواكه جملة؛ فروع في الرياض وجدة وبريدة' },
    { name: 'Bidfood KSA', contact: '9200 23663', category: 'F&B', representatives: [], branches: ALL_BRANCH_IDS, website: 'bidfoodme.com', notes: 'توريد أغذية ومشروبات HoReCa بالرياض / جدة / الخبر' },
    { name: 'حلواني إخوان - المكتب الرئيسي', contact: '00966126366667 / 8002441112', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JEDDAH], website: 'halwani.com.sa', notes: 'مصنع وموزع' },
    { name: 'سدافكو (Saudia)', contact: '+966 12 629 3370 / +966 12 629 3366 / 800 244 0044', category: 'F&B', representatives: [], branches: ALL_BRANCH_IDS, website: 'sadafco.com', notes: 'تغطية وطنية, ألبان، عصائر، معجون طماطم، آیس کریم' },
    { name: 'بیادر الغذاء – جملة', contact: '0566886141', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JEDDAH], website: 'horecaway.com', notes: 'جملة مواد غذائية – حي بترومين' },
    { name: 'أسواق أسترا / أسترا الغذائية', contact: '0144232888 / 0569629894 (مستودع)', category: 'F&B', representatives: [], branches: [BRANCH_IDS.TABUK], website: 'astramarkets.com', notes: 'مستودع وثلاجة جملة؛ تغطية المنطقة' },
    { name: 'شركة الجوف للتنمية الزراعية', contact: '014-6466664 / 014-6540054 / 0580700970', category: 'F&B', representatives: [], branches: [BRANCH_IDS.TABUK, BRANCH_IDS.JOUF], website: 'horecaway.com/aljouf', notes: 'منتجات زراعية، زيوت زيتون، توزيع واسع وبييع' },
    { name: 'أسواق عبدالله العثيم – خميس مشيط (قسم الجملة)', contact: '059 790 2869 / 920000702', category: 'F&B', representatives: [], branches: [BRANCH_IDS.ABHA], website: 'wowdeals.me', notes: 'هايبر/جملة لتوريد سريع محلياً' },
    { name: 'بقالة تموينات درة أبها للمواد الغذائية', contact: '0557162735', category: 'F&B', representatives: [], branches: [BRANCH_IDS.ABHA], website: 'd2020.net', notes: 'تموينات؛ يُفضّل الاستفسار عن الجملة' },
    { name: 'سوق ومخبز مروج أبها', contact: '0501696885', category: 'F&B', representatives: [], branches: [BRANCH_IDS.ABHA], website: 'd2020.net', notes: 'مواد غذائية وفواكه وخضار' },
    { name: 'شركة جياد القصيم – أبا الخيل للصناعات الغذائية', contact: '+966163231758', category: 'F&B', representatives: [], branches: [BRANCH_IDS.QASSIM], website: 'jiadalqassim.com', notes: 'مصنع مورد (حلويات كليجا...)' },
    { name: 'المقرن للمواد الغذائية', contact: '0163841637', category: 'F&B', representatives: [], branches: [BRANCH_IDS.QASSIM], website: 'instagram.com/al_muqaran', notes: 'مواد غذائية بسعر الجملة' },
    { name: 'شركة ثلاجة أبار وزيني (بريدة)', contact: '+966163263290 / +966163249700', category: 'F&B', representatives: [], branches: [BRANCH_IDS.QASSIM], website: 'arablocal.com', notes: 'تبريد / توزيع أغذية' },
    { name: 'شركة عمان العالمية للتجارة (سكاكا)', contact: 'N/A', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JOUF], website: 'yango maps سكاكا', notes: 'بيع مواد غذائية بالجملة (تحقق من الرقم محلياً)' },
    { name: 'شركة فود ماركت التجارية (سكاكا)', contact: 'N/A', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JOUF], website: 'yango maps سكاكا', notes: 'بيع مواد غذائية بالجملة (تحقق من الرقم محلياً)' },

    // AI-Generated New Suppliers
    { name: 'شركة التجهيزات الفندقية المتحدة (Riyadh)', contact: '920011234', category: 'Linens', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'uhs-sa.com', notes: 'متخصصون في المفروشات والبياضات الفندقية عالية الجودة.' },
    { name: 'مواد الإعمار للتجارة (Jeddah)', contact: '+966126910000', category: 'Maintenance', representatives: [], branches: [BRANCH_IDS.JEDDAH], website: 'bmc.com.sa', notes: 'مواد بناء وأدوات صيانة متنوعة.' },
    { name: 'الشركة العربية للتموين والتجارة (Riyadh)', contact: '920002624', category: 'F&B', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'arabian-stores.com', notes: 'مورد معتمد للمواد الغذائية الجافة والمبردة.' },
    { name: 'مؤسسة إمداد الشمال (Tabuk)', contact: '0554567890', category: 'Housekeeping', representatives: [], branches: [BRANCH_IDS.TABUK], website: 'emdadshamal.com.sa', notes: 'منظفات ومعدات نظافة احترافية.' },
    { name: 'واحة القصيم لتموين الفنادق (Buraidah)', contact: '0501231234', category: 'F&B', representatives: [], branches: [BRANCH_IDS.QASSIM], website: 'qassim-oasis.com', notes: 'خضروات وفواكه طازجة ومنتجات محلية.' },
    { name: 'رواد الجنوب للتوريدات (Abha)', contact: '0539876543', category: 'Maintenance', representatives: [], branches: [BRANCH_IDS.ABHA], website: 'rowadaljanoub.sa', notes: 'حلول صيانة متكاملة وقطع غيار.' },
    { name: 'شركة نماء الجوف (Al-Jouf)', contact: '0555667788', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JOUF], website: 'namaaljouf.com', notes: 'منتجات زراعية عضوية وزيت زيتون.' },
    { name: 'البحار السبعة للمأكولات البحرية (Jizan)', contact: '0587654321', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JIZAN], website: 'sevenseas-jizan.com', notes: 'موردون للمأكولات البحرية الطازجة من البحر الأحمر.' },
    { name: 'شركة الفنار للكهرباء (All Cities)', contact: '920006111', category: 'Electrical', representatives: [], branches: ALL_BRANCH_IDS, website: 'alfanar.com', notes: 'مواد ومستلزمات كهربائية.' },
    { name: 'الجزيرة للأجهزة المنزلية (Riyadh)', contact: '+966114111111', category: 'Engineering', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'al-jazierah.com.sa', notes: 'مكيفات، سخانات، ومعدات هندسية.' },
    { name: 'شركة مواد التنظيف الحديثة (Jeddah)', contact: '0502345678', category: 'Housekeeping', representatives: [], branches: [BRANCH_IDS.JEDDAH], website: 'mcc-sa.com', notes: 'موزع لماركات عالمية من المنظفات.' },
    { name: 'تموينات تبوك الكبرى (Tabuk)', contact: '0144223344', category: 'F&B', representatives: [], branches: [BRANCH_IDS.TABUK], website: 'tabuksupplies.com', notes: 'مواد غذائية بالجملة.' },
    { name: 'قمم عسير التجارية (Abha)', contact: '0551122334', category: 'Linens', representatives: [], branches: [BRANCH_IDS.ABHA], website: 'aseerpeaks.com', notes: 'مفروشات ومناشف ولوازم غرف.' },
    { name: 'مصنع بريدة للثلج والمياه (Buraidah)', contact: '0163810000', category: 'F&B', representatives: [], branches: [BRANCH_IDS.QASSIM], website: 'buraidahice.com', notes: 'مياه معبأة ومكعبات ثلج.' },
    { name: 'شركة الساحل الغربي للتبريد (Jizan)', contact: '0509871234', category: 'Engineering', representatives: [], branches: [BRANCH_IDS.JIZAN], website: 'westcoastcooling.sa', notes: 'صيانة وتركيب أنظمة التبريد والتكييف.' },
    { name: 'شركة دلتا للتسويق (Jeddah)', contact: '+966126659988', category: 'F&B', representatives: [], branches: [BRANCH_IDS.JEDDAH], website: 'delta.com.sa', notes: 'مستورد وموزع للماركات الغذائية العالمية.' },
    { name: 'الشركة السعودية لخدمات السيارات (All Cities)', contact: '920001840', category: 'Maintenance', representatives: [], branches: ALL_BRANCH_IDS, website: 'sasco.com.sa', notes: 'صيانة أسطول السيارات ومستلزماتها.' },
    { name: 'مصنع مكة للمفروشات (Jeddah)', contact: '0553334445', category: 'Linens', representatives: [], branches: [BRANCH_IDS.JEDDAH], website: 'makkahlinens.com', notes: 'تصنيع وتوريد كافة أنواع المفروشات الفندقية.' },
    { name: 'شركة الحلول الذكية للسلامة (Riyadh)', contact: '0112233445', category: 'Engineering', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'smartsafety.sa', notes: 'أنظمة إطفاء وإنذار حريق.' },
    { name: 'خيرات أبها الزراعية (Abha)', contact: '0501239876', category: 'F&B', representatives: [], branches: [BRANCH_IDS.ABHA], website: 'khairatabha.com', notes: 'منتجات زراعية طازجة من مزارع الجنوب.' },
    { name: 'شركة إمداد لخدمات الأعمال (All Cities)', contact: '920006616', category: 'Housekeeping', representatives: [], branches: ALL_BRANCH_IDS, website: 'emdad.com.sa', notes: 'حلول متكاملة لإدارة المرافق والنظافة.' },
    { name: 'مؤسسة نجمة تبوك للمقاولات (Tabuk)', contact: '0531234567', category: 'Maintenance', representatives: [], branches: [BRANCH_IDS.TABUK], website: 'najmattabuk.com', notes: 'أعمال صيانة وترميمات عامة.' },
    { name: 'شركة أراسكو (Riyadh)', contact: '8001242242', category: 'F&B', representatives: [], branches: [BRANCH_IDS.RIYADH], website: 'arasco.com', notes: 'منتجات لحوم ودواجن عالية الجودة.' },
    { name: 'معدات تهامة الفندقية (Jizan)', contact: '0558889990', category: 'Housekeeping', representatives: [], branches: [BRANCH_IDS.JIZAN], website: 'tihama-he.com', notes: 'تجهيزات ومعدات المطابخ والمغاسل الفندقية.' },
    { name: 'شركة العليان المالية (All Cities)', contact: '+966114777777', category: 'General', representatives: [], branches: ALL_BRANCH_IDS, website: 'olayan.com', notes: 'مجموعة واسعة من المنتجات والخدمات عبر شركاتها التابعة.' },
    { name: 'شركة الزامل الصناعية (All Cities)', contact: '+966138471888', category: 'Engineering', representatives: [], branches: ALL_BRANCH_IDS, website: 'zamilindustrial.com', notes: 'حلول تكييف وهياكل فولاذية ومواد عزل.' }
];

export const SUPPLIERS = INITIAL_SUPPLIERS;


export const MOCK_REQUESTS: PurchaseRequest[] = [
  {
    id: 'pr-123456',
    requester: INITIAL_USERS[0],
    status: RequestStatus.PENDING_HM_APPROVAL,
    items: [
      { id: 'item-1', name: 'Luxury Bath Towels', quantity: 50, unit: 'piece', estimatedCost: 25, category: 'Linens', justification: 'Replacing worn out towels in premium suites.' },
      { id: 'item-2', name: 'High-Quality Coffee Beans', quantity: 20, unit: 'kg', estimatedCost: 40, category: 'F&B', justification: 'Restocking for the lobby cafe.' },
    ],
    totalEstimatedCost: (50 * 25) + (20 * 40),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvalHistory: [
      { user: INITIAL_USERS[0], action: 'Submitted', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ],
    department: 'Housekeeping',
    branch: MOCK_BRANCHES[0],
  },
  {
    id: 'pr-789012',
    requester: INITIAL_USERS[0],
    status: RequestStatus.COMPLETED,
    items: [
      { id: 'item-3', name: 'LED Light Bulbs', quantity: 200, unit: 'piece', estimatedCost: 5, category: 'Maintenance', justification: 'Energy saving initiative for all corridors.' },
    ],
    totalEstimatedCost: 200 * 5,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    approvalHistory: [
        { user: INITIAL_USERS[0], action: 'Submitted', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { user: INITIAL_USERS[1], action: 'Approved', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
        { user: INITIAL_USERS[3], action: 'Approved', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
        { user: INITIAL_USERS[5], action: 'Approved', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
    department: 'Maintenance',
    branch: MOCK_BRANCHES[1],
  },
  {
    id: 'pr-345678',
    requester: INITIAL_USERS[1],
    status: RequestStatus.DRAFT,
    items: [
      { id: 'item-4', name: 'New Lobby Furniture Set', quantity: 1, unit: 'set', estimatedCost: 15000, category: 'Furniture', justification: 'Complete lobby renovation project.' },
    ],
    totalEstimatedCost: 15000,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    approvalHistory: [],
    department: 'Management',
    branch: MOCK_BRANCHES[0],
  },
   {
    id: 'pr-999999',
    requester: INITIAL_USERS[0],
    status: RequestStatus.PENDING_INVOICE,
    items: [
      { id: 'item-5', name: 'Cleaning Supplies', quantity: 10, unit: 'bottle', estimatedCost: 100, category: 'Housekeeping', justification: 'Monthly restock' },
    ],
    totalEstimatedCost: 1000,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    approvalHistory: [
         { user: INITIAL_USERS[0], action: 'Submitted', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
         { user: INITIAL_USERS[1], action: 'Approved', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
         { user: INITIAL_USERS[2], action: 'Marked as Purchased', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ],
    // FIX: Added missing 'department' and 'branch' properties to satisfy the PurchaseRequest type.
    department: 'Housekeeping',
    branch: MOCK_BRANCHES[1],
  },
];