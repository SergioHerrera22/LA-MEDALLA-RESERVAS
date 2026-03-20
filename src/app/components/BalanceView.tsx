import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Home,
  PieChart,
} from "lucide-react";
import { Reservation, Expense, Cabin } from "../types/cabin";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale/es";

interface BalanceViewProps {
  reservations: Reservation[];
  expenses: Expense[];
  cabins: Cabin[];
}

export function BalanceView({
  reservations,
  expenses,
  cabins,
}: BalanceViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Calculate total income
  const totalIncome = reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.totalPrice, 0);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate monthly income
  const monthlyIncome = reservations
    .filter(
      (r) =>
        r.status !== "cancelled" &&
        isWithinInterval(r.startDate, { start: monthStart, end: monthEnd }),
    )
    .reduce((sum, r) => sum + r.totalPrice, 0);

  // Calculate monthly expenses
  const monthlyExpenses = expenses
    .filter((e) =>
      isWithinInterval(e.date, { start: monthStart, end: monthEnd }),
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Calculate income by cabin
  const incomeByСabin = cabins.map((cabin) => {
    const cabinIncome = reservations
      .filter((r) => r.cabin.id === cabin.id && r.status !== "cancelled")
      .reduce((sum, r) => sum + r.totalPrice, 0);
    return { cabin, income: cabinIncome };
  });

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += expense.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categoryLabels: Record<string, string> = {
    maintenance: "Mantenimiento",
    cleaning: "Limpieza",
    utilities: "Servicios",
    supplies: "Insumos",
    other: "Otros",
  };

  // Calculate occupancy
  const confirmedReservations = reservations.filter(
    (r) => r.status === "confirmed" || r.status === "completed",
  );
  const occupancyRate =
    reservations.length > 0
      ? (confirmedReservations.length / reservations.length) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
          Finanzas
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Balance General
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Resumen de ingresos y egresos del negocio
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Ingresos
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            ${totalIncome.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            {reservations.filter((r) => r.status !== "cancelled").length}{" "}
            reservas confirmadas
          </p>
        </div>

        <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-400 rounded-t-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-50 p-2.5 rounded-xl">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              Egresos
            </span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
            ${totalExpenses.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            {expenses.length} gastos registrados
          </p>
        </div>

        <div
          className={`relative bg-white rounded-2xl border shadow-sm p-6 overflow-hidden ${
            netBalance >= 0 ? "border-blue-100" : "border-red-100"
          }`}
        >
          <div
            className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
              netBalance >= 0
                ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                : "bg-gradient-to-r from-red-400 to-orange-500"
            }`}
          />
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-2.5 rounded-xl ${netBalance >= 0 ? "bg-blue-50" : "bg-red-50"}`}
            >
              <DollarSign
                className={`w-5 h-5 ${netBalance >= 0 ? "text-blue-600" : "text-red-500"}`}
              />
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                netBalance >= 0
                  ? "text-blue-700 bg-blue-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              Balance
            </span>
          </div>
          <p
            className={`text-3xl font-extrabold tracking-tight ${
              netBalance >= 0 ? "text-gray-900" : "text-red-600"
            }`}
          >
            {netBalance < 0 && "-"}${Math.abs(netBalance).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            {netBalance >= 0 ? "Ganancia neta" : "Pérdida neta"}
          </p>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900 capitalize">
            Resumen de {format(today, "MMMM yyyy", { locale: es })}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Ingresos del mes
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              ${monthlyIncome.toLocaleString()}
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Gastos del mes
            </p>
            <p className="text-2xl font-extrabold text-red-500 tracking-tight">
              ${monthlyExpenses.toLocaleString()}
            </p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Balance del mes
            </p>
            <p
              className={`text-2xl font-extrabold tracking-tight ${
                monthlyBalance >= 0 ? "text-blue-600" : "text-red-500"
              }`}
            >
              {monthlyBalance < 0 && "-"}$
              {Math.abs(monthlyBalance).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Cabin */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Home className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Ingresos por Cabaña</h3>
          </div>
          <div className="p-6 space-y-5">
            {incomeByСabin.map(({ cabin, income }) => {
              const percentage =
                totalIncome > 0 ? (income / totalIncome) * 100 : 0;
              return (
                <div key={cabin.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 text-sm">
                      {cabin.name}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      ${income.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {percentage.toFixed(1)}% del total
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <PieChart className="w-4 h-4 text-gray-600" />
            </div>
            <h3 className="font-semibold text-gray-900">
              Gastos por Categoría
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(expensesByCategory).map(([category, amount]) => {
              const percentage =
                totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              return (
                <div
                  key={category}
                  className="px-6 py-4 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800 text-sm">
                      {categoryLabels[category] || category}
                    </span>
                    <span className="text-sm font-extrabold text-red-500">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-red-400 to-orange-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {percentage.toFixed(1)}% del total
                  </p>
                </div>
              );
            })}
            {Object.keys(expensesByCategory).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                  <PieChart className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  Sin gastos registrados
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Estadísticas generales
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="px-6 py-5 text-center">
            <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {reservations.length}
            </p>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Total de Reservas
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {confirmedReservations.length}
            </p>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Reservas Confirmadas
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="text-3xl font-extrabold text-violet-600 tracking-tight">
              {occupancyRate.toFixed(0)}%
            </p>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Tasa de Ocupación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
