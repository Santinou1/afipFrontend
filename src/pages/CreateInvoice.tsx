import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import Alert from '../components/ui/Alert';
import { invoiceApi, taxpayerApi } from '../services/api';
import { Search, FileText, CheckCircle } from 'lucide-react';

interface InvoiceFormData {
  DocTipo: number;
  DocNro: string;
  ImpNeto: string;
  ImpIVA: string;
  Concepto: number;
  PtoVta: string;
}

interface Taxpayer {
  idPersona: string;
  nombre: string;
  tipoClave: string;
  estadoClave: string;
  impuestos: { idImpuesto: number; descripcionImpuesto: string }[];
}

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('a');
  const [formData, setFormData] = useState<InvoiceFormData>({
    DocTipo: 80, // CUIT by default
    DocNro: '',
    ImpNeto: '',
    ImpIVA: '',
    Concepto: 1, // Products by default
    PtoVta: '1',
  });
  const [taxpayer, setTaxpayer] = useState<Taxpayer | null>(null);
  const [isSearchingTaxpayer, setIsSearchingTaxpayer] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when user changes a field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const searchTaxpayer = async () => {
    if (!formData.DocNro) {
      setValidationErrors(prev => ({ ...prev, DocNro: 'Debe ingresar un número de documento' }));
      return;
    }

    try {
      setIsSearchingTaxpayer(true);
      setErrorMessage(null);
      
      const response = await taxpayerApi.getTaxpayer(formData.DocNro);
      
      if (response.success) {
        setTaxpayer(response.data);
      } else {
        setErrorMessage('No se encontró el contribuyente');
        setTaxpayer(null);
      }
    } catch (error) {
      console.error('Error searching taxpayer:', error);
      setErrorMessage('Error al buscar el contribuyente');
      setTaxpayer(null);
    } finally {
      setIsSearchingTaxpayer(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.DocNro) errors.DocNro = 'El número de documento es requerido';
    if (!formData.ImpNeto) errors.ImpNeto = 'El importe neto es requerido';
    
    // For Factura A and B, IVA is required
    if (activeTab !== 'c' && !formData.ImpIVA) {
      errors.ImpIVA = 'El importe de IVA es requerido';
    }
    
    if (!formData.PtoVta) errors.PtoVta = 'El punto de venta es requerido';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsCreatingInvoice(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Convert string values to numbers for the API
      const apiData = {
        ...formData,
        DocNro: Number(formData.DocNro),
        ImpNeto: Number(formData.ImpNeto),
        ImpIVA: activeTab === 'c' ? 0 : Number(formData.ImpIVA),
        PtoVta: Number(formData.PtoVta),
      };
      
      let response;
      
      switch (activeTab) {
        case 'a':
          response = await invoiceApi.createInvoiceA(apiData);
          break;
        case 'b':
          response = await invoiceApi.createInvoiceB(apiData);
          break;
        case 'c':
          response = await invoiceApi.createInvoiceC(apiData);
          break;
        default:
          throw new Error('Tipo de factura no válido');
      }
      
      if (response.success) {
        setSuccessMessage(`Factura ${activeTab.toUpperCase()} generada correctamente`);
        
        // Reset form
        setFormData({
          DocTipo: 80,
          DocNro: '',
          ImpNeto: '',
          ImpIVA: '',
          Concepto: 1,
          PtoVta: '1',
        });
        setTaxpayer(null);
        
        // Navigate to invoice details
        setTimeout(() => {
          const invoiceData = response.data.invoice;
          navigate(`/invoices/${activeTab.toUpperCase()}/${invoiceData.PtoVta}/${invoiceData.CbteDesde}`);
        }, 1500);
      } else {
        setErrorMessage('Error al generar la factura');
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setErrorMessage(error.message || 'Error al generar la factura');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const renderInvoiceForm = (type: string) => {
    const isTypeC = type === 'c';
    
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Card title="Datos del Cliente">
              <div className="space-y-4">
                <Select
                  label="Tipo de Documento"
                  name="DocTipo"
                  value={formData.DocTipo.toString()}
                  onChange={handleInputChange}
                  options={[
                    { value: '80', label: 'CUIT' },
                    { value: '96', label: 'DNI' },
                    { value: '99', label: 'Consumidor Final' },
                  ]}
                  error={validationErrors.DocTipo}
                />
                
                <div className="flex space-x-2">
                  <FormInput
                    label="Número de Documento"
                    name="DocNro"
                    type="text"
                    value={formData.DocNro}
                    onChange={handleInputChange}
                    placeholder="Ej: 20301234567"
                    error={validationErrors.DocNro}
                    className="flex-1"
                  />
                  
                  <div className="self-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={searchTaxpayer}
                      isLoading={isSearchingTaxpayer}
                      leftIcon={<Search size={16} />}
                    >
                      Buscar
                    </Button>
                  </div>
                </div>
                
                {taxpayer && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                      <div>
                        <p className="font-medium text-green-800">{taxpayer.nombre}</p>
                        <p className="text-sm text-green-700">{taxpayer.tipoClave}: {taxpayer.idPersona}</p>
                        <p className="text-sm text-green-700">Estado: {taxpayer.estadoClave}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div>
            <Card title="Datos de la Factura">
              <div className="space-y-4">
                <FormInput
                  label="Punto de Venta"
                  name="PtoVta"
                  type="number"
                  value={formData.PtoVta}
                  onChange={handleInputChange}
                  placeholder="Ej: 1"
                  error={validationErrors.PtoVta}
                />
                
                <Select
                  label="Concepto"
                  name="Concepto"
                  value={formData.Concepto.toString()}
                  onChange={handleInputChange}
                  options={[
                    { value: '1', label: 'Productos' },
                    { value: '2', label: 'Servicios' },
                    { value: '3', label: 'Productos y Servicios' },
                  ]}
                  error={validationErrors.Concepto}
                />
                
                <FormInput
                  label="Importe Neto"
                  name="ImpNeto"
                  type="number"
                  step="0.01"
                  value={formData.ImpNeto}
                  onChange={handleInputChange}
                  placeholder="Ej: 1000.00"
                  error={validationErrors.ImpNeto}
                />
                
                {!isTypeC && (
                  <FormInput
                    label="Importe IVA"
                    name="ImpIVA"
                    type="number"
                    step="0.01"
                    value={formData.ImpIVA}
                    onChange={handleInputChange}
                    placeholder="Ej: 210.00"
                    error={validationErrors.ImpIVA}
                  />
                )}
                
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-2">Importe Total:</p>
                  <p className="text-xl font-semibold">
                    $
                    {(
                      parseFloat(formData.ImpNeto || '0') +
                      (isTypeC ? 0 : parseFloat(formData.ImpIVA || '0'))
                    ).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {successMessage && (
          <Alert
            type="success"
            message={successMessage}
            className="mb-4"
          />
        )}
        
        {errorMessage && (
          <Alert
            type="error"
            message={errorMessage}
            className="mb-4"
          />
        )}
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isCreatingInvoice}
            leftIcon={<FileText size={16} />}
          >
            Generar Factura {type.toUpperCase()}
          </Button>
        </div>
      </form>
    );
  };

  const tabs = [
    {
      id: 'a',
      label: 'Factura A',
      content: renderInvoiceForm('a'),
    },
    {
      id: 'b',
      label: 'Factura B',
      content: renderInvoiceForm('b'),
    },
    {
      id: 'c',
      label: 'Factura C',
      content: renderInvoiceForm('c'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Crear Factura</h1>
        <p className="mt-1 text-sm text-gray-500">Complete los datos para generar una nueva factura</p>
      </div>

      <Tabs
        tabs={tabs}
        defaultTabId="a"
        onChange={setActiveTab}
        variant="pills"
      />
    </div>
  );
};

export default CreateInvoice;