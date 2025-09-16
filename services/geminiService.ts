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
                vendorName: 'Mock Vendor',
                invoiceNumber: `MV-${Date.now()}`,
                invoiceDate: new Date().toISOString().split('T')[0],
                totalAmount: Math.floor(Math.random() * 2000) + 500,
                 items: [
                    { itemName: 'Luxury Bath Towels', price: 24, unit: 'piece', category: 'Linens' },
                    { itemName: 'High-Quality Coffee Beans', price: 45, unit: 'kg', category: 'F&B' },
                ],
                salesRepresentative: {
                    name: "Mock Rep",
                    contact: "0500000000"
                }
            },
            duplicateCheck: {
                isDuplicate: false,
                reason: 'This is a mock response. No duplicate check performed.',
            },
            priceCheck: {
                overallAssessment: 'Mock analysis: Prices are generally reasonable, though one item is slightly above the estimated market rate.',
                priceAnalysis: [
                    { itemName: 'Luxury Bath Towels', price: 24, isOverpriced: false, marketPriceComparison: 'Price is within the expected range (SAR 22-26).' },
                    { itemName: 'High-Quality Coffee Beans', price: 45, isOverpriced: true, marketPriceComparison: 'Slightly above average market price. Expected range is SAR 38-42.' },
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
            Analyze this invoice for a hotel procurement system.
            1. Extract the vendor name, invoice number, invoice date, total amount, and a list of items.
            2. For each item, extract its name, price, unit, and determine its category from this list: F&B, Maintenance, Linens, Engineering, Housekeeping, Furniture, Plumbing & Heating, Electrical, Painting & Decoration.
            3. If you find a sales representative's name and contact number on the invoice, extract it into the 'salesRepresentative' object.
            4. Check if this invoice is a potential duplicate. Here is a list of existing invoice numbers: ${JSON.stringify(existingInvoices.map(inv => inv.invoiceNumber))}. An invoice is a duplicate if it has the same invoice number as an existing one.
            5. For each item, act as a procurement specialist. Estimate a reasonable market price range in SAR (e.g., "SAR 100-120"). Compare the item's price to this range. In the 'marketPriceComparison' field, state if the price is reasonable, high, or low, and YOU MUST include the estimated price range you used for comparison.
            6. Based on the individual item analysis, provide a brief, one-sentence overall assessment of the invoice's pricing in the 'overallAssessment' field.
            Return the result in JSON format.
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
            { supplierName: suppliers[0]?.name || 'Mock F&B Supplier', justification: 'Recommended for F&B items based on their category.' },
            { supplierName: suppliers[1]?.name || 'Mock Maintenance Supplier', justification: 'This supplier specializes in maintenance and engineering parts.' }
        ]);
    }

    const model = 'gemini-2.5-flash';

    const prompt = `
        As a procurement expert for a hotel chain, your task is to recommend the best suppliers for a given purchase request.
        
        Here are the items in the current purchase request:
        ${JSON.stringify(items.map(item => ({ name: item.name, category: item.category, quantity: item.quantity })), null, 2)}

        Here is the list of available suppliers for the hotel's branch:
        ${JSON.stringify(suppliers.map(s => ({ name: s.name, category: s.category, notes: s.notes })), null, 2)}

        Based on the item categories and supplier specializations, please recommend up to 3 of the most suitable suppliers from the provided list. 
        For each recommendation, provide a brief justification explaining why they are a good fit (e.g., "specializes in F&B", "is a national distributor for maintenance parts", "has positive notes for this branch").
        
        Return the result as a JSON array.
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
        return Promise.resolve(`This is a mock AI analysis for ${branchName} for ${month}.
- Overall spending seems to be focused on Maintenance.
- Suggest exploring bulk discounts for frequently purchased items like 'LED Light Bulbs'.
- No major anomalies detected.`);
    }


    const model = 'gemini-2.5-flash';
    
    const simplifiedRequests = requests.map(r => ({
        department: r.department,
        totalCost: r.totalEstimatedCost,
        items: r.items.map(i => ({ name: i.name, cost: i.estimatedCost, quantity: i.quantity }))
    }));

    const prompt = `
        Generate a concise monthly expense report analysis for ${branchName} for the month of ${month}.
        Based on the following purchase request data, provide key insights, identify spending trends, and suggest potential cost-saving opportunities.
        Keep the analysis to 3-4 bullet points. Be insightful and brief.

        Data:
        ${JSON.stringify(simplifiedRequests, null, 2)}
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return response.text;
};