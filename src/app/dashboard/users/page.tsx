"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Search, Users as UsersIcon, UserCheck, Mail, Calendar, Edit, Save, X } from "lucide-react"


interface User {
  id: string
  name: string
  email: string
  role: "admin" | "student_ufba" | "student_external" | "professor"
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function UsersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string>("")

  const isAdmin = session?.user?.role === "admin"

  useEffect(() => {
    if (session?.user) {
      if (!isAdmin) {
        router.push("/dashboard")
        return
      }
      fetchUsers()
    }
  }, [session, search, roleFilter, pagination.page, router, isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search,
        role: roleFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      const response = await fetch(`/api/users?${params}`)
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Acesso Negado",
            description: "Apenas administradores podem gerenciar usuários.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar usuários")
      }
      
      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar usuários.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar usuário")
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole as any, updatedAt: new Date().toISOString() }
          : user
      ))

      setEditingUser(null)
      setEditingRole("")

      toast({
        title: "Sucesso",
        description: "Role do usuário atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar usuário.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "professor":
        return "default"
      case "student_ufba":
        return "secondary"
      case "student_external":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "professor":
        return "Professor"
      case "student_ufba":
        return "Aluno UFBA"
      case "student_external":
        return "externo à UFBA"
      default:
        return role
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-12 w-64" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Acesso Negado</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Gerenciar Usuários</h1>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            {pagination.total} usuários cadastrados
          </p>
        </div>
        <UsersIcon className="h-8 w-8 text-blue-600" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Busque e filtre usuários por nome, email ou role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="professor">Professores</SelectItem>
                <SelectItem value="user">Estudantes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Gerencie roles e visualize informações dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <Select value={editingRole} onValueChange={setEditingRole}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="professor">Professor</SelectItem>
                            <SelectItem value="student_ufba">Aluno UFBA</SelectItem>
                            <SelectItem value="student_external">Aluno externo à UFBA</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => handleRoleUpdate(user.id, editingRole)}
                          disabled={!editingRole || editingRole === user.role}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(null)
                            setEditingRole("")
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Verificado</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-600">Pendente</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(user.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingUser !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUser(user.id)
                          setEditingRole(user.role)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600">Nenhum usuário encontrado</p>
              <p className="text-gray-500">
                Tente ajustar os filtros ou convide novos usuários
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
} 