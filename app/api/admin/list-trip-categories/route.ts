import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminApi } from "@/lib/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminListTripCategories } from "@/services/list-trip-categories";

const schema=z.object({
  id:z.string().trim().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(80).optional(),
  slug:z.string().trim().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).max(80),
  name:z.string().trim().min(2).max(80),
  sortOrder:z.number().int().min(1).max(9999),
  isActive:z.boolean(),
});
export async function GET(){
  const auth=await authorizeAdminApi();if(!auth.ok)return auth.response;
  return NextResponse.json({categories:await getAdminListTripCategories()});
}
export async function POST(request:Request){return mutate(request,"create");}
export async function PATCH(request:Request){return mutate(request,"update");}
export async function DELETE(request:Request){return mutate(request,"delete");}

async function mutate(request:Request,action:"create"|"update"|"delete"){
  const auth=await authorizeAdminApi(["ADMIN"]);if(!auth.ok)return auth.response;
  const client=await createSupabaseServerClient();
  if(!client)return NextResponse.json({error:"Supabase tidak tersedia."},{status:503});
  const body=await request.json().catch(()=>null);
  if(action==="delete"){
    const id=z.string().min(1).safeParse(body?.id);
    if(!id.success)return NextResponse.json({error:"ID wajib."},{status:400});
    const {data:category}=await client.from("list_trip_categories").select("slug").eq("id",id.data).maybeSingle();
    if(!category)return NextResponse.json({error:"Kategori tidak ditemukan."},{status:404});
    const {data:trips,error:readError}=await client.from("list_trips").select("draft_payload,published_payload");
    if(readError)return NextResponse.json({error:readError.message},{status:500});
    const used=(trips??[]).some((row)=>
      [row.draft_payload,row.published_payload].some((trip)=>
        trip && (trip.categories?.includes(category.slug)||trip.category===category.slug)));
    if(used)return NextResponse.json({error:"Kategori sedang digunakan oleh List Trip. Nonaktifkan saja."},{status:409});
    const {error}=await client.from("list_trip_categories").delete().eq("id",id.data);
    return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});
  }
  const parsed=schema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??"Input tidak valid."},{status:400});
  const {id,slug,name,sortOrder,isActive}=parsed.data;
  const values={slug,name,sort_order:sortOrder,is_active:isActive,updated_at:new Date().toISOString()};
  if(action==="create"){
    const {error}=await client.from("list_trip_categories").insert({id:id??slug,...values});
    return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true},{status:201});
  }
  if(!id)return NextResponse.json({error:"ID wajib."},{status:400});
  const {data:original}=await client.from("list_trip_categories").select("slug").eq("id",id).maybeSingle();
  if(!original)return NextResponse.json({error:"Kategori tidak ditemukan."},{status:404});
  if(original.slug!==slug)return NextResponse.json({error:"Slug tidak dapat diubah."},{status:409});
  const {error}=await client.from("list_trip_categories").update(values).eq("id",id);
  return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({ok:true});
}
