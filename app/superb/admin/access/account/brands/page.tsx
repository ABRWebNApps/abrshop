import { createClient } from "@/lib/supabase/server";
import BrandManagement from "@/components/admin/BrandManagement";

async function getBrands() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");

  return data || [];
}

async function getCategories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");

  return data || [];
}

export default async function BrandsPage() {
  const brands = await getBrands();
  const categories = await getCategories();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Brand Management</h1>
        <p className="text-gray-400">Create, edit, and manage product brands</p>
      </div>
      <BrandManagement initialBrands={brands} categories={categories} />
    </div>
  );
}
