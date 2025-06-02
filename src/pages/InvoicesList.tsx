import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Pagination from '../components/ui/Pagination';
import FormInput from '../components/ui/FormInput';
import Select from '../components/ui/Select';
import { invoiceApi } from '../services/api';
import { Search, Download, RefreshCw } from 'lucide-react';

interface Invoice {
  id: number;
  tipo: string;
  punto_venta: number;
  numero: number;
  fecha: string;
  cae: string;
  importe_total: number;
  importe_neto: number;
  importe_iva: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const InvoicesList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    puntoVenta: ''
  });

  const fetchInvoices = async (page = 1, limit = 10, filters = {}) => {
    try {
      setIsLoading(true);
      const response = await invoiceApi.getInvoices(page, limit, filters);
      
      if (response.success) {
        setInvoices(response.data.invoices);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Use default values if pagination properties are undefined
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    fetchInvoices(page, limit, filters);
  }, [pagination?.page, pagination?.limit]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInvoices(1, pagination?.limit || 10, filters);
  };

  const resetFilters = () => {
    setFilters({
      tipo: '',
      puntoVenta: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInvoices(1, pagination?.limit || 10, {});
  };

  const handleRowClick = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.tipo}/${invoice.punto_venta}/${invoice.numero}`);
  };

  // Define the Column type to match the Table component's expectations
  type Column<T> = {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Tipo',
      accessor: (invoice: Invoice) => {
        const colors: Record<string, string> = {
          'A': 'bg-blue-100 text-blue-800',
          'B': 'bg-green-100 text-green-800',
          'C': 'bg-yellow-100 text-yellow-800',
          'NC-A': 'bg-purple-100 text-purple-800',
          'NC-B': 'bg-indigo-100 text-indigo-800',
          'NC-C': 'bg-pink-100 text-pink-800'
        };
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[invoice.tipo] || 'bg-gray-100 text-gray-800'}`}>
            {invoice.tipo}
          </span>
        );
      },
    },
    {
      header: 'Número',
      accessor: (invoice: Invoice) => `${invoice.punto_venta.toString().padStart(5, '0')}-${invoice.numero.toString().padStart(8, '0')}`,
    },
    {
      header: 'Fecha',
      accessor: 'fecha' as keyof Invoice,
    },
    {
      header: 'CAE',
      accessor: 'cae' as keyof Invoice,
    },
    {
      header: 'Importe Neto',
      accessor: (invoice: Invoice) => (
        <span>
          ${invoice.importe_neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'IVA',
      accessor: (invoice: Invoice) => (
        <span>
          ${(invoice.importe_iva || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Total',
      accessor: (invoice: Invoice) => (
        <span className="font-medium">
          ${invoice.importe_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (invoice: Invoice) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              // Handle download
              window.open(`/api/db/invoices/${invoice.tipo}/${invoice.punto_venta}/${invoice.numero}/pdf`, '_blank');
            }}
          >
            PDF
          </Button>
          {!invoice.tipo.startsWith('NC') && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/create-credit-note/${invoice.cae}`);
              }}
            >
              NC
            </Button>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  const invoiceTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'A', label: 'Factura A' },
    { value: 'B', label: 'Factura B' },
    { value: 'C', label: 'Factura C' },
    { value: 'NC-A', label: 'Nota de Crédito A' },
    { value: 'NC-B', label: 'Nota de Crédito B' },
    { value: 'NC-C', label: 'Nota de Crédito C' }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Listado de Facturas</h1>
        <p className="mt-1 text-sm text-gray-500">Consulta y gestiona todas las facturas emitidas</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo de Comprobante"
            name="tipo"
            value={filters.tipo}
            onChange={handleFilterChange}
            options={invoiceTypeOptions}
          />
          
          <FormInput
            label="Punto de Venta"
            name="puntoVenta"
            type="number"
            placeholder="Ej: 1"
            value={filters.puntoVenta}
            onChange={handleFilterChange}
          />
          
          <div className="flex items-end space-x-2">
            <Button
              variant="primary"
              onClick={applyFilters}
              leftIcon={<Search size={16} />}
              className="mb-0"
            >
              Buscar
            </Button>
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={invoices}
          keyExtractor={(invoice) => invoice.id}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage="No se encontraron facturas con los filtros aplicados"
        />
        
        <div className="mt-4">
          <Pagination
            currentPage={pagination?.page || 1}
            totalPages={pagination?.pages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      </Card>
    </div>
  );
};

export default InvoicesList;