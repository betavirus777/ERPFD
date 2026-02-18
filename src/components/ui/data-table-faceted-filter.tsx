import * as React from "react"
import { Check, PlusCircle } from "lucide-react"
import { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    title?: string
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
    selectedValues?: Set<string>
    onSelect?: (values: Set<string>) => void
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
    selectedValues: externalSelectedValues,
    onSelect,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const facets = column?.getFacetedUniqueValues()
    const selectedValues = externalSelectedValues || new Set(column?.getFilterValue() as string[] || [])
    const [searchQuery, setSearchQuery] = React.useState("")

    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options
        return options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [options, searchQuery])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed"
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator orientation="vertical" className="mx-2 h-4" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) => selectedValues.has(option.value))
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
                <div className="space-y-2">
                    <div className="relative">
                        <Input
                            placeholder={title}
                            className="h-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="max-h-[300px] overflow-auto mt-2 space-y-1">
                    {filteredOptions.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">No results found</div>
                    ) : (
                        filteredOptions.map((option) => {
                            const isSelected = selectedValues.has(option.value)
                            return (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                                        isSelected && "bg-slate-100 dark:bg-slate-800"
                                    )}
                                    onClick={() => {
                                        const newSelectedValues = new Set(selectedValues)
                                        if (isSelected) {
                                            newSelectedValues.delete(option.value)
                                        } else {
                                            newSelectedValues.add(option.value)
                                        }

                                        if (onSelect) {
                                            onSelect(newSelectedValues)
                                        } else {
                                            const filterValues = Array.from(newSelectedValues)
                                            column?.setFilterValue(
                                                filterValues.length ? filterValues : undefined
                                            )
                                        }
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary pointer-events-none",
                                            isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50"
                                        )}
                                    >
                                        <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                    </div>
                                    {option.icon && (
                                        <option.icon className="mr-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    )}
                                    <span className="truncate">{option.label}</span>
                                    {facets?.get(option.value) && (
                                        <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs text-gray-500">
                                            {facets.get(option.value)}
                                        </span>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
                {selectedValues.size > 0 && (
                    <>
                        <Separator className="my-2" />
                        <div
                            onClick={() => {
                                if (onSelect) {
                                    onSelect(new Set())
                                } else {
                                    column?.setFilterValue(undefined)
                                }
                            }}
                            className="flex items-center justify-center text-sm font-medium py-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm"
                        >
                            Clear filters
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}
