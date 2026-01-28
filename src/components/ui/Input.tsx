import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, className = '', id, ...props }: InputProps) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s/g, '-')}`;
  
  return (
    <div className={styles.container}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <input 
        id={inputId}
        className={`${styles.input} ${error ? styles.inputError : ''} ${className}`} 
        {...props} 
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};
