import { RouterProvider } from 'react-router-dom';
import { appRouter } from './routes/router';

export default function App() {
  return <RouterProvider router={appRouter} />;
}
