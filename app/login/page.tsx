import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <form className="flex flex-col gap-4 w-full max-w-sm">
        <h1 className="text-6xl font-serif italic text-heading text-center tracking-tight">Welcome to Trippin! </h1>

        <label htmlFor="email">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="border p-2 rounded"
        />

        <label htmlFor="password">Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="border p-2 rounded"
        />

        <button formAction={login} className="bg-primary text-white p-2 rounded">
          Log in
        </button>
        <button formAction={signup} className="bg-accent text-white p-2 rounded">
          Sign up
        </button>
      </form>
    </div>
  )
}