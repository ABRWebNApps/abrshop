import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured - use process.env directly
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is missing from environment variables");
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured. Please check your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Re-initialize genAI with the API key to ensure it's fresh
    const genAIInstance = new GoogleGenerativeAI(geminiApiKey);

    console.log("Using GEMINI_API_KEY:", geminiApiKey.substring(0, 10) + "...");

    const { query, conversationHistory = [] } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Fetch all products from database
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products")
      .select(
        "*, category:categories(*), brand:brands(*), tags:product_tags(tag:tags(*))"
      )
      .gt("stock", 0)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        message: "I'm sorry, we don't have any products available right now.",
        products: [],
        clarifyingQuestion: null,
        recommendations: [],
      });
    }

    // Prepare product data for Gemini
    const productsData = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock: product.stock,
      category: product.category?.name || "",
      brand: product.brand?.name || "",
      tags: product.tags?.map((pt: any) => pt.tag?.name).filter(Boolean) || [],
      images: product.images || [],
    }));

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map((msg: Message) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Create enhanced prompt for conversational AI
    const prompt = `You are a friendly, helpful shopping assistant for an e-commerce store. Your goal is to help customers find products through natural conversation.

Available products (${productsData.length} total):
${JSON.stringify(productsData, null, 2)}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

User's current query: "${query}"

Your task:
1. Analyze the user's query to understand their needs (product type, budget, use case, preferences)
2. Find matching products from the available products list - ALWAYS return products if available
3. Priority order:
   a) Exact matches (product type + budget match) - return as "primaryMatches"
   b) Product type matches (ignore budget if no exact matches) - return as "primaryMatches"
   c) Similar/related products - return as "recommendations"
4. If query is vague, you can ask a clarifying question BUT still return some products
5. Generate a friendly, conversational response message

Response format (JSON only, no markdown):
{
  "message": "Your friendly response message here. Be conversational and helpful!",
  "clarifyingQuestion": "One question if query is vague, or null if clear",
  "primaryMatches": ["productId1", "productId2", ...], // Up to 5 product IDs - ALWAYS include if products exist
  "recommendations": ["productId1", "productId2", ...], // 2-3 alternative product IDs
  "needsClarification": true/false
}

CRITICAL RULES:
- ALWAYS return at least 3-5 products in "primaryMatches" if any products exist in the database
- If user mentions a budget but no products match that budget, IGNORE the budget and return products of the same type
- Example: User says "laptop under $2000" but no laptops under $2000 exist → return laptops anyway (ignore price)
- If user asks for "laptop for video editing" → return ALL laptops, prioritize ones with better specs
- NEVER return empty "primaryMatches" if products exist - always find something relevant
- Be flexible: if exact match not found, return similar products
- Be warm, helpful, and conversational - like a real store assistant
- Always return valid JSON, no explanations outside the JSON`;

    // Get the Gemini model
    const modelName = process.env.GEMINI_MODEL || "gemini-pro";
    const model = genAIInstance.getGenerativeModel({ model: modelName });

    // Generate response
    let result;
    let response;
    let text;

    try {
      result = await model.generateContent(prompt);
      response = await result.response;
      text = response.text();
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError);
      // Fallback to simple text search
      return fallbackSearch(query, products, productsData);
    }

    // Parse the response
    let aiResponse: any = {};
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      aiResponse = JSON.parse(cleanedText);
      console.log(
        "Gemini response parsed successfully. Primary matches:",
        aiResponse.primaryMatches?.length || 0,
        "Recommendations:",
        aiResponse.recommendations?.length || 0
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Response text:", text);
      return fallbackSearch(query, products, productsData);
    }

    // Validate and filter product IDs
    const validProductIds = products.map((p: any) => p.id);

    let primaryMatches = (aiResponse.primaryMatches || [])
      .filter((id: string) => validProductIds.includes(id))
      .slice(0, 5);

    let recommendations = (aiResponse.recommendations || [])
      .filter(
        (id: string) =>
          validProductIds.includes(id) && !primaryMatches.includes(id)
      )
      .slice(0, 3);

    // CRITICAL: If no products returned, use intelligent fallback search
    if (primaryMatches.length === 0 && recommendations.length === 0) {
      console.log(
        "⚠️ No products from AI response, using intelligent fallback..."
      );
      const fallbackResults = intelligentFallbackSearch(
        query,
        products,
        productsData
      );
      primaryMatches = fallbackResults.primaryMatches;
      recommendations = fallbackResults.recommendations;
      console.log(
        "✅ Fallback found",
        primaryMatches.length,
        "primary matches and",
        recommendations.length,
        "recommendations"
      );
    } else if (primaryMatches.length === 0 && recommendations.length > 0) {
      // Use recommendations as primary matches if no primary matches
      console.log("⚠️ No primary matches, using recommendations as primary");
      primaryMatches = recommendations.slice(0, 5);
      recommendations = [];
    } else if (primaryMatches.length === 0) {
      // Last resort: get any products related to the query
      console.log("⚠️ No primary matches found, using intelligent fallback...");
      const fallbackResults = intelligentFallbackSearch(
        query,
        products,
        productsData
      );
      primaryMatches = fallbackResults.primaryMatches;
      recommendations = fallbackResults.recommendations;
      console.log("✅ Fallback found", primaryMatches.length, "matches");
    }

    console.log(
      "📦 Final product counts - Primary:",
      primaryMatches.length,
      "Recommendations:",
      recommendations.length
    );

    // Get full product data for matches
    const matchedProducts = primaryMatches
      .map((id: string) => products.find((p: any) => p.id === id))
      .filter(Boolean);

    const recommendedProducts = recommendations
      .map((id: string) => products.find((p: any) => p.id === id))
      .filter(Boolean);

    // Ensure we always return products if available
    if (matchedProducts.length === 0 && products.length > 0) {
      // Absolute fallback: return first 5 products
      console.log("Absolute fallback: returning first 5 products");
      const fallbackProducts = products.slice(0, 5);
      return NextResponse.json({
        message:
          aiResponse.message ||
          "Here are some products you might be interested in!",
        clarifyingQuestion: aiResponse.clarifyingQuestion || null,
        needsClarification: false,
        products: fallbackProducts,
        recommendations: [],
      });
    }

    return NextResponse.json({
      message: aiResponse.message || "I found some great options for you!",
      clarifyingQuestion: aiResponse.clarifyingQuestion || null,
      needsClarification: aiResponse.needsClarification || false,
      products: matchedProducts,
      recommendations: recommendedProducts,
    });
  } catch (error: any) {
    console.error("Error in Gemini chat API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Intelligent fallback search function - flexible with price constraints
function intelligentFallbackSearch(
  query: string,
  products: any[],
  productsData: any[]
): { primaryMatches: string[]; recommendations: string[] } {
  const searchLower = query.toLowerCase();

  // Extract budget if mentioned
  const budgetMatch = query.match(
    /(?:under|below|less than|around|about|up to|maximum|max)\s*[₦$]?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  const budget = budgetMatch
    ? parseFloat(budgetMatch[1].replace(/,/g, ""))
    : null;

  // Extract product type keywords
  const productKeywords = [
    "laptop",
    "computer",
    "pc",
    "notebook",
    "phone",
    "smartphone",
    "mobile",
    "watch",
    "smartwatch",
    "wearable",
    "keyboard",
    "mouse",
    "monitor",
    "display",
    "headphone",
    "earphone",
    "speaker",
    "camera",
    "tablet",
    "accessory",
    "gadget",
  ];

  const detectedType = productKeywords.find((keyword) =>
    searchLower.includes(keyword)
  );

  // Step 1: Try exact match with budget
  let filtered = products.filter((product: any) => {
    const matchesText =
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower) ||
      product.category?.name?.toLowerCase().includes(searchLower) ||
      product.brand?.name?.toLowerCase().includes(searchLower) ||
      product.tags?.some((pt: any) =>
        pt.tag?.name?.toLowerCase().includes(searchLower)
      );

    const matchesBudget = budget ? parseFloat(product.price) <= budget : true;
    const matchesType = detectedType
      ? product.name.toLowerCase().includes(detectedType) ||
        product.description.toLowerCase().includes(detectedType) ||
        product.category?.name?.toLowerCase().includes(detectedType)
      : true;

    return matchesText && matchesBudget && matchesType;
  });

  // Step 2: If no results with budget, try without budget constraint
  if (filtered.length === 0 && budget && detectedType) {
    filtered = products.filter((product: any) => {
      const matchesType =
        product.name.toLowerCase().includes(detectedType) ||
        product.description.toLowerCase().includes(detectedType) ||
        product.category?.name?.toLowerCase().includes(detectedType);
      return matchesType;
    });
  }

  // Step 3: If still no results, try broader text search
  if (filtered.length === 0) {
    filtered = products.filter((product: any) => {
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category?.name?.toLowerCase().includes(searchLower) ||
        product.brand?.name?.toLowerCase().includes(searchLower)
      );
    });
  }

  // Step 4: Last resort - return products from same category or any products
  if (filtered.length === 0 && detectedType) {
    filtered = products.filter((product: any) => {
      return (
        product.category?.name?.toLowerCase().includes(detectedType) ||
        product.name.toLowerCase().includes(detectedType)
      );
    });
  }

  // Final fallback: return any products
  if (filtered.length === 0) {
    filtered = products.slice(0, 10);
  }

  const primaryMatches = filtered.slice(0, 5).map((p: any) => p.id);
  const recommendations = filtered.slice(5, 8).map((p: any) => p.id);

  return { primaryMatches, recommendations };
}

// Legacy fallback search function (kept for compatibility)
function fallbackSearch(
  query: string,
  products: any[],
  productsData: any[]
): NextResponse {
  const result = intelligentFallbackSearch(query, products, productsData);

  const matchedProducts = result.primaryMatches
    .map((id: string) => products.find((p: any) => p.id === id))
    .filter(Boolean);

  const recommendedProducts = result.recommendations
    .map((id: string) => products.find((p: any) => p.id === id))
    .filter(Boolean);

  let message = "I found some options for you!";
  if (matchedProducts.length === 0) {
    message = "Here are some products you might be interested in!";
  }

  return NextResponse.json({
    message,
    clarifyingQuestion: null,
    needsClarification: false,
    products: matchedProducts,
    recommendations: recommendedProducts,
  });
}
