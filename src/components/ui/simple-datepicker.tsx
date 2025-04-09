"use client"

import React from "react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

// Formata a data para o input, garantindo zeros à esquerda
function formatDateForInput(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Cria uma nova data tendo como base o meio-dia UTC para evitar problemas de fuso horário
function parseDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;

  // Formato esperado: YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length !== 3) return undefined;

  // Garantir que todos os elementos existem e são strings válidas
  const yearStr = parts[0] || "";
  const monthStr = parts[1] || "";
  const dayStr = parts[2] || "";

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Meses em JS são 0-indexed
  const day = parseInt(dayStr, 10);

  // Criar data com meio-dia UTC para evitar problemas de fuso horário
  const date = new Date(Date.UTC(year, month, day, 12, 0, 0));
  
  // Verificar se a data é válida
  if (isNaN(date.getTime())) return undefined;

  return date;
}

export interface DatePickerProps {
  id: string
  value?: Date
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  disablePastDates?: boolean
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
  disablePastDates = false,
}: DatePickerProps) {
  // Define a data mínima como hoje ao meio-dia UTC se disablePastDates for true
  const minDate = disablePastDates ? new Date(new Date().setUTCHours(12, 0, 0, 0)) : undefined;
  const minDateString = minDate ? formatDateForInput(minDate) : "";

  // Conversão da string do input para Date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    if (!dateStr) {
      onChange(undefined)
      return
    }
    
    const date = parseDate(dateStr);
    if (date) {
      onChange(date);
      return;
    }
    
    // Fallback caso algo dê errado
    onChange(new Date(dateStr))
  }

  return (
    <div className={cn("relative", className)}>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Input
            type="date"
            placeholder="DD/MM/YYYY"
            value={value ? formatDateForInput(value) : ""}
            onChange={handleDateChange}
            min={minDateString}
            className={className}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

export interface DateRangePickerProps {
  id: string
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  disabled?: boolean
  disablePastDates?: boolean
  className?: string
}

export function DatePickerWithRange({
  value,
  onChange,
  disabled = false,
  disablePastDates = false,
  className,
}: DateRangePickerProps) {
  // Define a data mínima como hoje ao meio-dia UTC se disablePastDates for true
  const minDate = disablePastDates ? new Date(new Date().setUTCHours(12, 0, 0, 0)) : undefined;
  const minDateString = minDate ? formatDateForInput(minDate) : "";

  // Conversão da string do input para Date e atualização do DateRange
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    if (!dateStr) {
      onChange(undefined)
      return
    }
    
    const startDate = parseDate(dateStr)
    if (!startDate) return
    
    const newRange: DateRange = { from: startDate }
    if (value?.to) {
      // Se a data final for anterior à nova data inicial, remova-a
      if (value.to < startDate) {
        onChange({ from: startDate })
        return
      }
      newRange.to = value.to
    }
    
    onChange(newRange)
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateStr = e.target.value
    if (!dateStr || !value?.from) {
      return
    }
    
    const endDate = parseDate(dateStr)
    if (!endDate) return
    
    onChange({ from: value.from, to: endDate })
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Input
            type="date"
            placeholder="DD/MM/YYYY"
            value={value?.from ? formatDateForInput(value.from) : ""}
            onChange={handleStartDateChange}
            min={minDateString}
            className={className}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Input
            type="date"
            placeholder="DD/MM/YYYY"
            value={value?.to ? formatDateForInput(value.to) : ""}
            onChange={handleEndDateChange}
            min={value?.from ? formatDateForInput(value.from) : minDateString}
            className={className}
            disabled={!value?.from || disabled}
          />
        </div>
      </div>
    </div>
  )
} 