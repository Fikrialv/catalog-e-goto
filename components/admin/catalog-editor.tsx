"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import type {
  AvailabilityStatus,
  CatalogRecord,
  HighlightOffer,
  ItineraryDay,
  PublicationStatus,
  TripDestination,
} from "@/types/catalog";
import { createChangeSummary, clone } from "@/lib/catalog-utils";
import { monthKeyFromDate } from "@/lib/catalog-utils";
import { formatMonthLabel } from "@/lib/format";

const inputClass =
  "min-h-11 w-full rounded-xl border border-ink/15 bg-paper px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-accent focus:ring-2 focus:ring-accent/20";
const smallButtonClass =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-ink/15 px-3 text-xs font-semibold text-ink transition-colors hover:border-ink/35 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const publicationStatuses: PublicationStatus[] = [
  "draft",
  "published",
  "archived",
];
const availabilityStatuses: AvailabilityStatus[] = [
  "available",
  "full",
  "closed",
  "cancelled",
];
type StringListField = "includes" | "excludes" | "notes";

function ordered<T extends { sortOrder: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, sortOrder: index + 1 }));
}

function moveItem<T extends { sortOrder: number }>(
  items: T[],
  index: number,
  direction: -1 | 1,
) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return ordered(next);
}

function movePlain<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

function getScheduleMonthTabs(schedules: TripDestination["schedules"]) {
  const scheduleMonths = schedules.map((schedule) =>
    monthKeyFromDate(schedule.startDate),
  );
  const keys = [...new Set([...scheduleMonths.filter(Boolean)])].sort();
  return keys.map((key) => ({ key, label: formatMonthLabel(key) }));
}

