// FIX: Replaced placeholder content with Gemini API service implementation.

import { GoogleGenAI, Type } from "@google/genai";
import type { PurchaseRequest, AIAnalysisResult, Invoice, SalesRepresentative, Supplier, PurchaseRequestItem, SupplierSuggestion, AISearchFilters, User, Branch, AIInsight } from '../types';
import { RequestStatus } from '../types';
import { DEPARTMENTS } from '../constants';

if (!process.env.API_KEY) {
    // This is a mock implementation for development without an API key.
    // In a real environment, the API_KEY should be set.
    console.warn("API_KEY environment variable not set. Using mock Gemini service.");
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY || "mock-key"});

const invoiceSchema = {
    type: Type.OBJECT,
    properties: {
        vendorName: {
            type: Type.STRING,
            description: "The name of the vendor or supplier on the invoice."
        },
        invoiceNumber: {
            type: Type.STRING,
            description: "The unique invoice number or identifier."
        },
        invoiceDate: {
            type: Type.STRING,
            description: "The date the invoice was issued, in YYYY-MM-DD format."
        },
        totalAmount: {
            type: Type.NUMBER,
            description: "The final total amount due on the invoice."
        },
        items: {
            type: Type.ARRAY,
            description: "A list of items from the invoice.",
            items: {
                type: Type.OBJECT,
                properties: {
                    itemName: { type: Type.STRING, description: "Description of the item." },
                    price: { type: Type.NUMBER, description: "Price of the item." },
                    unit: { type: Type.STRING, description: "The unit of the item (e.g., kg, piece, box, set)." },
                    category: { type: Type.STRING, description: "The category of the item (e.g., F&B, Maintenance, Linens, Engineering)." }
                },
                required: ["itemName", "price", "unit", "category"]
            }
        },
        salesRepresentative: {
            type: Type.OBJECT,
            description: "The name and contact number of the sales representative, if found on the invoice.",
            properties: {
                name: { type: Type.STRING },
                contact: { type: Type.STRING }
            }
        }
    },
    required: ["vendorName", "invoiceNumber", "invoiceDate", "totalAmount", "items"]
};

