import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserCircle } from 'lucide-react';
import { GuestData } from '../types/cabin';

interface GuestFormProps {
  onDataComplete: (guest: GuestData) => void;
  initialGuest?: GuestData;
  maxCapacity: number;
}

export function GuestForm({ onDataComplete, initialGuest, maxCapacity }: GuestFormProps) {
  const [guestData, setGuestData] = useState<GuestData>(initialGuest || {
    name: '',
    phone: '',
    email: '',
    numberOfGuests: 1
  });

  const isDataValid = 
    guestData.name.trim() !== '' && 
    guestData.phone.trim() !== '' && 
    guestData.email.trim() !== '' &&
    guestData.numberOfGuests > 0;

  const handleInputChange = (field: string, value: string | number) => {
    const newGuestData = { ...guestData, [field]: value };
    setGuestData(newGuestData);
    
    const valid = 
      newGuestData.name.trim() !== '' && 
      newGuestData.phone.trim() !== '' && 
      newGuestData.email.trim() !== '' &&
      newGuestData.numberOfGuests > 0;
    
    if (valid) {
      onDataComplete(newGuestData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl mb-2">Datos del Huésped</h2>
        <p className="text-sm text-gray-600">Complete la información para confirmar su reserva</p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <UserCircle className="w-5 h-5" />
          Información de Contacto
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              placeholder="Juan Pérez"
              value={guestData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+54 11 1234-5678"
              value={guestData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@ejemplo.com"
              value={guestData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Número de Huéspedes *</Label>
            <Select
              value={guestData.numberOfGuests.toString()}
              onValueChange={(value) => handleInputChange('numberOfGuests', parseInt(value))}
            >
              <SelectTrigger id="guests">
                <SelectValue placeholder="Seleccione cantidad" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxCapacity }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'persona' : 'personas'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {isDataValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
          ✓ Información completa. Puede continuar al siguiente paso.
        </div>
      )}
    </div>
  );
}
