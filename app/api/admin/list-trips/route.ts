import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/api-auth";
import { createListTrip,getAdminListTrips } from "@/services/list-trips";

export async function GET() {
  const auth=await authorizeAdminApi();
  if(!auth.ok)return auth.response;
  try { return NextResponse.json({records:await getAdminListTrips()}); }
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Gagal memuat List Trip."},{status:500});}
}
export async function POST(request:Request){
  const auth=await authorizeAdminApi(["ADMIN","EDITOR"]);
  if(!auth.ok)return auth.response;
  const body=await request.json().catch(()=>null);
  if(body?.action!=="create"||!body.payload)
    return NextResponse.json({error:"Payload tidak valid."},{status:400});
  try {return NextResponse.json({record:await createListTrip(body.payload)},{status:201});}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Gagal membuat trip."},{status:400});}
}
