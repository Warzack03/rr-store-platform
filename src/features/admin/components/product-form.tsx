"use client";

import Image from "next/image";
import { useState } from "react";

import { archiveProduct, saveProduct } from "@/features/admin/server/product-actions";

import { Flash } from "./flash";

type ProductValue = {
  id: string; name: string; slug: string; type: "SIMPLE" | "BUNDLE"; status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  shortDescription: string; description: string; seoTitle: string | null; seoDescription: string | null; sizeGuideId: string | null;
  sizes: Array<{ sizeId: string }>; images: Array<{ mediaAssetId: string; isPrimary: boolean; altText: string }>;
  customizations: Array<{ type: "NAME" | "NUMBER"; isActive: boolean; label: string; maxLength: number | null; minNumber: number | null; maxNumber: number | null }>;
  bundleComponents: Array<{ id: string; componentProductId: string; sortOrder: number }>;
};
type Option = { id: string; label?: string; name?: string; originalName?: string; storageKey?: string; width?: number; height?: number };

export function ProductForm({ product, sizes, guides, media, components, searchParams }: { product?: ProductValue; sizes: Option[]; guides: Option[]; media: Option[]; components: Option[]; searchParams?: { ok?: string; error?: string } }) {
  const [productType, setProductType] = useState<"SIMPLE" | "BUNDLE">(product?.type ?? "SIMPLE");
  const [bundleRows, setBundleRows] = useState(() =>
    [...(product?.bundleComponents ?? [])]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((component) => ({ rowId: component.id, productId: component.componentProductId })),
  );
  const selectedSizes = new Set(product?.sizes.map((item) => item.sizeId));
  const selectedMedia = new Map(product?.images.map((item) => [item.mediaAssetId, item]));
  const nameConfig = product?.customizations.find((item) => item.type === "NAME");
  const numberConfig = product?.customizations.find((item) => item.type === "NUMBER");
  const field = "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2";
  return <div className="space-y-5"><Flash searchParams={searchParams} /><form action={saveProduct} className="space-y-6">
    {product ? <input name="id" type="hidden" value={product.id} /> : null}
    <section className="grid gap-4 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2">
      <h2 className="text-xl font-bold md:col-span-2">Información</h2>
      <label className="text-sm font-semibold">Nombre<input className={field} defaultValue={product?.name} maxLength={191} name="name" required /></label>
      <label className="text-sm font-semibold">Slug<input className={field} defaultValue={product?.slug} maxLength={191} name="slug" placeholder="Se genera desde el nombre" /></label>
      <label className="text-sm font-semibold">Tipo<select className={field} name="type" onChange={(event) => setProductType(event.target.value as "SIMPLE" | "BUNDLE")} value={productType}><option value="SIMPLE">Producto simple</option><option value="BUNDLE">Pack</option></select></label>
      <label className="text-sm font-semibold">Estado<select className={field} defaultValue={product?.status === "ARCHIVED" ? "DRAFT" : (product?.status ?? "DRAFT")} name="status"><option value="DRAFT">Borrador</option><option value="PUBLISHED">Publicado</option></select></label>
      <label className="text-sm font-semibold md:col-span-2">Descripción corta<textarea className={field} defaultValue={product?.shortDescription} maxLength={500} name="shortDescription" required rows={2} /></label>
      <label className="text-sm font-semibold md:col-span-2">Descripción completa<textarea className={field} defaultValue={product?.description} name="description" required rows={7} /></label>
      <label className="text-sm font-semibold">Título SEO<input className={field} defaultValue={product?.seoTitle ?? ""} maxLength={191} name="seoTitle" /></label>
      <label className="text-sm font-semibold">Descripción SEO<input className={field} defaultValue={product?.seoDescription ?? ""} maxLength={500} name="seoDescription" /></label>
      <label className="text-sm font-semibold md:col-span-2">Guía de tallas<select className={field} defaultValue={product?.sizeGuideId ?? ""} name="sizeGuideId"><option value="">Sin guía</option>{guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.name}</option>)}</select></label>
    </section>
    <section className="rounded-xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Tallas</h2><div className="mt-4 flex flex-wrap gap-3">{sizes.map((size) => <label className="flex items-center gap-2 rounded border border-slate-200 px-3 py-2" key={size.id}><input defaultChecked={selectedSizes.has(size.id)} name="sizeIds" type="checkbox" value={size.id} />{size.label}</label>)}</div></section>
    <section className="rounded-xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Imágenes</h2><p className="mt-1 text-sm text-slate-500">Marca las imágenes del producto y selecciona una principal.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{media.map((asset) => <div className="rounded border border-slate-200 p-3" key={asset.id}><Image alt="" className="mb-2 aspect-video w-full bg-slate-100 object-contain" height={asset.height ?? 1} src={`/media/${asset.storageKey}`} unoptimized width={asset.width ?? 1} /><label className="flex gap-2 font-semibold"><input defaultChecked={selectedMedia.has(asset.id)} name="mediaIds" type="checkbox" value={asset.id} />{asset.originalName}</label><label className="mt-2 block text-xs">Alt<input className={field} defaultValue={selectedMedia.get(asset.id)?.altText ?? product?.name ?? ""} name={`alt_${asset.id}`} /></label><label className="mt-2 flex gap-2 text-xs"><input defaultChecked={selectedMedia.get(asset.id)?.isPrimary} name="primaryMediaId" type="radio" value={asset.id} /> Principal</label></div>)}</div></section>
    <section className="grid gap-4 rounded-xl bg-white p-6 shadow-sm md:grid-cols-2"><h2 className="text-xl font-bold md:col-span-2">Personalización disponible</h2>
      <fieldset className="rounded border border-slate-200 p-4"><label className="flex gap-2 font-bold"><input defaultChecked={nameConfig?.isActive} name="enableName" type="checkbox" /> Nombre</label><label className="mt-3 block text-sm">Etiqueta<input className={field} defaultValue={nameConfig?.label ?? "Nombre"} name="nameLabel" /></label><label className="mt-3 block text-sm">Máximo de caracteres<input className={field} defaultValue={nameConfig?.maxLength ?? 12} min="1" name="nameMaxLength" type="number" /></label></fieldset>
      <fieldset className="rounded border border-slate-200 p-4"><label className="flex gap-2 font-bold"><input defaultChecked={numberConfig?.isActive} name="enableNumber" type="checkbox" /> Dorsal</label><label className="mt-3 block text-sm">Etiqueta<input className={field} defaultValue={numberConfig?.label ?? "Dorsal"} name="numberLabel" /></label><div className="grid grid-cols-2 gap-3"><label className="mt-3 block text-sm">Mínimo<input className={field} defaultValue={numberConfig?.minNumber ?? 0} min="0" name="numberMin" type="number" /></label><label className="mt-3 block text-sm">Máximo<input className={field} defaultValue={numberConfig?.maxNumber ?? 99} min="0" name="numberMax" type="number" /></label></div></fieldset>
    </section>
    {productType === "BUNDLE" ? <section className="space-y-4 rounded-xl bg-white p-6 shadow-sm"><div><h2 className="text-xl font-bold">Componentes del pack</h2><p className="text-sm text-slate-500">Añade y ordena tantos productos como necesite el pack.</p></div>
      {bundleRows.length === 0 ? <p className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-500">Aún no has añadido productos al pack.</p> : <div className="space-y-3">{bundleRows.map((row, index) => <div className="grid items-end gap-3 rounded border border-slate-200 p-4 sm:grid-cols-[1fr_auto]" key={`${row.rowId}-${index}`}><input name="bundleComponentRowIds" type="hidden" value={row.rowId} /><label className="text-sm font-semibold">Producto {index + 1}<select className={field} name="bundleComponentProductIds" onChange={(event) => setBundleRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item))} required value={row.productId}><option value="">Selecciona un producto</option>{components.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="rounded border border-red-300 px-4 py-2 font-semibold text-red-700" onClick={() => setBundleRows((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">Eliminar</button></div>)}</div>}
      <button className="rounded border border-slate-300 px-4 py-2 font-semibold" onClick={() => setBundleRows((current) => [...current, { rowId: "", productId: "" }])} type="button">+ Añadir producto</button>
    </section> : null}
    <div className="flex flex-wrap gap-3"><button className="rounded bg-[var(--rr-navy-900)] px-6 py-3 font-bold text-white" type="submit">Guardar producto</button></div>
  </form>{product && product.status !== "ARCHIVED" ? <form action={archiveProduct}><input name="id" type="hidden" value={product.id} /><button className="rounded border border-red-300 bg-white px-4 py-2 font-semibold text-red-700" type="submit">Archivar producto</button></form> : null}</div>;
}
