import { HomePage } from '../pages';

/**
 * Central routing configuration.
 * Replace with react-router-dom <Routes> when you install it:
 *   npm install react-router-dom
 */
export function AppRouter() {
  // Minimal path-based routing without a library dependency
  const path = window.location.pathname;

  switch (path) {
    case '/':
    default:
      return <HomePage />;
  }
}
