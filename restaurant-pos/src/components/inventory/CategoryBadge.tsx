interface CategoryBadgeProps {
  name: string
  icon?: string
  size?: 'sm' | 'md'
}

export function CategoryBadge({
  name, icon, size = 'sm'
}: CategoryBadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1 bg-gray-100 text-gray-700
      rounded-full font-medium
      ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
    `}>
      {icon && <span>{icon}</span>}
      {name}
    </span>
  )
}