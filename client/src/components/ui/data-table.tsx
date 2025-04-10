import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import { Search, RefreshCw, Download, Trash, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Column {
  id: string;
  header: string;
  accessorKey: string;
  cell?: (info: any) => React.ReactNode;
  meta?: {
    align?: 'right' | 'center' | 'left';
    className?: string;
  };
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  caption?: string;
  searchable?: boolean;
  selectable?: boolean;
  actions?: {
    onAdd?: () => void;
    onDelete?: (ids: number[]) => void;
    onRefresh?: () => void;
    onExport?: () => void;
  };
  totals?: Record<string, number>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable({
  data,
  columns,
  caption,
  searchable = true,
  selectable = true,
  actions,
  totals,
  isLoading = false,
  emptyMessage = "لا توجد بيانات للعرض"
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(column => {
        const value = row[column.accessorKey];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, searchQuery, columns]);
  
  // Check if all rows are selected
  const allSelected = useMemo(() => {
    return filteredData.length > 0 && selectedRows.length === filteredData.length;
  }, [filteredData, selectedRows]);
  
  // Toggle all rows selection
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(row => row.id));
    }
  };
  
  // Toggle single row selection
  const toggleRowSelection = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Actions Bar */}
      {(searchable || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap space-x-2 space-x-reverse">
            {actions?.onAdd && (
              <Button 
                className="gap-1" 
                onClick={actions.onAdd}
              >
                <Plus className="h-4 w-4" />
                جديد
              </Button>
            )}
            {actions?.onRefresh && (
              <Button 
                variant="outline" 
                className="gap-1" 
                onClick={actions.onRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </Button>
            )}
            {selectedRows.length > 0 && actions?.onDelete && (
              <Button 
                variant="destructive" 
                className="gap-1" 
                onClick={() => actions.onDelete?.(selectedRows)}
              >
                <Trash className="h-4 w-4" />
                حذف ({selectedRows.length})
              </Button>
            )}
            {actions?.onExport && (
              <Button 
                variant="outline" 
                className="gap-1" 
                onClick={actions.onExport}
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            )}
          </div>
          
          {searchable && (
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-[240px]"
              />
              {searchQuery && (
                <button 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      <div className="rounded-md border bg-white overflow-hidden">
        <Table className="custom-table">
          {caption && <TableCaption>{caption}</TableCaption>}
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={allSelected && filteredData.length > 0} 
                    indeterminate={!allSelected && selectedRows.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="تحديد الكل"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead 
                  key={column.id}
                  className={column.meta?.className}
                  style={{ textAlign: column.meta?.align || 'right' }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell 
                  colSpan={selectable ? columns.length + 1 : columns.length}
                  className="text-center h-24"
                >
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={selectable ? columns.length + 1 : columns.length}
                  className="text-center h-24"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={selectedRows.includes(row.id) ? 'selected-row' : ''}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows.includes(row.id)} 
                        onCheckedChange={() => toggleRowSelection(row.id)}
                        aria-label={`تحديد صف ${row.id}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell 
                      key={`${row.id}-${column.id}`} 
                      className={column.meta?.className}
                      style={{ textAlign: column.meta?.align || 'right' }}
                    >
                      {column.cell ? column.cell(row) : row[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            
            {/* Totals Row */}
            {totals && (
              <TableRow className="bg-gray-100 font-bold">
                {selectable && <TableCell />}
                {columns.map((column) => {
                  if (column.accessorKey in totals) {
                    return (
                      <TableCell 
                        key={`total-${column.id}`}
                        className={column.meta?.className}
                        style={{ textAlign: column.meta?.align || 'right' }}
                      >
                        {formatCurrency(totals[column.accessorKey])}
                      </TableCell>
                    );
                  }
                  
                  if (column.id === 'summary') {
                    return (
                      <TableCell 
                        key={`total-${column.id}`}
                        className={column.meta?.className}
                        style={{ textAlign: column.meta?.align || 'right' }}
                      >
                        الإجمالي
                      </TableCell>
                    );
                  }
                  
                  if (column.id === 'count') {
                    return (
                      <TableCell 
                        key={`total-${column.id}`}
                        className={column.meta?.className}
                        style={{ textAlign: column.meta?.align || 'right' }}
                      >
                        {filteredData.length} سجل
                      </TableCell>
                    );
                  }
                  
                  return <TableCell key={`total-${column.id}`} />;
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
