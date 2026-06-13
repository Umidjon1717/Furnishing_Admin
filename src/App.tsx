import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductsList from './pages/Products/ProductsList'
import ProductForm from './pages/Products/ProductForm'
import Categories from './pages/Categories'
import OrdersList from './pages/Orders/OrdersList'
import OrderDetail from './pages/Orders/OrderDetail'
import OrderInvoice from './pages/Orders/OrderInvoice'
import Customers from './pages/Customers'
import CustomerDetail from './pages/Customers/CustomerDetail'
import Payments from './pages/Payments'
import Discounts from './pages/Discounts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Invoice is a standalone print page — still auth-guarded but no sidebar */}
        <Route
          path="/orders/:id/invoice"
          element={
            <AuthGuard>
              <div className="min-h-screen bg-gray-50 p-8">
                <OrderInvoice />
              </div>
            </AuthGuard>
          }
        />

        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductForm />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/orders" element={<OrdersList />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/discounts" element={<Discounts />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
