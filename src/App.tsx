import { ThemeProvider } from './context';
import { AppRouter } from './router';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
