"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


import { cn } from "@/lib/utils"

export interface FilterConfig {
  key: string
  label: string
  options: { label: string; value: string }[]
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  filterConfigs?: FilterConfig[]
  filters?: FilterConfig[]  // Alias for filterConfigs
  activeFilters?: Record<string, string>
  isLoading?: boolean
  serverSide?: boolean
  totalItems?: number
  debounceMs?: number // New prop for debounce delay
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void // New Prop
  onSearch?: (value: string) => void
  onFilterChange?: ((key: string, value: string) => void) | ((filters: Record<string, string>) => void)
  onRowClick?: (row: TData) => void // New Prop for row clicking
}

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  filterConfigs,
  filters, // Alias for filterConfigs
  activeFilters,
  isLoading = false,
  serverSide = false,
  totalItems,
  debounceMs = 0, // Default to 0 (no debounce)
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange, // New Prop
  onSearch,
  onFilterChange,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [searchValue, setSearchValue] = React.useState("")

  // Support both filterConfigs and filters props
  const effectiveFilters = filterConfigs || filters || []

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: serverSide ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(serverSide ? {
      manualPagination: true,
      manualFiltering: true,
      pageCount: totalItems ? Math.ceil(totalItems / pageSize) : -1,
    } : {}),
  })

  // Debounce logic
  React.useEffect(() => {
    // If debounceMs is 0, we don't use this effect for triggering search
    // The handleSearch below handles immediate updates if debounceMs is 0
    if (debounceMs > 0) {
      const timeoutId = setTimeout(() => {
        if (onSearch) {
          onSearch(searchValue)
        } else if (searchKey) {
          table.getColumn(searchKey)?.setFilterValue(searchValue)
        }
      }, debounceMs)

      return () => clearTimeout(timeoutId)
    }
  }, [searchValue, debounceMs, onSearch, searchKey, table])

  const handleSearch = React.useCallback((value: string) => {
    setSearchValue(value)

    // If no debounce, trigger immediately
    if (debounceMs === 0) {
      if (onSearch) {
        onSearch(value)
      } else if (searchKey) {
        table.getColumn(searchKey)?.setFilterValue(value)
      }
    }
  }, [onSearch, searchKey, table, debounceMs])

  const handleFilterChange = React.useCallback((key: string, value: string) => {
    if (onFilterChange) {
      // Check if it's the old signature (Record<string, string>)
      if (activeFilters !== undefined) {
        const newFilters = { ...activeFilters, [key]: value }
        if (value === "all" || value === "") {
          delete newFilters[key]
        }
        ; (onFilterChange as (filters: Record<string, string>) => void)(newFilters)
      } else {
        // New signature (key, value)
        ; (onFilterChange as (key: string, value: string) => void)(key, value)
      }
    } else {
      table.getColumn(key)?.setFilterValue(value === "all" ? "" : value)
    }
  }, [onFilterChange, activeFilters, table])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => handleSearch(event.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )}
          {effectiveFilters.map((config) => (
            <DataTableFacetedFilter
              key={config.key}
              title={config.label}
              options={config.options}
              selectedValues={activeFilters?.[config.key] ? new Set([activeFilters[config.key]]) : undefined}
              onSelect={(values) => {
                // Determine the new value:
                // If the user selected a value that was already selected, it means they are deselecting it (values will NOT contain it if we follow standard logic, but here values IS the new set).
                // Wait, DataTableFacetedFilter returns the NEW set.
                // If we want single select behavior:
                // If values has multiple items, we pick the LAST one added (implied by user interaction) or just arbitrary. 
                // However, since we re-render with single selection, the 'values' set passed from FacetedFilter likely contains [old, new] or just [new].
                // Actually, FacetedFilter logic: newSelectedValues = new Set(selectedValues); if (has) delete else add.
                // So if we had 'A', and clicked 'B'. Set has {'A', 'B'}.
                // We want just 'B'.
                // If we had 'A' and clicked 'A'. Set has {}. We want "".

                // Optimized for single-select behavior if strict mode is desired:
                const currentVal = activeFilters?.[config.key]
                const newSet = Array.from(values)
                let val = ""

                if (newSet.length === 0) {
                  val = ""
                } else if (newSet.length === 1) {
                  val = newSet[0]
                } else {
                  // If multiple, pick the one that is NOT the current one (the new selection)
                  // If currentVal is in the set, find the one that isn't.
                  val = newSet.find(v => v !== currentVal) || newSet[newSet.length - 1]
                }

                handleFilterChange(config.key, val)
              }}
            />
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto h-8">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800")}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
          {serverSide && totalItems ? (
            `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} results`
          ) : (
            `${table.getFilteredRowModel().rows.length} row(s)`
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                const newSize = Number(value)
                table.setPageSize(newSize)
                if (onPageSizeChange) {
                  onPageSizeChange(newSize)
                }
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {serverSide ? currentPage : table.getState().pagination.pageIndex + 1} of{" "}
            {serverSide && totalItems
              ? Math.ceil(totalItems / pageSize)
              : table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (serverSide && onPageChange) {
                  onPageChange(1)
                } else {
                  table.setPageIndex(0)
                }
              }}
              disabled={serverSide ? currentPage === 1 : !table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              &lt;&lt;
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (serverSide && onPageChange) {
                  onPageChange(currentPage - 1)
                } else {
                  table.previousPage()
                }
              }}
              disabled={serverSide ? currentPage === 1 : !table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              &lt;
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (serverSide && onPageChange) {
                  onPageChange(currentPage + 1)
                } else {
                  table.nextPage()
                }
              }}
              disabled={
                serverSide
                  ? !totalItems || currentPage >= Math.ceil(totalItems / pageSize)
                  : !table.getCanNextPage()
              }
            >
              <span className="sr-only">Go to next page</span>
              &gt;
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (serverSide && onPageChange && totalItems) {
                  onPageChange(Math.ceil(totalItems / pageSize))
                } else {
                  table.setPageIndex(table.getPageCount() - 1)
                }
              }}
              disabled={
                serverSide
                  ? !totalItems || currentPage >= Math.ceil(totalItems / pageSize)
                  : !table.getCanNextPage()
              }
            >
              <span className="sr-only">Go to last page</span>
              &gt;&gt;
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
