import { useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale/es";
import { Reservation, Cabin } from "../types/cabin";

interface ReservationsCalendarProps {
  reservations: Reservation[];
  cabins: Cabin[];
}

const CABIN_COLORS = [
  {
    bg: "bg-emerald-500",
    light: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  {
    bg: "bg-sky-500",
    light: "bg-sky-100",
    text: "text-sky-800",
    border: "border-sky-300",
  },
  {
    bg: "bg-violet-500",
    light: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-300",
  },
  {
    bg: "bg-amber-500",
    light: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-300",
  },
];

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function ReservationsCalendar({
  reservations,
  cabins,
}: ReservationsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const cabinColorMap = useMemo(() => {
    const map = new Map<string, (typeof CABIN_COLORS)[0]>();
    cabins.forEach((cabin, i) => {
      map.set(cabin.id, CABIN_COLORS[i % CABIN_COLORS.length]);
    });
    return map;
  }, [cabins]);

  const activeReservations = useMemo(
    () => reservations.filter((r) => r.status !== "cancelled"),
    [reservations],
  );

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  // Monday-first offset: getDay returns 0=Sun, so we shift
  const startOffset = useMemo(() => {
    const dayOfWeek = getDay(startOfMonth(currentMonth));
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }, [currentMonth]);

  const getReservationsForDay = (date: Date) =>
    activeReservations.filter((r) =>
      isWithinInterval(date, {
        start: startOfDay(r.startDate),
        end: endOfDay(r.endDate),
      }),
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Home className="w-5 h-5 text-gray-600" />
          Calendario de Reservas
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium min-w-32 text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Leyenda de cabañas */}
      <div className="flex flex-wrap gap-3">
        {cabins.map((cabin) => {
          const color = cabinColorMap.get(cabin.id)!;
          return (
            <div key={cabin.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color.bg}`} />
              <span className="text-sm text-gray-700">{cabin.name}</span>
            </div>
          );
        })}
      </div>

      {/* Grilla del calendario */}
      <Card className="p-4">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1">
          {/* Celdas vacías para el offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16" />
          ))}

          {days.map((day) => {
            const dayReservations = getReservationsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`h-16 p-1 rounded-lg border transition-colors ${
                  isCurrentDay
                    ? "border-green-500 bg-green-50"
                    : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                } ${!isCurrentMonth ? "opacity-30" : ""}`}
              >
                <p
                  className={`text-xs font-medium mb-1 ${
                    isCurrentDay ? "text-green-700" : "text-gray-700"
                  }`}
                >
                  {format(day, "d")}
                </p>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayReservations.slice(0, 2).map((r) => {
                    const color = cabinColorMap.get(r.cabin.id)!;
                    return (
                      <div
                        key={r.id}
                        className={`${color.light} ${color.text} text-[10px] px-1 rounded truncate leading-4`}
                        title={`${r.cabin.name} - ${r.guest.name}`}
                      >
                        {r.cabin.name.replace("Cabaña ", "C")}
                      </div>
                    );
                  })}
                  {dayReservations.length > 2 && (
                    <span className="text-[10px] text-gray-500 px-1">
                      +{dayReservations.length - 2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reservas del mes seleccionado */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 text-sm text-gray-700 capitalize">
          Reservas de {format(currentMonth, "MMMM", { locale: es })}
        </h4>
        {activeReservations.filter((r) =>
          isWithinInterval(r.startDate, {
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth),
          }),
        ).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay reservas este mes
          </p>
        ) : (
          <div className="space-y-2">
            {activeReservations
              .filter((r) =>
                isWithinInterval(r.startDate, {
                  start: startOfMonth(currentMonth),
                  end: endOfMonth(currentMonth),
                }),
              )
              .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
              .map((r) => {
                const color = cabinColorMap.get(r.cabin.id)!;
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${color.light} ${color.border}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${color.bg}`} />
                      <span className={`text-xs font-medium ${color.text}`}>
                        {r.cabin.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {r.guest.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {format(r.startDate, "dd/MM", { locale: es })} →{" "}
                        {format(r.endDate, "dd/MM", { locale: es })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        ${r.totalPrice.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>
    </div>
  );
}
