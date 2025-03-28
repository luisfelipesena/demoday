"use client"

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
export function DatePicker({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[280px] justify-start text-left font-normal", !value && "text-muted-foreground")}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

export function DatePickerWithRange({
  id,
  value,
  onChange,
  disabled = false,
  disablePastDates = false,
  className,
}: {
  id: string
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  disabled?: boolean
  disablePastDates?: boolean
  className?: string
}) {
  const [date, setDate] = useState<DateRange | undefined>(value)

  // Update internal state when external value changes
  useEffect(() => {
    setDate(value)
  }, [value])

  // Handle date selection and propagate changes
  const handleSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)
    onChange(selectedDate)
  }

  // Get today for disabling past dates
  const today = disablePastDates ? new Date() : undefined

  // Determine default month to show based on current selection or today
  const defaultMonth = date?.from || new Date()

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={"outline"}
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={defaultMonth}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={disablePastDates ? (today ? { before: today } : undefined) : undefined}
            fromDate={disablePastDates ? today : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
