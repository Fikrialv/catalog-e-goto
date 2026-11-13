"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import type { TripCategory } from "@/types/catalog";
import type { ListTrip, ListTripRecord } from "@/types/list-trip";

const input="min-h-11 w-full rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const section="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8";
const action="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-semibold hover:border-ink/40 disabled:opacity-50";
function message(error:unknown){return error instanceof Error?error.message:"Operasi gagal.";}

export function ListTripEditor({record,categories,isNew=false}:{
  record:ListTripRecord; categories:TripCategory[];isNew?:boolean;
}){
  const router=useRouter();
  const [trip,setTrip]=useState<ListTrip>(record.draft);
  const [dirty,setDirty]=useState(false);
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  function update<K extends keyof ListTrip>(field:K,value:ListTrip[K]){
    setTrip(t=>({...t,[field]:value}));
    setDirty(true);
    setNotice("");
  }
  async function upload(file:File|undefined,target:"cover"|"gallery"){
    if(!file)return;
    setUploading(true);setError("");
    try{
      const data=new FormData();
      data.set("file",file);data.set("tripId",trip.id);
      const response=await fetch("/api/admin/list-trips/upload",{method:"POST",body:data});
      const result=await response.json();
      if(!response.ok)throw Error(result.error??"Upload gagal.");
      const image={src:result.src as string,alt:trip.name||"Foto perjalanan",sortOrder:target==="cover"?1:trip.gallery.length+1};
      if(target==="cover")update("coverImage",image);
      else update("gallery",[...trip.gallery,image]);
      setNotice("Gambar berhasil diunggah. Klik Simpan draft.");
    }catch(e){setError(message(e));}finally{setUploading(false);}
  }
  async function save(event?:FormEvent){
    event?.preventDefault();
    if(busy||uploading)return;
    setBusy(true);setError("");setNotice("");
    try{
      const endpoint=isNew?"/api/admin/list-trips":`/api/admin/list-trips/${record.id}`;
      const response=await fetch(endpoint,{
        method:isNew?"POST":"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:isNew?"create":"save-draft",payload:trip}),
      });
      const result=await response.json();
      if(!response.ok)throw Error(result.error??"Simpan gagal.");
      setDirty(false);setNotice("Draft List Trip tersimpan. Publish untuk tampil di website.");
      if(isNew)router.replace(`/admin/trips/${result.record.id}/edit`);
      else router.refresh();
    }catch(e){setError(message(e));}finally{setBusy(false);}
  }
  async function act(action:"publish"|"unpublish"|"archive"|"restore"|"delete"){
    if(busy||uploading||dirty){setError("Simpan perubahan draft terlebih dahulu.");return;}
    if(!window.confirm(action==="delete"?"Hapus permanen List Trip ini? Gambar yang pernah diunggah tetap tersimpan.":`Konfirmasi ${action} List Trip?`))return;
    setBusy(true);setError("");
    try{
      const response=await fetch(`/api/admin/list-trips/${record.id}`,{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action,confirmed:true}),
      });
      const result=await response.json();
      if(!response.ok)throw Error(result.error??"Aksi gagal.");
      if(action==="delete")router.replace("/admin/trips");
      else{setNotice(`Aksi ${action} berhasil.`);router.refresh();}
    }catch(e){setError(message(e));}finally{setBusy(false);}
  }
  return <form onSubmit={save} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
    <div className="space-y-6">
      <section className={section}>
        <p className="eyebrow">Master List Trip</p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight text-ink">Informasi destinasi</h2>
        <p className="mt-2 text-sm text-ink-muted">Tidak ada jadwal, harga, atau promo dalam fitur List Trip.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Nama trip
            <input required minLength={2} maxLength={160} className={input} value={trip.name} onChange={e=>update("name",e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Slug URL
            <input required className={input} value={trip.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e=>update("slug",e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Lokasi
            <input className={input} value={trip.location} onChange={e=>update("location",e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">Durasi informasi (opsional)
            <input className={input} value={trip.duration} onChange={e=>update("duration",e.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Deskripsi
            <textarea rows={5} className={input} value={trip.description} onChange={e=>update("description",e.target.value)} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-bold">Kategori List Trip</legend>
            <div className="mt-3 flex flex-wrap gap-3">{categories.filter(cat=>cat.isActive||trip.categories.includes(cat.slug)).map(cat=>
              <label key={cat.id} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold">
                <input type="checkbox" checked={trip.categories.includes(cat.slug)} disabled={!cat.isActive&&!trip.categories.includes(cat.slug)} onChange={e=>{
                  const next=e.target.checked?[...trip.categories,cat.slug]:trip.categories.filter(slug=>slug!==cat.slug);
                  if(!next.length){setError("Pilih minimal satu kategori.");return;}
                  setTrip(t=>({...t,categories:next,category:next[0]}));setDirty(true);
                }}/>{cat.name}
              </label>
            )}</div>
            <Link href="/admin/list-trip-categories" className="mt-3 inline-block text-sm font-bold underline underline-offset-4">Kelola kategori List Trip</Link>
          </fieldset>
        </div>
      </section>
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="eyebrow">Pilihan jalur</p><h2 className="mt-2 font-serif text-3xl">Jalur perjalanan</h2></div>
          <button type="button" className={action} onClick={()=>update("routes",[...trip.routes,{id:crypto.randomUUID(),name:"",description:"",active:true}])}><Plus className="h-4 w-4"/> Tambah jalur</button>
        </div>
        <div className="mt-5 grid gap-4">{trip.routes.map((route,index)=>
          <div key={route.id} className="grid gap-3 rounded-2xl bg-paper/70 p-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Nama jalur
              <input required minLength={2} className={input} value={route.name} placeholder="Via Sembalun" onChange={e=>update("routes",trip.routes.map((r,i)=>i===index?{...r,name:e.target.value}:r))}/>
            </label>
            <label className="grid gap-2 text-sm font-semibold">Deskripsi jalur
              <input className={input} value={route.description} onChange={e=>update("routes",trip.routes.map((r,i)=>i===index?{...r,description:e.target.value}:r))}/>
            </label>
            <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={route.active} onChange={e=>update("routes",trip.routes.map((r,i)=>i===index?{...r,active:e.target.checked}:r))}/> Jalur aktif</label>
            <button type="button" className={action} onClick={()=>update("routes",trip.routes.filter((_,i)=>i!==index))}><Trash2 className="h-4 w-4"/> Hapus jalur</button>
          </div>
        )}{!trip.routes.length?<p className="text-sm text-ink-muted">Belum ada jalur. Trip tetap bisa ditampilkan.</p>:null}</div>
      </section>
      <section className={section}>
        <p className="eyebrow">Foto List Trip</p><h2 className="mt-2 font-serif text-3xl">Cover & galeri</h2>
        <p className="mt-2 text-sm text-ink-muted">Upload JPG, PNG, WebP, atau AVIF (maksimal 5 MB per gambar). Gambar disimpan terpisah dari Catalog.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            {trip.coverImage.src?<Image src={trip.coverImage.src} alt={trip.coverImage.alt} width={400} height={250} unoptimized className="h-48 w-full rounded-xl object-cover"/>:
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-ink/20 text-sm text-ink-muted">Cover belum ada</div>}
            <label className="grid gap-2 text-sm font-semibold">Alt text cover
              <input className={input} required value={trip.coverImage.alt} onChange={e=>update("coverImage",{...trip.coverImage,alt:e.target.value})}/>
            </label>
            <label className={action}><UploadCloud className="h-4 w-4"/> {uploading?"Mengunggah...":"Upload cover"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy||uploading} onChange={e=>upload(e.target.files?.[0],"cover")}/>
            </label>
          </div>
          <div className="space-y-3">
            <label className={action}><UploadCloud className="h-4 w-4"/> Tambah gambar galeri
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy||uploading} onChange={e=>upload(e.target.files?.[0],"gallery")}/>
            </label>
            {trip.gallery.map((image,index)=>
              <div key={index} className="rounded-xl border border-ink/10 p-3">
                <Image src={image.src} alt={image.alt} width={280} height={140} unoptimized className="h-32 w-full rounded-lg object-cover"/>
                <input aria-label={`Alt galeri ${index+1}`} className={`${input} mt-2`} value={image.alt} onChange={e=>update("gallery",trip.gallery.map((it,i)=>i===index?{...it,alt:e.target.value}:it))}/>
                <button className="mt-2 text-sm font-semibold text-red-700" type="button" onClick={()=>update("gallery",trip.gallery.filter((_,i)=>i!==index).map((it,i)=>({...it,sortOrder:i+1})))}>Hapus dari galeri</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
    <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
      <section className={section}>
        <p className="eyebrow">Workflow List Trip</p><h2 className="mt-2 font-serif text-2xl">Draft & Publish</h2>
        <p className="mt-3 text-sm text-ink-muted">Status: {record.status}. {dirty?"Perubahan belum disimpan.":"Perubahan tersimpan."}</p>
        {error?<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>:null}
        {notice?<p role="status" className="mt-3 text-sm text-emerald-700">{notice}</p>:null}
        <button type="submit" disabled={busy||uploading} className="mt-5 min-h-12 w-full rounded-full bg-ink px-4 text-sm font-bold text-white disabled:opacity-50">{busy?"Menyimpan...":"Simpan draft"}</button>
        {!isNew?<div className="mt-3 grid gap-2">
          <button type="button" disabled={busy||dirty||uploading} className={`${action} bg-emerald-700 text-white`} onClick={()=>act("publish")}>Publish List Trip</button>
          {record.status==="published"?<button type="button" className={action} onClick={()=>act("unpublish")}>Unpublish</button>:null}
          {record.status==="archived"?<button type="button" className={action} onClick={()=>act("restore")}>Restore</button>:
            <button type="button" className={action} onClick={()=>act("archive")}>Archive</button>}
          <button type="button" className={`${action} text-red-700`} onClick={()=>act("delete")}>Hapus permanen</button>
        </div>:null}
      </section>
      <Link href="/admin/trips" className="block text-center text-sm font-semibold underline underline-offset-4">Kembali ke Kelola Trip</Link>
    </aside>
  </form>;
}
