import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePasswordResetRequest } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/errors'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Ingresá un correo electrónico válido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const resetRequest = usePasswordResetRequest()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    resetRequest.mutate(data.email, {
      onSuccess: () => setSent(true),
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <title>Olvidé mi contraseña | Planify</title>

      {sent ? (
        <div className="text-center py-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Revisá tu correo</h1>
          <p className="text-sm text-gray-500 mb-6">
            Si tu correo está registrado en Planify, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </p>
          <Link
            to="/login"
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <>
          <Link
            to="/login"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Olvidé mi contraseña</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ingresá tu correo y te enviaremos un enlace para restablecerla.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />

            {resetRequest.isError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl p-3">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {getApiErrorMessage(resetRequest.error, 'Error al enviar el correo. Intentá de nuevo.')}
              </div>
            )}

            <Button type="submit" isLoading={resetRequest.isPending} className="w-full mt-2">
              Enviar enlace
            </Button>
          </form>
        </>
      )}
    </Card>
  )
}
