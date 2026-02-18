import * as React from "react"
import { Check, ChevronsUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface SearchableSelectOption {
    value: string
    label: string
}

interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyMessage = "No results found.",
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options
        return options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [options, searchQuery])

    const selectedOption = options.find((option) => option.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", className)}
                    disabled={disabled}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-2" align="start">
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>
                    <div className="max-h-[300px] overflow-auto mt-2 space-y-1">
                        {filteredOptions.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-4">{emptyMessage}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                                        value === option.value && "bg-slate-100 dark:bg-slate-800"
                                    )}
                                    onClick={() => {
                                        onChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                        setSearchQuery("")
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
