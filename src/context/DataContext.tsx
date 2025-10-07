import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { 
    Batch, Product, Employee, Nozzle, AdjustmentBatch, 
    DbProduct, DbEmployee, DbNozzle, DbBatch, DbAdjustmentBatch,
    BatchProductDetail, Assignment
} from '@/types';
import { useAuth } from './AuthContext';

// --- Funções de Mapeamento ---
const mapFromDbProduct = (db: DbProduct): Product => ({
    id: db.id,
    name: db.name,
    productionTime: db.production_time,
    type: db.type,
    created_at: db.created_at,
});

const mapFromDbEmployee = (db: DbEmployee): Employee => ({
    id: db.id,
    name: db.name,
    hoursPerDay: db.hours_per_day,
    workingDays: db.working_days,
    created_at: db.created_at,
});

const mapFromDbNozzle = (db: DbNozzle): Nozzle => ({
    id: db.id,
    name: db.name,
    flowRate: db.flow_rate,
    created_at: db.created_at,
});

const mapFromDbBatch = (db: any): Batch => ({
    id: db.id,
    name: db.name,
    nozzleId: db.nozzle_id,
    startDate: new Date(db.start_date),
    deliveryDate: new Date(db.delivery_date),
    status: db.status,
    progress: db.progress,
    realProductionTime: db.real_production_time,
    realInputKg: db.real_input_kg,
    created_at: db.created_at,
    products: db.batch_products.map((p: any) => ({
        productId: p.product_id,
        assignments: p.batch_assignments.map((a: any) => ({
            employeeId: a.employee_id,
            quantity: a.quantity,
            realQuantity: a.real_quantity,
        })),
    })),
});

const mapFromDbAdjustmentBatch = (db: any): AdjustmentBatch => ({
    id: db.id,
    name: db.name,
    productId: db.product_id,
    plannedTime: db.planned_time,
    realTime: db.real_time,
    status: db.status,
    startDate: new Date(db.start_date),
    deliveryDate: new Date(db.delivery_date),
    progress: db.progress,
    created_at: db.created_at,
    assignments: db.adjustment_assignments.map((a: any) => ({
        employeeId: a.employee_id,
        quantity: a.quantity,
        realQuantity: a.real_quantity,
    })),
});

interface DataContextType {
    loading: boolean;
    batches: Batch[];
    products: Product[];
    employees: Employee[];
    nozzles: Nozzle[];
    adjustmentBatches: AdjustmentBatch[];
    updateBatchStatus: (batchId: string, newStatus: Batch['status']) => Promise<void>;
    saveBatch: (batchData: Omit<Batch, 'progress' | 'status' | 'deliveryDate'> & { id?: string }) => Promise<void>;
    updateBatchRealData: (batchId: string, updates: { products: BatchProductDetail[], realProductionTime: number, realInputKg: number }) => Promise<void>;
    saveProduct: (productData: Omit<Product, 'id'> & { id?: string }) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    saveNozzle: (nozzleData: Omit<Nozzle, 'id'> & { id?: string }) => Promise<void>;
    deleteNozzle: (nozzleId: string) => Promise<void>;
    saveEmployee: (employeeData: Omit<Employee, 'id'> & { id?: string }) => Promise<void>;
    deleteEmployee: (employeeId: string) => Promise<void>;
    saveAdjustmentBatch: (adjustmentData: Omit<AdjustmentBatch, 'progress' | 'status' | 'deliveryDate' | 'plannedTime' | 'realTime'> & { id?: string }) => Promise<void>;
    updateAdjustmentBatchRealData: (batchId: string, updates: { assignments: Assignment[], realTime: number }) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [nozzles, setNozzles] = useState<Nozzle[]>([]);
    const [adjustmentBatches, setAdjustmentBatches] = useState<AdjustmentBatch[]>([]);

