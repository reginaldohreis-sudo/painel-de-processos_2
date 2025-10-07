import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button, buttonVariants } from "@/components/ui/Button";
import { Edit, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ProductFormModal } from '@/components/ProductFormModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

type ProductType = 'aspercao' | 'ajustagem';

export function ProductsPage() {
    const { products, saveProduct, deleteProduct } = useData();
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState<ProductType>('aspercao');

    const filteredProducts = useMemo(() => 
        products.filter(p => p.type === activeTab),
    [products, activeTab]);

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormModalOpen(true);
    };

    const handleDeleteClick = (product: Product) => {
        setDeletingProduct(product);
        setDeleteAlertOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!deletingProduct) return;
        deleteProduct(deletingProduct.id);
        setDeleteAlertOpen(false);
        setDeletingProduct(null);
    };

    const handleSave = (productData: Product) => {
        saveProduct(productData);
        setFormModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold text-foreground">Produtos</h2>
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Produto
                    </Button>
                </div>

                <div>
                    <div className="border-b border-border">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => setActiveTab('aspercao')}
                                className={cn(
                                    'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                                    activeTab === 'aspercao'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-500'
                                )}
                            >
                                Produtos de Asperção
                            </button>
                            <button
                                onClick={() => setActiveTab('ajustagem')}
                                className={cn(
                                    'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                                    activeTab === 'ajustagem'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-500'
                                )}
                            >
                                Produtos de Ajustagem
                            </button>
                        </nav>
                    </div>

                    <Card className="mt-5">
                        <CardHeader>
                            <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6">
                                <div className="col-span-1">Produto</div>
                                <div className="col-span-1">Tempo de Produção</div>
                                <div className="col-span-1 text-right">Ações</div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="grid grid-cols-3 gap-4 items-center px-6 py-4 hover:bg-accent transition-colors">
                                        <div className="col-span-1 text-sm font-medium text-foreground capitalize">{product.name}</div>
                                        <div className="col-span-1 text-sm text-muted-foreground">{product.productionTime} min</div>
                                        <div className="col-span-1 flex justify-end items-center space-x-2">
                                            <Button onClick={() => handleEdit(product)} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button onClick={() => handleDeleteClick(product)} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Nenhum produto encontrado para esta categoria.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isFormModalOpen && (
                <ProductFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setFormModalOpen(false)}
                    onSave={handleSave}
                    product={editingProduct}
                />
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto <span className="font-bold capitalize">"{deletingProduct?.name}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingProduct(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
