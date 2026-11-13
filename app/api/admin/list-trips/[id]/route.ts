import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/api-auth";
import { changeListTripStatus,getAdminListTrip,saveListTripDraft } from "@/services/list-trips";

type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){
  const auth=await authorizeAdminApi();
  if(!auth.ok)return auth.response;
  const {id}=await params;
  const record=await getAdminListTrip(id);
  return record?NextResponse.json({record}):NextResponse.json({error:"Trip tidak ditemukan."},{status:404});
}
export async function PATCH(request:Request,{params}:Context){
  const auth=await authorizeAdminApi(["ADMIN","EDITOR"]);
  if(!auth.ok)return auth.response;
  const {id}=await params;
  const body=await request.json().catch(()=>null);
  const action=body?.action;
  const actions=["save-draft","publish","unpublish","archive","restore","delete"];
  if(!actions.includes(action))return NextResponse.json({error:"Action tidak valid."},{status:400});
  if(action!=="save-draft"&&body.confirmed!==true)
    return NextResponse.json({error:"Konfirmasi wajib."},{status:400});
  try {
    const record=action==="save-draft"
      ? await saveListTripDraft(id,body.payload)
      : await changeListTripStatus(id,action);
    return NextResponse.json({record,message:"Perubahan List Trip disimpan."});
  } catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Aksi gagal."},{status:400});
  }
}
