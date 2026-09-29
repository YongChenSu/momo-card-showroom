import { createHashRouter, RouterProvider } from 'react-router'
import '../embed'
import { Layout } from './Layout'
import { CardPage } from './pages/CardPage'
import { ListPage } from './pages/ListPage'
import { NotFoundPage } from './pages/NotFoundPage'
import './showroom.css'

// Hash routing (D11): works on the dev server, static hosting and file:// with no rewrite config.
const router = createHashRouter([
  {
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: '/', element: <ListPage /> },
      { path: '/cards/:variant', element: <CardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export const App = () => <RouterProvider router={router} />
