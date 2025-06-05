import { useLocation, useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface AfipCreditNoteData {
  CantReg: number;
  PtoVta: number;
  CbteTipo: number;
  Concepto: number;
  DocTipo: number;
  DocNro: number;
  CbteDesde: number;
  CbteHasta: number;
  CbteFch: number;
  ImpTotal: number;
  ImpNeto: number;
  CAE: string;
  CAEFchVto: string;
  formattedDate: string;
}

interface LocationState {
  originalInvoice: {
    tipo: string;
    puntoVenta: number;
    numero: number;
    cae: string;
  };
  creditNote: {
    creditNote: AfipCreditNoteData;
    qrData: {
      qrImagePath: string;
      qrUrl: string;
    };
    htmlData: {
      htmlFilePath: string;
      message: string;
    };
    originalInvoice: {
      tipo: string;
      punto_venta: number;
      numero: number;
      cae: string;
    };
  };
}

const CreditNoteConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  console.log('Estado recibido en confirmación:', state);

  // Validación más estricta de la estructura de datos
  if (!state || 
      !state.originalInvoice || 
      !state.creditNote || 
      !state.creditNote.creditNote ||
      typeof state.creditNote.creditNote.PtoVta === 'undefined' ||
      typeof state.creditNote.creditNote.CbteDesde === 'undefined') {
    console.error('Datos inválidos:', state);
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Error</h1>
        <p className="text-gray-500 mb-4">No se encontró información de la nota de crédito</p>
        <Button
          variant="outline"
          onClick={() => navigate('/invoices')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  const creditNoteData = state.creditNote.creditNote;
  const originalInvoice = state.originalInvoice;

  // Función auxiliar para formatear números
  const formatNumber = (num: number) => {
    if (typeof num !== 'number') {
      console.error('Número inválido:', num);
      return '00000';
    }
    return num.toString().padStart(8, '0');
  };

  // Función auxiliar para formatear punto de venta
  const formatPuntoVenta = (num: number) => {
    if (typeof num !== 'number') {
      console.error('Punto de venta inválido:', num);
      return '0000';
    }
    return num.toString().padStart(4, '0');
  };

  // Función para obtener el tipo de comprobante
  const getTipoComprobante = (tipo: number) => {
    switch (tipo) {
      case 13:
        return 'NC C';
      case 12:
        return 'NC B';
      case 11:
        return 'NC A';
      default:
        return `NC ${tipo}`;
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">¡Nota de Crédito Creada!</h1>
        <p className="text-gray-500 mt-2">La nota de crédito se ha generado correctamente</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card title="Detalles de la Operación">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Factura Original</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <span className="ml-2 font-medium">Factura {originalInvoice.tipo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Número:</span>
                    <span className="ml-2 font-medium">
                      {formatPuntoVenta(originalInvoice.puntoVenta)}-{formatNumber(originalInvoice.numero)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">CAE:</span>
                    <span className="ml-2 font-medium">{originalInvoice.cae}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Nota de Crédito Generada</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <span className="ml-2 font-medium">{getTipoComprobante(creditNoteData.CbteTipo)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Número:</span>
                    <span className="ml-2 font-medium">
                      {formatPuntoVenta(creditNoteData.PtoVta)}-{formatNumber(creditNoteData.CbteDesde)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">CAE:</span>
                    <span className="ml-2 font-medium">{creditNoteData.CAE}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fecha:</span>
                    <span className="ml-2 font-medium">{creditNoteData.formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Importe:</span>
                    <span className="ml-2 font-medium">
                      ${creditNoteData.ImpTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/invoices')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Volver al listado
          </Button>
          <Link to={`/invoices/NC${originalInvoice.tipo}/${creditNoteData.PtoVta}/${creditNoteData.CbteDesde}`}>
            <Button variant="primary">
              Ver Nota de Crédito
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreditNoteConfirmation; 