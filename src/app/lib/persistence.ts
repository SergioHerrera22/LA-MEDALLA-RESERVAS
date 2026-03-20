import { format, parseISO } from "date-fns";
import { cabins as initialCabins } from "../data/cabins";
import { Cabin, Expense, Reservation } from "../types/cabin";
import { getSupabaseClient } from "./supabase";

type CabinRow = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price_per_night: number;
  amenities: string[] | null;
  image: string;
};

type ReservationRow = {
  id: string;
  cabin_id: string;
  start_date: string;
  end_date: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  number_of_guests: number;
  total_price: number;
  status: Reservation["status"];
  payment_status: Reservation["paymentStatus"];
};

type ExpenseRow = {
  id: string;
  date: string;
  category: Expense["category"];
  description: string;
  amount: number;
  cabin_id: string | null;
};

const mapCabinRow = (row: CabinRow): Cabin => ({
  id: row.id,
  name: row.name,
  description: row.description,
  capacity: row.capacity,
  pricePerNight: Number(row.price_per_night),
  amenities: row.amenities ?? [],
  image: row.image,
});

const mapCabinToRow = (cabin: Cabin): CabinRow => ({
  id: cabin.id,
  name: cabin.name,
  description: cabin.description,
  capacity: cabin.capacity,
  price_per_night: cabin.pricePerNight,
  amenities: cabin.amenities,
  image: cabin.image,
});

const mapReservationRow = (
  row: ReservationRow,
  cabinById: Map<string, Cabin>,
): Reservation | null => {
  const cabin = cabinById.get(row.cabin_id);

  if (!cabin) {
    return null;
  }

  return {
    id: row.id,
    cabin,
    startDate: parseISO(row.start_date),
    endDate: parseISO(row.end_date),
    guest: {
      name: row.guest_name,
      phone: row.guest_phone,
      email: row.guest_email,
      numberOfGuests: row.number_of_guests,
    },
    totalPrice: Number(row.total_price),
    status: row.status,
    paymentStatus: row.payment_status,
  };
};

const mapExpenseRow = (
  row: ExpenseRow,
  cabinById: Map<string, Cabin>,
): Expense => ({
  id: row.id,
  date: parseISO(row.date),
  category: row.category,
  description: row.description,
  amount: Number(row.amount),
  cabin: row.cabin_id ? cabinById.get(row.cabin_id) : undefined,
});

const ensureCabinsSeeded = async () => {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("cabins")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error: seedError } = await supabase
    .from("cabins")
    .upsert(initialCabins.map(mapCabinToRow), { onConflict: "id" });

  if (seedError) {
    throw seedError;
  }
};

export const loadAppData = async () => {
  const supabase = getSupabaseClient();

  await ensureCabinsSeeded();

  const [cabinsResult, reservationsResult, expensesResult] = await Promise.all([
    supabase.from("cabins").select("*").order("id"),
    supabase.from("reservations").select("*").order("start_date", {
      ascending: false,
    }),
    supabase.from("expenses").select("*").order("date", { ascending: false }),
  ]);

  if (cabinsResult.error) {
    throw cabinsResult.error;
  }

  if (reservationsResult.error) {
    throw reservationsResult.error;
  }

  if (expensesResult.error) {
    throw expensesResult.error;
  }

  const cabins = (cabinsResult.data ?? []).map((row) =>
    mapCabinRow(row as CabinRow),
  );
  const cabinById = new Map(cabins.map((cabin) => [cabin.id, cabin]));

  const reservations = (reservationsResult.data ?? [])
    .map((row) => mapReservationRow(row as ReservationRow, cabinById))
    .filter((reservation): reservation is Reservation => reservation !== null);

  const expenses = (expensesResult.data ?? []).map((row) =>
    mapExpenseRow(row as ExpenseRow, cabinById),
  );

  return { cabins, reservations, expenses };
};

export const updateCabinPrice = async (cabinId: string, newPrice: number) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("cabins")
    .update({ price_per_night: newPrice })
    .eq("id", cabinId);

  if (error) {
    throw error;
  }
};

export const createReservation = async (
  reservation: Omit<Reservation, "id">,
): Promise<Reservation> => {
  const supabase = getSupabaseClient();

  const payload = {
    cabin_id: reservation.cabin.id,
    start_date: format(reservation.startDate, "yyyy-MM-dd"),
    end_date: format(reservation.endDate, "yyyy-MM-dd"),
    guest_name: reservation.guest.name,
    guest_phone: reservation.guest.phone,
    guest_email: reservation.guest.email,
    number_of_guests: reservation.guest.numberOfGuests,
    total_price: reservation.totalPrice,
    status: reservation.status,
    payment_status: reservation.paymentStatus,
  };

  const { data, error } = await supabase
    .from("reservations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    ...reservation,
  };
};

export const deleteReservation = async (reservationId: string) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId);

  if (error) {
    throw error;
  }
};

export const updateReservation = async (
  reservation: Reservation,
): Promise<Reservation> => {
  const supabase = getSupabaseClient();

  const payload = {
    cabin_id: reservation.cabin.id,
    start_date: format(reservation.startDate, "yyyy-MM-dd"),
    end_date: format(reservation.endDate, "yyyy-MM-dd"),
    guest_name: reservation.guest.name,
    guest_phone: reservation.guest.phone,
    guest_email: reservation.guest.email,
    number_of_guests: reservation.guest.numberOfGuests,
    total_price: reservation.totalPrice,
    status: reservation.status,
    payment_status: reservation.paymentStatus,
  };

  const { error } = await supabase
    .from("reservations")
    .update(payload)
    .eq("id", reservation.id);

  if (error) {
    throw error;
  }

  return reservation;
};

export const createExpense = async (
  expense: Omit<Expense, "id">,
): Promise<Expense> => {
  const supabase = getSupabaseClient();

  const payload = {
    date: format(expense.date, "yyyy-MM-dd"),
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    cabin_id: expense.cabin?.id ?? null,
  };

  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    ...expense,
  };
};

export const deleteExpense = async (expenseId: string) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    throw error;
  }
};

export const updateExpense = async (expense: Expense): Promise<Expense> => {
  const supabase = getSupabaseClient();

  const payload = {
    date: format(expense.date, "yyyy-MM-dd"),
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    cabin_id: expense.cabin?.id ?? null,
  };

  const { error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", expense.id);

  if (error) {
    throw error;
  }

  return expense;
};
