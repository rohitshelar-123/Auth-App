type InputProps = {
    label: string,
    type: string,
    placeholder: string,
    value: string,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    className?: string
}

const Input = ({ label, type, placeholder, value, onChange, className }: InputProps) => {
    return (
        <div className="flex flex-col">
            <label>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={className}
            />
        </div>
    )
}

export default Input;