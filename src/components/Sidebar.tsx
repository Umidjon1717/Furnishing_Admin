import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Box,
  Tag,
  ShoppingCart,
  Users,
  CreditCard,
  Percent,
  LogOut,
} from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/discounts', label: 'Discounts', icon: Percent },
]

export default function Sidebar() {
  const navigate = useNavigate()

  function signOut() {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-xl font-bold tracking-wide text-gold-400" style={{ color: '#d4a843' }}>
          Furnishing
        </span>
        <span className="ml-1 text-sm text-gray-400">Admin</span>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
