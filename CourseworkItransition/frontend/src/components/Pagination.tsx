interface Props {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
  className?: string
}

export default function Pagination({ page, totalPages, onPageChange, className = 'justify-content-center' }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav>
      <ul className={`pagination pagination-sm mb-0 ${className}`}>
        <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)}>‹</button>
        </li>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
          </li>
        ))}
        <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)}>›</button>
        </li>
      </ul>
    </nav>
  )
}
