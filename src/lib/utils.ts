import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Batch, Product, Nozzle, Employee, Assignment } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string) => {
  if (!name) return '??';
  const names = name.trim().split(' ').filter(Boolean);
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  const firstName = names[0];
  const lastName = names[names.length - 1];
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};


// --- Funções de Cálculo ---
const OXYGEN_FLOW_LPH = 1;
const ACETYLENE_FLOW_LPH = 1.15;
const OXYGEN_CYLINDER_L = 50;
const ACETYLENE_CYLINDER_L = 55;

export const calculateBatchEstimates = (batch: Partial<Batch>, allProducts: Product[], allNozzles: Nozzle[]) => {
    const nozzle = allNozzles.find(n => n.id === batch.nozzleId);
    if (!nozzle || !batch.products) {
        return {
            totalItems: 0,
            estimatedTimeHours: 0,
            estimatedInputKg: 0,
            estimatedOxygenL: 0,
            estimatedAcetyleneL: 0,
            oxygenCylinders: 0,
            acetyleneCylinders: 0,
        };
    }

    let totalItems = 0;
    let estimatedTimeMinutes = 0;
    let estimatedInputGrams = 0;

    batch.products.forEach(bp => {
        const product = allProducts.find(p => p.id === bp.productId);
        if (product) {
            bp.assignments.forEach(assignment => {
                const quantity = assignment.quantity;
                totalItems += quantity;
                const timeForProductItems = product.productionTime * quantity;
                estimatedTimeMinutes += timeForProductItems;
                estimatedInputGrams += (product.productionTime * 60) * nozzle.flowRate * quantity;
            });
        }
    });

    const estimatedTimeHours = estimatedTimeMinutes / 60;
    const estimatedInputKg = estimatedInputGrams / 1000;

    const estimatedOxygenL = estimatedTimeHours * OXYGEN_FLOW_LPH;
    const estimatedAcetyleneL = estimatedTimeHours * ACETYLENE_FLOW_LPH;

    const oxygenCylinders = Math.ceil(estimatedOxygenL / OXYGEN_CYLINDER_L) || 0;
    const acetyleneCylinders = Math.ceil(estimatedAcetyleneL / ACETYLENE_CYLINDER_L) || 0;

    return {
        totalItems,
        estimatedTimeHours,
        estimatedInputKg,
        estimatedOxygenL,
        estimatedAcetyleneL,
        oxygenCylinders,
        acetyleneCylinders,
    };
};

export const calculateRealGasConsumption = (realTimeHours: number) => {
    const realOxygenL = realTimeHours * OXYGEN_FLOW_LPH;
    const realAcetyleneL = realTimeHours * ACETYLENE_FLOW_LPH;

    const oxygenCylinders = Math.ceil(realOxygenL / OXYGEN_CYLINDER_L) || 0;
    const acetyleneCylinders = Math.ceil(realAcetyleneL / ACETYLENE_CYLINDER_L) || 0;

    return {
        realOxygenL,
        realAcetyleneL,
        oxygenCylinders,
        acetyleneCylinders,
    };
}


export const formatTime = (timeInHours: number) => {
    if (isNaN(timeInHours) || timeInHours < 0) return '0 min';
    if (timeInHours < 1) {
        return `${Math.round(timeInHours * 60)} min`;
    }
    const hours = Math.floor(timeInHours);
    const minutes = Math.round((timeInHours - hours) * 60);
    return `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`.trim();
};

// --- NOVA FUNÇÃO DE CÁLCULO DE ENTREGA ---
export const calculateDeliveryDate = (
    startDate: Date,
    totalProductionHours: number,
    assignments: Assignment[],
    allEmployees: Employee[]
): Date => {
    if (totalProductionHours <= 0) {
        return startDate;
    }

    const assignedEmployeeIds = new Set(assignments.map(a => a.employeeId));
    const team = allEmployees.filter(e => assignedEmployeeIds.has(e.id));

    if (team.length === 0) {
        return new Date('2099-12-31'); // Retorna data futura se não houver equipe
    }

    // Cria um mapa de capacidade diária para cada dia da semana
    const weeklyCapacity: { [key: number]: number } = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
    team.forEach(employee => {
        employee.workingDays.forEach(dayIndex => {
            weeklyCapacity[dayIndex] += employee.hoursPerDay;
        });
    });

    const totalWeeklyCapacity = Object.values(weeklyCapacity).reduce((a, b) => a + b, 0);
    if (totalWeeklyCapacity <= 0) {
        return new Date('2099-12-31'); // Retorna data futura se a equipe não trabalha
    }

    let remainingHours = totalProductionHours;
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0); // Normaliza para o início do dia

    // Loop de segurança para evitar execução infinita
    for (let i = 0; i < 365 * 5; i++) { 
        const dayOfWeek = currentDate.getDay();
        const dailyCapacity = weeklyCapacity[dayOfWeek];

        if (dailyCapacity > 0) {
            remainingHours -= dailyCapacity;
        }

        if (remainingHours <= 0) {
            return currentDate; // Este é o dia em que o trabalho termina
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return new Date('2099-12-31'); // Retorna data distante se o cálculo demorar demais
};
