'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { currencies } from '@mreduar/iso-4217-currencies'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const currencyList = Object.values(currencies) as {
  code: string
  name: string
}[]

export function CurrencyCombobox({ value, onChange }: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || 'Select currency'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {currencyList.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.code} ${currency.name}`}
                  onSelect={() => {
                    onChange(currency.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4',
                      value === currency.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {currency.code}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}