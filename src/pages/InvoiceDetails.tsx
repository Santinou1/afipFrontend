import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { invoiceApi, creditNoteApi } from '../services/api';
import { Download, RefreshCw, ArrowLeft, Printer } from 'lucide-react';

interface InvoiceDetail {
  id: number;
  tipo: string;
  punto_venta: number;
  numero: number;
  fecha: string;
  cae: string;
  cae_vencimiento: string;
  importe_total: number;
  importe_neto: number;
  importe_iva: number;
  doc_tipo: number;
  doc_nro: number;
  datos_completos: {
    CAE: string;
    CAEFchVto: string;
    CbteDesde: number;
    CbteHasta: number;
    CbteFch: number;
    PtoVta: number;
  };
  qr_image_path: string;
  qr_url: string;
  pdf_path: string;
  pdf_message: string;
  fecha_creacion: string;
}

const InvoiceDetails = () => {
  const { type, puntoVenta, numero } = useParams<{ type: string; puntoVenta: string; numero: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingCreditNote, setIsCreatingCreditNote] = useState(false);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!type || !puntoVenta || !numero) {
        setError('Información de factura incompleta');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await invoiceApi.getInvoiceDetails(type, parseInt(puntoVenta), parseInt(numero));
        
        console.log('Respuesta de detalles de factura:', response);
        
        if (response.success) {
          setInvoice(response.data);
          // Verificar que el CAE esté presente
          if (!response.data.cae && !response.data.datos_completos?.CAE) {
            console.error('La factura no tiene CAE:', response.data);
            setError('La factura no tiene un CAE válido');
          }
        } else {
          setError('No se pudo cargar los detalles de la factura');
        }
      } catch (error) {
        console.error('Error fetching invoice details:', error);
        setError('Error al cargar los detalles de la factura');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [type, puntoVenta, numero]);

  const formatDocumentType = (docType: number) => {
    switch (docType) {
      case 80: return 'CUIT';
      case 96: return 'DNI';
      case 99: return 'Consumidor Final';
      default: return `Tipo ${docType}`;
    }
  };
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };
  
  const handleDownloadPdf = () => {
    if (invoice) {
      window.open(`/api/db/invoices/${invoice.tipo}/${invoice.punto_venta}/${invoice.numero}/pdf`, '_blank');
    }
  };
  
  const handlePrint = () => {
    if (invoice) {
      window.open(`/api/db/invoices/${invoice.tipo}/${invoice.punto_venta}/${invoice.numero}/print`, '_blank');
    }
  };
  
  const handleCreateCreditNote = async () => {
    if (!invoice || !invoice.cae) return;

    try {
      setIsCreatingCreditNote(true);
      console.log('Creando nota de crédito con CAE:', invoice.cae);
      
      const response = await creditNoteApi.createCreditNoteFromCae(invoice.cae);
      console.log('Respuesta de creación de nota de crédito:', response);

      if (response.success) {
        // Redirigir a una página de confirmación con los detalles
        navigate('/credit-note-confirmation', {
          state: {
            originalInvoice: {
              tipo: invoice.tipo,
              puntoVenta: invoice.punto_venta,
              numero: invoice.numero,
              cae: invoice.cae
            },
            creditNote: response.data // Pasamos toda la respuesta que incluye creditNote, qrData, etc.
          }
        });
      } else {
        setError(response.message || 'Error al crear la nota de crédito');
      }
    } catch (error) {
      console.error('Error al crear nota de crédito:', error);
      setError('Error al crear la nota de crédito');
    } finally {
      setIsCreatingCreditNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Alert
          type="error"
          title="Error"
          message={error}
        />
        <div className="mt-4">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/invoices')}
          >
            Volver al listado
          </Button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const isInvoice = !invoice.tipo.startsWith('NC');
  const documentTitle = isInvoice 
    ? `Factura ${invoice.tipo}` 
    : `Nota de Crédito ${invoice.tipo.substring(3)}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/invoices" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ArrowLeft size={16} className="mr-1" /> Volver al listado
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">{documentTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {`${invoice.punto_venta.toString().padStart(5, '0')}-${invoice.numero.toString().padStart(8, '0')}`}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={handleDownloadPdf}
          >
            Descargar PDF
          </Button>
          
          <Button
            variant="outline"
            leftIcon={<Printer size={16} />}
            onClick={handlePrint}
          >
            Imprimir
          </Button>
          
          {isInvoice && (
            <Button
              variant="primary"
              leftIcon={<RefreshCw size={16} />}
              onClick={handleCreateCreditNote}
              isLoading={isCreatingCreditNote}
              disabled={isCreatingCreditNote}
            >
              {isCreatingCreditNote ? 'Creando nota de crédito...' : 'Crear Nota de Crédito'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="Información del Comprobante">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo:</span>
              <span className="font-medium">{documentTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Número:</span>
              <span className="font-medium">{`${invoice.punto_venta.toString().padStart(5, '0')}-${invoice.numero.toString().padStart(8, '0')}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha de emisión:</span>
              <span className="font-medium">{formatDate(invoice.fecha)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CAE:</span>
              <span className="font-medium">{invoice.cae}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vencimiento CAE:</span>
              <span className="font-medium">{formatDate(invoice.cae_vencimiento)}</span>
            </div>
          </div>
        </Card>

        <Card title="Información del Cliente">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo de documento:</span>
              <span className="font-medium">{formatDocumentType(invoice.doc_tipo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Número de documento:</span>
              <span className="font-medium">{invoice.doc_nro}</span>
            </div>
          </div>
        </Card>

        <Card title="Importes">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Neto:</span>
              <span className="font-medium">{formatCurrency(invoice.importe_neto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IVA:</span>
              <span className="font-medium">{formatCurrency(invoice.importe_iva || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-700 font-medium">Total:</span>
              <span className="text-lg font-semibold">{formatCurrency(invoice.importe_total)}</span>
            </div>
          </div>
        </Card>
      </div>

      {invoice.qr_url && (
        <Card title="Código QR">
          <div className="flex flex-col items-center">
            <img 
              src={`/api/db/invoices/${invoice.tipo}/${invoice.punto_venta}/${invoice.numero}/qr`} 
              alt="QR Code" 
              className="h-48 w-48 mb-2"
            />
            <a 
              href={invoice.qr_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Verificar en AFIP
            </a>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetails;