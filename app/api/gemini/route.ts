import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment variables");
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured. Please check your .env.local file.",
        },
        { status: 500 }
      );
    }

    if (!genAI) {
      return NextResponse.json(
        { error: "Gemini AI client initialization failed" },
        { status: 500 }
      );
    }

    const { query } = await request.json();

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
      .gt("stock", 0);

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ productIds: [] });
    }

    // Prepare product data for Gemini
    const productsData = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category?.name || "",
      brand: product.brand?.name || "",
      tags: product.tags?.map((pt: any) => pt.tag?.name).filter(Boolean) || [],
    }));

    // Create a prompt for Gemini
    const prompt = `You are an AI assistant helping customers find products in an e-commerce store.

Available products:
${JSON.stringify(productsData, null, 2)}

User query: "${query}"

Analyze the user's query and identify which products match their needs. Consider:
- Product name and description
- Category
- Brand
- Tags
- Price range (if mentioned)
- Use case or requirements mentioned

Return ONLY a JSON array of product IDs that match the query, ordered by relevance (most relevant first).
If no products match, return an empty array [].

Format your response as a valid JSON array of strings, for example: ["id1", "id2", "id3"]
Do not include any explanation or additional text, only the JSON array.`;

    // Get the Gemini model
    // Using gemini-pro as the stable model name
    const modelName = process.env.GEMINI_MODEL || "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelName });

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
      // If Gemini API fails, fall back to text search
      console.log("Falling back to text-based search");
      const searchLower = query.toLowerCase();
      const fallbackIds = products
        .filter((product: any) => {
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.category?.name?.toLowerCase().includes(searchLower) ||
            product.brand?.name?.toLowerCase().includes(searchLower)
          );
        })
        .map((p: any) => p.id);

      return NextResponse.json({ productIds: fallbackIds });
    }

    // Parse the response (remove markdown code blocks if present)
    let productIds: string[] = [];
    try {
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      productIds = JSON.parse(cleanedText);

      // Validate that productIds is an array
      if (!Array.isArray(productIds)) {
        productIds = [];
      }

      // Filter to only include valid product IDs that exist in our database
      const validProductIds = products.map((p: any) => p.id);
      productIds = productIds.filter((id: string) =>
        validProductIds.includes(id)
      );
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Response text:", text);
      // Fallback: try to extract product IDs using text search
      productIds = products
        .filter((product: any) => {
          const searchLower = query.toLowerCase();
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.category?.name?.toLowerCase().includes(searchLower) ||
            product.brand?.name?.toLowerCase().includes(searchLower)
          );
        })
        .map((p: any) => p.id);
    }

    return NextResponse.json({ productIds });
  } catch (error: any) {
    console.error("Error in Gemini API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
