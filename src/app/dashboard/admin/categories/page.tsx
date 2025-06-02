"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description: string | null;
  maxFinalists: number;
  demodayId: string;
  createdAt: string;
  updatedAt: string;
}

interface Demoday {
  id: string;
  name: string;
  active: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [demodays, setDemodays] = useState<Demoday[]>([]);
  const [selectedDemoday, setSelectedDemoday] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", maxFinalists: 5 });
  const [newCategory, setNewCategory] = useState({ name: "", description: "", maxFinalists: 5 });
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!selectedDemoday) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/categories?demodayId=${selectedDemoday}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, [selectedDemoday]);

  useEffect(() => {
    fetchDemodays();
  }, []);

  useEffect(() => {
    if (selectedDemoday) {
      fetchCategories();
    }
  }, [selectedDemoday, fetchCategories]);

  const fetchDemodays = async () => {
    try {
      const response = await fetch("/api/demoday");
      if (response.ok) {
        const data = await response.json();
        setDemodays(data);
        // Auto-select the active demoday if available
        const activeDemoday = data.find((d: Demoday) => d.active);
        if (activeDemoday) {
          setSelectedDemoday(activeDemoday.id);
        }
      }
    } catch (error) {
      console.error("Error fetching demodays:", error);
      toast.error("Erro ao carregar demodays");
    }
  };

  const handleCreate = async () => {
    if (!newCategory.name.trim() || !selectedDemoday) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCategory,
          demodayId: selectedDemoday,
        }),
      });

      if (response.ok) {
        toast.success("Categoria criada com sucesso!");
        setNewCategory({ name: "", description: "", maxFinalists: 5 });
        setShowNewForm(false);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao criar categoria");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Erro ao criar categoria");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description || "",
      maxFinalists: category.maxFinalists,
    });
  };

  const handleSave = async (id: string) => {
    if (!editForm.name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success("Categoria atualizada com sucesso!");
        setEditingId(null);
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao atualizar categoria");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Erro ao atualizar categoria");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Categoria excluída com sucesso!");
        fetchCategories();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao excluir categoria");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Erro ao excluir categoria");
    }
  };

  if (!selectedDemoday) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Gestão de Categorias</h1>
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Demoday</CardTitle>
            <CardDescription>
              Escolha um demoday para gerenciar suas categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedDemoday}
              onChange={(e) => setSelectedDemoday(e.target.value)}
            >
              <option value="">Selecione um demoday...</option>
              {demodays.map((demoday) => (
                <option key={demoday.id} value={demoday.id}>
                  {demoday.name} {demoday.active && "(Ativo)"}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Categorias</h1>
          <p className="text-muted-foreground">
            Demoday: {demodays.find(d => d.id === selectedDemoday)?.name}
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Nova Categoria Form */}
      {showNewForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nova Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Ex: Inovação Tecnológica"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Input
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Descrição da categoria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Máximo de Finalistas</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={newCategory.maxFinalists}
                onChange={(e) => setNewCategory({ ...newCategory, maxFinalists: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Criar Categoria</Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Categorias */}
      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-3 w-3/4 mb-4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Nenhuma categoria encontrada para este demoday.
              </p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                {editingId === category.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nome</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descrição</label>
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Máximo de Finalistas</label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={editForm.maxFinalists}
                        onChange={(e) => setEditForm({ ...editForm, maxFinalists: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(category.id)} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setEditingId(null)} size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      {category.description && (
                        <p className="text-muted-foreground mt-1">{category.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          Máx. {category.maxFinalists} finalistas
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}