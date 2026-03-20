import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  PencilLine,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
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
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
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

  const handleMarkAsPaid = async (reservation: Reservation) => {
    setMarkingPaidId(reservation.id);
    try {
      await onUpdate({ ...reservation, paymentStatus: "paid" });
      toast.success("Reserva marcada como pagada");
    } catch {
      toast.error("No se pudo actualizar el pago");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleExportExcel = () => {
    const rows = reservations.map((r) => ({
      Cabaña: r.cabin.name,
      Huésped: r.guest.name,
      Teléfono: r.guest.phone,
      Email: r.guest.email,
      Huéspedes: r.guest.numberOfGuests,
      "Check-in": format(r.startDate, "dd/MM/yyyy", { locale: es }),
      "Check-out": format(r.endDate, "dd/MM/yyyy", { locale: es }),
      Noches: differenceInDays(r.endDate, r.startDate),
      "Total ($)": r.totalPrice,
      Estado: r.status,
      Pago: r.paymentStatus,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, "reservas-la-medalla.xlsx");
    toast.success("Excel exportado correctamente");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Reservas - Cabañas La Medalla", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Cabaña",
          "Huésped",
          "Check-in",
          "Check-out",
          "Noches",
          "Total",
          "Estado",
          "Pago",
        ],
      ],
      body: reservations.map((r) => [
        r.cabin.name,
        r.guest.name,
        format(r.startDate, "dd/MM/yyyy", { locale: es }),
        format(r.endDate, "dd/MM/yyyy", { locale: es }),
        differenceInDays(r.endDate, r.startDate),
        `$${r.totalPrice.toLocaleString()}`,
        r.status,
        r.paymentStatus,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    });
    doc.save("reservas-la-medalla.pdf");
    toast.success("PDF exportado correctamente");
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
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <div className="bg-gray-100 p-4 rounded-full mb-3">
          <Calendar className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-600 font-semibold">Sin reservas registradas</p>
        <p className="text-gray-400 text-sm mt-1">Las reservas aparecerán aquí una vez creadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-gray-200 font-semibold hover:bg-gray-50"
          onClick={handleExportExcel}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Exportar Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-gray-200 font-semibold hover:bg-gray-50"
          onClick={handleExportPDF}
        >
          <FileText className="w-4 h-4 text-red-500" />
          Exportar PDF
        </Button>
      </div>
      {reservations.map((reservation) => {
        const statusInfo = statusLabels[reservation.status];
        const paymentInfo = paymentLabels[reservation.paymentStatus];
        const nights = differenceInDays(
          reservation.endDate,
          reservation.startDate,
        );
        const initials = reservation.guest.name
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase();

        return (
          <div
            key={reservation.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Card top bar with status color */}
            <div
              className={`h-1 w-full ${
                reservation.status === "cancelled"
                  ? "bg-red-400"
                  : reservation.status === "completed"
                    ? "bg-gray-300"
                    : reservation.status === "confirmed"
                      ? "bg-emerald-500"
                      : "bg-amber-400"
              }`}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {reservation.guest.name}
                      </h3>
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Home className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium">{reservation.cabin.name}</span>
                      <span className="text-gray-300">·</span>
                      <User className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{reservation.guest.numberOfGuests} {reservation.guest.numberOfGuests === 1 ? "persona" : "personas"}</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {reservation.paymentStatus !== "paid" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsPaid(reservation)}
                      disabled={markingPaidId === reservation.id}
                      className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold px-2.5"
                      title="Marcar como pagada"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Pagado</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(reservation)}
                    className="text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg"
                  >
                    <PencilLine className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReservation(reservation.id)}
                    disabled={deletingReservationId === reservation.id}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Dates + payment row */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Check-in: <span className="font-bold text-gray-900">{format(reservation.startDate, "dd/MM/yyyy", { locale: es })}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Check-out: <span className="font-bold text-gray-900">{format(reservation.endDate, "dd/MM/yyyy", { locale: es })}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600">
                    {nights} {nights === 1 ? "noche" : "noches"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    ${reservation.totalPrice.toLocaleString()}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    reservation.paymentStatus === "paid"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : reservation.paymentStatus === "partial"
                        ? "text-blue-700 bg-blue-50 border-blue-200"
                        : "text-orange-600 bg-orange-50 border-orange-200"
                  }`}>
                    {paymentInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
