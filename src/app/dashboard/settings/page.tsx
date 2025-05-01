"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  const [profileSettings, setProfileSettings] = useState({
    name: "",
    email: "",
  })

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (session?.user) {
      setProfileSettings({
        name: session.user.name || "",
        email: session.user.email || "",
      })
    }
  }, [session])

  const handleInputChange = (
    key: string, 
    value: string, 
    stateUpdater: React.Dispatch<React.SetStateAction<any>>
  ) => {
    stateUpdater((prev: any) => ({ ...prev, [key]: value }))
    
    if (errors[key as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [key]: "" }))
    }
  }

  const validateProfileData = () => {
    const newErrors = { ...errors }
    let isValid = true

    if (!profileSettings.name.trim()) {
      newErrors.name = "O nome é obrigatório"
      isValid = false
    }

    if (!profileSettings.email.trim()) {
      newErrors.email = "O email é obrigatório"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(profileSettings.email)) {
      newErrors.email = "Email inválido"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const validatePasswordData = () => {
    const newErrors = { ...errors }
    let isValid = true

    if (!passwordSettings.currentPassword.trim()) {
      newErrors.currentPassword = "A senha atual é obrigatória"
      isValid = false
    }

    if (!passwordSettings.newPassword.trim()) {
      newErrors.newPassword = "A nova senha é obrigatória"
      isValid = false
    } else if (passwordSettings.newPassword.length < 8) {
      newErrors.newPassword = "A senha deve ter pelo menos 8 caracteres"
      isValid = false
    }

    if (!passwordSettings.confirmPassword.trim()) {
      newErrors.confirmPassword = "A confirmação de senha é obrigatória"
      isValid = false
    } else if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSaveProfile = async () => {
    if (!validateProfileData()) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileSettings),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil')
      }
      
      toast({
        title: "Perfil atualizado",
        description: "Informações do perfil atualizadas com sucesso!",
        variant: "success",
        duration: 5000,
      })

      window.location.reload()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar salvar as informações do perfil.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (isPasswordLoading || !validatePasswordData()) return

    setIsPasswordLoading(true)
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordSettings.currentPassword,
          newPassword: passwordSettings.newPassword,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 400 && data.error === "Senha atual incorreta") {
          toast({
            title: "Senha incorreta",
            description: "A senha atual está incorreta. Verifique e tente novamente.",
            variant: "destructive",
            duration: 5000,
          })
        } else if (response.status === 404) {
          toast({
            title: "Conta não encontrada",
            description: "Não foi possível encontrar sua conta. Entre em contato com o suporte.",
            variant: "destructive",
            duration: 5000,
          })
        } else if (response.status === 401) {
          toast({
            title: "Não autorizado",
            description: "Sua sessão pode ter expirado. Faça login novamente.",
            variant: "destructive",
            duration: 5000,
          })
        } else {
          throw new Error(data.error || 'Erro ao alterar senha')
        }
      } else {
        setPasswordSettings({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        
        toast({
          title: "Senha alterada",
          description: "Senha alterada com sucesso!",
          variant: "success",
          duration: 5000,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao tentar alterar a senha"
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ query: { callbackUrl: "/login" } })
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao sair da conta.",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Gerencie seus dados pessoais e como eles são exibidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Nome</div>
                <Input 
                  id="name" 
                  value={profileSettings.name} 
                  onChange={e => handleInputChange("name", e.target.value, setProfileSettings)}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Email</div>
                <Input 
                  id="email" 
                  type="email" 
                  value={profileSettings.email} 
                  onChange={e => handleInputChange("email", e.target.value, setProfileSettings)}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                <p className="text-sm text-gray-500">
                  Este email é usado para notificações e login.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar alterações"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Atualize sua senha para manter sua conta segura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Senha atual</div>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  value={passwordSettings.currentPassword} 
                  onChange={e => handleInputChange("currentPassword", e.target.value, setPasswordSettings)}
                />
                {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword}</p>}
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Nova senha</div>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={passwordSettings.newPassword} 
                  onChange={e => handleInputChange("newPassword", e.target.value, setPasswordSettings)}
                />
                {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword}</p>}
                <p className="text-sm text-gray-500">
                  A senha deve ter pelo menos 6 caracteres.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Confirmar nova senha</div>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={passwordSettings.confirmPassword} 
                  onChange={e => handleInputChange("confirmPassword", e.target.value, setPasswordSettings)}
                />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleChangePassword} disabled={isPasswordLoading}>
                {isPasswordLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Alterando senha...
                  </>
                ) : "Alterar senha"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Gerencie as configurações de segurança da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Detalhes da conta</div>
                <div className="text-sm text-gray-500">
                  <p><span className="font-medium">ID:</span> {session?.user?.id}</p>
                  <p><span className="font-medium">Função:</span> {session?.user?.role}</p>
                  <p><span className="font-medium">Conta criada em:</span> {session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <Separator className="my-4" />
                <div className="text-sm text-gray-500">
                  Último acesso: {new Date().toLocaleDateString()}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={handleSignOut}
              >
                Sair da conta
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
