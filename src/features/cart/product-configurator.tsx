"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatMoney } from "@/features/catalog/domain";
import type {
  CatalogProductDetail,
  ProductCustomizationView,
  ProductSizeView,
} from "@/features/catalog/types";

import { useCart } from "./cart-provider";
import {
  normalizeDorsal,
  normalizeName,
  type CartCustomizationSelection,
  type CartLine,
} from "./domain";

type ComponentState = Record<
  string,
  { sizeId: string; customizations: Record<string, string> }
>;

type ConfigurableProduct = CatalogProductDetail & {
  drop: NonNullable<CatalogProductDetail["drop"]>;
};

function customizationPrice(customizations: ProductCustomizationView[], values: Record<string, string>) {
  return customizations.reduce(
    (total, customization) =>
      values[customization.id]
        ? total + (customization.surchargeCents ?? 0)
        : total,
    0,
  );
}

function toSelections(values: Record<string, string>): CartCustomizationSelection[] {
  return Object.entries(values)
    .filter(([, value]) => value.length > 0)
    .map(([customizationId, value]) => ({ customizationId, value }));
}

export function ProductConfigurator({ product }: { product: ConfigurableProduct }) {
  const { cart, hydrated, addLine, updateLine } = useCart();
  const router = useRouter();
  const editLineId = useSearchParams().get("editar");
  const loadedEdit = useRef(false);
  const [sizeId, setSizeId] = useState("");
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [components, setComponents] = useState<ComponentState>(() =>
    Object.fromEntries(
      product.bundleComponents.map((component) => [
        component.id,
        { sizeId: "", customizations: {} },
      ]),
    ),
  );
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const editingLine = editLineId
    ? cart.lines.find(
        (line) => line.id === editLineId && line.productId === product.id,
      )
    : undefined;

  useEffect(() => {
    if (!hydrated || !editLineId || loadedEdit.current) return;
    const line = cart.lines.find(
      (candidate) =>
        candidate.id === editLineId && candidate.productId === product.id,
    );
    loadedEdit.current = true;
    if (!line) return;
    const editTimer = window.setTimeout(() => {
      setSizeId(line.sizeId ?? "");
      setCustomizations(
        Object.fromEntries(line.customizations.map((item) => [item.customizationId, item.value])),
      );
      setComponents((current) => ({
        ...current,
        ...Object.fromEntries(
          line.components.map((component) => [
            component.bundleComponentId,
            {
              sizeId: component.sizeId,
              customizations: Object.fromEntries(
                component.customizations.map((item) => [item.customizationId, item.value]),
              ),
            },
          ]),
        ),
      }));
      setQuantity(line.quantity);
    }, 0);
    return () => window.clearTimeout(editTimer);
  }, [cart.lines, editLineId, hydrated, product.id]);

  const customizationCents = useMemo(() => {
    if (product.type === "SIMPLE") {
      return customizationPrice(product.customizations, customizations);
    }
    return product.bundleComponents.reduce(
      (total, component) =>
        total +
        customizationPrice(
          component.customizations,
          components[component.id]?.customizations ?? {},
        ),
      0,
    );
  }, [components, customizations, product]);
  const unitTotal = (product.drop.publicPrice?.priceCents ?? 0) + customizationCents;

  function validate() {
    if (product.drop.state !== "AVAILABLE" || !product.drop.publicPrice) {
      return "Este producto no está disponible para añadir al carrito.";
    }
    if (product.type === "SIMPLE" && !sizeId) return "Selecciona una talla.";
    if (
      product.type === "BUNDLE" &&
      product.bundleComponents.some((component) => !components[component.id]?.sizeId)
    ) return "Selecciona la talla de todos los productos del pack.";

    const groups = product.type === "SIMPLE"
      ? [{ definitions: product.customizations, values: customizations }]
      : product.bundleComponents.map((component) => ({
          definitions: component.customizations,
          values: components[component.id]?.customizations ?? {},
        }));
    for (const group of groups) {
      for (const definition of group.definitions) {
        const enabled = Object.hasOwn(group.values, definition.id);
        if (!enabled) continue;
        const value = group.values[definition.id];
        if (!value) return `Completa ${definition.label.toLowerCase()}.`;
        if (
          definition.type === "NAME" &&
          normalizeName(value).length > (definition.maxLength ?? 12)
        ) return `${definition.label} supera la longitud máxima.`;
        if (definition.type === "NUMBER" && !/^\d{2}$/.test(value)) {
          return `${definition.label} debe tener dos cifras, de 00 a 99.`;
        }
      }
    }
    return null;
  }

  function submit() {
    const error = validate();
    if (error) { setMessage(error); return; }
    const line: CartLine = {
      id: editingLine?.id ?? crypto.randomUUID(),
      dropId: product.drop.id,
      dropProductId: product.drop.dropProductId,
      productId: product.id,
      quantity,
      sizeId: product.type === "SIMPLE" ? sizeId : null,
      customizations:
        product.type === "SIMPLE" ? toSelections(customizations) : [],
      components:
        product.type === "BUNDLE"
          ? product.bundleComponents.map((component) => ({
              bundleComponentId: component.id,
              sizeId: components[component.id].sizeId,
              customizations: toSelections(
                components[component.id].customizations,
              ),
            }))
          : [],
    };
    if (editingLine) {
      updateLine(line);
      router.push("/carrito");
      return;
    }
    const { replacedDrop } = addLine(line);
    setMessage(
      replacedDrop
        ? "Hemos sustituido el carrito anterior porque pertenecía a otro drop."
        : "Producto añadido al carrito.",
    );
  }

  if (product.drop.state !== "AVAILABLE" || !product.drop.publicPrice) return null;

  return (
    <section className="mt-9 space-y-7 border-t border-white/12 pt-7" aria-labelledby="configurar-producto">
      <h2 id="configurar-producto" className="font-heading text-2xl font-bold uppercase tracking-wide text-white">
        Configura tu producto
      </h2>
      {product.type === "SIMPLE" ? (
        <SelectionGroup
          title="Talla"
          sizes={product.sizes}
          selectedSize={sizeId}
          onSize={setSizeId}
          customizations={product.customizations}
          values={customizations}
          onValues={setCustomizations}
        />
      ) : (
        <div className="space-y-6">
          {product.bundleComponents.map((component) => (
            <SelectionGroup
              key={component.id}
              title={`${component.label} · ${component.name}`}
              sizes={component.sizes}
              selectedSize={components[component.id]?.sizeId ?? ""}
              onSize={(value) => setComponents((current) => ({ ...current, [component.id]: { ...current[component.id], sizeId: value } }))}
              customizations={component.customizations}
              values={components[component.id]?.customizations ?? {}}
              onValues={(values) => setComponents((current) => ({ ...current, [component.id]: { ...current[component.id], customizations: values } }))}
            />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-4 border-y border-white/12 py-5">
        <div><p className="text-sm text-white/58">Cantidad</p><div className="mt-2 inline-flex border border-white/20"><button aria-label="Reducir cantidad" className="size-11 text-xl text-white hover:bg-white/10" onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button">−</button><span className="inline-flex min-w-11 items-center justify-center font-bold text-white">{quantity}</span><button aria-label="Aumentar cantidad" className="size-11 text-xl text-white hover:bg-white/10" onClick={() => setQuantity((value) => Math.min(20, value + 1))} type="button">+</button></div></div>
        <div className="text-right"><p className="text-sm text-white/58">Total</p><p className="mt-1 text-3xl font-bold text-white">{formatMoney(unitTotal * quantity)}</p>{customizationCents > 0 ? <p className="text-xs text-brand-gold">Incluye {formatMoney(customizationCents * quantity)} en personalización</p> : null}</div>
      </div>
      {message ? <p className="border border-brand-gold/35 bg-brand-gold/10 px-4 py-3 text-sm text-white" role="status">{message}</p> : null}
      <button className="sticky bottom-3 z-20 inline-flex min-h-14 w-full items-center justify-center border border-brand-gold bg-brand-gold px-6 font-heading text-lg font-bold uppercase tracking-[0.1em] text-brand-panel shadow-xl hover:-translate-y-0.5 hover:bg-[#ffe19a]" onClick={submit} type="button">
        {editingLine ? "Guardar cambios" : `Añadir al carrito · ${formatMoney(unitTotal * quantity)}`}
      </button>
    </section>
  );
}

function SelectionGroup({ title, sizes, selectedSize, onSize, customizations, values, onValues }: { title: string; sizes: ProductSizeView[]; selectedSize: string; onSize: (value: string) => void; customizations: ProductCustomizationView[]; values: Record<string, string>; onValues: (values: Record<string, string>) => void }) {
  return <fieldset className="border-l-2 border-brand-gold/65 pl-4"><legend className="font-heading text-xl font-bold uppercase tracking-wide text-brand-gold">{title}</legend><div className="mt-3 flex flex-wrap gap-2">{sizes.map((size) => <button aria-pressed={selectedSize === size.id} className={`inline-flex min-h-12 min-w-14 items-center justify-center border px-4 font-heading text-lg font-bold ${selectedSize === size.id ? "border-brand-gold bg-brand-gold text-brand-panel" : "border-white/25 bg-white/[0.035] text-white hover:border-brand-gold"}`} key={size.id} onClick={() => onSize(size.id)} type="button">{size.label}</button>)}</div>{customizations.length ? <div className="mt-4 space-y-3">{customizations.map((customization) => { const enabled = Object.hasOwn(values, customization.id); const value = values[customization.id] ?? ""; return <div className="border border-white/12 bg-white/[0.025] p-4" key={customization.id}><label className="flex items-center justify-between gap-3 font-heading font-bold uppercase tracking-wide text-white"><span className="flex items-center gap-2"><input checked={enabled} className="size-4 accent-[#ffd46f]" onChange={(event) => { const next = { ...values }; if (event.target.checked) next[customization.id] = ""; else delete next[customization.id]; onValues(next); }} type="checkbox" />Añadir {customization.label.toLowerCase()}</span><span className="text-brand-gold">+{formatMoney(customization.surchargeCents ?? 0)}</span></label>{enabled ? <input aria-label={customization.label} autoComplete="off" className="mt-3 min-h-12 w-full border border-white/20 bg-[#07101d] px-4 text-white placeholder:text-white/35" inputMode={customization.type === "NUMBER" ? "numeric" : "text"} maxLength={customization.type === "NAME" ? (customization.maxLength ?? 12) : 2} onChange={(event) => onValues({ ...values, [customization.id]: customization.type === "NAME" ? normalizeName(event.target.value) : normalizeDorsal(event.target.value) })} placeholder={customization.type === "NAME" ? "NOMBRE" : "00-99"} value={value} /> : null}</div>; })}</div> : null}</fieldset>;
}
