export interface Cabin {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  image: string;
}

export interface GuestData {
  name: string;
  phone: string;
  email: string;
  numberOfGuests: number;
}

export interface Reservation {
  id: string;
  cabin: Cabin;
  startDate: Date;
  endDate: Date;
  guest: GuestData;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  paymentStatus: "paid" | "pending" | "partial";
}

export interface Expense {
  id: string;
  date: Date;
  category: "maintenance" | "cleaning" | "utilities" | "supplies" | "other";
  description: string;
  amount: number;
  cabin?: Cabin;
}

export type InventoryLocationType = "cabin" | "deposit";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  replacementCost: number;
  locationType: InventoryLocationType;
  cabin?: Cabin;
  notes?: string;
  updatedAt: Date;
}

export interface BalanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  reservationsCount: number;
  occupancyRate: number;
}
