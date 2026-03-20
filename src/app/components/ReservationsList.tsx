import { useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { areIntervalsOverlapping, differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Calendar,
  Home,
  User,
  Trash2,
  DollarSign,
  PencilLine,
} from "lucide-react";
import { Cabin, Reservation } from "../types/cabin";
import { toast } from "sonner";

interface ReservationsListProps {
  reservations: Reservation[];
  cabins: Cabin[];
  onUpdate: (reservation: Reservation) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface ReservationFormState {
  cabinId: string;
  startDate: string;
  endDate: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  numberOfGuests: string;
  status: Reservation["status"];
  paymentStatus: Reservation["paymentStatus"];
}

const statusLabels: Record<
  Reservation["status"],
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  confirmed: { label: "Confirmada", variant: "default" },
  completed: { label: "Completada", variant: "outline" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

const paymentLabels: Record<
  Reservation["paymentStatus"],
  { label: string; color: string }
> = {
  paid: { label: "Pagado", color: "text-green-600" },
  pending: { label: "Pendiente", color: "text-orange-600" },
  partial: { label: "Parcial", color: "text-blue-600" },
};

export function ReservationsList({
  reservations,
  cabins,
  onUpdate,
  onDelete,
}: ReservationsListProps) {
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingReservationId, setDeletingReservationId] = useState<
    string | null
  >(null);
  const [formState, setFormState] = useState<ReservationFormState>({
    cabinId: cabins[0]?.id ?? "",
    startDate: "",
    endDate: "",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    numberOfGuests: "1",
    status: "confirmed",
    paymentStatus: "pending",
  });

  const selectedCabin = useMemo(
    () => cabins.find((cabin) => cabin.id === formState.cabinId) ?? null,
    [cabins, formState.cabinId],
  );

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormState({
      cabinId: reservation.cabin.id,
      startDate: format(reservation.startDate, "yyyy-MM-dd"),
      endDate: format(reservation.endDate, "yyyy-MM-dd"),
      guestName: reservation.guest.name,
      guestPhone: reservation.guest.phone,
      guestEmail: reservation.guest.email,
      numberOfGuests: String(reservation.guest.numberOfGuests),
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
    });
  };

  const closeEditDialog = () => {
    setEditingReservation(null);
  };

  const handleDeleteReservation = async (reservationId: string) => {
    const shouldDelete = window.confirm(
      "¿Seguro que desea eliminar esta reserva? Esta acción no se puede deshacer.",
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingReservationId(reservationId);

    try {
      await onDelete(reservationId);
    } finally {
      setDeletingReservationId(null);
    }
  };

  const handleSaveReservation = async () => {
    if (!editingReservation || !selectedCabin) {
      return;
    }

    if (
      !formState.guestName.trim() ||
      !formState.guestPhone.trim() ||
      !formState.guestEmail.trim() ||
      !formState.startDate ||
      !formState.endDate
    ) {
      toast.error("Complete todos los campos obligatorios de la reserva");
      return;
    }

    const startDate = new Date(`${formState.startDate}T00:00:00`);
    const endDate = new Date(`${formState.endDate}T00:00:00`);
    const nights = differenceInDays(endDate, startDate);
    const numberOfGuests = Number(formState.numberOfGuests);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Ingrese fechas válidas");
      return;
    }

    if (nights <= 0) {
      toast.error("La fecha de salida debe ser posterior al check-in");
      return;
    }

    if (!Number.isFinite(numberOfGuests) || numberOfGuests <= 0) {
      toast.error("Ingrese una cantidad válida de huéspedes");
      return;
    }

    if (numberOfGuests > selectedCabin.capacity) {
      toast.error("La cantidad de huéspedes supera la capacidad de la cabaña");
      return;
    }

    const hasOverlappingReservation =
      formState.status !== "cancelled" &&
      reservations.some(
        (reservation) =>
          reservation.id !== editingReservation.id &&
          reservation.status !== "cancelled" &&
          reservation.cabin.id === selectedCabin.id &&
          areIntervalsOverlapping(
            { start: startDate, end: endDate },
            { start: reservation.startDate, end: reservation.endDate },
            { inclusive: true },
          ),
      );

    if (hasOverlappingReservation) {
      toast.error(
        "Ya existe otra reserva para esa cabaña en el rango de fechas seleccionado",
      );
      return;
    }

    setIsSaving(true);

    try {
      await onUpdate({
        ...editingReservation,
        cabin: selectedCabin,
        startDate,
        endDate,
        guest: {
          name: formState.guestName,
          phone: formState.guestPhone,
          email: formState.guestEmail,
          numberOfGuests,
        },
        totalPrice: nights * selectedCabin.pricePerNight,
        status: formState.status,
        paymentStatus: formState.paymentStatus,
      });

      toast.success("Reserva actualizada correctamente");
      closeEditDialog();
    } finally {
      setIsSaving(false);
    }
  };

  if (reservations.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        <p>No hay reservas registradas</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => {
        const statusInfo = statusLabels[reservation.status];
        const paymentInfo = paymentLabels[reservation.paymentStatus];
        const nights = differenceInDays(
          reservation.endDate,
          reservation.startDate,
        );

        return (
          <Card key={reservation.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-lg">
                        {reservation.cabin.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {reservation.cabin.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Fechas de estadía</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Check-in: </span>
                      <span className="font-medium">
                        {format(reservation.startDate, "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Check-out: </span>
                      <span className="font-medium">
                        {format(reservation.endDate, "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Noches: </span>
                      <Badge variant="secondary">{nights}</Badge>
                    </div>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="flex items-start gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.guest.name}
                      </p>
                      <p className="text-xs">
                        {reservation.guest.numberOfGuests}{" "}
                        {reservation.guest.numberOfGuests === 1
                          ? "persona"
                          : "personas"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xl font-bold text-green-600">
                        ${reservation.totalPrice.toLocaleString()}
                      </p>
                      <p className={`text-xs font-medium ${paymentInfo.color}`}>
                        {paymentInfo.label}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(reservation)}
                    className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <PencilLine className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReservation(reservation.id)}
                    disabled={deletingReservationId === reservation.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      <Dialog
        open={editingReservation !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar reserva</DialogTitle>
            <DialogDescription>
              Actualice los datos de la reserva seleccionada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reservation-cabin">Cabaña</Label>
              <Select
                value={formState.cabinId}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, cabinId: value }))
                }
              >
                <SelectTrigger id="reservation-cabin">
                  <SelectValue placeholder="Seleccione cabaña" />
                </SelectTrigger>
                <SelectContent>
                  {cabins.map((cabin) => (
                    <SelectItem key={cabin.id} value={cabin.id}>
                      {cabin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-guests">Huéspedes</Label>
              <Input
                id="reservation-guests"
                type="number"
                min="1"
                max={selectedCabin?.capacity ?? undefined}
                value={formState.numberOfGuests}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    numberOfGuests: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-start-date">Check-in</Label>
              <Input
                id="reservation-start-date"
                type="date"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-end-date">Check-out</Label>
              <Input
                id="reservation-end-date"
                type="date"
                value={formState.endDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reservation-guest-name">Nombre del huésped</Label>
              <Input
                id="reservation-guest-name"
                value={formState.guestName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    guestName: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-guest-phone">Teléfono</Label>
              <Input
                id="reservation-guest-phone"
                value={formState.guestPhone}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    guestPhone: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-guest-email">Email</Label>
              <Input
                id="reservation-guest-email"
                type="email"
                value={formState.guestEmail}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    guestEmail: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-status">Estado</Label>
              <Select
                value={formState.status}
                onValueChange={(value: Reservation["status"]) =>
                  setFormState((current) => ({ ...current, status: value }))
                }
              >
                <SelectTrigger id="reservation-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation-payment-status">Pago</Label>
              <Select
                value={formState.paymentStatus}
                onValueChange={(value: Reservation["paymentStatus"]) =>
                  setFormState((current) => ({
                    ...current,
                    paymentStatus: value,
                  }))
                }
              >
                <SelectTrigger id="reservation-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={closeEditDialog}
            >
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving}
              onClick={handleSaveReservation}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