export const analyzeInvoice = async (
    base64ImageData: string,
    mimeType: string,
    existingInvoices: Invoice[]
): Promise<AIAnalysisResult> => {
    
    if (!process.env.API_KEY) {
        // MOCK IMPLEMENTATION
        console.log("Using mock analyzeInvoice response.");
        return Promise.resolve({
            extractedData: {
                vendorName: 'مورد تجريبي',
                invoiceNumber: `MV-${Date.now()}`,
                invoiceDate: new Date().toISOString().split('T')[0],
                totalAmount: Math.floor(Math.random() * 2000) + 500,
                 items: [
                    { itemName: 'مناشف حمام فاخرة', price: 24, unit: 'قطعة', category: 'البياضات' },
                    { itemName: 'حبوب بن عالية الجودة', price: 45, unit: 'كجم', category: 'الأغذية والمشروبات' },
                ],
                salesRepresentative: {
                    name: "مندوب تجريبي",
                    contact: "0500000000"
                }
            },
            duplicateCheck: {
                isDuplicate: false,
                reason: 'هذه استجابة تجريبية. لم يتم إجراء فحص للتكرار.',
            },
            priceCheck: {
                overallAssessment: 'تحليل تجريبي: الأسعار معقولة بشكل عام، على الرغم من أن أحد الأصناف أعلى قليلاً من سعر السوق المقدر.',
                priceAnalysis: [
                    { itemName: 'مناشف حمام فاخرة', price: 24, isOverpriced: false, marketPriceComparison: 'السعر ضمن النطاق المتوقع (22-26 ريال سعودي).' },
                    { itemName: 'حبوب بن عالية الجودة', price: 45, isOverpriced: true, marketPriceComparison: 'أعلى قليلاً من متوسط سعر السوق. النطاق المتوقع هو 38-42 ريال سعودي.' },
                ],
            },
        });
    }

    const model = 'gemini-2.5-flash';

    const imagePart = {
        inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
        },
    };
    
    const textPart = {
        text: `
            حلل هذه الفاتورة لنظام مشتريات فندقي.
            1. استخرج اسم المورد، رقم الفاتورة، تاريخ الفاتورة، المبلغ الإجمالي، وقائمة الأصناف.
            2. لكل صنف، استخرج اسمه، سعره، وحدته، وحدد فئته من هذه القائمة: الأغذية والمشروبات، الصيانة، البياضات، الهندسة، التدبير المنزلي، الأثاث، السباكة والتدفئة، الكهرباء، الدهان والديكور.
            3. إذا وجدت اسم مندوب مبيعات ورقم اتصال في الفاتورة، استخرجه في كائن 'salesRepresentative'.
            4. تحقق مما إذا كانت هذه الفاتورة نسخة مكررة محتملة. إليك قائمة بأرقام الفواتير الحالية: ${JSON.stringify(existingInvoices.map(inv => inv.invoiceNumber))}. تعتبر الفاتورة مكررة إذا كان لها نفس رقم فاتورة موجودة.
            5. لكل صنف، تصرف كأخصائي مشتريات. قدر نطاق سعر سوق معقول بالريال السعودي (مثال: "100-120 ريال سعودي"). قارن سعر الصنف بهذا النطاق. في حقل 'marketPriceComparison'، اذكر ما إذا كان السعر معقولاً، مرتفعاً، أو منخفضاً، ويجب أن تدرج نطاق السعر التقديري الذي استخدمته للمقارنة.
            6. بناءً على تحليل الأصناف الفردية، قدم تقييماً عاماً موجزاً من جملة واحدة لتسعير الفاتورة في حقل 'overallAssessment'.
            يجب أن تكون جميع الردود النصية باللغة العربية.
            أعد النتيجة بتنسيق JSON.
        `
    };

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    extractedData: invoiceSchema,
                    duplicateCheck: {
                        type: Type.OBJECT,
                        properties: {
                            isDuplicate: { type: Type.BOOLEAN },
                            reason: { type: Type.STRING }
                        }
                    },
                    priceCheck: {
                        type: Type.OBJECT,
                        properties: {
                             overallAssessment: { type: Type.STRING },
                             priceAnalysis: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        itemName: { type: Type.STRING },
                                        price: { type: Type.NUMBER },
                                        isOverpriced: { type: Type.BOOLEAN },
                                        marketPriceComparison: { type: Type.STRING }
                                    }
                                }
                             }
                        }
                    }
                }
            }
        }
    });
    
    const json = JSON.parse(response.text);
    return json as AIAnalysisResult;
};


