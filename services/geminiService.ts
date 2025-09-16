// FIX: Replaced placeholder content with Gemini API service implementation.

import { GoogleGenAI, Type } from "@google/genai";
import type { PurchaseRequest, AIAnalysisResult, Invoice, SalesRepresentative, Supplier, PurchaseRequestItem, SupplierSuggestion } from '../types';

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