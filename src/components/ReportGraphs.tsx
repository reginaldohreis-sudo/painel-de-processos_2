import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Batch, Product, Nozzle } from '@/types';
import { calculateBatchEstimates } from '@/lib/utils';

interface ReportGraphsProps {
    batch: Batch;
    allProducts: Product[];
    allNozzles: Nozzle[];
}

// Helper to generate "nice" ticks for the chart axes dynamically.
const generateNiceTicks = (maxValue: number, tickCount: number = 6) => {
    if (maxValue <= 0) return [0];

    // Calculate a "nice" step.
    const range = maxValue;
    const unroundedTickSize = range / (tickCount - 1);
    const x = Math.ceil(Math.log10(unroundedTickSize) - 1);
    const pow10x = Math.pow(10, x);
    const roundedTickRange = Math.ceil(unroundedTickSize / pow10x) * pow10x;
    
    // Calculate the new max value for the axis
    const newMax = Math.ceil(maxValue / roundedTickRange) * roundedTickRange;

    // Generate the ticks
    const ticks = [];
    for (let i = 0; i <= newMax; i += roundedTickRange) {
        ticks.push(parseFloat(i.toPrecision(10)));
        if (ticks.length > 10) break; // Safety break
    }

    // If there's only one tick [0] is generated but maxValue > 0, add the max value
    if (ticks.length <= 1 && maxValue > 0) {
        return [0, Math.ceil(maxValue)];
    }

    return ticks;
};


export function ReportGraphs({ batch, allProducts, allNozzles }: ReportGraphsProps) {
    const { totalItems, estimatedTimeHours, estimatedInputKg } = calculateBatchEstimates(batch, allProducts, allNozzles);
    const totalProduced = batch.products.reduce((sum, p) => sum + p.assignments.reduce((as, a) => as + (a.realQuantity || 0), 0), 0);
    const realTimeHours = batch.realProductionTime || 0;
    const realInputKg = batch.realInputKg || 0;

    // --- Generate data points for charts ---
    const inputVsQtyData = [
        { qty: 0, previsto: 0, real: 0 },
        { qty: totalProduced, real: realInputKg },
        { qty: totalItems, previsto: estimatedInputKg },
    ].sort((a, b) => a.qty - b.qty).filter((v, i, a) => !i || v.qty !== a[i - 1].qty);


    const qtyVsTimeData = [
        { time: 0, previsto: 0, realizado: 0 },
        { time: realTimeHours, realizado: totalProduced },
        { time: estimatedTimeHours, previsto: totalItems },
    ].sort((a, b) => a.time - b.time).filter((v, i, a) => !i || v.time !== a[i - 1].time);
    
    // --- Calculate metrics ---
    const realEfficiency = realInputKg > 0 ? (totalProduced / realInputKg) * 5 : 0;
    const realProductivity = realTimeHours > 0 ? totalProduced / realTimeHours : 0;

    // --- Generate ticks for axes ---
    const maxTime = Math.max(realTimeHours, estimatedTimeHours);
    const maxInput = Math.max(realInputKg, estimatedInputKg);
    const maxQty = Math.max(totalProduced, totalItems);

    const timeTicks = generateNiceTicks(maxTime);
    const inputTicks = generateNiceTicks(maxInput);
    const qtyTicks = generateNiceTicks(maxQty);

    return (
        <div id={`report-graphs-${batch.id}`} className="p-4 bg-white text-gray-800 font-sans" style={{ width: '800px' }}>
            <div className="mb-4">
                <h3 className="text-base font-semibold mb-2 text-center">Análise: Insumo vs. Quantidade</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={inputVsQtyData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="qty" 
                            type="number" 
                            domain={[0, 'dataMax']} 
                            label={{ value: 'Quantidade de Peças (un)', position: 'insideBottom', offset: -10 }} 
                            ticks={qtyTicks}
                        />
                        <YAxis 
                            domain={[0, 'dataMax']} 
                            label={{ value: 'Insumo (kg)', angle: -90, position: 'insideLeft' }} 
                            ticks={inputTicks}
                        />
                        <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                        <Legend verticalAlign="top" />
                        <Line type="monotone" dataKey="previsto" name="Previsto" stroke="#3498db" strokeDasharray="5 5" connectNulls />
                        <Line type="monotone" dataKey="real" name="Real" stroke="#2ecc71" connectNulls />
                    </LineChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-gray-600 mt-2 max-w-prose mx-auto">
                    <p className="font-semibold">Eficiência Real: {realEfficiency.toFixed(1)} peças a cada 5kg de insumo.</p>
                </div>
            </div>
            <div className="mt-6">
                <h3 className="text-base font-semibold mb-2 text-center">Análise: Quantidade vs. Tempo</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={qtyVsTimeData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="time" 
                            type="number" 
                            domain={[0, 'dataMax']} 
                            unit="h" 
                            label={{ value: 'Tempo (horas)', position: 'insideBottom', offset: -10 }} 
                            ticks={timeTicks}
                        />
                        <YAxis 
                            domain={[0, 'dataMax']} 
                            label={{ value: 'Quantidade de Peças (un)', angle: -90, position: 'insideLeft' }} 
                            ticks={qtyTicks}
                        />
                        <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} />
                        <Legend verticalAlign="top" />
                        <Line type="monotone" dataKey="previsto" name="Previsto" stroke="#f39c12" strokeDasharray="5 5" connectNulls />
                        <Line type="monotone" dataKey="realizado" name="Realizado" stroke="#9b59b6" connectNulls />
                    </LineChart>
                </ResponsiveContainer>
                <div className="text-center text-xs text-gray-600 mt-2 max-w-prose mx-auto">
                    <p className="font-semibold">Produtividade Real: {realProductivity.toFixed(1)} peças por hora.</p>
                </div>
            </div>
        </div>
    );
}
