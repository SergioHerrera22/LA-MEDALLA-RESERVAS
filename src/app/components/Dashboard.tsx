import { useMemo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  TrendingUp,
  CalendarDays,
  Users,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Reservation, Cabin } from "../types/cabin";
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isToday,
  isTomorrow,
  addDays,
  differenceInDays,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale/es";

interface DashboardProps {
  reservations: Reservation[];
  cabins: Cabin[];
}

export function Dashboard({ reservations, cabins }: DashboardProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const metrics = useMemo(() => {
    const activeReservations = reservations.filter(
      (r) => r.status !== "cancelled",
    );

    // Ingresos del mes
    const monthlyIncome = activeReservations
      .filter((r) =>
        isWithinInterval(r.startDate, { start: monthStart, end: monthEnd }),
      )
      .reduce((sum, r) => sum + r.totalPrice, 0);

    // Reservas del mes
    const monthlyReservations = activeReservations.filter((r) =>
      isWithinInterval(r.startDate, { start: monthStart, end: monthEnd }),
    );

    // Ocupación hoy (cabañas siendo usadas ahora)
    const occupiedToday = cabins.filter((cabin) =>
      activeReservations.some(
        (r) =>
          r.cabin.id === cabin.id &&
          isWithinInterval(today, {
            start: startOfDay(r.startDate),
            end: endOfDay(r.endDate),
          }),
      ),
    );

    // Próximas llegadas (hoy + 7 días)
    const next7Days = addDays(today, 7);
    const upcomingArrivals = activeReservations
      .filter(
        (r) =>
          isAfter(r.startDate, startOfDay(today)) &&
          isBefore(r.startDate, next7Days),
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Salidas pendientes hoy/mañana
    const checkoutsNearby = activeReservations.filter(
      (r) => isToday(r.endDate) || isTomorrow(r.endDate),
    );

    // Reservas pendientes de pago
    const pendingPayment = activeReservations.filter(
      (r) => r.paymentStatus === "pending" && r.status === "confirmed",
    );

    return {
      monthlyIncome,
      monthlyReservations,
      occupiedToday,
      upcomingArrivals,
      checkoutsNearby,
      pendingPayment,
    };
  }, [reservations, cabins, today]);

  const occupancyPercent =
    cabins.length > 0
      ? Math.round((metrics.occupiedToday.length / cabins.length) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header del panel */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
            Resumen operativo
          </p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Panel de Control
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-fit">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-700 capitalize">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ingresos */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Este mes
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            ${metrics.monthlyIncome.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">Ingresos del mes</p>
        </div>

        {/* Reservas */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-sky-500 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              Este mes
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {metrics.monthlyReservations.length}
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">Reservas del mes</p>
        </div>

        {/* Ocupación */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-500 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="bg-violet-50 p-2.5 rounded-xl">
              <Home className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
              Ahora
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {occupancyPercent}%
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            {metrics.occupiedToday.length} de {cabins.length} cabañas ocupadas
          </p>
          <div className="mt-3 bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-violet-400 to-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Llegadas */}
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-50 p-2.5 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              Próx. 7 días
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {metrics.upcomingArrivals.length}
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">Llegadas próximas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado cabañas hoy */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Home className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Estado de cabañas hoy</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {cabins.map((cabin) => {
              const reservation = reservations
                .filter((r) => r.status !== "cancelled")
                .find(
                  (r) =>
                    r.cabin.id === cabin.id &&
                    isWithinInterval(today, {
                      start: startOfDay(r.startDate),
                      end: endOfDay(r.endDate),
                    }),
                );
              return (
                <div
                  key={cabin.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        reservation
                          ? "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.6)]"
                          : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                      }`}
                    />
                    <span className="font-medium text-gray-800">{cabin.name}</span>
                  </div>
                  {reservation ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        Sale {format(reservation.endDate, "dd/MM", { locale: es })}
                      </span>
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                        Ocupada
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Disponible
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximas llegadas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Próximas llegadas (7 días)</h3>
          </div>
          {metrics.upcomingArrivals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <CalendarDays className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Sin check-ins próximos</p>
              <p className="text-gray-400 text-xs mt-1">No hay llegadas en los próximos 7 días</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {metrics.upcomingArrivals.map((r) => {
                const daysUntil = differenceInDays(r.startDate, today);
                const initials = r.guest.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{r.guest.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.cabin.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {format(r.startDate, "dd/MM", { locale: es })}
                      </p>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          daysUntil === 0
                            ? "text-emerald-600"
                            : daysUntil === 1
                              ? "text-amber-600"
                              : "text-gray-400"
                        }`}
                      >
                        {daysUntil === 0
                          ? "Hoy"
                          : daysUntil === 1
                            ? "Mañana"
                            : `En ${daysUntil} días`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Check-outs cercanos */}
        {metrics.checkoutsNearby.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-3 bg-amber-50/50">
              <div className="bg-amber-100 p-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Check-outs hoy y mañana</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {metrics.checkoutsNearby.map((r) => {
                const initials = r.guest.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-amber-50/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{r.guest.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.cabin.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0">
                      {isToday(r.endDate) ? "Sale hoy" : "Sale mañana"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagos pendientes */}
        {metrics.pendingPayment.length > 0 && (
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-orange-100 flex items-center gap-3 bg-orange-50/50">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Pagos pendientes</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {metrics.pendingPayment.map((r) => {
                const initials = r.guest.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-orange-50/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{r.guest.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.cabin.name} · {format(r.startDate, "dd/MM", { locale: es })}</p>
                    </div>
                    <span className="text-sm font-extrabold text-orange-600 flex-shrink-0">
                      ${r.totalPrice.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
