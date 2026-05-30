'use client'

import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { requestPasswordReset } from '@/app/login/actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  return (
    <>
      <header className="p-6">
        <Link href="/" className="flex items-center gap-1 w-fit">
          <Image
            src="/TrippinLogo.png"
            alt="Trippin logo"
            width={50}
            height={50}
            className="rounded"
          />
          <span className="text-3xl font-serif italic text-primary">
            Trippin
          </span>
        </Link>
      </header>

    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pt-4 pb-2">
          <CardTitle className="text-4xl font-serif italic text-heading">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            A reset link will be sent to your email.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn&apos;t send reset email</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="text-green">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Email sent!</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-heading">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <Button
                formAction={async (formData) => {
                    setError(null)
                    setSuccess(null)
                    const result = await requestPasswordReset(formData)
                    if (result?.error) setError(result.error)
                    if (result?.success) setSuccess(result.success)
                }}
                className="bg-primary text-primary-foreground p-4.5 rounded-md hover:bg-primary/90 transition font-normal w-full"
                >
                Send reset link
                </Button>

                <Button asChild variant="ghost" 
                className="bg-white border border-input text-heading p-4.5 rounded-md hover:bg-muted transition font-normal w-full"
                >
                    <Link href="/login">
                        Back to login
                    </Link>
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  )
}