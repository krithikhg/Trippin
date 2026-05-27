'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { login, signup } from './actions'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-6xl font-serif italic text-heading">
            Welcome to Trippin!
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
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

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-heading">
                Password
              </label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline hover:text-primary"
                >
                  Forgot your password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                formAction={async (formData) => {
                  const result = await login(formData)
                  if (result?.error) {
                    setError(result.error)
                  }
                }}
                className="bg-primary text-primary-foreground p-2.5 rounded-md hover:bg-primary/90 transition"
              >
                Log in
              </button>
              <button
                formAction={async (formData) => {
                  const result = await signup(formData)
                  if (result?.error) {
                    setError(result.error)
                  }
                }}
                className="bg-white border border-input text-heading p-2.5 rounded-md hover:bg-muted transition"
              >
                Sign up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}