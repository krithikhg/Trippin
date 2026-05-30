'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { resetPassword } from '@/app/login/actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pt-4 pb-2">
          <CardTitle className="text-4xl font-serif italic text-heading">
            Reset Password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Couldn&apos;t update password</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-heading">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Button
              formAction={async (formData) => {
                setError(null)
                const result = await resetPassword(formData)
                if (result?.error) setError(result.error)
              }}
              className="p-4.5 hover:bg-primary/90 transition font-normal w-full"
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}