import { Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppShell from '../layouts/AppShell'
import { RealtimeProvider } from './realtime'
import { WebSocketBridge } from './websocketBridge'
import FleetOverview from '../pages/FleetOverview'
import LendingActivity from '../pages/LendingActivity'
import TrustRegistry from '../pages/TrustRegistry'
import AgentSkills from '../pages/AgentSkills'
import AgentConfig from '../pages/AgentConfig'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 8000),
      refetchOnWindowFocus: false
    }
  }
})

export default function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        <WebSocketBridge />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(8, 15, 16, 0.96)',
              color: '#f5f1e8',
              border: '1px solid rgba(53, 241, 162, 0.18)'
            }
          }}
        />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<FleetOverview />} />
            <Route path="/lending" element={<LendingActivity />} />
            <Route path="/trust" element={<TrustRegistry />} />
            <Route path="/skills" element={<AgentSkills />} />
            <Route path="/config/:id" element={<AgentConfig />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
