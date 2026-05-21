interface Props { message: string | null; className?: string }

export default function ErrorAlert({ message, className = 'py-2' }: Props) {
  if (!message) return null
  return <div className={`alert alert-danger ${className}`}>{message}</div>
}
