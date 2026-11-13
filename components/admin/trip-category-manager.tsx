"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import type { TripCategory } from "@/types/catalog";

type Editable = TripCategory;
const inputClass = "min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export function TripCategoryManager({ initial, endpoint = "/api/admin/trip-categories" }: { initial: TripCategory[]; endpoint?: string }) {
  const router = useRouter();
  const [categories,setCategories] = useState(initial);
  const [name,setName] = useState("");
  const [slug,setSlug] = useState("");
  const [loading,setLoading] = useState("");
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  async function submit(method: "POST" | "PATCH" | "DELETE", body: object, id: string) {
    if (loading) return false;
    setError(""); setNotice(""); setLoading(id);
    try {
      const response = await fetch(endpoint, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error ?? "Gagal mengubah kategori.");
      setNotice("Perubahan kategori berhasil disimpan.");
      router.refresh();
      return true;
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan. Coba lagi.");
      return false;
    } finally { setLoading(""); }
  }
  async function create(event: React.FormEvent) {
    event.preventDefault();
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g,"-");
    if(await submit("POST",{
      slug:cleanSlug,name:name.trim(),sortOrder:categories.length+1,isActive:true,
    },"new")){
      setCategories((list)=>[...list,{id:cleanSlug,slug:cleanSlug,name:name.trim(),sortOrder:list.length+1,isActive:true}]);
      setName(""); setSlug("");
    }
  }
  async function update(cat: Editable) {
    await submit("PATCH",cat,cat.id);
  }
  async function remove(cat: Editable) {
    if(!window.confirm(`Hapus kategori "${cat.name}"? Hanya kategori yang tidak digunakan dapat dihapus.`)) return;
    if(await submit("DELETE",{id:cat.id},cat.id)){
      setCategories((list)=>list.filter((item)=>item.id!==cat.id));
    }
  }
  function setItem(id:string,update:Partial<Editable>) {
    setCategories((list)=>list.map((item)=>item.id===id?{...item,...update}:item));
  }

  return <div className="mt-8 space-y-7">
    {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>:null}
    {notice ? <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>:null}
    <form onSubmit={create} className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold text-ink">Tambah kategori baru</h2>
      <p className="mt-2 text-sm text-ink-muted">Kategori muncul pada filter List Trip ketika dipakai oleh trip Published.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-ink">Nama kategori
          <input required minLength={2} maxLength={80} className={inputClass} value={name} onChange={(event)=>{setName(event.target.value);if(!slug)setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));}} placeholder="Contoh: Camping"/>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">Slug kategori
          <input required minLength={2} maxLength={80} pattern="[a-z0-9]+([-_][a-z0-9]+)*" className={inputClass} value={slug} onChange={(event)=>setSlug(event.target.value.toLowerCase())} placeholder="camping"/>
        </label>
      </div>
      <button type="submit" disabled={Boolean(loading)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white disabled:opacity-50">
        <Plus className="h-4 w-4" aria-hidden="true"/> Tambah kategori
      </button>
    </form>
    <div className="grid gap-4 md:grid-cols-2">
      {categories.map((cat)=>(
        <section key={cat.id} className="rounded-[22px] border border-ink/10 bg-white p-5 sm:p-6">
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-semibold text-ink">Nama kategori
              <input className={inputClass} maxLength={80} value={cat.name}
                onChange={(event)=>setItem(cat.id,{name:event.target.value})}/>
            </label>
            <p className="text-xs text-ink-muted">Slug: <code>{cat.slug}</code> (tidak dapat diubah agar trip tetap terhubung)</p>
            <label className="grid gap-2 text-sm font-semibold text-ink">Urutan
              <input className={inputClass} type="number" min={1} max={9999} value={cat.sortOrder}
                onChange={(event)=>setItem(cat.id,{sortOrder:Number(event.target.value)})}/>
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">
              <input type="checkbox" className="h-4 w-4 accent-[#064e4f]" checked={cat.isActive}
                onChange={(event)=>setItem(cat.id,{isActive:event.target.checked})}/> Kategori aktif
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(loading)} onClick={()=>update(cat)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white disabled:opacity-50">
              <Save className="h-4 w-4" aria-hidden="true"/> Simpan
            </button>
            <button type="button" disabled={Boolean(loading)} onClick={()=>remove(cat)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-200 px-4 text-sm font-bold text-red-700 disabled:opacity-50">
              <Trash2 className="h-4 w-4" aria-hidden="true"/> Hapus
            </button>
          </div>
        </section>
      ))}
    </div>
  </div>;
}
