import { faker } from '@faker-js/faker';
import type { Product, Employee, Batch, Nozzle, BatchProductDetail, Assignment, Activity, AdjustmentBatch } from '@/types';

const TOTAL_EMPLOYEES = 8;
const TOTAL_BATCHES = 9;
const TOTAL_ADJUSTMENT_BATCHES = 5;

export const nozzles: Nozzle[] = [
  { id: 'n1', name: 'pequeno', flowRate: 5 },
  { id: 'n2', name: 'médio', flowRate: 10 },
  { id: 'n3', name: 'grande', flowRate: 15 },
];

export const employees: Employee[] = Array.from({ length: TOTAL_EMPLOYEES }, (_, i) => ({
  id: `emp-${i + 1}`,
  name: faker.person.fullName(),
  hoursPerDay: faker.helpers.arrayElement([5, 7, 8]),
  workingDays: faker.helpers.arrayElements([1, 2, 3, 4, 5], faker.number.int({ min: 3, max: 5 })),
}));

export const products: Product[] = [
    { id: 'prod-1', name: 'macho soprado', productionTime: 3, type: 'aspercao' },
    { id: 'prod-2', name: 'euro 3', productionTime: 1, type: 'aspercao' },
    { id: 'prod-3', name: 'FE 15 CTN', productionTime: 2.5, type: 'aspercao' },
    { id: 'prod-4', name: 'LB 545', productionTime: 3, type: 'aspercao' },
    { id: 'prod-5', name: 'P28 SWN TV', productionTime: 0.55, type: 'aspercao' },
    { id: 'prod-6', name: 'SB 1036', productionTime: 2.53, type: 'aspercao' },
    { id: 'prod-7', name: 'METALIZAÇÃO DE ANÉIS', productionTime: 4, type: 'aspercao' },
    { id: 'prod-8', name: 'Componente X', productionTime: 1.8, type: 'ajustagem' },
    { id: 'prod-9', name: 'Peça Y', productionTime: 2.2, type: 'ajustagem' },
    { id: 'prod-10', name: 'Conjunto Z', productionTime: 5, type: 'ajustagem' },
];

const getStatus = (deliveryDate: Date, progress: number): Batch['status'] => {
    if (progress >= 100) return 'Concluído';
    if (new Date() > deliveryDate) return 'Atrasado';
    if (progress > 0) return 'Em Produção';
    return 'Planejado';
};

const aspercaoProducts = products.filter(p => p.type === 'aspercao');
const ajustagemProducts = products.filter(p => p.type === 'ajustagem');

export const batches: Batch[] = Array.from({ length: TOTAL_BATCHES }, (_, i) => {
  const numProductsInBatch = faker.number.int({ min: 1, max: 2 });
  const selectedProducts = faker.helpers.arrayElements(aspercaoProducts, numProductsInBatch);

  let totalPlanned = 0;
  let totalReal = 0;

  const batchProducts: BatchProductDetail[] = selectedProducts.map(product => {
      const numAssignments = faker.number.int({ min: 1, max: 2 });
      const assignedEmployees = faker.helpers.arrayElements(employees, numAssignments);
      const assignments: Assignment[] = assignedEmployees.map(emp => {
          const plannedQty = faker.number.int({ min: 50, max: 150 });
          const realQty = faker.number.int({ min: 0, max: plannedQty });
          totalPlanned += plannedQty;
          totalReal += realQty;
          return {
              employeeId: emp.id,
              quantity: plannedQty,
              realQuantity: realQty,
          };
      });
      return {
          productId: product.id,
          assignments,
      };
  });

  const progress = totalPlanned > 0 ? Math.round((totalReal / totalPlanned) * 100) : 0;
  
  const startDate = faker.date.between({ from: new Date(new Date().setDate(new Date().getDate() - 10)), to: new Date(new Date().setDate(new Date().getDate() + 10)) });
  const deliveryDate = new Date(startDate.getTime());
  deliveryDate.setDate(startDate.getDate() + faker.number.int({ min: 2, max: 15 }));

  const status = getStatus(deliveryDate, progress);
  const mainProductName = products.find(p => p.id === batchProducts[0].productId)?.name || 'Lote Misto';

  return {
    id: `${2300 + i}`,
    name: mainProductName,
    products: batchProducts,
    progress: status === 'Planejado' ? 0 : (status === 'Concluído' ? 100 : progress),
    status,
    startDate,
    deliveryDate,
    nozzleId: faker.helpers.arrayElement(nozzles).id,
    realProductionTime: status !== 'Planejado' ? parseFloat(faker.number.float({ min: 1, max: 10, precision: 1 }).toFixed(1)) : 0,
    realInputKg: status !== 'Planejado' ? parseFloat(faker.number.float({ min: 5, max: 20, precision: 1 }).toFixed(1)) : 0,
  };
});

// --- Mock Data para Ajustagem (ATUALIZADO) ---
export const adjustmentBatches: AdjustmentBatch[] = Array.from({ length: TOTAL_ADJUSTMENT_BATCHES }, (_, i) => {
    let totalPlanned = 0;
    let totalReal = 0;

    const numAssignments = faker.number.int({ min: 1, max: 2 });
    const assignedEmployees = faker.helpers.arrayElements(employees, numAssignments);
    
    const assignments: Assignment[] = assignedEmployees.map(emp => {
        const plannedQty = faker.number.int({ min: 50, max: 200 });
        const realQty = faker.number.int({ min: 0, max: plannedQty });
        totalPlanned += plannedQty;
        totalReal += realQty;
        return {
            employeeId: emp.id,
            quantity: plannedQty,
            realQuantity: realQty,
        };
    });

    const progress = totalPlanned > 0 ? Math.round((totalReal / totalPlanned) * 100) : 0;
    
    const startDate = faker.date.between({ from: new Date(new Date().setDate(new Date().getDate() - 5)), to: new Date(new Date().setDate(new Date().getDate() + 5)) });
    const deliveryDate = new Date(startDate.getTime());
    deliveryDate.setDate(startDate.getDate() + faker.number.int({ min: 1, max: 7 }));

    const status = getStatus(deliveryDate, progress);
    const product = faker.helpers.arrayElement(ajustagemProducts);
    const plannedTime = (product.productionTime * totalPlanned) / 60;

    return {
        id: `adj-${3000 + i}`,
        name: `Ajuste - ${product.name}`,
        productId: product.id,
        assignments,
        plannedTime,
        realTime: status !== 'Planejado' ? parseFloat(faker.number.float({ min: 0, max: plannedTime, precision: 1 }).toFixed(1)) : 0,
        status,
        startDate,
        deliveryDate,
        progress: status === 'Planejado' ? 0 : (status === 'Concluído' ? 100 : progress),
    };
});


export const recentActivities: Activity[] = [
    { id: 'act-1', description: 'Lote #2301 iniciado', timestamp: faker.date.recent({ days: 1 }) },
    { id: 'act-2', description: 'Produto "euro 3" adicionado ao Lote #2308', timestamp: faker.date.recent({ days: 1 }) },
    { id: 'act-3', description: 'Lote #2300 concluído', timestamp: faker.date.recent({ days: 2 }) },
    { id: 'act-4', description: 'Funcionário "Maria Silva" cadastrado', timestamp: faker.date.recent({ days: 3 }) },
    { id: 'act-5', description: 'Bico "grande" atualizado', timestamp: faker.date.recent({ days: 4 }) },
];

export const chartData = {
    miniChart: Array.from({ length: 10 }, () => ({ value: faker.number.int({ min: 50, max: 200 }) })),
};
