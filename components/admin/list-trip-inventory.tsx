"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, FilePenLine, Trash2 } from "lucide-react";
import type { ListTripRecord } from "@/types/list-trip";
export function ListTripInventory({records,canEdit}:{records:ListTripRecord[];canEdit:boolean}){
  const router=useRouter();
  const [search,setSearch]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const filtered=records.filter(r=>[r.draft.name,r.draft.slug,r.draft.location].some(v=>v.toLowerCase().includes(search.toLowerCase())));
  async function remove(record:ListTripRecord){
    if(!window.confirm(`Hapus permanen List Trip "${record.draft.name}"? Tindakan ini tidak menghapus Catalog.`))return;
    setBusy(record.id);setError("");
    try{
      const res=await fetch(`/api/admin/list-trips/${record.id}`,{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"delete",confirmed:true}),
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error??"Hapus gagal.");
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Hapus gagal.");}finally{setBusy("");}
  }
  return <section className="mt-8">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h2 className="font-serif text-3xl">{filtered.length} Master Trip</h2>
      <input className="min-h-11 w-full rounded-xl border border-ink/15 bg-white px-4 text-sm sm:w-80" placeholder="Cari nama atau lokasi trip..." value={search} onChange={e=>setSearch(e.target.value)}/>
    </div>
    {error?<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>:null}
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map(r=><article key={r.id} className="rounded-2xl border border-ink/10 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">{r.status}</span>
          <span className="text-xs text-ink-muted">{r.draft.routes.filter(route=>route.active).length} jalur</span>
        </div>
        <h3 className="mt-3 font-serif text-2xl">{r.draft.name}</h3>
        <p className="mt-1 text-sm text-ink-muted">{r.draft.location||"Lokasi belum diisi"}</p>
        <p className="mt-3 text-xs text-ink-muted">Kategori: {r.draft.categories.join(", ")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {canEdit?<Link href={`/admin/trips/${r.id}/edit`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white"><FilePenLine className="h-4 w-4"/> Edit List Trip</Link>:null}
          {r.status==="published"?<Link href="/trips" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold"><ExternalLink className="h-4 w-4"/> Publik</Link>:null}
          {canEdit?<button type="button" disabled={Boolean(busy)} onClick={()=>remove(r)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4"/> Hapus</button>:null}
        </div>
      </article>)}
    </div>
    {!filtered.length?<p className="mt-6 rounded-2xl border border-dashed border-ink/20 bg-white p-8 text-sm text-ink-muted">Belum ada Master Trip sesuai pencarian.</p>:null}
  </section>;
}
