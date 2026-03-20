import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Home,
  PieChart
} from 'lucide-react';
import { Reservation, Expense, Cabin } from '../types/cabin';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface BalanceViewProps {
  reservations: Reservation[];
  expenses: Expense[];
  cabins: Cabin[];
}

export function BalanceView({ reservations, expenses, cabins }: BalanceViewProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  // Calculate total income
  const totalIncome = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.totalPrice, 0);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate monthly income
  const monthlyIncome = reservations
    .filter(r => 
      r.status !== 'cancelled' && 
      isWithinInterval(r.startDate, { start: monthStart, end: monthEnd })
    )
    .reduce((sum, r) => sum + r.totalPrice, 0);

  // Calculate monthly expenses
  const monthlyExpenses = expenses
    .filter(e => isWithinInterval(e.date, { start: monthStart, end: monthEnd }))
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Calculate income by cabin
  const incomeByСabin = cabins.map(cabin => {
    const cabinIncome = reservations
      .filter(r => r.cabin.id === cabin.id && r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalPrice, 0);
    return { cabin, income: cabinIncome };
  });

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, string> = {
    maintenance: 'Mantenimiento',
    cleaning: 'Limpieza',
    utilities: 'Servicios',
    supplies: 'Insumos',
    other: 'Otros'
  };

  // Calculate occupancy
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'completed');
  const occupancyRate = reservations.length > 0 
    ? (confirmedReservations.length / reservations.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Balance General</h2>
        <p className="text-gray-600">Resumen de ingresos y egresos del negocio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-full shadow-md">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <Badge variant="outline" className="text-green-700">Ingresos</Badge>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            ${totalIncome.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            {reservations.filter(r => r.status !== 'cancelled').length} reservas confirmadas
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-full shadow-md">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <Badge variant="outline" className="text-red-700">Egresos</Badge>
          </div>
          <p className="text-3xl font-bold text-red-600 mb-1">
            ${totalExpenses.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            {expenses.length} gastos registrados
          </p>
        </Card>

        <Card className={`p-6 bg-gradient-to-br ${
          netBalance >= 0 
            ? 'from-blue-50 to-indigo-50' 
            : 'from-orange-50 to-red-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white p-3 rounded-full shadow-md">
              <DollarSign className={`w-6 h-6 ${
                netBalance >= 0 ? 'text-blue-600' : 'text-red-600'
              }`} />
            </div>
            <Badge variant="outline" className={
              netBalance >= 0 ? 'text-blue-700' : 'text-red-700'
            }>
              Balance
            </Badge>
          </div>
          <p className={`text-3xl font-bold mb-1 ${
            netBalance >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            ${Math.abs(netBalance).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            {netBalance >= 0 ? 'Ganancia neta' : 'Pérdida neta'}
          </p>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">
            Resumen de {format(today, "MMMM yyyy", { locale: es })}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Ingresos del mes</p>
            <p className="text-2xl font-bold text-green-600">
              ${monthlyIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Gastos del mes</p>
            <p className="text-2xl font-bold text-red-600">
              ${monthlyExpenses.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Balance del mes</p>
            <p className={`text-2xl font-bold ${
              monthlyBalance >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}>
              ${Math.abs(monthlyBalance).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Income by Cabin */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Ingresos por Cabaña</h3>
        </div>
        
        <div className="space-y-4">
          {incomeByСabin.map(({ cabin, income }) => {
            const percentage = totalIncome > 0 ? (income / totalIncome) * 100 : 0;
            return (
              <div key={cabin.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{cabin.name}</span>
                  <span className="text-lg font-bold text-green-600">
                    ${income.toLocaleString()}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% del total</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expenses by Category */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Gastos por Categoría</h3>
        </div>
        
        <div className="space-y-3">
          {Object.entries(expensesByCategory).map(([category, amount]) => {
            const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
            return (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{categoryLabels[category] || category}</p>
                  <Progress value={percentage} className="h-1.5 mt-2" />
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-red-600">${amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
          {Object.keys(expensesByCategory).length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay gastos registrados</p>
          )}
        </div>
      </Card>

      {/* Statistics */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Estadísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600 mb-1">
              {reservations.length}
            </p>
            <p className="text-sm text-gray-600">Total de Reservas</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600 mb-1">
              {confirmedReservations.length}
            </p>
            <p className="text-sm text-gray-600">Reservas Confirmadas</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600 mb-1">
              {occupancyRate.toFixed(0)}%
            </p>
            <p className="text-sm text-gray-600">Tasa de Ocupación</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
