interface ToastProps {
  icon: React.ReactNode
  text: string
  subtext: string
  type: 'red' | 'primary'
  isVisible: boolean
}

const Toast = ({ icon, text, subtext, type, isVisible = true }: ToastProps) => {
  return (
    <div style={{ position: 'fixed', left: 40, bottom: 40, zIndex: 50 }}>
      <div
        className={`bg-wh p-5 flex flex-col gap-1 w-111 rounded-[8px] ${
          isVisible ? 'toast-in' : 'toast-out'
        } ${
          type === 'red'
            ? 'border border-red shadow-[4px_4px_20px_-12px_rgba(243,18,96,1)]'
            : 'border border-primary shadow-[4px_4px_20px_-12px_rgba(1,111,238,1)]'
        }`}
      >
        <div className="flex items-center gap-1">
          {icon}
          <p className="Me_Body-1">{text}</p>
        </div>
        <p className="Re_Body-1 text-[#363636]">{subtext}</p>
      </div>
    </div>
  )
}

export default Toast
