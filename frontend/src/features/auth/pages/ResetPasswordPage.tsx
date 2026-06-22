import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePasswordResetConfirm } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/errors'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react'

const schema = z
  .object({
    new_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>()
  const resetConfirm = usePasswordResetConfirm()
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    if (!uid || !token) return
    resetConfirm.mutate(
      { uid, token, new_password: data.new_password },
      { onSuccess: () => setDone(true) },
    )
  }

  if (done) {
    return (
      <Card className="w-full max-w-sm text-center py-4">
        <title>Contraseña restablecida | Planify</title>
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">¡Listo!</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tu contraseña fue restablecida. Ya podés iniciar sesión con tu nueva contraseña.
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-2 px-4 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Ir al inicio de sesión
        </Link>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <title>Restablecer contraseña | Planify</title>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Nueva contraseña</h1>
      <p className="text-sm text-gray-500 mb-6">Elegí una nueva contraseña para tu cuenta.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={errors.new_password?.message}
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
          {...register('new_password')}
        />

        <Input
          label="Confirmar contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />

        {resetConfirm.isError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {getApiErrorMessage(resetConfirm.error, 'El enlace no es válido o ya expiró.')}
          </div>
        )}

        <Button type="submit" isLoading={resetConfirm.isPending} className="w-full mt-2">
          Guardar nueva contraseña
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        <Link to="/olvide-contrasena" className="text-primary-600 font-medium hover:underline">
          Solicitar un nuevo enlace
        </Link>
      </p>
    </Card>
  )
}
