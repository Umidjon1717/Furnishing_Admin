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
  UserCircle,
} from 'lucide-react'
import { useNewOrders } from '../hooks/useNewOrders'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/orders', label: 'Orders', icon: ShoppingCart, badge: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/discounts', label: 'Discounts', icon: Percent },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const { hasNew, markSeen } = useNewOrders()

  function signOut() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_email')
    navigate('/login')
  }

  return (
    <aside className="w-64 h-full min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-xl font-bold tracking-wide" style={{ color: '#d4a843' }}>
          Furnishing
        </span>
        <span className="ml-1 text-sm text-gray-400">Admin</span>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {NAV_LINKS.map(({ to, label, icon: Icon, exact, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => {
              if (badge && hasNew) markSeen()
              onNavigate?.()
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge && hasNew && (
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3 space-y-1">
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <UserCircle size={18} />
          Profile
        </NavLink>
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