    const fetchData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        };
        setLoading(true);
        try {
            const [productsRes, employeesRes, nozzlesRes, batchesRes, adjustmentBatchesRes] = await Promise.all([
                supabase.from('products').select('*'),
                supabase.from('employees').select('*'),
                supabase.from('nozzles').select('*'),
                supabase.from('batches').select('*, batch_products(*, batch_assignments(*))'),
                supabase.from('adjustment_batches').select('*, adjustment_assignments(*)'),
            ]);

            if (productsRes.error || employeesRes.error || nozzlesRes.error || batchesRes.error || adjustmentBatchesRes.error) {
                throw new Error('Failed to fetch data');
            }

            setProducts(productsRes.data.map(mapFromDbProduct));
            setEmployees(employeesRes.data.map(mapFromDbEmployee));
            setNozzles(nozzlesRes.data.map(mapFromDbNozzle));
            setBatches(batchesRes.data.map(mapFromDbBatch));
            setAdjustmentBatches(adjustmentBatchesRes.data.map(mapFromDbAdjustmentBatch));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sortedProducts = useMemo(() => 
        [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })), 
    [products]);

    const updateBatchStatus = async (batchId: string, newStatus: Batch['status']) => {
        const isAspercao = batches.some(b => b.id === batchId);
        const tableName = isAspercao ? 'batches' : 'adjustment_batches';
        
        const { error } = await supabase.from(tableName).update({ status: newStatus }).eq('id', batchId);
        if (!error) await fetchData();
    };

    const saveBatch = async (batchData: any) => {
        const { error } = await supabase.rpc('create_or_update_batch', { payload: batchData });
        if (!error) await fetchData(); else console.error(error);
    };

    const updateBatchRealData = async (batchId: string, updates: any) => {
        const { error } = await supabase.rpc('update_batch_real_data', { b_id: batchId, payload: updates });
        if (!error) await fetchData(); else console.error(error);
    };

    const saveProduct = async (productData: any) => {
        const payload = {
            name: productData.name,
            production_time: productData.productionTime,
            type: productData.type,
        };
        const { error } = await supabase.from('products').upsert({ id: productData.id, ...payload });
        if (!error) await fetchData();
    };

    const deleteProduct = async (productId: string) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (!error) await fetchData();
    };
    
    const saveNozzle = async (nozzleData: any) => {
        const payload = { name: nozzleData.name, flow_rate: nozzleData.flowRate };
        const { error } = await supabase.from('nozzles').upsert({ id: nozzleData.id, ...payload });
        if (!error) await fetchData();
    };

    const deleteNozzle = async (nozzleId: string) => {
        const { error } = await supabase.from('nozzles').delete().eq('id', nozzleId);
        if (!error) await fetchData();
    };

    const saveEmployee = async (employeeData: any) => {
        const payload = { name: employeeData.name, hours_per_day: employeeData.hoursPerDay, working_days: employeeData.workingDays };
        const { error } = await supabase.from('employees').upsert({ id: employeeData.id, ...payload });
        if (!error) await fetchData();
    };

    const deleteEmployee = async (employeeId: string) => {
        const { error } = await supabase.from('employees').delete().eq('id', employeeId);
        if (!error) await fetchData();
    };

    const saveAdjustmentBatch = async (adjustmentData: any) => {
        const { error } = await supabase.rpc('create_or_update_adjustment_batch', { payload: adjustmentData });
        if (!error) await fetchData(); else console.error(error);
    };

    const updateAdjustmentBatchRealData = async (batchId: string, updates: any) => {
        const { error } = await supabase.rpc('update_adjustment_batch_real_data', { b_id: batchId, payload: updates });
        if (!error) await fetchData(); else console.error(error);
    };

    const value = {
        loading,
        batches,
        products: sortedProducts,
        employees,
        nozzles,
        adjustmentBatches,
        updateBatchStatus,
        saveBatch,
        updateBatchRealData,
        saveProduct,
        deleteProduct,
        saveNozzle,
        deleteNozzle,
        saveEmployee,
        deleteEmployee,
        saveAdjustmentBatch,
        updateAdjustmentBatchRealData,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
