import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error'
interface Toast { id: number; message: string; type: ToastType }

interface ToastCtx { success: (msg: string) => void; error: (msg: string) => void }
const Ctx = createContext<ToastCtx>({ success: () => {}, error: () => {} })

export function useToast() { return useContext(Ctx) }

let _id = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id)), [])

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++_id
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => remove(id), 3500)
  }, [remove])

  const success = useCallback((msg: string) => add(msg, 'success'), [add])
  const error = useCallback((msg: string) => add(msg, 'error'), [add])

  return (
    <Ctx.Provider value={{ success, error }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const isSuccess = toast.type === 'success'

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 min-w-[260px] max-w-sm
        ${isSuccess ? 'bg-white border-green-200 text-green-800' : 'bg-white border-red-200 text-red-800'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {isSuccess
        ? <CheckCircle size={18} className="text-green-500 shrink-0" />
        : <XCircle size={18} className="text-red-500 shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  )
}
