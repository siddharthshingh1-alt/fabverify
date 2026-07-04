export type QcInspector = {
  id: string;
  name: string;
  city: string;
  fabscore: number;
  tags: string[];
  inspectionTypes: string[];
  citiesCovered: string[];
  experience: number;
  inspectionsCount: number;
  accuracy: number;
  rateMin: number;
  rateMax: number;
  availability: string;
};

export const qcInspectors: QcInspector[] = [
  {
    id: "sunil-mehta",
    name: "Sunil Mehta",
    city: "Delhi NCR",
    fabscore: 9.6,
    tags: ["Woven", "Ethnic Wear", "Export"],
    inspectionTypes: ["Pre-production", "In-line", "Pre-dispatch"],
    citiesCovered: ["Delhi", "Jaipur", "Agra"],
    experience: 14,
    inspectionsCount: 312,
    accuracy: 99,
    rateMin: 1500,
    rateMax: 3000,
    availability: "Available tomorrow",
  },
  {
    id: "kavitha-rajan",
    name: "Kavitha Rajan",
    city: "Tirupur",
    fabscore: 9.4,
    tags: ["Knitwear", "Activewear", "Export"],
    inspectionTypes: ["In-line", "Pre-dispatch"],
    citiesCovered: ["Tirupur", "Coimbatore", "Chennai"],
    experience: 10,
    inspectionsCount: 234,
    accuracy: 98,
    rateMin: 1200,
    rateMax: 2500,
    availability: "Available today",
  },
  {
    id: "mohammed-iqbal",
    name: "Mohammed Iqbal",
    city: "Surat",
    fabscore: 9.7,
    tags: ["Fabric", "Woven", "Luxury"],
    inspectionTypes: ["Pre-production", "In-line", "Pre-dispatch", "Post-delivery"],
    citiesCovered: ["Surat", "Ahmedabad", "Baroda"],
    experience: 16,
    inspectionsCount: 445,
    accuracy: 99,
    rateMin: 1800,
    rateMax: 3500,
    availability: "Available today",
  },
  {
    id: "preethi-nair",
    name: "Preethi Nair",
    city: "Lucknow",
    fabscore: 9.3,
    tags: ["Chikankari", "Ethnic Wear", "Handcraft"],
    inspectionTypes: ["Pre-dispatch", "Post-delivery"],
    citiesCovered: ["Lucknow", "Kanpur", "Varanasi"],
    experience: 8,
    inspectionsCount: 156,
    accuracy: 97,
    rateMin: 1000,
    rateMax: 2000,
    availability: "Available in 2 days",
  },
];
