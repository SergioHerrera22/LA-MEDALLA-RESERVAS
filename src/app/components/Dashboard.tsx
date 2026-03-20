import { useMemo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ReservationsCalendar } from "./ReservationsCalendar";
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

      {/* Layout de 2 columnas: Calendario (izq) + Panel de Control (der) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IZQUIERDA: Calendario */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <ReservationsCalendar
              reservations={reservations}
              cabins={cabins}
            />
          </Card>
        </div>

        {/* DERECHA: Panel de Control comprimido */}
        <aside className="space-y-4">
          {/* Métricas principales comprimidas */}
          {/* Ingresos */}
          <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-xl" />
            <div className="flex items-center justify-between mb-2">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Mes
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              ${metrics.monthlyIncome.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Ingresos</p>
          </div>

          {/* Reservas */}
          <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-sky-500 rounded-t-xl" />
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-50 p-2 rounded-lg">
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                Mes
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {metrics.monthlyReservations.length}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Reservas</p>
          </div>

          {/* Ocupación */}
          <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-purple-500 rounded-t-xl" />
            <div className="flex items-center justify-between mb-2">
              <div className="bg-violet-50 p-2 rounded-lg">
                <Home className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                Ahora
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {occupancyPercent}%
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {metrics.occupiedToday.length}/{cabins.length}
            </p>
            <div className="mt-2 bg-gray-100 rounded-full h-1">
              <div
                className="bg-gradient-to-r from-violet-400 to-purple-500 h-1 rounded-full transition-all"
                style={{ width: `${occupancyPercent}%` }}
              />
            </div>
          </div>

          {/* Llegadas */}
          <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-xl" />
            <div className="flex items-center justify-between mb-2">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                7 días
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {metrics.upcomingArrivals.length}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Próximas</p>
          </div>

          {/* Alertas colapsadas */}
          <div className="space-y-3 pt-2">
            {/* Cabañas ocupadas hoy */}
            {metrics.occupiedToday.length > 0 && (
              <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
                <h4 className="text-xs font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Ocupadas hoy
                </h4>
                <div className="space-y-2">
                  {metrics.occupiedToday.map((cabin) => (
                    <div key={cabin.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium truncate">
                        {cabin.name}
                      </span>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                        En uso
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Check-outs cercanos */}
            {metrics.checkoutsNearby.length > 0 && (
              <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
                <h4 className="text-xs font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Check-outs
                </h4>
                <div className="space-y-2">
                  {metrics.checkoutsNearby.map((r) => (
                    <div key={r.id} className="text-xs">
                      <p className="font-medium text-amber-900">{r.guest.name}</p>
                      <p className="text-amber-700 text-xs">
                        {isToday(r.endDate) ? "Sale hoy" : "Sale mañana"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagos pendientes */}
            {metrics.pendingPayment.length > 0 && (
              <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
                <h4 className="text-xs font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Pagos pendientes
                </h4>
                <div className="space-y-2">
                  {metrics.pendingPayment.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-medium text-orange-900">
                          {r.guest.name}
                        </p>
                        <p className="text-orange-700">
                          ${r.totalPrice.toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                        Pendiente
                      </Badge>
                    </div>
                  ))}
                  {metrics.pendingPayment.length > 3 && (
                    <p className="text-xs text-gray-500 text-center pt-1 border-t border-orange-100">
                      +{metrics.pendingPayment.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
