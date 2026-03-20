import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Plus,
  PencilLine,
  Trash2,
  DollarSign,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Expense, Cabin } from "../types/cabin";
import { expenseCategories } from "../data/cabins";
import { toast } from "sonner";

const GENERAL_EXPENSE_VALUE = "general";

interface ExpensesManagerProps {
  expenses: Expense[];
  cabins: Cabin[];
  onAddExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  onUpdateExpense: (expense: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

const categoryColors: Record<string, string> = {
  maintenance: "bg-orange-100 text-orange-800",
  cleaning: "bg-blue-100 text-blue-800",
  utilities: "bg-purple-100 text-purple-800",
  supplies: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

export function ExpensesManager({
  expenses,
  cabins,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ExpensesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null,
  );
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    category: "maintenance" as Expense["category"],
    description: "",
    amount: "",
    cabinId: "",
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      category: "maintenance",
      description: "",
      amount: "",
      cabinId: "",
    });
    setEditingExpenseId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingExpenseId(null);
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      category: "maintenance",
      description: "",
      amount: "",
      cabinId: "",
    });
    setShowForm(true);
  };

  const openEditForm = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setFormData({
      date: format(expense.date, "yyyy-MM-dd"),
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      cabinId: expense.cabin?.id ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim() || !formData.amount) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    const expenseData = {
      date: new Date(formData.date),
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      cabin: formData.cabinId
        ? cabins.find((c) => c.id === formData.cabinId)
        : undefined,
    };

    setIsSubmitting(true);

    try {
      if (editingExpenseId) {
        await onUpdateExpense({
          id: editingExpenseId,
          ...expenseData,
        });
        toast.success("Gasto actualizado correctamente");
      } else {
        await onAddExpense(expenseData);
        toast.success("Gasto registrado correctamente");
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const shouldDelete = window.confirm(
      "¿Seguro que desea eliminar este gasto? Esta acción no se puede deshacer.",
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingExpenseId(expenseId);

    try {
      await onDeleteExpense(expenseId);
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const getCategoryLabel = (category: string) => {
    return (
      expenseCategories.find((c) => c.value === category)?.label || category
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-2">Gestión de Gastos</h2>
          <p className="text-gray-600">
            Administre los gastos de mantenimiento de las cabañas
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
              return;
            }

            openCreateForm();
          }}
          className="bg-green-600 hover:bg-green-700 gap-2"
          disabled={isSubmitting}
        >
          <Plus className="w-4 h-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total de Gastos</p>
            <p className="text-3xl font-bold text-red-600">
              ${totalExpenses.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {expenses.length} gastos registrados
            </p>
          </div>
          <div className="bg-white p-4 rounded-full shadow-md">
            <DollarSign className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </Card>

      {/* Add Expense Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            {editingExpenseId ? "Editar Gasto" : "Registrar Nuevo Gasto"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: Expense["category"]) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cabin">Cabaña (opcional)</Label>
                <Select
                  value={formData.cabinId || GENERAL_EXPENSE_VALUE}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      cabinId: value === GENERAL_EXPENSE_VALUE ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="cabin">
                    <SelectValue placeholder="Seleccione cabaña" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERAL_EXPENSE_VALUE}>
                      Ninguna (gasto general)
                    </SelectItem>
                    {cabins.map((cabin) => (
                      <SelectItem key={cabin.id} value={cabin.id}>
                        {cabin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción *</Label>
                <Input
                  id="description"
                  placeholder="Ej: Reparación de cañería"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {editingExpenseId ? "Guardar cambios" : "Guardar Gasto"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        <h3 className="font-semibold">Historial de Gastos</h3>
        {expenses.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No hay gastos registrados</p>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={categoryColors[expense.category]}>
                      {getCategoryLabel(expense.category)}
                    </Badge>
                    {expense.cabin && (
                      <Badge variant="outline">{expense.cabin.name}</Badge>
                    )}
                  </div>
                  <p className="font-medium mb-1">{expense.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    {format(expense.date, "d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600">
                      ${expense.amount.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(expense)}
                    disabled={isSubmitting}
                    className="text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <PencilLine className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={deletingExpenseId === expense.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
