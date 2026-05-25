import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('Erro 404: Usuário tentou acessar rota inexistente:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-transparent animate-fade-in">
      <div className="text-center space-y-5">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">Ops! Esta página não foi encontrada.</p>
        <div className="pt-4">
          <Button asChild>
            <Link to="/">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