function MoveControls({
  label,
  index,
  total,
  onMove,
}: {
  label: string;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="flex gap-1" aria-label={`Urutkan ${label}`}>
      <button
        type="button"
        className={smallButtonClass}
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label={`Naikkan ${label}`}
      >
        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={smallButtonClass}
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        aria-label={`Turunkan ${label}`}
      >
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function CalendarInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      <span>{label}</span>
      <input
        type="date"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function ListEditor({
  title,
  field,
  values,
  onChange,
  onAdd,
  onRemove,
  onMove,
}: {
  title: string;
  field: StringListField;
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Content list</p>
          <h2 className="mt-2 font-serif text-3xl capitalize tracking-[-0.04em] text-ink">
            {title}
          </h2>
        </div>
        <button type="button" className={smallButtonClass} onClick={onAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Tambah
        </button>
      </div>
      <div className="mt-6 grid gap-3">
        {values.length ? (
          values.map((value, index) => (
            <div
              key={`${field}-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              <label className="sr-only" htmlFor={`${field}-${index}`}>
                {title} {index + 1}
              </label>
              <input
                id={`${field}-${index}`}
                value={value}
                onChange={(event) => onChange(index, event.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
              />
              <MoveControls
                label={`${title} ${index + 1}`}
                index={index}
                total={values.length}
                onMove={(direction) => onMove(index, direction)}
              />
              <button
                type="button"
                className={`${smallButtonClass} px-2.5`}
                onClick={() => onRemove(index)}
                aria-label={`Hapus ${title} ${index + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-ink/15 px-4 py-5 text-sm text-ink-muted">
            Belum ada isi. Tambahkan item baru.
          </p>
        )}
      </div>
    </section>
  );
}

export function HighlightItineraryEditor({
  itinerary,
  onChange,
}: {
  itinerary: ItineraryDay[];
  onChange: (itinerary: ItineraryDay[]) => void;
}) {
  function updateDay(
    index: number,
    update: (day: ItineraryDay) => ItineraryDay,
  ) {
    onChange(
      itinerary.map((day, dayIndex) =>
        dayIndex === index ? update(day) : day,
      ),
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink/10 bg-paper/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Itinerary highlight</p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Bisa berbeda dari itinerary katalog bulanan.
          </p>
        </div>
        <button
          type="button"
          className={smallButtonClass}
          onClick={() =>
            onChange([
              ...itinerary,
              {
                dayNumber: itinerary.length + 1,
                title: "Hari baru",
                sortOrder: itinerary.length + 1,
                items: [],
              },
            ])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Tambah hari
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {itinerary.map((day, dayIndex) => (
          <div
            key={`highlight-day-${dayIndex}`}
            className="rounded-xl border border-ink/10 bg-white p-4"
          >
            <div className="flex min-w-0 items-end gap-2">
              <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold text-ink">
                <span>Hari {dayIndex + 1}</span>
                <input
                  value={day.title}
                  onChange={(event) =>
                    updateDay(dayIndex, (current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                className={`${smallButtonClass} px-2.5`}
                onClick={() =>
                  onChange(itinerary.filter((_, index) => index !== dayIndex))
                }
                aria-label={`Hapus hari highlight ${dayIndex + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              {day.items.map((item, itemIndex) => (
                <div
                  key={`highlight-item-${dayIndex}-${itemIndex}`}
                  className="flex min-w-0 items-end gap-2"
                >
                  <label className="grid w-24 gap-2 text-xs font-semibold text-ink">
                    <span>Jam</span>
                    <input
                      type="time"
                      value={item.time.replace(".", ":")}
                      onChange={(event) =>
                        updateDay(dayIndex, (current) => ({
                          ...current,
                          items: current.items.map((entry, entryIndex) =>
                            entryIndex === itemIndex
                              ? {
                                  ...entry,
                                  time: event.target.value.replace(":", "."),
                                }
                              : entry,
                          ),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="grid min-w-0 flex-1 gap-2 text-xs font-semibold text-ink">
                    <span>Aktivitas</span>
                    <input
                      value={item.activity}
                      onChange={(event) =>
                        updateDay(dayIndex, (current) => ({
                          ...current,
                          items: current.items.map((entry, entryIndex) =>
                            entryIndex === itemIndex
                              ? { ...entry, activity: event.target.value }
                              : entry,
                          ),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="button"
                    className={`${smallButtonClass} px-2.5`}
                    onClick={() =>
                      updateDay(dayIndex, (current) => ({
                        ...current,
                        items: current.items.filter(
                          (_, index) => index !== itemIndex,
                        ),
                      }))
                    }
                    aria-label={`Hapus aktivitas ${itemIndex + 1} hari ${dayIndex + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="inline-flex min-h-9 w-fit items-center rounded-full border border-dashed border-ink/20 px-3 text-xs font-semibold text-ink-muted hover:border-ink/40 hover:text-ink"
                onClick={() =>
                  updateDay(dayIndex, (current) => ({
                    ...current,
                    items: [
                      ...current.items,
                      {
                        time: "09.00",
                        activity: "Aktivitas baru",
                        sortOrder: current.items.length + 1,
                      },
                    ],
                  }))
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                Tambah aktivitas
              </button>
            </div>
          </div>
        ))}
        {!itinerary.length ? (
          <p className="rounded-xl border border-dashed border-ink/15 px-4 py-5 text-sm text-ink-muted">
            Belum ada itinerary. Tambahkan hari pertama.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CatalogEditor({
  record,
  isNew = false,
}: {
  record: CatalogRecord;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState<TripDestination>(() =>
    clone(record.draft),
  );
  const [dirty, setDirty] = useState(false);
  const [selectedScheduleMonth, setSelectedScheduleMonth] = useState(() =>
    monthKeyFromDate(
      record.draft.schedules[0]?.startDate ?? new Date().toISOString(),
    ),
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<"cover" | number | null>(
    null,
  );
  const [pendingStorageDeletes, setPendingStorageDeletes] = useState<string[]>(
    [],
  );
  const summary = useMemo(
    () => createChangeSummary(record.published, payload),
    [payload, record.published],
  );
  const scheduleMonthTabs = useMemo(
    () => getScheduleMonthTabs(payload.schedules),
    [payload.schedules],
  );
  const activeScheduleMonth = scheduleMonthTabs.some(
    (month) => month.key === selectedScheduleMonth,
  )
    ? selectedScheduleMonth
    : (scheduleMonthTabs[0]?.key ?? selectedScheduleMonth);
  const visibleSchedules = payload.schedules
    .map((schedule, index) => ({ schedule, index }))
    .filter(
      ({ schedule }) =>
        monthKeyFromDate(schedule.startDate) === activeScheduleMonth,
    );

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function updatePayload(
    update: (current: TripDestination) => TripDestination,
  ) {
    setPayload((current) => update(current));
    setDirty(true);
    setNotice("");
  }
  function setField<K extends keyof TripDestination>(
    field: K,
    value: TripDestination[K],
  ) {
    updatePayload((current) => ({ ...current, [field]: value }));
  }
  function removeItem<T>(items: T[], index: number) {
    return items.filter((_, itemIndex) => itemIndex !== index);
  }
  function updateStringList(
    field: StringListField,
    index: number,
    value: string,
  ) {
    updatePayload((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  }
  function updateItineraryDay(
    dayIndex: number,
    update: (day: ItineraryDay) => ItineraryDay,
  ) {
    updatePayload((current) => ({
      ...current,
      itinerary: current.itinerary.map((day, index) =>
        index === dayIndex ? update(day) : day,
      ),
    }));
  }

  function queueStorageDelete(src: string) {
    if (!src.includes("/storage/v1/object/public/")) return;
    setPendingStorageDeletes((current) =>
      current.includes(src) ? current : [...current, src],
    );
  }

  async function flushStorageDeletes() {
    if (!pendingStorageDeletes.length) return 0;
    const results = await Promise.all(
      pendingStorageDeletes.map(async (src) => {
        try {
          const response = await fetch("/api/admin/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ src, destinationId: payload.id }),
          });
          return response.ok;
        } catch {
          return false;
        }
      }),
    );
    const failed = pendingStorageDeletes.filter((_, index) => !results[index]);
    setPendingStorageDeletes(failed);
    return failed.length;
  }

  async function saveDraft(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const response = await fetch(
      isNew ? "/api/admin/catalog" : `/api/admin/catalog/${record.id}`,
      {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isNew
            ? { action: "create", payload }
            : { action: "save-draft", payload },
        ),
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Draft gagal disimpan.");
      setSaving(false);
      return;
    }
    const failedDeleteCount = await flushStorageDeletes();
    setDirty(false);
    setNotice(
      failedDeleteCount
        ? `Draft tersimpan, tetapi ${failedDeleteCount} asset lama belum terhapus dari storage.`
        : "Draft tersimpan. Public belum berubah sampai Publish.",
    );
    setSaving(false);
    if (isNew && result.record?.id)
      router.replace(`/admin/catalog/${result.record.id}/edit`);
    else router.refresh();
  }

  async function runAction(action: string) {
    if (
      ["publish", "unpublish", "archive", "restore", "duplicate"].includes(
        action,
      ) &&
      !window.confirm(`Konfirmasi aksi ${action}?`)
    )
      return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/catalog/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload, confirmed: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Aksi gagal.");
    else {
      setNotice(result.message ?? "Aksi berhasil.");
      setDirty(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function uploadImage(
    file: File | undefined,
    target: "cover" | { galleryIndex: number },
  ) {
    if (!file) return;
    const currentSrc =
      target === "cover"
        ? payload.coverImage.src
        : payload.gallery[target.galleryIndex]?.src;
    setUploadingImage(target === "cover" ? "cover" : target.galleryIndex);
    setError("");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("destinationId", payload.id);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error ?? "Upload gagal.");
    else {
      if (currentSrc && currentSrc !== result.src)
        queueStorageDelete(currentSrc);
      if (target === "cover") {
        setField("coverImage", { ...payload.coverImage, src: result.src });
      } else {
        updatePayload((current) => ({
          ...current,
          gallery: current.gallery.map((image, index) =>
            index === target.galleryIndex
              ? { ...image, src: result.src }
              : image,
          ),
        }));
      }
    }
    setUploadingImage(null);
  }

  function addPrice() {
    updatePayload((current) => ({
      ...current,
      prices: [
        ...current.prices,
        {
          id: `${current.id}-price-${Date.now()}`,
          label: "Meeting point baru",
          amount: 0,
          sortOrder: current.prices.length + 1,
        },
      ],
    }));
  }
  function addHighlight() {
    updatePayload((current) => {
      const schedule =
        current.schedules.find(
          (item) => monthKeyFromDate(item.startDate) === activeScheduleMonth,
        ) ?? current.schedules[0];
      return {
        ...current,
        highlights: [
          ...current.highlights,
          {
            id: `${current.id}-highlight-${Date.now()}`,
            enabled: true,
            label: "Promo terbatas",
            scheduleId: schedule?.id ?? "",
            priceId: current.prices[0]?.id ?? "",
            discountAmount: Math.max(
              0,
              (current.prices[0]?.amount ?? 0) - 50000,
            ),
            discountType: "fixed",
            discountValue: 50000,
          },
        ],
      };
    });
  }
  function updateHighlight(
    id: string,
    update: (highlight: HighlightOffer) => HighlightOffer,
  ) {
    updatePayload((current) => ({
      ...current,
      highlights: current.highlights.map((highlight) =>
        highlight.id === id ? update(highlight) : highlight,
      ),
    }));
  }
  function addSchedule() {
    updatePayload((current) => ({
      ...current,
      schedules: [
        ...current.schedules,
        {
          id: `${current.id}-schedule-${Date.now()}`,
          destinationId: current.id,
          startDate: `${activeScheduleMonth}-01`,
          endDate: null,
          publicationStatus: "draft",
          availabilityStatus: "available",
          updatedAt: new Date().toISOString(),
        },
      ],
    }));
  }
  function addGalleryImage() {
    updatePayload((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        { src: "", alt: "", sortOrder: current.gallery.length + 1 },
      ],
    }));
  }

  function removeGalleryImage(index: number) {
    queueStorageDelete(payload.gallery[index]?.src ?? "");
    updatePayload((current) => ({
      ...current,
      gallery: ordered(removeItem(current.gallery, index)),
    }));
  }
  function addItineraryDay() {
    updatePayload((current) => ({
      ...current,
      itinerary: [
        ...current.itinerary,
        {
          dayNumber: current.itinerary.length + 1,
          title: "Hari baru",
          sortOrder: current.itinerary.length + 1,
          items: [],
        },
      ],
    }));
  }

  return (
    <form
      onSubmit={saveDraft}
      className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-6">
        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <p className="eyebrow">Basic information</p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
            Data utama
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              <span>Nama destination</span>
              <input
                value={payload.name}
                onChange={(event) => setField("name", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              <span>Slug</span>
              <input
                value={payload.slug}
                onChange={(event) => setField("slug", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              <span>Durasi</span>
              <input
                value={payload.duration}
                onChange={(event) => setField("duration", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              <span>Kategori</span>
              <select
                value={payload.category}
                onChange={(event) =>
                  setField(
                    "category",
                    event.target.value as TripDestination["category"],
                  )
                }
                className={inputClass}
              >
                <option value="mountain">Mountain</option>
                <option value="beach_waterfall">Beach & Waterfall</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              <span>Deskripsi</span>
              <textarea
                rows={4}
                value={payload.description}
                onChange={(event) =>
                  setField("description", event.target.value)
                }
                className="rounded-xl border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Homepage highlight</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
                Highlight discount
              </h2>
            </div>
            <button
              type="button"
              className={smallButtonClass}
              onClick={addHighlight}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Tambah discount
            </button>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Setiap discount memilih jadwal dan meeting point dari trip ini.
            Harga normal serta itinerary tetap mengikuti katalog bulanan.
          </p>
          <div className="mt-6 space-y-4">
            {payload.highlights.map((highlight) => (
              <div
                key={highlight.id}
                className="rounded-2xl border border-ink/10 bg-paper/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-ink">
                    {highlight.label || "Discount baru"}
                  </p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700"
                    onClick={() =>
                      updatePayload((current) => ({
                        ...current,
                        highlights: current.highlights.filter(
                          (item) => item.id !== highlight.id,
                        ),
                      }))
                    }
                  >
                    Hapus
                  </button>
                </div>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Label promo</span>
                    <input
                      value={highlight.label}
                      onChange={(event) =>
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Jadwal trip</span>
                    <select
                      value={highlight.scheduleId}
                      onChange={(event) =>
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          scheduleId: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">Pilih jadwal</option>
                      {payload.schedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.startDate} · {schedule.availabilityStatus}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Meeting point / harga normal</span>
                    <select
                      value={highlight.priceId}
                      onChange={(event) =>
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          priceId: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      {payload.prices.map((price) => (
                        <option key={price.id} value={price.id}>
                          {price.label} — Rp{" "}
                          {price.amount.toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Harga discount (Rp)</span>
                    <input
                      inputMode="numeric"
                      value={
                        highlight.discountAmount
                          ? `Rp ${highlight.discountAmount.toLocaleString("id-ID")}`
                          : ""
                      }
                      onChange={(event) => {
                        const amount =
                          Math.round(
                            Number(event.target.value.replace(/\D/g, "")) /
                              1000,
                          ) * 1000;
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          discountAmount: amount,
                        }));
                      }}
                      className={`${inputClass} tabular-nums`}
                    />
                  </label>
                </div>
              </div>
            ))}
            {!payload.highlights.length ? (
              <p className="rounded-xl border border-dashed border-ink/20 px-4 py-5 text-sm text-ink-muted">
                Belum ada highlight discount pada trip ini.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <p className="eyebrow">Media</p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
            Gambar
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-ink">
              <span>Cover source</span>
              <input
                value={payload.coverImage.src}
                onChange={(event) =>
                  setField("coverImage", {
                    ...payload.coverImage,
                    src: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              <span>Cover alt text</span>
              <input
                value={payload.coverImage.alt}
                onChange={(event) =>
                  setField("coverImage", {
                    ...payload.coverImage,
                    alt: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
              <span>Upload / replace cover</span>
              <span className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-dashed border-ink/20 bg-paper px-4 py-3 text-sm">
                <span className="min-w-0 truncate text-ink-muted">
                  {coverFileName || "Pilih gambar AVIF, JPG, PNG, atau WebP"}
                </span>
                <span className="shrink-0 rounded-full bg-ink px-3 py-2 text-xs font-bold text-white">
                  Pilih file
                </span>
                <input
                  type="file"
                  accept="image/avif,image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setCoverFileName(file?.name ?? "");
                    uploadImage(file, "cover");
                  }}
                  className="sr-only"
                />
              </span>
              {uploadingImage === "cover" ? (
                <span className="text-xs font-normal text-ink-muted">
                  Mengunggah…
                </span>
              ) : (
                <span className="text-xs font-normal text-ink-muted">
                  Supabase Storage aktif; unggah gambar atau isi URL gambar publik.
                </span>
              )}
            </label>
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Price options</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
                Pilihan harga
              </h2>
            </div>
            <button
              type="button"
              className={smallButtonClass}
              onClick={addPrice}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Tambah harga
            </button>
          </div>
          <div className="mt-6 grid gap-4">
            {payload.prices.map((price, index) => (
              <div
                key={price.id}
                className="grid gap-3 rounded-2xl border border-ink/10 bg-paper/60 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end"
              >
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>Label harga {index + 1}</span>
                  <input
                    value={price.label}
                    onChange={(event) =>
                      updatePayload((current) => ({
                        ...current,
                        prices: current.prices.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>Nominal rupiah</span>
                  <input
                    inputMode="numeric"
                    value={
                      price.amount
                        ? `Rp ${price.amount.toLocaleString("id-ID")}`
                        : ""
                    }
                    onChange={(event) =>
                      updatePayload((current) => ({
                        ...current,
                        prices: current.prices.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                amount:
                                  Math.round(
                                    Number(
                                      event.target.value.replace(/\D/g, ""),
                                    ) / 1000,
                                  ) * 1000,
                              }
                            : item,
                        ),
                      }))
                    }
                    className={`${inputClass} tabular-nums`}
                  />
                </label>
                <div className="flex items-center gap-2">
                  <MoveControls
                    label={`harga ${index + 1}`}
                    index={index}
                    total={payload.prices.length}
                    onMove={(direction) =>
                      updatePayload((current) => ({
                        ...current,
                        prices: moveItem(current.prices, index, direction),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className={`${smallButtonClass} px-2.5`}
                    onClick={() =>
                      updatePayload((current) => ({
                        ...current,
                        prices: ordered(removeItem(current.prices, index)),
                      }))
                    }
                    aria-label={`Hapus harga ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Departure schedules</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
                Jadwal keberangkatan
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                Pilih tanggal lewat kalender. End date boleh dikosongkan untuk
                jadwal satu hari.
              </p>
            </div>
            <button
              type="button"
              className={smallButtonClass}
              onClick={addSchedule}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Tambah jadwal
            </button>
          </div>
          <div
            className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Pilih bulan jadwal keberangkatan"
          >
            {scheduleMonthTabs.map((month) => (
              <button
                key={month.key}
                type="button"
                role="tab"
                aria-selected={activeScheduleMonth === month.key}
                onClick={() => setSelectedScheduleMonth(month.key)}
                className={`min-h-11 shrink-0 rounded-full border px-5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${activeScheduleMonth === month.key ? "border-primary bg-primary text-ink" : "border-ink/12 bg-white text-ink-muted hover:-translate-y-0.5 hover:border-primary/50 hover:text-ink"}`}
              >
                {month.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4">
            {visibleSchedules.map(({ schedule, index }) => (
              <div
                key={schedule.id}
                className="rounded-2xl border border-ink/10 bg-paper/60 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <CalendarInput
                    label="Mulai"
                    required
                    value={schedule.startDate}
                    onChange={(value) =>
                      updatePayload((current) => ({
                        ...current,
                        schedules: current.schedules.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, startDate: value }
                            : item,
                        ),
                      }))
                    }
                  />
                  <CalendarInput
                    label="Selesai (opsional)"
                    value={schedule.endDate ?? ""}
                    onChange={(value) =>
                      updatePayload((current) => ({
                        ...current,
                        schedules: current.schedules.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, endDate: value || null }
                            : item,
                        ),
                      }))
                    }
                  />
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Status publikasi</span>
                    <select
                      value={schedule.publicationStatus}
                      onChange={(event) =>
                        updatePayload((current) => ({
                          ...current,
                          schedules: current.schedules.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  publicationStatus: event.target
                                    .value as PublicationStatus,
                                }
                              : item,
                          ),
                        }))
                      }
                      className={inputClass}
                    >
                      {publicationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Ketersediaan</span>
                    <select
                      value={schedule.availabilityStatus}
                      onChange={(event) =>
                        updatePayload((current) => ({
                          ...current,
                          schedules: current.schedules.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  availabilityStatus: event.target
                                    .value as AvailabilityStatus,
                                }
                              : item,
                          ),
                        }))
                      }
                      className={inputClass}
                    >
                      {availabilityStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Jadwal {index + 1}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <MoveControls
                      label={`jadwal ${index + 1}`}
                      index={index}
                      total={payload.schedules.length}
                      onMove={(direction) =>
                        updatePayload((current) => ({
                          ...current,
                          schedules: movePlain(
                            current.schedules,
                            index,
                            direction,
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={smallButtonClass}
                      onClick={() =>
                        updatePayload((current) => ({
                          ...current,
                          schedules: [
                            ...current.schedules.slice(0, index + 1),
                            {
                              ...current.schedules[index],
                              id: `${current.id}-schedule-${Date.now()}`,
                              publicationStatus: "draft",
                            },
                            ...current.schedules.slice(index + 1),
                          ],
                        }))
                      }
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      Duplikasi
                    </button>
                    <button
                      type="button"
                      className={`${smallButtonClass} border-red-200 text-red-700 hover:border-red-300`}
                      onClick={() =>
                        updatePayload((current) => ({
                          ...current,
                          schedules: removeItem(current.schedules, index),
                        }))
                      }
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!visibleSchedules.length ? (
              <p className="rounded-xl border border-dashed border-ink/15 px-4 py-5 text-sm text-ink-muted">
                Belum ada jadwal pada bulan ini. Klik “Tambah jadwal” untuk
                membuat jadwal baru di bulan yang sedang dipilih.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Gallery</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
                Galeri gambar
              </h2>
            </div>
            <button
              type="button"
              className={smallButtonClass}
              onClick={addGalleryImage}
            >
              <ImagePlus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Tambah gambar
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            {payload.gallery.map((image, index) => (
              <div
                key={`${image.src}-${index}`}
                className="grid gap-3 rounded-2xl border border-ink/10 bg-paper/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
              >
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>URL gambar</span>
                  <input
                    value={image.src}
                    onChange={(event) =>
                      updatePayload((current) => ({
                        ...current,
                        gallery: current.gallery.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, src: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>Upload / replace</span>
                  <input
                    type="file"
                    accept="image/avif,image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      uploadImage(event.target.files?.[0], {
                        galleryIndex: index,
                      })
                    }
                    className="min-h-11 rounded-xl border border-dashed border-ink/20 bg-paper px-3 py-2 text-xs font-normal"
                  />
                  {uploadingImage === index ? (
                    <span className="text-xs font-normal text-ink-muted">
                      Mengunggah…
                    </span>
                  ) : null}
                </label>
                <label className="grid gap-2 text-sm font-semibold text-ink">
                  <span>Alt text</span>
                  <input
                    value={image.alt}
                    onChange={(event) =>
                      updatePayload((current) => ({
                        ...current,
                        gallery: current.gallery.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, alt: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-2">
                  <MoveControls
                    label={`gambar ${index + 1}`}
                    index={index}
                    total={payload.gallery.length}
                    onMove={(direction) =>
                      updatePayload((current) => ({
                        ...current,
                        gallery: moveItem(current.gallery, index, direction),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className={`${smallButtonClass} px-2.5`}
                    onClick={() => removeGalleryImage(index)}
                    aria-label={`Hapus gambar ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {(["includes", "excludes", "notes"] as StringListField[]).map(
          (field) => (
            <ListEditor
              key={field}
              title={field}
              field={field}
              values={payload[field]}
              onChange={(index, value) => updateStringList(field, index, value)}
              onAdd={() =>
                updatePayload((current) => ({
                  ...current,
                  [field]: [...current[field], ""],
                }))
              }
              onRemove={(index) =>
                updatePayload((current) => ({
                  ...current,
                  [field]: removeItem(current[field], index),
                }))
              }
              onMove={(index, direction) =>
                updatePayload((current) => ({
                  ...current,
                  [field]: movePlain(current[field], index, direction),
                }))
              }
            />
          ),
        )}

        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Itinerary builder</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
                Rundown perjalanan
              </h2>
            </div>
            <button
              type="button"
              className={smallButtonClass}
              onClick={addItineraryDay}
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Tambah hari
            </button>
          </div>
          <div className="mt-6 grid gap-5">
            {payload.itinerary.map((day, dayIndex) => (
              <div
                key={`day-${dayIndex}`}
                className="rounded-2xl border border-ink/10 bg-paper/60 p-4 sm:p-5"
              >
                <div className="grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-end">
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Hari</span>
                    <input
                      type="number"
                      min="1"
                      value={day.dayNumber}
                      onChange={(event) =>
                        updateItineraryDay(dayIndex, (current) => ({
                          ...current,
                          dayNumber: Number(event.target.value),
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Judul hari</span>
                    <input
                      value={day.title}
                      onChange={(event) =>
                        updateItineraryDay(dayIndex, (current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </label>
                  <div className="flex gap-2">
                    <MoveControls
                      label={`hari ${dayIndex + 1}`}
                      index={dayIndex}
                      total={payload.itinerary.length}
                      onMove={(direction) =>
                        updatePayload((current) => ({
                          ...current,
                          itinerary: moveItem(
                            current.itinerary,
                            dayIndex,
                            direction,
                          ),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={`${smallButtonClass} px-2.5`}
                      onClick={() =>
                        updatePayload((current) => ({
                          ...current,
                          itinerary: ordered(
                            removeItem(current.itinerary, dayIndex),
                          ),
                        }))
                      }
                      aria-label={`Hapus hari ${dayIndex + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 border-t border-ink/10 pt-4">
                  {day.items.map((item, itemIndex) => (
                    <div
                      key={`${dayIndex}-${itemIndex}`}
                      className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-end"
                    >
                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        <span>Jam</span>
                        <input
                          type="time"
                          value={item.time.replace(".", ":")}
                          onChange={(event) =>
                            updateItineraryDay(dayIndex, (current) => ({
                              ...current,
                              items: current.items.map((entry, entryIndex) =>
                                entryIndex === itemIndex
                                  ? {
                                      ...entry,
                                      time: event.target.value.replace(
                                        ":",
                                        ".",
                                      ),
                                    }
                                  : entry,
                              ),
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        <span>Aktivitas</span>
                        <input
                          value={item.activity}
                          onChange={(event) =>
                            updateItineraryDay(dayIndex, (current) => ({
                              ...current,
                              items: current.items.map((entry, entryIndex) =>
                                entryIndex === itemIndex
                                  ? { ...entry, activity: event.target.value }
                                  : entry,
                              ),
                            }))
                          }
                          className={inputClass}
                        />
                      </label>
                      <div className="flex gap-2">
                        <MoveControls
                          label={`aktivitas ${itemIndex + 1}`}
                          index={itemIndex}
                          total={day.items.length}
                          onMove={(direction) =>
                            updateItineraryDay(dayIndex, (current) => ({
                              ...current,
                              items: moveItem(
                                current.items,
                                itemIndex,
                                direction,
                              ),
                            }))
                          }
                        />
                        <button
                          type="button"
                          className={`${smallButtonClass} px-2.5`}
                          onClick={() =>
                            updateItineraryDay(dayIndex, (current) => ({
                              ...current,
                              items: removeItem(current.items, itemIndex),
                            }))
                          }
                          aria-label={`Hapus aktivitas ${itemIndex + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-dashed border-ink/20 px-4 text-sm font-semibold text-ink-muted hover:border-ink/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={() =>
                      updateItineraryDay(dayIndex, (current) => ({
                        ...current,
                        items: [
                          ...current.items,
                          {
                            time: "09.00",
                            activity: "Aktivitas baru",
                            sortOrder: current.items.length + 1,
                          },
                        ],
                      }))
                    }
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Tambah aktivitas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-6">
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink">
            Draft & publish
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            {dirty ? "Ada perubahan belum disimpan." : "Form bersih."}
          </p>
          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
            >
              {error}
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
            >
              {notice}
            </p>
          ) : null}
          <button
            disabled={saving}
            className="mt-6 min-h-12 w-full rounded-full bg-ink px-5 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {saving ? "Menyimpan…" : "Save draft"}
          </button>
          {!isNew ? (
            <div className="mt-3 grid gap-2">
              <Link
                href={`/admin/catalog/${record.id}/preview`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/15 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Preview draft
              </Link>
              <button
                type="button"
                onClick={() => runAction("publish")}
                className="min-h-11 rounded-full bg-accent px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Publish changes
              </button>
              <button
                type="button"
                onClick={() => runAction("unpublish")}
                className="min-h-11 rounded-full border border-ink/15 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Unpublish ke draft
              </button>
              <button
                type="button"
                onClick={() => runAction("duplicate")}
                className="min-h-11 rounded-full border border-ink/15 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Duplicate
              </button>
              {record.status === "archived" ? (
                <button
                  type="button"
                  onClick={() => runAction("restore")}
                  className="min-h-11 rounded-full border border-ink/15 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runAction("archive")}
                  className="min-h-11 rounded-full border border-red-200 text-sm font-semibold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Archive
                </button>
              )}
            </div>
          ) : null}
        </section>
        <section className="rounded-[1.35rem] border border-ink/10 bg-primary-soft p-6">
          <p className="eyebrow">Change summary</p>
          <h2 className="mt-2 font-serif text-2xl tracking-[-0.035em] text-ink">
            Before / after
          </h2>
          {summary.length ? (
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-muted">
              {summary.map((item) => (
                <li key={String(item.field)}>
                  <strong className="text-ink">{item.type}</strong> ·{" "}
                  {String(item.field)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">Belum ada perubahan.</p>
          )}
        </section>
      </aside>
    </form>
  );
}
