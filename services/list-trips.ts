import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseListTrip } from "@/lib/list-trip-validation";
import type { ListTrip, ListTripRecord } from "@/types/list-trip";

type TripRow = {
  id: string; slug: string; publication_status: "draft"|"published"|"archived";
  draft_payload: ListTrip; published_payload: ListTrip | null;
  draft_version: number; published_version: number; updated_at: string;
};

function toRecord(row: TripRow): ListTripRecord {
  return {
    id: row.id, slug: row.slug,status: row.publication_status,
    draft: parseListTrip(row.draft_payload),
    published: row.published_payload ? parseListTrip(row.published_payload) : null,
    draftVersion: row.draft_version,publishedVersion: row.published_version,updatedAt:row.updated_at,
  };
}
function invalidate() {
  revalidatePath("/","page");
  revalidatePath("/trips","page");
  revalidatePath("/admin/trips","page");
}
async function adminClient() {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi.");
  return client;
}
export async function getPublicListTrips(): Promise<ListTrip[]> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return [];
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const {data,error} = await client.from("list_trips")
    .select("published_payload").eq("publication_status","published").not("published_payload","is",null);
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    try { return [parseListTrip(row.published_payload)]; }
    catch (error) { console.error("Invalid published List Trip skipped",error);return []; }
  }).sort((a,b)=>a.name.localeCompare(b.name,"id"));
}
export async function getAdminListTrips(): Promise<ListTripRecord[]> {
  const client = await adminClient();
  const {data,error} = await client.from("list_trips").select("*").order("updated_at",{ascending:false});
  if (error) throw new Error(error.message);
  return (data as TripRow[]).map(toRecord);
}
export async function getAdminListTrip(id: string): Promise<ListTripRecord | null> {
  const client = await adminClient();
  const {data,error} = await client.from("list_trips").select("*").eq("id",id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as TripRow) : null;
}
export async function createListTrip(input: unknown): Promise<ListTripRecord> {
  const trip = parseListTrip(input);
  const draft = parseListTrip({...trip,publicationStatus:"draft"});
  const client = await adminClient();
  const {data,error} = await client.from("list_trips").insert({
    id:draft.id,slug:draft.slug,publication_status:"draft",draft_payload:draft,
    published_payload:null,draft_version:1,published_version:0,
  }).select("*").single();
  if (error) throw new Error(error.message);
  invalidate();
  return toRecord(data as TripRow);
}
export async function saveListTripDraft(id: string, input: unknown): Promise<ListTripRecord> {
  const current = await getAdminListTrip(id);
  if (!current) throw new Error("Trip tidak ditemukan.");
  const inputTrip = parseListTrip(input);
  if (inputTrip.id !== id) throw new Error("ID trip tidak boleh berubah.");
  const draft = parseListTrip({...inputTrip,publicationStatus:"draft",updatedAt:new Date().toISOString()});
  const client = await adminClient();
  const {data,error} = await client.from("list_trips").update({
    draft_payload:draft,
    // A published slug must stay stable until publishing the new snapshot.
    slug:current.status==="published" ? current.slug : draft.slug,
    draft_version:current.draftVersion+1,updated_at:new Date().toISOString(),
  }).eq("id",id).eq("draft_version",current.draftVersion).select("*").single();
  if (error) throw new Error(error.message);
  invalidate();
  return toRecord(data as TripRow);
}
export async function changeListTripStatus(id:string,action:"publish"|"unpublish"|"archive"|"restore"|"delete") {
  const current = await getAdminListTrip(id);
  if (!current) throw new Error("Trip tidak ditemukan.");
  const client = await adminClient();
  if (action==="delete") {
    const {error}=await client.from("list_trips").delete().eq("id",id);
    if(error) throw new Error(error.message);
    invalidate();
    return null;
  }
  const now = new Date().toISOString();
  let patch: Record<string,unknown>;
  if(action==="publish"){
    const published=parseListTrip({...current.draft,publicationStatus:"published",updatedAt:now});
    patch={publication_status:"published",published_payload:published,slug:published.slug,
      published_version:current.draftVersion,published_at:now,updated_at:now};
  } else if (action==="unpublish") {
    patch={publication_status:"draft",published_payload:null,published_at:null,updated_at:now};
  } else if (action==="archive"){
    patch={publication_status:"archived",published_payload:null,published_at:null,updated_at:now};
  } else {
    patch={publication_status:"draft",published_payload:null,published_at:null,updated_at:now};
  }
  const {data,error}=await client.from("list_trips").update(patch).eq("id",id).select("*").single();
  if(error) throw new Error(error.message);
  invalidate();
  return toRecord(data as TripRow);
}
