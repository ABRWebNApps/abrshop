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

    // Fetch all products and categories from database
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

    // Fetch all categories for better product matching
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
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
      category_id: product.category_id || "",
      brand: product.brand?.name || "",
      brand_id: product.brand_id || "",
      tags: product.tags?.map((pt: any) => pt.tag?.name).filter(Boolean) || [],
      images: product.images || [],
    }));

    // Prepare categories data for better matching
    const categoriesData = (categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    }));

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map((msg: Message) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // Create enhanced prompt for conversational AI
    const prompt = `You are Athena, a smart and innovative AI shopping assistant for a tech-focused e-commerce store in Nigeria. Your goal is to help customers find tech products through natural conversation, understanding both Pidgin English and proper English.

IMPORTANT: This is a TECH STORE - we only sell technology products like:
- Laptops, computers, notebooks
- Smartphones, phones, mobile devices
- Earpieces, headphones, earphones, wireless earbuds, Bluetooth earpieces
- Smartwatches, wearables
- Keyboards, mice, monitors, displays
- Tech accessories and gadgets
- Gaming equipment

We DO NOT sell: clothes, shoes, cooking items, gifts, furniture, or non-tech products.

PRODUCT TYPE KEYWORDS (understand these in both English and Pidgin):
- Earpiece/earphone/headphone: "earpiece", "earphone", "headphone", "wireless earpiece", "Bluetooth earpiece", "ear piece", "ear piece for phone"
- Phone/smartphone: "phone", "smartphone", "mobile", "android phone", "iPhone"
- Laptop/computer: "laptop", "computer", "pc", "notebook", "lappy"
- Watch: "watch", "smartwatch", "wearable"
- Monitor/display: "monitor", "display", "screen"
- Keyboard/mouse: "keyboard", "mouse", "keypad"
- USB-C/cable/accessory: "usb-c", "usb c", "usb-c cable", "cable", "charger", "adapter"

SPECIFIC FILTERING RULES:
- If user says "android phone" → return ONLY Android phones, EXCLUDE Apple/iPhone products
- If user says "iPhone" or "Apple phone" → return ONLY Apple/iPhone products, EXCLUDE Android
- If user says "USB-C" → prioritize products with "USB-C" in name/description
- If user says "laptop" → return ONLY laptops/computers, NOT headphones or other accessories

Available categories:
${JSON.stringify(categoriesData, null, 2)}

Available products (${productsData.length} total):
${JSON.stringify(productsData, null, 2)}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

User's current query: "${query}"

Your task:
1. FIRST: Identify the EXACT product type the user wants (earpiece, phone, laptop, etc.)
   - Use the AVAILABLE CATEGORIES list to understand product categories
   - Match user query to the most relevant category from the categories list
   - Understand queries in BOTH Pidgin English and proper English
   - "I need wireless earpiece" = earpiece/earphone/headphone products ONLY
   - "Show me phones" = smartphone/phone products ONLY
   - "I want laptop" = laptop/computer products ONLY
   - DO NOT confuse product types (earpiece ≠ phone, phone ≠ earpiece)

2. SECOND: Find EXACT matches first:
   a) Products that match the EXACT product type mentioned
   b) Use category matching - if user mentions a category name, prioritize products in that category
   c) If budget mentioned, prioritize products within budget
   d) Return these as "primaryMatches" (up to 5 products)

3. THIRD: Only if no exact matches exist, find alternatives:
   a) Similar product types (e.g., if no earpieces, suggest headphones)
   b) Products from related categories
   c) Return these as "recommendations" (2-3 products)

4. ACCURACY IS CRITICAL:
   - Use category information to improve matching accuracy
   - If user asks for "earpiece" → return EARPIECE products, NOT phones
   - If user asks for "phone" → return PHONE products, NOT earpieces
   - Match product type FIRST, then consider category, then other factors
   - Check product name, description, category, and tags for product type

5. Generate a friendly, conversational response message (ALWAYS mix Pidgin English with proper English)
   - NEVER use the same response twice - be creative and varied
   - Use different phrases each time you respond
   - Mix Pidgin and English naturally and differently each time

Response format (JSON only, no markdown):
{
  "message": "Your friendly response message here. ALWAYS mix Pidgin English with proper English like a proper Nigerian - be professional but relatable!",
  "clarifyingQuestion": "One question if query is vague, or null if clear",
  "primaryMatches": ["productId1", "productId2", ...], // Up to 5 product IDs - EXACT matches first
  "recommendations": ["productId1", "productId2", ...], // 2-3 alternative product IDs - only if no exact matches
  "needsClarification": true/false
}

CRITICAL ACCURACY RULES:
- ACCURACY FIRST: Match the EXACT product type the user wants before anything else
- PRIORITIZE EXACT MATCHES: Products with exact keywords in name should come FIRST
- If user says "USB-C" → return products with "USB-C" in name FIRST, then description matches
- If user says "android phone" → return ONLY Android phones, EXCLUDE Apple/iPhone completely
- If user says "earpiece" → return EARPIECE/HEADPHONE products ONLY, never phones
- If user says "phone" → return PHONE/SMARTPHONE products ONLY, never earpieces
- If user says "laptop" → return LAPTOP/COMPUTER products ONLY, NOT headphones or accessories
- SORT BY RELEVANCE: Exact name matches first, then description matches, then category matches
- Check product names, descriptions, categories, and tags to identify product type
- ALWAYS return at least 3-5 products in "primaryMatches" if matching products exist
- If user mentions a budget but no products match that budget, IGNORE the budget and return products of the same type
- NEVER return wrong product types (e.g., phones when user asks for earpieces, headphones when asking for laptops)
- NEVER return duplicate products
- Use Naira (₦) currency, not dollars ($)
- ALWAYS mix Pidgin English with proper English in responses - be VARIED and DYNAMIC:
  * CRITICAL: NEVER repeat the same response message - always generate a NEW, UNIQUE response
  * Vary your responses - don't use the same phrase every time, even if the products are similar
  * Use different phrases each time: "I found some options for you", "Check these out", "Here's what I found", "These should work for you", "I found exactly what you're looking for", "Check these products", "Here are some good options"
  * Tone: Professional but relatable - mix Pidgin and English naturally but avoid overly dramatic endings like "o!"
  * Examples: "I found some options for you", "Check these out - they look good", "Here's what I found", "These should work well for you"
  * Be creative and natural - mix Pidgin and English naturally and differently each response
  * Avoid ending messages with "o!" - it's too dramatic
  * Generate a UNIQUE message every single time - never copy previous responses
- Be warm, helpful, and conversational - like a real Nigerian tech store assistant
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
      return fallbackSearch(query, products, productsData, categories);
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
      return fallbackSearch(query, products, productsData, categories);
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
        productsData,
        categories || undefined
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
        productsData,
        categories || undefined
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

    // Get full product data for matches and sort by relevance
    const matchedProducts = primaryMatches
      .map((id: string) => products.find((p: any) => p.id === id))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Sort by relevance score (exact matches first)
        const scoreA = calculateRelevanceScore(a, query);
        const scoreB = calculateRelevanceScore(b, query);
        return scoreB - scoreA; // Higher score first
      });

    const recommendedProducts = recommendations
      .map((id: string) => products.find((p: any) => p.id === id))
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const scoreA = calculateRelevanceScore(a, query);
        const scoreB = calculateRelevanceScore(b, query);
        return scoreB - scoreA;
      });

    // Ensure we always return products if available
    if (matchedProducts.length === 0 && products.length > 0) {
      // Absolute fallback: return first 5 products
      console.log("Absolute fallback: returning first 5 products");
      const fallbackProducts = products.slice(0, 5);
      // Generate dynamic fallback message
      const fallbackMessages = [
        "I don see some products wey fit interest you! Check am out.",
        "Na these ones I find for you, check am out.",
        "See wetin I get for you here.",
        "I don get some options for you, check am out.",
        "These ones na good options wey I find for you.",
      ];
      const randomMessage =
        fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

      return NextResponse.json({
        message: aiResponse.message || randomMessage,
        clarifyingQuestion: aiResponse.clarifyingQuestion || null,
        needsClarification: false,
        products: fallbackProducts,
        recommendations: [],
      });
    }

    // Generate dynamic response - ensure it's always varied (professional but relatable tone)
    const dynamicMessages = [
      "I found some great options for you",
      "Check these ones out, they're good options",
      "Here are some products I found for you",
      "These ones should work well for you, check them out",
      "I found some products that might interest you",
      "These are the best options I found",
      "I got exactly what you're looking for",
      "Check these products I found for you",
      "Perfect match - here's what I found",
      "These should work well for you, take a look",
      "I found some good options that might interest you",
      "Here are some quality products I found",
      "These are top picks I found for you",
      "I found some options that should suit your needs",
      "Check these out - good products I found",
      "Here are some matches I found",
      "I found these options for you",
      "These products should work for you",
      "Here's what I found",
      "Check these out - they look good",
    ];

    // Use AI response if it exists and is unique, otherwise use random fallback
    let finalMessage = aiResponse.message;

    // If AI response is empty or too generic, use random message
    if (!finalMessage || finalMessage.length < 10) {
      finalMessage =
        dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
    }

    // If AI response matches a common phrase, replace it with random for variety
    const commonPhrases = [
      "i don find some options for you",
      "i found some great options for you",
      "i don find some options",
    ];
    if (
      commonPhrases.some((phrase) =>
        finalMessage.toLowerCase().includes(phrase.toLowerCase())
      )
    ) {
      // 50% chance to replace with random message for variety
      if (Math.random() < 0.5) {
        finalMessage =
          dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
      }
    }
    
    // Remove "o!" endings if present (too dramatic)
    finalMessage = finalMessage.replace(/\s+o!?\s*$/i, "");

    return NextResponse.json({
      message: finalMessage,
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

// Calculate relevance score for product sorting
function calculateRelevanceScore(product: any, query: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = product.name.toLowerCase();
  const descLower = product.description.toLowerCase();
  const categoryLower = product.category?.name?.toLowerCase() || "";
  const brandLower = product.brand?.name?.toLowerCase() || "";

  let score = 0;

  // Exact name match (highest priority)
  if (nameLower === queryLower) score += 100;
  else if (nameLower.includes(queryLower)) score += 50;

  // Query keywords in name
  const queryWords = queryLower.split(/\s+/);
  queryWords.forEach((word) => {
    if (nameLower.includes(word)) score += 20;
    if (descLower.includes(word)) score += 10;
    if (categoryLower.includes(word)) score += 15;
    if (brandLower.includes(word)) score += 5;
  });

  // Specific term matches (USB-C, Android, etc.)
  if (queryLower.includes("usb-c") || queryLower.includes("usb c")) {
    if (
      nameLower.includes("usb-c") ||
      nameLower.includes("usb c") ||
      descLower.includes("usb-c")
    ) {
      score += 80; // High priority for USB-C
    }
  }

  if (queryLower.includes("android")) {
    if (nameLower.includes("android") || descLower.includes("android")) {
      score += 60;
    }
    // Exclude Apple/iPhone
    if (
      nameLower.includes("iphone") ||
      nameLower.includes("apple") ||
      brandLower.includes("apple")
    ) {
      score -= 100; // Heavily penalize Apple products
    }
  }

  if (queryLower.includes("apple") || queryLower.includes("iphone")) {
    if (
      nameLower.includes("apple") ||
      nameLower.includes("iphone") ||
      brandLower.includes("apple")
    ) {
      score += 60;
    }
    // Exclude Android
    if (descLower.includes("android") && !nameLower.includes("android")) {
      score -= 50;
    }
  }

  return score;
}

// Product type mapping for accurate product detection
const productTypeMap: { [key: string]: string[] } = {
  earpiece: [
    "earpiece",
    "ear piece",
    "earphone",
    "headphone",
    "earbud",
    "ear bud",
    "wireless earpiece",
    "bluetooth earpiece",
    "bluetooth earphone",
  ],
  phone: [
    "phone",
    "smartphone",
    "mobile",
    "android phone",
    "iphone",
    "cell phone",
  ],
  laptop: ["laptop", "computer", "pc", "notebook", "lappy"],
  watch: ["watch", "smartwatch", "wearable"],
  monitor: ["monitor", "display", "screen"],
  keyboard: ["keyboard", "keypad"],
  mouse: ["mouse", "computer mouse"],
  speaker: ["speaker", "bluetooth speaker"],
  camera: ["camera", "webcam"],
  tablet: ["tablet", "ipad"],
};

// Intelligent fallback search function - flexible with price constraints
function intelligentFallbackSearch(
  query: string,
  products: any[],
  productsData: any[],
  categories?: any[] | null
): { primaryMatches: string[]; recommendations: string[] } {
  const searchLower = query.toLowerCase();

  // Extract budget if mentioned
  const budgetMatch = query.match(
    /(?:under|below|less than|around|about|up to|maximum|max)\s*[₦$]?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  const budget = budgetMatch
    ? parseFloat(budgetMatch[1].replace(/,/g, ""))
    : null;

  // Detect product type with priority (earpiece should not match phone)
  let detectedType: string | null = null;
  for (const [type, keywords] of Object.entries(productTypeMap)) {
    if (keywords.some((keyword) => searchLower.includes(keyword))) {
      detectedType = type;
      break; // Use first match (most specific)
    }
  }

  // Also check categories for better matching
  let matchingCategory: any = null;
  if (categories && categories.length > 0) {
    matchingCategory = categories.find((cat: any) => {
      const catNameLower = cat.name?.toLowerCase() || "";
      const catSlugLower = cat.slug?.toLowerCase() || "";
      return (
        searchLower.includes(catNameLower) ||
        searchLower.includes(catSlugLower) ||
        catNameLower.includes(searchLower) ||
        (detectedType && catNameLower.includes(detectedType))
      );
    });
  }

  // Check for specific terms like USB-C, Android, etc.
  const hasUSBC =
    searchLower.includes("usb-c") || searchLower.includes("usb c");
  const hasAndroid = searchLower.includes("android");
  const hasApple =
    searchLower.includes("apple") || searchLower.includes("iphone");

  // Step 1: Try exact match with product type and budget
  let filtered = products.filter((product: any) => {
    const productNameLower = product.name.toLowerCase();
    const productDescLower = product.description.toLowerCase();
    const categoryLower = product.category?.name?.toLowerCase() || "";

    // First check if product type matches (CRITICAL for accuracy)
    let matchesType = true;

    // Check category match first if category was detected
    if (matchingCategory) {
      const productCategoryId = product.category_id || "";
      const matchingCategoryId = matchingCategory.id || "";
      if (productCategoryId === matchingCategoryId) {
        matchesType = true; // Category match
      } else {
        matchesType = false; // Wrong category
      }
    } else if (detectedType) {
      const typeKeywords = productTypeMap[detectedType] || [];
      matchesType = typeKeywords.some(
        (keyword) =>
          productNameLower.includes(keyword) ||
          productDescLower.includes(keyword) ||
          categoryLower.includes(keyword) ||
          product.tags?.some((pt: any) =>
            pt.tag?.name?.toLowerCase().includes(keyword)
          )
      );

      // Exclude wrong product types (e.g., if looking for earpiece, exclude phones)
      if (detectedType === "earpiece") {
        const phoneKeywords = productTypeMap.phone || [];
        const isPhone = phoneKeywords.some(
          (keyword) =>
            productNameLower.includes(keyword) ||
            productDescLower.includes(keyword) ||
            categoryLower.includes(keyword)
        );
        if (isPhone) matchesType = false; // Exclude phones when looking for earpieces
      } else if (detectedType === "phone") {
        const earpieceKeywords = productTypeMap.earpiece || [];
        const isEarpiece = earpieceKeywords.some(
          (keyword) =>
            productNameLower.includes(keyword) ||
            productDescLower.includes(keyword) ||
            categoryLower.includes(keyword)
        );
        if (isEarpiece) matchesType = false; // Exclude earpieces when looking for phones
      }
    }

    const matchesText =
      productNameLower.includes(searchLower) ||
      productDescLower.includes(searchLower) ||
      categoryLower.includes(searchLower) ||
      product.brand?.name?.toLowerCase().includes(searchLower) ||
      product.tags?.some((pt: any) =>
        pt.tag?.name?.toLowerCase().includes(searchLower)
      );

    const matchesBudget = budget ? parseFloat(product.price) <= budget : true;

    // Specific filtering for Android/Apple
    if (hasAndroid) {
      const brandLower = product.brand?.name?.toLowerCase() || "";
      const isApple =
        productNameLower.includes("iphone") ||
        productNameLower.includes("apple") ||
        brandLower.includes("apple");
      if (isApple) return false; // Exclude Apple when Android requested
    }

    if (hasApple) {
      const descLower = product.description.toLowerCase();
      const isAndroid =
        descLower.includes("android") && !productNameLower.includes("android");
      if (isAndroid && !productNameLower.includes("iphone")) return false; // Exclude Android when Apple requested
    }

    // USB-C priority
    if (hasUSBC) {
      const productDescLower = product.description.toLowerCase();
      const hasUSBCInProduct =
        productNameLower.includes("usb-c") ||
        productNameLower.includes("usb c") ||
        productDescLower.includes("usb-c");
      if (!hasUSBCInProduct && detectedType) {
        // If USB-C requested but product doesn't have it, lower priority
        // Still include if it matches the product type
      }
    }

    return matchesType && matchesText && matchesBudget;
  });

  // Sort by relevance score
  filtered = filtered.sort((a: any, b: any) => {
    const scoreA = calculateRelevanceScore(a, query);
    const scoreB = calculateRelevanceScore(b, query);
    return scoreB - scoreA;
  });

  // Remove duplicates
  const seenIds = new Set<string>();
  filtered = filtered.filter((product: any) => {
    if (seenIds.has(product.id)) return false;
    seenIds.add(product.id);
    return true;
  });

  // Step 2: If no results with budget, try without budget constraint but keep product type accuracy
  if (filtered.length === 0 && budget && detectedType) {
    const typeKeywords = productTypeMap[detectedType] || [];
    filtered = products.filter((product: any) => {
      const productNameLower = product.name.toLowerCase();
      const productDescLower = product.description.toLowerCase();
      const categoryLower = product.category?.name?.toLowerCase() || "";

      const matchesType = typeKeywords.some(
        (keyword) =>
          productNameLower.includes(keyword) ||
          productDescLower.includes(keyword) ||
          categoryLower.includes(keyword) ||
          product.tags?.some((pt: any) =>
            pt.tag?.name?.toLowerCase().includes(keyword)
          )
      );

      // Exclude wrong product types
      if (detectedType === "earpiece") {
        const phoneKeywords = productTypeMap.phone || [];
        const isPhone = phoneKeywords.some(
          (keyword) =>
            productNameLower.includes(keyword) ||
            productDescLower.includes(keyword) ||
            categoryLower.includes(keyword)
        );
        return matchesType && !isPhone;
      } else if (detectedType === "phone") {
        const earpieceKeywords = productTypeMap.earpiece || [];
        const isEarpiece = earpieceKeywords.some(
          (keyword) =>
            productNameLower.includes(keyword) ||
            productDescLower.includes(keyword) ||
            categoryLower.includes(keyword)
        );
        return matchesType && !isEarpiece;
      }

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

  // Remove duplicates before slicing
  const uniqueFiltered = filtered.filter(
    (product: any, index: number, self: any[]) =>
      index === self.findIndex((p: any) => p.id === product.id)
  );

  const primaryMatches = uniqueFiltered.slice(0, 5).map((p: any) => p.id);
  const recommendations = uniqueFiltered.slice(5, 8).map((p: any) => p.id);

  return { primaryMatches, recommendations };
}

// Legacy fallback search function (kept for compatibility)
function fallbackSearch(
  query: string,
  products: any[],
  productsData: any[],
  categories?: any[] | null
): NextResponse {
  const result = intelligentFallbackSearch(
    query,
    products,
    productsData,
    categories
  );

  const matchedProducts = result.primaryMatches
    .map((id: string) => products.find((p: any) => p.id === id))
    .filter(Boolean);

  const recommendedProducts = result.recommendations
    .map((id: string) => products.find((p: any) => p.id === id))
    .filter(Boolean);

  const fallbackMessages = [
    "I found some options for you",
    "Here are some products I found",
    "Check these out - I found some options",
    "These are some products that might interest you",
  ];
  let message = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  if (matchedProducts.length === 0) {
    const noMatchMessages = [
      "I found some products that might interest you",
      "Here are some options you might like",
      "Check these out - they might work for you",
    ];
    message = noMatchMessages[Math.floor(Math.random() * noMatchMessages.length)];
  }

  return NextResponse.json({
    message,
    clarifyingQuestion: null,
    needsClarification: false,
    products: matchedProducts,
    recommendations: recommendedProducts,
  });
}
