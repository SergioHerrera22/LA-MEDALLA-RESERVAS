import { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { format, differenceInDays, isSameDay, isWithinInterval, addDays, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface CalendarViewProps {
  selectedRange: DateRange | undefined;
  onRangeSelect: (range: DateRange | undefined) => void;
  reservations: Array<{ startDate: Date; endDate: Date }>;
}

export function CalendarView({ selectedRange, onRangeSelect, reservations }: CalendarViewProps) {
  const today = startOfDay(new Date());

  // Check if a date is within any reservation
  const isDateReserved = (date: Date) => {
    return reservations.some(reservation => {
      try {
        return isWithinInterval(date, {
          start: startOfDay(reservation.startDate),
          end: startOfDay(reservation.endDate)
        });
      } catch {
        return false;
      }
    });
  };

  // Disable reserved dates and past dates
  const disabledDays = (date: Date) => {
    return isBefore(date, today) || isDateReserved(date);
  };

  const nights = selectedRange?.from && selectedRange?.to 
    ? differenceInDays(selectedRange.to, selectedRange.from)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl mb-2">Seleccione las Fechas</h2>
        <p className="text-sm text-gray-600">Elija el rango de fechas para su reserva</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Calendario de Disponibilidad
            </h3>
          </div>
          
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={onRangeSelect}
            disabled={disabledDays}
            locale={es}
            numberOfMonths={2}
            className="rounded-md border"
          />

          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Seleccionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-600">No disponible</span>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6 h-fit">
          <h3 className="font-semibold mb-4">Resumen de Reserva</h3>
          
          {!selectedRange?.from ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Info className="w-12 h-12 mb-2" />
              <p className="text-sm text-center">Seleccione las fechas en el calendario</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Check-in</p>
                <p className="font-medium">
                  {format(selectedRange.from, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>

              {selectedRange.to && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Check-out</p>
                    <p className="font-medium">
                      {format(selectedRange.to, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Noches:</span>
                      <Badge variant="secondary" className="text-base">
                        {nights}
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              {!selectedRange.to && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  Seleccione la fecha de salida
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
