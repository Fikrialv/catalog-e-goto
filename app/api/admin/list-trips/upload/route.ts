import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSafeStorageDestinationId,isSupportedCatalogImageType,MAX_CATALOG_IMAGE_BYTES } from "@/lib/storage";

export async function POST(request:Request){
  const auth=await authorizeAdminApi(["ADMIN","EDITOR"]);
  if(!auth.ok)return auth.response;
  const form=await request.formData();
  const file=form.get("file");
  const id=String(form.get("tripId")??"");
  if(!(file instanceof File)||!isSafeStorageDestinationId(id))
    return NextResponse.json({error:"File atau ID trip tidak valid."},{status:400});
  if(!isSupportedCatalogImageType(file.type)||file.size>MAX_CATALOG_IMAGE_BYTES)
    return NextResponse.json({error:"Gunakan JPG, PNG, WebP atau AVIF maksimal 5 MB."},{status:400});
  const client=await createSupabaseServerClient();
  if(!client)return NextResponse.json({error:"Supabase tidak tersedia."},{status:503});
  const name=file.name.toLowerCase().replace(/[^a-z0-9.]+/g,"-");
  const path=`${id}/${crypto.randomUUID()}-${name}`;
  const {error}=await client.storage.from("list-trip-images").upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false});
  if(error)return NextResponse.json({error:error.message},{status:400});
  const {data}=client.storage.from("list-trip-images").getPublicUrl(path);
  return NextResponse.json({src:data.publicUrl});
}
