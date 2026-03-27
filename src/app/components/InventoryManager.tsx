import { useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Box,
  PencilLine,
  Plus,
  Printer,
  Trash2,
  Warehouse,
} from "lucide-react";
import { Cabin, InventoryItem } from "../types/cabin";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

interface InventoryManagerProps {
  cabins: Cabin[];
  inventoryItems: InventoryItem[];
  onAddItem: (item: Omit<InventoryItem, "id" | "updatedAt">) => Promise<void>;
  onUpdateItem: (item: InventoryItem) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

const DEPOSIT_KEY = "deposit";

export function InventoryManager({
  cabins,
  inventoryItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: InventoryManagerProps) {
  const [activeLocation, setActiveLocation] = useState<string>(DEPOSIT_KEY);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "1",
    replacementCost: "",
    notes: "",
  });

  const selectedCabin = useMemo(
    () => cabins.find((cabin) => cabin.id === activeLocation),
    [cabins, activeLocation],
  );

  const filteredItems = useMemo(() => {
    if (activeLocation === DEPOSIT_KEY) {
      return inventoryItems.filter((item) => item.locationType === "deposit");
    }

    return inventoryItems.filter(
      (item) =>
        item.locationType === "cabin" && item.cabin?.id === activeLocation,
    );
  }, [inventoryItems, activeLocation]);

  const totalValue = filteredItems.reduce(
    (acc, item) => acc + item.quantity * item.replacementCost,
    0,
  );

  const resetForm = () => {
    setEditingItemId(null);
    setFormData({
      name: "",
      category: "",
      quantity: "1",
      replacementCost: "",
      notes: "",
    });
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      replacementCost: String(item.replacementCost),
      notes: item.notes ?? "",
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const quantity = Number(formData.quantity);
    const replacementCost = Number(formData.replacementCost);

    if (!formData.name.trim() || !formData.category.trim()) {
      toast.error("Ingrese el nombre y la categoria del articulo");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error("La cantidad debe ser un numero valido mayor o igual a 0");
      return;
    }

    if (!Number.isFinite(replacementCost) || replacementCost < 0) {
      toast.error("El precio de reposicion debe ser valido");
      return;
    }

    const locationType = activeLocation === DEPOSIT_KEY ? "deposit" : "cabin";
    const cabin = locationType === "cabin" ? selectedCabin : undefined;

    setIsSubmitting(true);

    try {
      if (editingItemId) {
        const existingItem = inventoryItems.find(
          (item) => item.id === editingItemId,
        );

        if (!existingItem) {
          toast.error("No se encontro el articulo a editar");
          return;
        }

        await onUpdateItem({
          ...existingItem,
          name: formData.name.trim(),
          category: formData.category.trim(),
          quantity,
          replacementCost,
          locationType,
          cabin,
          notes: formData.notes.trim(),
        });

        toast.success("Articulo actualizado");
      } else {
        await onAddItem({
          name: formData.name.trim(),
          category: formData.category.trim(),
          quantity,
          replacementCost,
          locationType,
          cabin,
          notes: formData.notes.trim(),
        });

        toast.success("Articulo agregado al inventario");
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    const shouldDelete = window.confirm(
      "Desea eliminar este articulo del inventario? Esta accion no se puede deshacer.",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingId(itemId);

    try {
      await onDeleteItem(itemId);
      toast.success("Articulo eliminado");
      if (editingItemId === itemId) {
        resetForm();
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const handlePrint = () => {
    if (!selectedCabin || filteredItems.length === 0) {
      toast.error("Seleccione una cabaña con inventario para imprimir");
      return;
    }

    const rows = filteredItems
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">$${item.replacementCost.toLocaleString("es-AR")}</td>
            <td style="text-align:right;">$${(item.quantity * item.replacementCost).toLocaleString("es-AR")}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1024,height=768");

    if (!printWindow) {
      toast.error("No se pudo abrir la ventana de impresion");
      return;
    }

    const now = format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", {
      locale: es,
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Inventario ${selectedCabin.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px 0; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 14px; }
            th { background: #f3f4f6; text-align: left; }
            .footer { margin-top: 20px; font-size: 14px; }
            .line { margin-top: 42px; border-top: 1px solid #334155; width: 280px; }
          </style>
        </head>
        <body>
          <h1>Inventario de ${selectedCabin.name}</h1>
          <p>Fecha de impresion: ${now}</p>
          <p>Total estimado de reposicion: $${totalValue.toLocaleString("es-AR")}</p>
          <table>
            <thead>
              <tr>
                <th>Articulo</th>
                <th>Categoria</th>
                <th>Cantidad</th>
                <th>Precio reposicion</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            <p>Control de salida de inquilinos</p>
            <p class="line"></p>
            <p>Firma responsable</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Inventario de Cabanas y Deposito
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Controle cantidad, precio de reposicion y stock por ubicacion.
          </p>
        </div>
        <Button
          type="button"
          onClick={handlePrint}
          className="gap-2 bg-emerald-700 hover:bg-emerald-800"
          disabled={!selectedCabin || filteredItems.length === 0}
        >
          <Printer className="w-4 h-4" />
          Imprimir cabaña
        </Button>
      </div>

      <Card className="p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeLocation === DEPOSIT_KEY ? "default" : "outline"}
            className="gap-2"
            onClick={() => {
              setActiveLocation(DEPOSIT_KEY);
              resetForm();
            }}
          >
            <Warehouse className="w-4 h-4" />
            Deposito
          </Button>
          {cabins.map((cabin) => (
            <Button
              key={cabin.id}
              type="button"
              variant={activeLocation === cabin.id ? "default" : "outline"}
              className="gap-2"
              onClick={() => {
                setActiveLocation(cabin.id);
                resetForm();
              }}
            >
              <Box className="w-4 h-4" />
              {cabin.name}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">
              Valor estimado de reposicion (
              {activeLocation === DEPOSIT_KEY
                ? "Deposito"
                : selectedCabin?.name}
              )
            </p>
            <p className="text-3xl font-bold text-slate-900">
              ${totalValue.toLocaleString()}
            </p>
          </div>
          <Badge className="bg-slate-800 hover:bg-slate-800 text-white px-3 py-1">
            {filteredItems.length} articulos
          </Badge>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          {editingItemId ? "Editar articulo" : "Nuevo articulo"}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventory-name">Articulo *</Label>
              <Input
                id="inventory-name"
                placeholder="Ej: Pava electrica"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory-category">Categoria *</Label>
              <Input
                id="inventory-category"
                placeholder="Ej: Electrodomesticos"
                value={formData.category}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory-quantity">Cantidad *</Label>
              <Input
                id="inventory-quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    quantity: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inventory-price">
                Precio de reposicion ($) *
              </Label>
              <Input
                id="inventory-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.replacementCost}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    replacementCost: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="inventory-notes">Observaciones</Label>
              <Input
                id="inventory-notes"
                placeholder="Ej: Marca Philips, color negro"
                value={formData.notes}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {editingItemId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              {editingItemId ? "Guardar cambios" : "Agregar articulo"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No hay articulos cargados en esta ubicacion.
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Cantidad: {item.quantity} | Precio: $
                    {item.replacementCost.toLocaleString()} | Subtotal: $
                    {(item.quantity * item.replacementCost).toLocaleString()}
                  </p>
                  {item.notes ? (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => openEdit(item)}
                    className="text-slate-700 hover:bg-slate-100"
                    disabled={isSubmitting}
                  >
                    <PencilLine className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:bg-red-50"
                    disabled={isDeletingId === item.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
