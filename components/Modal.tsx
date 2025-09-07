import './Modal.css';
import { ReactNode } from 'react'

type ModalProps = {
  children?: ReactNode
  onClose: () => void
}
export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="modalShroud">
      <div className="modal">
        <button onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
        <div className="modalContent">{children}</div>
      </div>
    </div>
  )
}