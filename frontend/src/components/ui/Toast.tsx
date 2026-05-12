import React, { useEffect } from 'react';
import { useToast, type ToastType } from './ToastContext';

interface ToastProps {
  show: boolean;
  title: string;
  type?: ToastType;
  onClose: () => void;
}

/**
 * @deprecated Use useToast() hook instead of this component.
 * This component is kept for backward compatibility and redirects calls to the new global Toast system.
 */
const Toast: React.FC<ToastProps> = ({ show, title, type = 'success', onClose }) => {
  const { showToast } = useToast();

  useEffect(() => {
    if (show && title) {
      showToast(title, type);
      onClose();
    }
  }, [show, title, type, showToast, onClose]);

  return null;
};


export default Toast;

