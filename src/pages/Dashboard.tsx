import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import { FilePlus, RefreshCw, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { invoiceApi } from '../services/api';

interface Invoice {
  id: number;
  tipo: string;
  punto_venta: number;
  numero: number;
  fecha: string;
  cae: string;
  importe_total: string;
  importe_neto: string;
  importe_iva: string;
  doc_nro?: number;
  doc_tipo?: number;
  fecha_creacion?: string;
}

interface DashboardSummary {
  totalInvoicesThisMonth: number;
  totalAmountThisMonth: number;
  invoicesByType: {
    A: number;
    B: number;
    C: number;
  };
}

const Dashboard = () => {
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalInvoicesThisMonth: 0,
    totalAmountThisMonth: 0,
    invoicesByType: { A: 0, B: 0, C: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch recent invoices
        const response = await invoiceApi.getInvoices(1, 5);
        
        if (response.success && response.data) {
          setRecentInvoices(response.data);
          
          // Calculate summary data from the response
          const typeACounts = response.data.filter((inv: Invoice) => inv.tipo === 'A').length;
          const typeBCounts = response.data.filter((inv: Invoice) => inv.tipo === 'B').length;
          const typeCCounts = response.data.filter((inv: Invoice) => inv.tipo === 'C').length;
          
          const totalAmount = response.data.reduce(
            (sum: number, inv: Invoice) => sum + Number(inv.importe_total), 
            0
          );
          
          setSummary({
            totalInvoicesThisMonth: response.pagination?.totalItems || 0,
            totalAmountThisMonth: totalAmount,
            invoicesByType: {
              A: typeACounts,
              B: typeBCounts,
              C: typeCCounts
            }
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('No se pudo conectar con el servidor. Por favor, verifique que el servidor API esté en funcionamiento.');
        // Set empty state for data
        setRecentInvoices([]);
        setSummary({
          totalInvoicesThisMonth: 0,
          totalAmountThisMonth: 0,
          invoicesByType: { A: 0, B: 0, C: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Define the Column type to match the Table component's expectations
  type Column<T> = {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Tipo',
      accessor: (invoice: Invoice) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {invoice.tipo}
        </span>
      ),
    },
    {
      header: 'Número',
      accessor: (invoice: Invoice) => `${invoice.punto_venta}-${invoice.numero}`,
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
      header: 'Importe',
      accessor: (invoice: Invoice) => (
        <span className="font-medium">
          ${Number(invoice.importe_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    });
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 p-4 text-red-800 bg-red-50 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white hover:bg-blue-700"
          leftIcon={<RefreshCw size={16} />}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen de facturación y actividad reciente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Facturas (mes actual)</h3>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {isLoading ? '...' : summary.totalInvoicesThisMonth}
              </p>
            </div>
          </div>
        </Card>

        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-start">
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Facturado (mes actual)</h3>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {isLoading ? '...' : formatCurrency(summary.totalAmountThisMonth)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="transform transition-transform hover:scale-105">
          <div className="flex items-start">
            <div className="bg-yellow-100 p-3 rounded-full">
              <FilePlus className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Facturas por tipo</h3>
              <div className="mt-1">
                <div className="flex items-center">
                  <span className="text-xs font-medium mr-2">A:</span>
                  <span className="text-sm font-semibold">{isLoading ? '...' : summary.invoicesByType.A}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-medium mr-2">B:</span>
                  <span className="text-sm font-semibold">{isLoading ? '...' : summary.invoicesByType.B}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-medium mr-2">C:</span>
                  <span className="text-sm font-semibold">{isLoading ? '...' : summary.invoicesByType.C}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="text-center">
            <h3 className="text-lg font-medium">Acciones rápidas</h3>
            <div className="mt-4 space-y-2">
              <Link to="/create-invoice">
                <Button
                  variant="outline"
                  leftIcon={<FilePlus size={16} />}
                  className="bg-white text-blue-600 hover:bg-blue-50 w-full justify-center"
                >
                  Nueva Factura
                </Button>
              </Link>
              <Link to="/create-credit-note">
                <Button
                  variant="outline"
                  leftIcon={<RefreshCw size={16} />}
                  className="bg-white text-blue-600 hover:bg-blue-50 w-full justify-center"
                >
                  Nueva Nota de Crédito
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <Card
          title="Facturas recientes"
          footer={
            <div className="flex justify-end">
              <Link to="/invoices">
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
          }
        >
          <Table
            columns={columns}
            data={recentInvoices}
            keyExtractor={(invoice) => invoice.id}
            isLoading={isLoading}
            emptyMessage={error ? 'Error al cargar las facturas' : 'No hay facturas recientes'}
            onRowClick={(invoice) => 
              window.location.href = `/invoices/${invoice.tipo}/${invoice.punto_venta}/${invoice.numero}`
            }
          />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;