export const getSupplierSuggestions = async (
    items: Omit<PurchaseRequestItem, 'id'>[],
    suppliers: Supplier[]
): Promise<SupplierSuggestion[]> => {
    if (!process.env.API_KEY) {
        // MOCK IMPLEMENTATION
        console.log("Using mock getSupplierSuggestions response.");
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        return Promise.resolve([
            { supplierName: suppliers[0]?.name || 'مورد أغذية ومشروبات تجريبي', justification: 'موصى به لأصناف الأغذية والمشروبات بناءً على فئتهم.' },
            { supplierName: suppliers[1]?.name || 'مورد صيانة تجريبي', justification: 'هذا المورد متخصص في قطع غيار الصيانة والهندسة.' }
        ]);
    }

    const model = 'gemini-2.5-flash';

    const prompt = `
        بصفتك خبير مشتريات لسلسلة فنادق، مهمتك هي التوصية بأفضل الموردين لطلب شراء معين.
        
        إليك الأصناف في طلب الشراء الحالي:
        ${JSON.stringify(items.map(item => ({ name: item.name, category: item.category, quantity: item.quantity })), null, 2)}

        وهذه قائمة الموردين المتاحين لفرع الفندق:
        ${JSON.stringify(suppliers.map(s => ({ name: s.name, category: s.category, notes: s.notes })), null, 2)}

        بناءً على فئات الأصناف وتخصصات الموردين، يرجى التوصية بما يصل إلى 3 من أنسب الموردين من القائمة المتوفرة.
        لكل توصية، قدم مبررًا موجزًا يشرح سبب كونهم مناسبين (على سبيل المثال: "متخصص في الأغذية والمشروبات"، "موزع وطني لقطع غيار الصيانة"، "لديه ملاحظات إيجابية لهذا الفرع").
        يجب أن تكون جميع المبررات باللغة العربية.
        
        أعد النتيجة كمصفوفة JSON.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        supplierName: { type: Type.STRING },
                        justification: { type: Type.STRING }
                    },
                    required: ["supplierName", "justification"]
                }
            }
        }
    });

    const json = JSON.parse(response.text);
    return json as SupplierSuggestion[];
};


export const generateMonthlyReport = async (
    requests: PurchaseRequest[],
    branchName: string,
    month: string
): Promise<string> => {

    if (!process.env.API_KEY) {
        // MOCK IMPLEMENTATION
        console.log("Using mock generateMonthlyReport response.");
        return Promise.resolve(`هذا تحليل ذكاء اصطناعي تجريبي لـ ${branchName} لشهر ${month}.
- يبدو أن الإنفاق العام يتركز على قسم الصيانة.
- نقترح استكشاف خصومات الشراء بالجملة للأصناف التي يتم شراؤها بشكل متكرر مثل 'لمبات LED'.
- لم يتم الكشف عن أي حالات شاذة كبيرة.`);
    }


    const model = 'gemini-2.5-flash';
    
    const simplifiedRequests = requests.map(r => ({
        department: r.department,
        totalCost: r.totalEstimatedCost,
        items: r.items.map(i => ({ name: i.name, cost: i.estimatedCost, quantity: i.quantity }))
    }));

    const prompt = `
        أنشئ تحليلاً موجزاً لتقرير المصروفات الشهري لـ ${branchName} لشهر ${month}.
        بناءً على بيانات طلبات الشراء التالية، قدم رؤى أساسية، وحدد اتجاهات الإنفاق، واقترح فرصاً محتملة لتوفير التكاليف.
        اجعل التحليل في 3-4 نقاط. كن ثاقبًا وموجزًا. يجب أن يكون التحليل بالكامل باللغة العربية.

        البيانات:
        ${JSON.stringify(simplifiedRequests, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return response.text;
};

const searchFiltersSchema = {
    type: Type.OBJECT,
    properties: {
        status: {
            type: Type.ARRAY,
            description: "An array of statuses to filter by. Possible values are: " + Object.values(RequestStatus).join(', '),
            items: { type: Type.STRING }
        },
        branchId: {
            type: Type.STRING,
            description: "The ID of the branch to filter by."
        },
        department: {
            type: Type.STRING,
            description: "The department to filter by. Possible values are: " + DEPARTMENTS.join(', ')
        },
        searchTerm: {
            type: Type.STRING,
            description: "A general search term for item names, requester names, or reference numbers."
        },
        minTotal: {
            type: Type.NUMBER,
            description: "The minimum total estimated cost."
        },
        maxTotal: {
            type: Type.NUMBER,
            description: "The maximum total estimated cost."
        },
        requesterId: {
            type: Type.NUMBER,
            description: "The ID of the user who made the request. For queries like 'my requests'."
        }
    }
};

export const getAIsearchFilters = async (
    query: string,
    currentUser: User,
    branches: Branch[]
): Promise<{ filters: AISearchFilters; responseText: string }> => {
    if (!process.env.API_KEY) {
        // MOCK IMPLEMENTATION
        console.log("Using mock getAIsearchFilters response.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        let filters: AISearchFilters = {};
        if (query.toLowerCase().includes('completed')) filters.status = [RequestStatus.COMPLETED];
        if (query.toLowerCase().includes('jeddah')) filters.branchId = 'branch-2';
        if (query.toLowerCase().includes('riyadh')) filters.branchId = 'branch-1';
        if (query.toLowerCase().includes('my requests')) filters.requesterId = currentUser.id;

        return Promise.resolve({
            filters,
            responseText: `Okay, I'm applying the following filters based on your request: ${JSON.stringify(filters)}`
        });
    }

    const model = 'gemini-2.5-flash';

    const prompt = `
        You are an AI assistant for a hotel procurement system. Your task is to understand a user's natural language query and translate it into a JSON filter object.
        You must also provide a short, friendly confirmation message in the user's language (the query will be in English or Arabic).

        Here is the context you need:
        - The current user is: ${JSON.stringify({id: currentUser.id, name: currentUser.name, role: currentUser.role})}
        - Available branches: ${JSON.stringify(branches.map(b => ({id: b.id, name: b.name, city: b.city})))}
        - Available departments: ${DEPARTMENTS.join(', ')}
        - Available statuses: ${Object.values(RequestStatus).join(', ')}

        User's query: "${query}"

        Analyze the user's query and generate a JSON object with two keys: "filters" and "responseText".
        - "filters": This should be a JSON object matching the provided schema. Only include keys for the filters the user mentioned.
          - For queries like "my requests" or "طلباتي", you should use the requesterId from the current user context.
          - If the user mentions a city name (e.g., "Riyadh", "جدة"), find the corresponding branchId from the available branches.
          - If the user mentions a price like "over 5000 SAR" or "أكثر من ٥٠٠٠ ريال", set minTotal to 5000.
          - If the user mentions a status like "pending" or "معلقة", you can include multiple relevant pending statuses in the status array.
        - "responseText": A friendly confirmation message in the same language as the query (English or Arabic). For example: "Sure, showing pending requests from the Riyadh branch." or "بالتأكيد، إليك الطلبات المكتملة التي تزيد عن 5000 ريال."

        Respond ONLY with the JSON object.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    filters: searchFiltersSchema,
                    responseText: { type: Type.STRING }
                },
                required: ["filters", "responseText"]
            }
        }
    });

    const json = JSON.parse(response.text);
    return json as { filters: AISearchFilters; responseText: string };
};

export const getAIInsights = async (requests: PurchaseRequest[]): Promise<AIInsight[]> => {
    if (!process.env.API_KEY) {
        console.log("Using mock getAIInsights response.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return Promise.resolve([
            {
                type: 'cost',
                title: 'فرصة للشراء بالجملة',
                description: 'لاحظنا أن فرعي الرياض وجدة يطلبان "لمبات LED" بشكل متكرر. فكر في توحيد هذه الطلبات في طلب شهري واحد للتفاوض على سعر أفضل.'
            },
            {
                type: 'efficiency',
                title: 'تنبيه لارتفاع التكلفة',
                description: 'زاد الإنفاق على "حبوب البن عالية الجودة" بنسبة 15% هذا الشهر. نقترح التواصل مع موردين بديلين مثل "Bidfood KSA" للحصول على أسعار تنافسية.'
            },
             {
                type: 'trend',
                title: 'اتجاه جديد',
                description: 'هناك طلب متزايد على "لوازم تنظيف صديقة للبيئة". هذا يتماشى مع أهداف الاستدامة. نوصي بإضافتها إلى كتالوج الأصناف الرسمي.'
            }
        ]);
    }
    
    const model = 'gemini-2.5-flash';

    const simplifiedRequests = requests.map(r => ({
        branch: r.branch.name,
        department: r.department,
        totalCost: r.totalEstimatedCost,
        items: r.items.map(i => ({ name: i.name, category: i.category, cost: i.estimatedCost, quantity: i.quantity }))
    }));

    const prompt = `
        You are a procurement analyst AI for a hotel chain. Analyze the following recent purchase requests and provide 2-3 actionable insights.
        Focus on identifying:
        1.  **Cost-saving opportunities:** Look for frequently ordered items across different branches that could be bought in bulk for a discount.
        2.  **Efficiency improvements:** Identify bottlenecks or suggest ways to streamline purchasing.
        3.  **Emerging trends:** Notice if there's a growing demand for a new type of item that might be worth standardizing.
        
        For each insight, provide a 'type' ('cost', 'efficiency', or 'trend'), a short 'title', and a concise 'description'.
        All text output (title and description) MUST be in Arabic.

        Here is the data for the most recent purchase requests:
        ${JSON.stringify(simplifiedRequests, null, 2)}

        Return the response as a JSON array.
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, description: "The type of insight: 'cost', 'efficiency', or 'trend'." },
                        title: { type: Type.STRING, description: "A short title for the insight in Arabic." },
                        description: { type: Type.STRING, description: "A concise description of the insight in Arabic." }
                    },
                    required: ["type", "title", "description"]
                }
            }
        }
    });

    const json = JSON.parse(response.text);
    return json as AIInsight[];
};