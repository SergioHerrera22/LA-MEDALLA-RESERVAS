import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { CabinSelector } from "./components/CabinSelector";
import { CalendarView } from "./components/CalendarView";
import { GuestForm } from "./components/GuestForm";
import { ReservationConfirmation } from "./components/ReservationConfirmation";
import { ReservationsList } from "./components/ReservationsList";
import { Dashboard } from "./components/Dashboard";
import { ExpensesManager } from "./components/ExpensesManager";
import { BalanceView } from "./components/BalanceView";
import { InventoryManager } from "./components/InventoryManager";
import { cabins as initialCabins } from "./data/cabins";
import {
  createInventoryItem,
  createExpense,
  createReservation,
  deleteInventoryItem,
  deleteExpense,
  deleteReservation,
  loadAppData,
  updateInventoryItem,
  updateExpense,
  updateCabinPrice,
  updateReservation,
} from "./lib/persistence";
import {
  Cabin,
  GuestData,
  Reservation,
  Expense,
  InventoryItem,
} from "./types/cabin";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar as CalendarIcon,
  DollarSign,
  LogOut,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { DateRange } from "react-day-picker";
import { differenceInDays } from "date-fns";

interface AppProps {
  onSignOut?: () => void;
}

export default function App({ onSignOut }: AppProps) {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "reservations" | "expenses" | "balance" | "inventory"
  >("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [cabinList, setCabinList] = useState<Cabin[]>(initialCabins);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
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
        setInventoryItems(data.inventoryItems);
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

  const handleAddInventoryItem = async (
    item: Omit<InventoryItem, "id" | "updatedAt">,
  ) => {
    try {
      const createdItem = await createInventoryItem(item);
      setInventoryItems((currentItems) => [createdItem, ...currentItems]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el articulo en Supabase");
      throw error;
    }
  };

  const handleUpdateInventoryItem = async (updatedItem: InventoryItem) => {
    try {
      const savedItem = await updateInventoryItem(updatedItem);
      setInventoryItems((currentItems) =>
        currentItems.map((item) =>
          item.id === savedItem.id ? savedItem : item,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el articulo en Supabase");
      throw error;
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    try {
      await deleteInventoryItem(itemId);
      setInventoryItems((currentItems) =>
        currentItems.filter((item) => item.id !== itemId),
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el articulo en Supabase");
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
      <header className="relative bg-gradient-to-r from-green-800 via-emerald-700 to-teal-700 text-white shadow-xl overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative container mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/15 backdrop-blur-sm p-3 rounded-2xl border border-white/20 shadow-inner">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Cabañas La Medalla
                </h1>
                <p className="text-emerald-200 text-sm font-medium tracking-wide">
                  Sistema de Gestión y Reservas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-sm rounded-xl font-medium transition-all"
                onClick={() => {
                  setActiveTab("reservations");
                  setTimeout(() => {
                    document
                      .getElementById("reservations-list")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 100);
                }}
              >
                <CalendarIcon className="w-4 h-4" />
                Ver Reservas
              </Button>
              {onSignOut && (
                <Button
                  variant="secondary"
                  className="gap-2 bg-white/10 hover:bg-red-500/80 text-white border border-white/20 backdrop-blur-sm rounded-xl font-medium transition-all"
                  onClick={onSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoadingData ? (
          <div className="mx-auto max-w-sm rounded-2xl bg-white p-10 text-center shadow-lg border border-gray-100">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            <h2 className="text-lg font-bold text-gray-900">Cargando datos</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Sincronizando cabañas, reservas y gastos…
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl p-1 h-auto">
              <TabsTrigger
                value="dashboard"
                className="gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                Inicio
              </TabsTrigger>
              <TabsTrigger
                value="reservations"
                className="gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <CalendarIcon className="w-4 h-4" />
                Reservas
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <DollarSign className="w-4 h-4" />
                Gastos
              </TabsTrigger>
              <TabsTrigger
                value="balance"
                className="gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                Balance
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="gap-2 rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <Boxes className="w-4 h-4" />
                Inventario
              </TabsTrigger>
            </TabsList>

            {/* Reservations Tab */}
            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="max-w-6xl mx-auto">
                <Dashboard reservations={reservations} cabins={cabinList} />
              </div>
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations">
              <div className="max-w-6xl mx-auto">
                {currentStep < totalSteps ? (
                  <>
                    {/* Visual step indicator */}
                    <div className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center justify-between relative">
                        {/* Connecting line */}
                        <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 mx-12" />
                        <div
                          className="absolute left-0 top-5 h-0.5 bg-emerald-500 mx-12 transition-all duration-500"
                          style={{
                            width: `${((currentStep - 1) / (totalSteps - 2)) * 100}%`,
                            right: "auto",
                          }}
                        />
                        {[
                          { step: 1, label: "Cabaña" },
                          { step: 2, label: "Fechas" },
                          { step: 3, label: "Datos" },
                        ].map(({ step, label }) => (
                          <div
                            key={step}
                            className="relative z-10 flex flex-col items-center gap-2"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                currentStep > step
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                  : currentStep === step
                                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md"
                                    : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                              }`}
                            >
                              {currentStep > step ? (
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                step
                              )}
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                currentStep >= step
                                  ? "text-emerald-700"
                                  : "text-gray-400"
                              }`}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Steps Content */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
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
                          className="gap-2 rounded-xl border-gray-200 font-semibold hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                      )}

                      {currentStep < 3 && (
                        <Button
                          onClick={handleNext}
                          disabled={!canGoNext()}
                          className="ml-auto gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-sm shadow-emerald-200"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}

                      {currentStep === 3 && (
                        <Button
                          onClick={handleNext}
                          disabled={!canGoNext() || isSavingReservation}
                          className="ml-auto gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-sm shadow-emerald-200"
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
                        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">
                                Precio total estimado
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {differenceInDays(
                                  selectedRange.to,
                                  selectedRange.from,
                                )}{" "}
                                noches × $
                                {selectedCabin.pricePerNight.toLocaleString()}
                              </p>
                            </div>
                            <p className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                              ${totalPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    {/* Confirmation View */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
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
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold shadow-sm"
                      >
                        Nueva Reserva
                      </Button>
                      <Button
                        onClick={() => {
                          setActiveTab("reservations");
                          setCurrentStep(1);
                        }}
                        variant="outline"
                        className="rounded-xl font-semibold border-gray-200"
                      >
                        Ver Todas las Reservas
                      </Button>
                    </div>
                  </>
                )}

                {/* Reservations List */}
                <div
                  id="reservations-list"
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        Reservas Registradas
                      </h2>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Gestione todas las reservas de las cabañas
                      </p>
                    </div>
                    <Button
                      onClick={handleNewReservation}
                      className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-xl font-semibold shadow-sm"
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
              </div>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses">
              <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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

            <TabsContent value="inventory">
              <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <InventoryManager
                  cabins={cabinList}
                  inventoryItems={inventoryItems}
                  onAddItem={handleAddInventoryItem}
                  onUpdateItem={handleUpdateInventoryItem}
                  onDeleteItem={handleDeleteInventoryItem}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-16 border-t border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Home className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-white">
              Cabañas La Medalla
            </span>
          </div>
          <p className="text-xs text-gray-400">
            © 2026 · Desarrollado por Santiago Herrera
          </p>
        </div>
      </footer>
    </div>
  );
}
