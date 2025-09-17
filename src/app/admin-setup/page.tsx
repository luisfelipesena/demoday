"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "student_ufba" | "student_external" | "professor"
  emailVerified: boolean
  createdAt: string
}

const roleLabels = {
  admin: "Administrador",
  student_ufba: "Aluno UFBA",
  student_external: "Aluno Externo",
  professor: "Professor"
}

const roleBadgeColors = {
  admin: "bg-red-100 text-red-800",
  student_ufba: "bg-blue-100 text-blue-800",
  student_external: "bg-green-100 text-green-800",
  professor: "bg-purple-100 text-purple-800"
}

export default function AdminSetupPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string
    email: string
    password: string
    role: "admin" | "student_ufba" | "student_external" | "professor"
  }>({
    name: "",
    email: "",
    password: "",
    role: "student_ufba"
  })
  const [formLoading, setFormLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin-setup/users")
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || "Erro ao carregar usuários")
      }
    } catch (err) {
      setError("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    
    try {
      const response = await fetch("/api/admin-setup/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUsers([...users, data.user])
        setShowCreateForm(false)
        resetForm()
        setError("")
      } else {
        setError(data.error || "Erro ao criar usuário")
      }
    } catch (err) {
      setError("Erro de conexão")
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    setFormLoading(true)
    
    try {
      const updateData = {
        id: editingUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(formData.password && { password: formData.password })
      }
      
      const response = await fetch("/api/admin-setup/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUsers(users.map(u => u.id === editingUser.id ? data.user : u))
        setEditingUser(null)
        resetForm()
        setError("")
      } else {
        setError(data.error || "Erro ao atualizar usuário")
      }
    } catch (err) {
      setError("Erro de conexão")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return
    
    try {
      const response = await fetch(`/api/admin-setup/users?id=${userId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        setError("")
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao excluir usuário")
      }
    } catch (err) {
      setError("Erro de conexão")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "student_ufba"
    })
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role
    })
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    resetForm()
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando usuários...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Setup - Gerenciar Usuários</h1>
          <p className="text-muted-foreground mt-2">
            Ferramenta para implantação inicial do sistema. Usuários criados aqui não precisam de verificação de email.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">← Voltar</Button>
          </Link>
          <Button 
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setEditingUser(null)
              resetForm()
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingUser) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingUser ? "Editar Usuário" : "Criar Novo Usuário"}
            </CardTitle>
            <CardDescription>
              {editingUser 
                ? "Modifique os dados do usuário abaixo" 
                : "Preencha os dados para criar um novo usuário. Não será necessária verificação de email."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required={!editingUser}
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Usuário</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="student_ufba">Aluno UFBA</SelectItem>
                      <SelectItem value="student_external">Aluno Externo</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={formLoading}>
                  {formLoading 
                    ? (editingUser ? "Atualizando..." : "Criando...")
                    : (editingUser ? "Atualizar" : "Criar Usuário")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false)
                    cancelEdit()
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({users.length})</CardTitle>
          <CardDescription>
            Lista de todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado. Crie o primeiro usuário acima.
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <Badge className={roleBadgeColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                      {user.emailVerified && (
                        <Badge variant="secondary">✓ Verificado</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em: {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
