type ButtonProps = {
    text: string;
    type?: "button" | "submit" | 'reset';
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

const Button = ({ text, type, onClick, disabled, className }: ButtonProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {text}
        </button>
    )
}

export default Button;