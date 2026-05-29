import type { TextareaHTMLAttributes } from 'react';
import './InkInput.css';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function InkInput({ label, className = '', ...rest }: Props) {
  return (
    <div className="ink-input-wrap">
      {label && <label className="ink-input-label">{label}</label>}
      <textarea className={`ink-input ${className}`} {...rest} />
    </div>
  );
}
