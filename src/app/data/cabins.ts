import { Cabin } from "../types/cabin";
import cabinOneImage from "../../assets/cabanas-la-medalla-2.jpg";
import cabinTwoImage from "../../assets/cabanas-la-medalla-1.png";

export const cabins: Cabin[] = [
  {
    id: "1",
    name: "Cabaña 1",
    description:
      "Acogedora cabaña rodeada de naturaleza con vista panorámica a la cordillera",
    capacity: 4,
    pricePerNight: 12000,
    amenities: [
      "Wi-Fi",
      "Cocina equipada",
      "Parrilla",
      "Calefacción",
      "TV",
      "Ropa de cama",
    ],
    image: cabinOneImage,
  },
  {
    id: "2",
    name: "Cabaña 2",
    description: "Hermosa cabaña con acceso directo al lago y muelle privado",
    capacity: 6,
    pricePerNight: 15000,
    amenities: [
      "Wi-Fi",
      "Cocina equipada",
      "Parrilla",
      "Calefacción",
      "TV",
      "Ropa de cama",
      "Kayaks",
      "Muelle",
    ],
    image: cabinTwoImage,
  },
];

export const expenseCategories = [
  { value: "maintenance", label: "Mantenimiento" },
  { value: "cleaning", label: "Limpieza" },
  { value: "utilities", label: "Servicios" },
  { value: "supplies", label: "Insumos" },
  { value: "other", label: "Otros" },
];
