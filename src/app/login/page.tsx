import { LoginForm } from './login-form'

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await props.searchParams

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm next={next || '/email'} />
      </div>
    </main>
  )
}