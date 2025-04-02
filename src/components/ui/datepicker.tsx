"use client"

import { format, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { ptBR } from "date-fns/locale"

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
          {value && isValid(value) ? format(value, "dd/MM/yyyy") : <span>Selecione uma data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar 
          mode="single" 
          selected={value} 
          onSelect={onChange} 
          initialFocus 
          locale={ptBR}
        />
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
    if (!selectedDate) {
      setDate(undefined)
      onChange(undefined)
      return
    }
    
    // Criar um novo objeto sem modificar o original
    const newRange: DateRange = {
      from: selectedDate.from ? new Date(selectedDate.from) : undefined,
      to: selectedDate.to ? new Date(selectedDate.to) : undefined
    }
    
    // Garantir que as datas permaneçam no mesmo dia, independente do fuso horário
    if (newRange.from) {
      // Preservar o dia definindo para meio-dia no horário local
      const year = newRange.from.getFullYear();
      const month = newRange.from.getMonth();
      const day = newRange.from.getDate();
      newRange.from = new Date(year, month, day, 12, 0, 0);
    }
    
    if (newRange.to) {
      // Preservar o dia definindo para meio-dia no horário local
      const year = newRange.to.getFullYear();
      const month = newRange.to.getMonth();
      const day = newRange.to.getDate();
      newRange.to = new Date(year, month, day, 12, 0, 0);
    }
    
    setDate(newRange)
    onChange(newRange)
  }

  // Get today for disabling past dates
  const today = disablePastDates ? new Date() : undefined
  if (today) {
    today.setHours(0, 0, 0, 0)
  }

  // Determine default month to show based on current selection or today
  const defaultMonth = date?.from && isValid(date.from) ? date.from : new Date()

  // Função para formatar datas de forma segura
  const formatDateSafely = (date: Date | undefined) => {
    if (!date || !isValid(date)) return null;
    return format(date, "dd/MM/yyyy");
  };

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
            {date?.from && isValid(date.from) ? (
              date.to && isValid(date.to) ? (
                <>
                  {formatDateSafely(date.from)} - {formatDateSafely(date.to)}
                </>
              ) : (
                formatDateSafely(date.from)
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
            locale={ptBR}
            weekStartsOn={0}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
