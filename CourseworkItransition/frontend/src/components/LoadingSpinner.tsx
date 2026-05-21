interface Props { small?: boolean }

export default function LoadingSpinner({ small }: Props) {
  return (
    <div className="text-center py-5">
      <div className={`spinner-border${small ? ' spinner-border-sm' : ''}`} role="status" />
    </div>
  )
}
