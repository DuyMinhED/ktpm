import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/AppRoutes';
import SessionTimeoutWarning from './components/common/SessionTimeoutWarning';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { ToastProvider } from './components/ui/ToastContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <AppRoutes />
          <SessionTimeoutWarning />
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
