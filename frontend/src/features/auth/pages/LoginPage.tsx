import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/errors'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = (data: LoginForm) => login.mutate(data)

  return (
    <Card className="w-full max-w-sm">
      <title>Ingresar | Planify</title>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</h1>
      <p className="text-sm text-gray-500 mb-6">Iniciá sesión en tu cuenta de Planify</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          {...register('password')}
        />

        {login.isError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3" role="alert">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {getApiErrorMessage(login.error, 'Error al ingresar. Intentá de nuevo.')}
          </div>
        )}

        <Button type="submit" isLoading={login.isPending} className="w-full mt-2">
          Ingresar
        </Button>
      </form>

      <p className="mt-3 text-center text-sm">
        <Link to="/olvide-contrasena" className="text-gray-400 hover:text-primary-600 hover:underline transition-colors">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-gray-500">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          Registrate
        </Link>
      </p>
    </Card>
  )
}
