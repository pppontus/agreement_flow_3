import styles from './Select.module.css';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const Select = ({ label, className = '', ...props }: SelectProps) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <select className={`${styles.select} ${className}`} {...props} />
    </div>
  );
};
