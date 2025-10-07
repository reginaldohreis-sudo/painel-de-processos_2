export type Product = {
  id: string;
  name: string;
  productionTime: number; // in minutes
  type: 'aspercao' | 'ajustagem';
  created_at?: string;
};

export type Employee = {
  id: string;
  name: string;
  hoursPerDay: number;
  workingDays: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  created_at?: string;
};

export type Nozzle = {
  id: string;
  name: string;
  flowRate: number; // in g/s
  created_at?: string;
};

export type Assignment = {
  employeeId: string;
  quantity: number; // planned quantity
  realQuantity?: number; // actual quantity produced
};

export type BatchProductDetail = {
  productId: string;
  assignments: Assignment[];
};

export type Batch = {
  id: string;
  name: string;
  products: BatchProductDetail[];
  progress: number; // 0-100
  status: 'Planejado' | 'Em Produção' | 'Concluído' | 'Atrasado';
  startDate: Date;
  deliveryDate: Date;
  realProductionTime?: number; // in hours
  realInputKg?: number; // in kg
  nozzleId: string;
  created_at?: string;
};

export type AdjustmentBatch = {
  id: string;
  name: string;
  productId: string;
  assignments: Assignment[]; // Múltiplas atribuições
  plannedTime: number; // in hours
  realTime: number; // in hours
  status: 'Planejado' | 'Em Produção' | 'Concluído' | 'Atrasado';
  startDate: Date;
  deliveryDate: Date;
  progress: number;
  created_at?: string;
};


export type Activity = {
  id:string;
  description: string;
  timestamp: Date;
};

// --- Tipos para Autenticação (ATUALIZADO) ---
export type UserProfile = {
  id: string; // UUID from auth.users
  full_name: string;
  username: string;
  role: 'admin' | 'user';
};

// Tipo para o usuário logado, combinando Auth e Profile
export type User = {
  id: string; // UUID from auth.users
  email: string;
  name: string; // Mapeado de full_name
  username: string;
  role: 'admin' | 'user';
};

// Tipos gerados a partir do schema do Supabase (para o DataContext)
export type DbProduct = {
  id: string;
  name: string;
  production_time: number;
  type: 'aspercao' | 'ajustagem';
  created_at: string;
};

export type DbEmployee = {
  id: string;
  name: string;
  hours_per_day: number;
  working_days: number[];
  created_at: string;
};

export type DbNozzle = {
  id: string;
  name: string;
  flow_rate: number;
  created_at: string;
};

export type DbBatchAssignment = {
  id?: number;
  batch_product_id?: number;
  employee_id: string;
  quantity: number;
  real_quantity: number;
}

export type DbBatchProduct = {
  id?: number;
  batch_id?: string;
  product_id: string;
  batch_assignments: DbBatchAssignment[];
}

export type DbBatch = {
  id: string;
  name: string;
  nozzle_id: string;
  start_date: string;
  delivery_date: string;
  status: 'Planejado' | 'Em Produção' | 'Concluído' | 'Atrasado';
  progress: number;
  real_production_time: number;
  real_input_kg: number;
  created_at: string;
  products: {
    productId: string;
    assignments: {
      employeeId: string;
      quantity: number;
      realQuantity?: number;
    }[];
  }[];
}

export type DbAdjustmentAssignment = {
  id?: number;
  adjustment_batch_id?: string;
  employee_id: string;
  quantity: number;
  real_quantity: number;
}

export type DbAdjustmentBatch = {
  id: string;
  name: string;
  product_id: string;
  planned_time: number;
  real_time: number;
  status: 'Planejado' | 'Em Produção' | 'Concluído' | 'Atrasado';
  start_date: string;
  delivery_date: string;
  progress: number;
  created_at: string;
  assignments: {
    employeeId: string;
    quantity: number;
    realQuantity?: number;
  }[];
}
