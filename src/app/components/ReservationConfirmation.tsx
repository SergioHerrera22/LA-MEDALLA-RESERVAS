import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { 
  CheckCircle2, 
  Calendar, 
  Home,
  User, 
  Phone, 
  Mail, 
  Users,
  DollarSign
} from 'lucide-react';
import { Cabin, GuestData } from '../types/cabin';

interface ReservationConfirmationProps {
  cabin: Cabin;
  startDate: Date;
  endDate: Date;
  guest: GuestData;
  totalPrice: number;
}

export function ReservationConfirmation({ 
  cabin, 
  startDate, 
  endDate, 
  guest,
  totalPrice
}: ReservationConfirmationProps) {
  const nights = differenceInDays(endDate, startDate);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl mb-2">¡Reserva Confirmada!</h2>
          <p className="text-gray-600">Su reserva ha sido registrada exitosamente. Recibirá un email de confirmación.</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Cabin Info */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Home className="w-5 h-5 text-green-600" />
              Cabaña
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium text-lg">{cabin.name}</p>
              <p className="text-sm text-gray-600 mt-1">{cabin.description}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                <Users className="w-4 h-4" />
                <span>Capacidad hasta {cabin.capacity} personas</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Fechas de la Reserva
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Check-in:</span>
                <span className="font-medium">
                  {format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Check-out:</span>
                <span className="font-medium">
                  {format(endDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Noches:</span>
                  <Badge variant="secondary">{nights}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Datos del Huésped
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="font-medium">{guest.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                {guest.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {guest.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                {guest.numberOfGuests} {guest.numberOfGuests === 1 ? 'persona' : 'personas'}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Detalle de Pago
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">${cabin.pricePerNight.toLocaleString()} x {nights} noches</span>
                <span className="font-medium">${(cabin.pricePerNight * nights).toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Importante:</strong> El check-in es a partir de las 15:00 hs y el check-out hasta las 11:00 hs. 
          Para cancelaciones, contactar con al menos 48 horas de anticipación.
        </p>
      </div>
    </div>
  );
}
