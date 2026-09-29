import { NavLink, Outlet } from 'react-router'
import { cardDefinitions } from '../cards'
import { cardVariants } from '../core/schema/card-config'

export const Layout = () => (
  <div className="layout">
    <header className="topbar">
      <h1>momo Card Showroom</h1>
      <nav>
        <NavLink to="/" end>
          全部卡片
        </NavLink>
        {cardVariants.map((variant) => (
          <NavLink key={variant} to={`/cards/${variant}`}>
            {cardDefinitions[variant].label}
          </NavLink>
        ))}
      </nav>
    </header>
    <main>
      <Outlet />
    </main>
  </div>
)
