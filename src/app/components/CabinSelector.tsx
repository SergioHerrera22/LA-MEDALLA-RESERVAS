import { useMemo, useState } from "react";
import { format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale/es";
import { Cabin, Reservation } from "../types/cabin";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  CalendarDays,
  CircleDollarSign,
  DollarSign,
  Home,
  PencilLine,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface CabinSelectorProps {
  cabins: Cabin[];
  selectedCabin: Cabin | null;
  onCabinSelect: (cabin: Cabin) => void;
  onPriceChange: (cabinId: string, newPrice: number) => Promise<void>;
  reservations?: Reservation[];
}

export function CabinSelector({
  cabins,
  selectedCabin,
  onCabinSelect,
  onPriceChange,
  reservations = [],
}: CabinSelectorProps) {
  const [editingCabin, setEditingCabin] = useState<Cabin | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const today = useMemo(() => new Date(), []);

  const openPriceEditor = (cabin: Cabin) => {
    setEditingCabin(cabin);
    setPriceInput(String(cabin.pricePerNight));
  };

  const closePriceEditor = () => {
    setEditingCabin(null);
    setPriceInput("");
  };

  const handleSavePrice = async () => {
    if (!editingCabin) {
      return;
    }

    const sanitizedValue = priceInput.replace(/[^\d]/g, "");
    const newPrice = Number(sanitizedValue);

    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      toast.error("Ingrese un precio válido mayor a 0");
      return;
    }

    setIsSavingPrice(true);

    try {
      await onPriceChange(editingCabin.id, newPrice);
      closePriceEditor();
    } finally {
      setIsSavingPrice(false);
    }
  };

  const getCabinReservations = (cabinId: string) =>
    reservations.filter(
      (reservation) =>
        reservation.cabin.id === cabinId && reservation.status !== "cancelled",
    );

  const getCabinStatus = (cabinReservations: Reservation[]) => {
    const currentReservation = cabinReservations.find((reservation) =>
      isWithinInterval(today, {
        start: reservation.startDate,
        end: reservation.endDate,
      }),
    );

    if (currentReservation) {
      return {
        label: "Ocupada hoy",
        detail: `Salida ${format(currentReservation.endDate, "d MMM", { locale: es })}`,
      };
    }

    const nextReservation = cabinReservations
      .filter((reservation) => isAfter(reservation.startDate, today))
      .sort(
        (left, right) => left.startDate.getTime() - right.startDate.getTime(),
      )[0];

    if (nextReservation) {
      return {
        label: "Disponible",
        detail: `Próximo ingreso ${format(nextReservation.startDate, "d MMM", { locale: es })}`,
      };
    }

    return {
      label: "Disponible",
      detail: "Sin reservas próximas",
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl mb-2">Seleccione la Cabaña</h2>
        <p className="text-sm text-gray-600">
          Elija la cabaña que desea reservar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cabins.map((cabin) => {
          const isSelected = selectedCabin?.id === cabin.id;
          const cabinReservations = getCabinReservations(cabin.id);
          const status = getCabinStatus(cabinReservations);
          const projectedIncome = cabinReservations.reduce(
            (total, reservation) => total + reservation.totalPrice,
            0,
          );
          const guestsInHouse = cabinReservations
            .filter(
              (reservation) =>
                isBefore(reservation.startDate, today) &&
                isAfter(reservation.endDate, today),
            )
            .reduce(
              (total, reservation) => total + reservation.guest.numberOfGuests,
              0,
            );

          return (
            <Card
              key={cabin.id}
              className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                isSelected
                  ? "ring-2 ring-green-600 bg-green-50"
                  : "hover:ring-1 hover:ring-gray-300"
              }`}
              onClick={() => onCabinSelect(cabin)}
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={cabin.image}
                  alt={cabin.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                  <Badge className="bg-white/90 text-slate-900 hover:bg-white">
                    {status.label}
                  </Badge>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 bg-white/90 text-slate-900 hover:bg-white"
                    disabled={isSavingPrice}
                    onClick={(event) => {
                      event.stopPropagation();
                      openPriceEditor(cabin);
                    }}
                  >
                    <PencilLine className="h-4 w-4" />
                    Cambiar precio
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl font-semibold">{cabin.name}</h3>
                  <p className="text-sm text-white/85">{status.detail}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm text-emerald-800">
                      <CalendarDays className="h-4 w-4" />
                      Reservas activas
                    </div>
                    <p className="text-2xl font-semibold text-emerald-900">
                      {cabinReservations.length}
                    </p>
                    <p className="text-xs text-emerald-700">
                      Confirmadas y completadas
                    </p>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm text-sky-800">
                      <CircleDollarSign className="h-4 w-4" />
                      Ingreso acumulado
                    </div>
                    <p className="text-2xl font-semibold text-sky-900">
                      ${projectedIncome.toLocaleString()}
                    </p>
                    <p className="text-xs text-sky-700">
                      Total de reservas no canceladas
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-xl font-semibold text-green-600">
                    ${cabin.pricePerNight.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/ noche</span>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                      <Users className="h-4 w-4" />
                      <span>Capacidad: {cabin.capacity} huéspedes</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                      <Home className="h-4 w-4" />
                      <span>
                        Huéspedes alojados:{" "}
                        {guestsInHouse > 0 ? guestsInHouse : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={editingCabin !== null}
        onOpenChange={(open) => {
          if (!open) {
            closePriceEditor();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar tarifa por noche</DialogTitle>
            <DialogDescription>
              {editingCabin
                ? `Defina la nueva tarifa para ${editingCabin.name}.`
                : "Defina la nueva tarifa por noche."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="cabin-price"
            >
              Nuevo precio
            </label>
            <Input
              id="cabin-price"
              type="text"
              inputMode="numeric"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="Ej: 18000"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSavingPrice}
              onClick={closePriceEditor}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSavingPrice}
              onClick={handleSavePrice}
            >
              Guardar precio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
