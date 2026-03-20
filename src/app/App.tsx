import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Progress } from "./components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { CabinSelector } from "./components/CabinSelector";
import { CalendarView } from "./components/CalendarView";
import { GuestForm } from "./components/GuestForm";
import { ReservationConfirmation } from "./components/ReservationConfirmation";
import { ReservationsList } from "./components/ReservationsList";
import { ExpensesManager } from "./components/ExpensesManager";
import { BalanceView } from "./components/BalanceView";
import { cabins as initialCabins } from "./data/cabins";
import {
  createExpense,
  createReservation,
  deleteExpense,
  deleteReservation,
  loadAppData,
  updateExpense,
  updateCabinPrice,
  updateReservation,
} from "./lib/persistence";
import { Cabin, GuestData, Reservation, Expense } from "./types/cabin";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { DateRange } from "react-day-picker";
import { differenceInDays } from "date-fns";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "reservations" | "expenses" | "balance"
  >("reservations");
  const [currentStep, setCurrentStep] = useState(1);
  const [cabinList, setCabinList] = useState<Cabin[]>(initialCabins);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingReservation, setIsSavingReservation] = useState(false);

  const totalSteps = 4;

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const data = await loadAppData();

        if (!isMounted) {
          return;
        }

        setCabinList(data.cabins);
        setReservations(data.reservations);
        setExpenses(data.expenses);
      } catch (error) {
        console.error(error);

        if (isMounted) {
          toast.error(
            "No se pudieron cargar los datos desde Supabase. Revise la configuración y ejecute el esquema SQL inicial.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCabinSelect = (cabin: Cabin) => {
    setSelectedCabin(cabin);
  };

  const handleCabinPriceChange = async (cabinId: string, newPrice: number) => {
    try {
      await updateCabinPrice(cabinId, newPrice);

      setCabinList((currentCabins) =>
        currentCabins.map((cabin) =>
          cabin.id === cabinId ? { ...cabin, pricePerNight: newPrice } : cabin,
        ),
      );

      setSelectedCabin((currentCabin) =>
        currentCabin?.id === cabinId
          ? { ...currentCabin, pricePerNight: newPrice }
          : currentCabin,
      );

      toast.success("Precio actualizado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el precio en Supabase");
      throw error;
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range);
  };

  const handleDataComplete = (guest: GuestData) => {
    setGuestData(guest);
    setIsFormComplete(true);
  };

  const handleNext = async () => {
    if (currentStep === 1 && !selectedCabin) {
      toast.error("Por favor, seleccione una cabaña");
      return;
    }
    if (currentStep === 2 && (!selectedRange?.from || !selectedRange?.to)) {
      toast.error("Por favor, seleccione las fechas de check-in y check-out");
      return;
    }
    if (currentStep === 3 && !isFormComplete) {
      toast.error("Por favor, complete todos los campos");
      return;
    }

    if (
      currentStep === 3 &&
      selectedCabin &&
      selectedRange?.from &&
      selectedRange?.to &&
      guestData
    ) {
      setIsSavingReservation(true);

      try {
        const nights = differenceInDays(selectedRange.to, selectedRange.from);
        const totalPrice = nights * selectedCabin.pricePerNight;

        const newReservation = await createReservation({
          cabin: selectedCabin,
          startDate: selectedRange.from,
          endDate: selectedRange.to,
          guest: guestData,
          totalPrice,
          status: "confirmed",
          paymentStatus: "pending",
        });

        setReservations((currentReservations) => [
          ...currentReservations,
          newReservation,
        ]);
      } catch (error) {
        console.error(error);
        toast.error("No se pudo guardar la reserva en Supabase");
        return;
      } finally {
        setIsSavingReservation(false);
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNewReservation = () => {
    setCurrentStep(1);
    setSelectedCabin(null);
    setSelectedRange(undefined);
    setGuestData(null);
    setIsFormComplete(false);
    setActiveTab("reservations");
  };

  const handleDeleteReservation = async (id: string) => {
    try {
      await deleteReservation(id);
      setReservations((currentReservations) =>
        currentReservations.filter((reservation) => reservation.id !== id),
      );
      toast.success("Reserva eliminada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar la reserva en Supabase");
    }
  };

  const handleUpdateReservation = async (updatedReservation: Reservation) => {
    try {
      const savedReservation = await updateReservation(updatedReservation);

      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === savedReservation.id
            ? savedReservation
            : reservation,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la reserva en Supabase");
      throw error;
    }
  };

  const handleAddExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const newExpense = await createExpense(expense);
      setExpenses((currentExpenses) => [newExpense, ...currentExpenses]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el gasto en Supabase");
      throw error;
    }
  };

  const handleUpdateExpense = async (updatedExpense: Expense) => {
    try {
      const savedExpense = await updateExpense(updatedExpense);

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === savedExpense.id ? savedExpense : expense,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el gasto en Supabase");
      throw error;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== id),
      );
      toast.success("Gasto eliminado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el gasto en Supabase");
      throw error;
    }
  };

  const canGoNext = () => {
    if (currentStep === 1) return selectedCabin !== null;
    if (currentStep === 2)
      return (
        selectedRange?.from !== undefined && selectedRange?.to !== undefined
      );
    if (currentStep === 3) return isFormComplete;
    return false;
  };

  // Get booked dates for selected cabin
  const bookedDates = selectedCabin
    ? reservations
        .filter(
          (r) => r.cabin.id === selectedCabin.id && r.status !== "cancelled",
        )
        .map((r) => ({ startDate: r.startDate, endDate: r.endDate }))
    : [];

  const totalPrice =
    selectedCabin && selectedRange?.from && selectedRange?.to
      ? differenceInDays(selectedRange.to, selectedRange.from) *
        selectedCabin.pricePerNight
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Home className="w-8 h-8 text-green-700" />
            </div>
            <div>
              <h1 className="text-2xl">Cabañas la Medalla</h1>
              <p className="text-green-100 text-sm">
                Sistema de Gestión y Reservas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoadingData ? (
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Cargando datos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Se está sincronizando la información de cabañas, reservas y gastos
              con Supabase.
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="reservations" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Reservas
              </TabsTrigger>
              <TabsTrigger value="expenses" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Gastos
              </TabsTrigger>
              <TabsTrigger value="balance" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Balance
              </TabsTrigger>
            </TabsList>

            {/* Reservations Tab */}
            <TabsContent value="reservations">
              <div className="max-w-6xl mx-auto">
                {currentStep < totalSteps ? (
                  <>
                    {/* Progress Bar */}
                    <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">
                          Paso {currentStep} de {totalSteps - 1}
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round((currentStep / (totalSteps - 1)) * 100)}%
                          completado
                        </span>
                      </div>
                      <Progress
                        value={(currentStep / (totalSteps - 1)) * 100}
                        className="h-2"
                      />

                      <div className="flex justify-between mt-4 text-xs text-gray-600">
                        <span
                          className={
                            currentStep >= 1 ? "text-green-600 font-medium" : ""
                          }
                        >
                          Cabaña
                        </span>
                        <span
                          className={
                            currentStep >= 2 ? "text-green-600 font-medium" : ""
                          }
                        >
                          Fechas
                        </span>
                        <span
                          className={
                            currentStep >= 3 ? "text-green-600 font-medium" : ""
                          }
                        >
                          Datos
                        </span>
                      </div>
                    </div>

                    {/* Steps Content */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                      {currentStep === 1 && (
                        <CabinSelector
                          cabins={cabinList}
                          selectedCabin={selectedCabin}
                          onCabinSelect={handleCabinSelect}
                          onPriceChange={handleCabinPriceChange}
                          reservations={reservations}
                        />
                      )}

                      {currentStep === 2 && (
                        <CalendarView
                          selectedRange={selectedRange}
                          onRangeSelect={handleRangeSelect}
                          reservations={bookedDates}
                        />
                      )}

                      {currentStep === 3 && selectedCabin && (
                        <GuestForm
                          onDataComplete={handleDataComplete}
                          initialGuest={guestData || undefined}
                          maxCapacity={selectedCabin.capacity}
                        />
                      )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between">
                      {currentStep > 1 && (
                        <Button
                          variant="outline"
                          onClick={handlePrevious}
                          className="gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                      )}

                      {currentStep < 3 && (
                        <Button
                          onClick={handleNext}
                          disabled={!canGoNext()}
                          className="ml-auto gap-2 bg-green-600 hover:bg-green-700"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}

                      {currentStep === 3 && (
                        <Button
                          onClick={handleNext}
                          disabled={!canGoNext() || isSavingReservation}
                          className="ml-auto gap-2 bg-green-600 hover:bg-green-700"
                        >
                          Confirmar Reserva
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Price Summary */}
                    {currentStep >= 2 &&
                      selectedCabin &&
                      selectedRange?.from &&
                      selectedRange?.to && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                Precio total estimado
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {differenceInDays(
                                  selectedRange.to,
                                  selectedRange.from,
                                )}{" "}
                                noches × $
                                {selectedCabin.pricePerNight.toLocaleString()}
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                              ${totalPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    {/* Confirmation View */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                      {selectedCabin &&
                        selectedRange?.from &&
                        selectedRange?.to &&
                        guestData && (
                          <ReservationConfirmation
                            cabin={selectedCabin}
                            startDate={selectedRange.from}
                            endDate={selectedRange.to}
                            guest={guestData}
                            totalPrice={totalPrice}
                          />
                        )}
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={handleNewReservation}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Nueva Reserva
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveTab("reservations");
                          // Show reservations list
                          setCurrentStep(5);
                        }}
                        variant="outline"
                      >
                        Ver Todas las Reservas
                      </Button>
                    </div>
                  </>
                )}

                {/* Reservations List */}
                {currentStep === 5 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl mb-2">Reservas Registradas</h2>
                        <p className="text-gray-600">
                          Gestione todas las reservas de las cabañas
                        </p>
                      </div>
                      <Button
                        onClick={handleNewReservation}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        Nueva Reserva
                      </Button>
                    </div>

                    <ReservationsList
                      reservations={reservations}
                      cabins={cabinList}
                      onUpdate={handleUpdateReservation}
                      onDelete={handleDeleteReservation}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses">
              <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm p-6">
                <ExpensesManager
                  expenses={expenses}
                  cabins={cabinList}
                  onAddExpense={handleAddExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              </div>
            </TabsContent>

            {/* Balance Tab */}
            <TabsContent value="balance">
              <div className="max-w-6xl mx-auto">
                <BalanceView
                  reservations={reservations}
                  expenses={expenses}
                  cabins={cabinList}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Cabañas del Valle - Sistema de Gestión Integral
          </p>
        </div>
      </footer>
    </div>
  );
}
