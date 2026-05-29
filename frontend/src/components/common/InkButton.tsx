import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './InkButton.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

export default function InkButton({ variant = 'primary', children, className = '', ...rest }: Props) {
  return (
    <button className={`ink-button ${variant} ${className}`} {...rest}>
      <span className="ink-button-inner">{children}</span>
    </button>
  );
}
