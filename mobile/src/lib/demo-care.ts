// Demo data from src/features/super-app/demo-data.ts (web): doctors and gyms. Names and prices are demo values.
export type DemoSpecialty = { id: string; label: string; icon: string };
export type DemoDoctor = { id: string; name: string; specialtyId: string; clinic: string };
export type DemoGym = { id: string; name: string; address: string; hours: string; trial: boolean };

export const SPECIALTIES: DemoSpecialty[] = [
  { id: "therapist", label: "Терапевт", icon: "medical-services" },
  { id: "pediatrician", label: "Педіатр", icon: "child-care" },
  { id: "dentist", label: "Стоматолог", icon: "healing" },
  { id: "ophthalmologist", label: "Офтальмолог", icon: "visibility" },
  { id: "dermatologist", label: "Дерматолог", icon: "face" },
];

export const DOCTORS: DemoDoctor[] = [
  { id: "d-t1", name: "Олена Коваленко", specialtyId: "therapist", clinic: "Клініка «Здоров'я» (демо)" },
  { id: "d-t2", name: "Андрій Мельник", specialtyId: "therapist", clinic: "Медцентр «Поділ» (демо)" },
  { id: "d-p1", name: "Ірина Шевчук", specialtyId: "pediatrician", clinic: "Дитяча клініка (демо)" },
  { id: "d-p2", name: "Максим Бондар", specialtyId: "pediatrician", clinic: "Медцентр «Поділ» (демо)" },
  { id: "d-d1", name: "Наталія Гнатюк", specialtyId: "dentist", clinic: "Стоматологія «Посмішка» (демо)" },
  { id: "d-d2", name: "Тарас Василюк", specialtyId: "dentist", clinic: "Клініка «Здоров'я» (демо)" },
  { id: "d-o1", name: "Ольга Гайдук", specialtyId: "ophthalmologist", clinic: "Офтальмоцентр (демо)" },
  { id: "d-o2", name: "Роман Кривий", specialtyId: "ophthalmologist", clinic: "Клініка «Здоров'я» (демо)" },
  { id: "d-s1", name: "Світлана Ткач", specialtyId: "dermatologist", clinic: "Шкіра і косметологія (демо)" },
  { id: "d-s2", name: "Юрій Савчук", specialtyId: "dermatologist", clinic: "Медцентр «Поділ» (демо)" },
];

export const GYMS: DemoGym[] = [
  { id: "gym-1", name: "Зал «Залізо» (демо)", address: "вул. Зелена, 22", hours: "06:00–23:00", trial: true },
  { id: "gym-2", name: "Фітнес-клуб «Баланс» (демо)", address: "вул. Личаківська, 5", hours: "07:00–22:00", trial: false },
  { id: "gym-3", name: "Студія «Рух» (демо)", address: "просп. Шевченка, 9", hours: "08:00–21:00", trial: true },
];

export const GYM_PLANS = [
  { id: "month", label: "1 місяць", months: 1, price: 890 },
  { id: "quarter", label: "3 місяці", months: 3, price: 2290 },
  { id: "year", label: "12 місяців", months: 12, price: 7990 },
] as const;
