import { createClient } from "@supabase/supabase-js";
import type { TripCategory } from "@/types/catalog";
import { SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = {id:string;slug:string;name:string;sort_order:number;is_active:boolean};
const map=(row:Row):TripCategory=>({
  id:row.id,slug:row.slug,name:row.name,sortOrder:row.sort_order,isActive:row.is_active,
});
export async function getPublicListTripCategories():Promise<TripCategory[]>{
  if(!SUPABASE_URL||!SUPABASE_PUBLISHABLE_KEY)return [];
  const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  const {data,error}=await client.from("list_trip_categories")
    .select("id,slug,name,sort_order,is_active").eq("is_active",true).order("sort_order");
  if(error)throw new Error(error.message);
  return (data as Row[]).map(map);
}
export async function getAdminListTripCategories():Promise<TripCategory[]>{
  const client=await createSupabaseServerClient();
  if(!client)throw new Error("Supabase tidak dikonfigurasi.");
  const {data,error}=await client.from("list_trip_categories")
    .select("id,slug,name,sort_order,is_active").order("sort_order");
  if(error)throw new Error(error.message);
  return (data as Row[]).map(map);
}
