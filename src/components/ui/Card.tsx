import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className = '', selected = false, onClick }: CardProps) => {
  return (
    <div 
      className={`${styles.card} ${selected ? styles.selected : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
