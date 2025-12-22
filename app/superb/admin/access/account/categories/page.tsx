import { createClient } from "@/lib/supabase/server";
import CategoryManagement from "@/components/admin/CategoryManagement";

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");

  return data || [];
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Category Management
        </h1>
        <p className="text-gray-400">
          Create, edit, and manage product categories
        </p>
      </div>
      <CategoryManagement initialCategories={categories} />
    </div>
  );
}
