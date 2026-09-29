import { Link, useLocation } from 'react-router'

/** Catch-all and route error fallback: any unknown hash path lands here instead of React Router's default error screen. */
export const NotFoundPage = () => {
  const { pathname } = useLocation()
  return (
    <p>
      找不到頁面「{pathname}」。<Link to="/">回列表</Link>
    </p>
  )
}
