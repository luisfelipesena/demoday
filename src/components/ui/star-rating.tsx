"use client"

import { Star } from "lucide-react"
import { useState } from "react"

interface StarRatingProps {
  value?: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StarRating({ value = 0, onChange, readonly = false, size = "md", className = "" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHovered(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHovered(0)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hovered || value)
        return (
          <Star
            key={star}
            className={`${sizeClasses[size]} transition-colors cursor-pointer ${
              isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-400"
            } ${readonly ? "cursor-default" : ""}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          />
        )
      })}
    </div>
  )
}
