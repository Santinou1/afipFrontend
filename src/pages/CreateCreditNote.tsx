import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Select from '../components/ui/Select';
import Tabs from '../components/ui/Tabs';
import Alert from '../components/ui/Alert';
import { invoiceApi, creditNoteApi, taxpayerApi } from '../services/api';
import { Search, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface CreditNoteFormData {
  DocTipo: number;
  DocNro: string;
  ImpNeto: string;
  ImpIVA: string;
  Concepto: number;
  PtoVta: string;
  CbtesAsoc: {
    Tipo: number;
    PtoVta: number;
    Nro: number;
  }[];
}

interface Taxpayer {
  idPersona: string;
  nombre: string;
  tipoClave: string;
  estadoClave: string;
}

interface InvoiceDetail {
  tipo: string;
  punto_venta: number;
  numero: number;
  importe_neto: number;
  importe_iva: number;
  importe_total: number;
  doc_tipo: number;
  doc_nro: number;
}

const CreateCreditNote = () => {
  const { cae } = useParams<{ cae: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('a');
  const [formData, setFormData] = useState<CreditNoteFormData>({
    DocTipo: 80,
    DocNro: '',
    ImpNeto: '',
    ImpIVA: '',
    Concepto: 1,
    PtoVta: '1',
    CbtesAsoc: [],
  });
  const [taxpayer, setTaxpayer] = useState<Taxpayer | null>(null);
  const [originalInvoice, setOriginalInvoice] = useState<InvoiceDetail | null>(null);
  const [isSearchingTaxpayer, setIsSearchingTaxpayer] = useState(false);
  const [isCreatingCreditNote, setIsCreatingCreditNote] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load original invoice data if CAE is provided
  useEffect(() => {
    const fetchInvoiceFromCae = async () => {
      if (!cae) return;
      
      try {
        setIsLoadingInvoice(true);
        
        // This is a mock call since the API doesn't specify an endpoint to get an invoice by CAE
        // In a real implementation, you would call the appropriate endpoint
        // For now, we'll simulate the response
        
        // Simulated response - in a real app, replace with actual API call
        const invoiceTypes = ['A', 'B', 'C'];
        let foundInvoice = null;
        
        for (const type of invoiceTypes) {
          try {
            // Try to fetch invoices and find the one with matching CAE
            const response = await invoiceApi.getInvoices(1, 100, { tipo: type });
            
            if (response.success) {
              const invoice = response.data.invoices.find((inv: any) => inv.cae === cae);
              if (invoice) {
                foundInvoice = invoice;
                break;
              }
            }
          } catch (error) {
            console.error(`Error searching for invoice of type ${type}:`, error);
          }
        }
        
        if (foundInvoice) {
          setActiveTab(foundInvoice.tipo.toLowerCase());
          setOriginalInvoice(foundInvoice);
          
          // Set form data from invoice
          setFormData({
            DocTipo: foundInvoice.doc_tipo,
            DocNro: foundInvoice.doc_nro.toString(),
            ImpNeto: foundInvoice.importe_neto.toString(),
            ImpIVA: (foundInvoice.importe_iva || 0).toString(),
            Concepto: 1, // Default to Products
            PtoVta: foundInvoice.punto_venta.toString(),
            CbtesAsoc: [
              {
                Tipo: getInvoiceTypeCode(foundInvoice.tipo),
                PtoVta: foundInvoice.punto_venta,
                Nro: foundInvoice.numero,
              },
            ],
          });
          
          // Fetch taxpayer info
          if (foundInvoice.doc_nro) {
            try {
              const taxpayerResponse = await taxpayerApi.getTaxpayer(foundInvoice.doc_nro.toString());
              if (taxpayerResponse.success) {
                setTaxpayer(taxpayerResponse.data);
              }
            } catch (error) {
              console.error('Error fetching taxpayer:', error);
            }
          }
        } else {
          setErrorMessage('No se encontró la factura original con el CAE proporcionado');
        }
      } catch (error) {
        console.error('Error loading invoice from CAE:', error);
        setErrorMessage('Error al cargar los datos de la factura original');
      } finally {
        setIsLoadingInvoice(false);
      }
    };
    
    fetchInvoiceFromCae();
  }, [cae]);

  const getInvoiceTypeCode = (type: string) => {
    // Map invoice type to code according to AFIP
    const typeMap: Record<string, number> = {
      'A': 1,
      'B': 6,
      'C': 11,
    };
    
    return typeMap[type] || 1;
  };

  const getCreditNoteTypeCode = (type: string) => {
    // Map credit note type to code according to AFIP
    const typeMap: Record<string, number> = {
      'A': 3,
      'B': 8,
      'C': 13,
    };
    
    return typeMap[type] || 3;
  };

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
    
    // For Credit Note A and B, IVA is required
    if (activeTab !== 'c' && !formData.ImpIVA) {
      errors.ImpIVA = 'El importe de IVA es requerido';
    }
    
    if (!formData.PtoVta) errors.PtoVta = 'El punto de venta es requerido';
    
    // Validate associated invoices
    if (formData.CbtesAsoc.length === 0) {
      errors.CbtesAsoc = 'Debe asociar al menos una factura';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cae) {
      // If CAE is provided, use the simplified endpoint
      createCreditNoteFromCae();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsCreatingCreditNote(true);
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
          response = await creditNoteApi.createCreditNoteA(apiData);
          break;
        case 'b':
          response = await creditNoteApi.createCreditNoteB(apiData);
          break;
        case 'c':
          response = await creditNoteApi.createCreditNoteC(apiData);
          break;
        default:
          throw new Error('Tipo de nota de crédito no válido');
      }
      
      if (response.success) {
        setSuccessMessage(`Nota de Crédito ${activeTab.toUpperCase()} generada correctamente`);
        
        // Reset form
        setFormData({
          DocTipo: 80,
          DocNro: '',
          ImpNeto: '',
          ImpIVA: '',
          Concepto: 1,
          PtoVta: '1',
          CbtesAsoc: [],
        });
        setTaxpayer(null);
        
        // Navigate to credit note details
        setTimeout(() => {
          const creditNoteData = response.data.creditNote;
          navigate(`/invoices/NC-${activeTab.toUpperCase()}/${creditNoteData.PtoVta}/${creditNoteData.CbteDesde}`);
        }, 1500);
      } else {
        setErrorMessage('Error al generar la nota de crédito');
      }
    } catch (error: any) {
      console.error('Error creating credit note:', error);
      setErrorMessage(error.message || 'Error al generar la nota de crédito');
    } finally {
      setIsCreatingCreditNote(false);
    }
  };

  const createCreditNoteFromCae = async () => {
    if (!cae) {
      setErrorMessage('No se proporcionó un CAE válido');
      return;
    }
    
    try {
      setIsCreatingCreditNote(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Create data object with optional updated amounts
      const data = {
        ImpNeto: formData.ImpNeto ? Number(formData.ImpNeto) : undefined,
        ImpIVA: formData.ImpIVA ? Number(formData.ImpIVA) : undefined,
      };
      
      const response = await creditNoteApi.createCreditNoteFromCae(cae, data);
      
      if (response.success) {
        setSuccessMessage(response.message || 'Nota de Crédito generada correctamente');
        
        // Navigate to credit note details
        setTimeout(() => {
          const creditNoteData = response.data.creditNote;
          const originalInvoice = response.data.originalInvoice;
          navigate(`/invoices/NC-${originalInvoice.tipo}/${creditNoteData.PtoVta}/${creditNoteData.CbteDesde}`);
        }, 1500);
      } else {
        setErrorMessage('Error al generar la nota de crédito');
      }
    } catch (error: any) {
      console.error('Error creating credit note from CAE:', error);
      setErrorMessage(error.message || 'Error al generar la nota de crédito');
    } finally {
      setIsCreatingCreditNote(false);
    }
  };

  const renderCreditNoteForm = (type: string) => {
    const isTypeC = type === 'c';
    const isCaeMode = !!cae;
    
    return (
      <form onSubmit={handleSubmit}>
        {isCaeMode && (
          <Alert
            type="info"
            title="Modo Nota de Crédito Automática"
            message="Está generando una nota de crédito a partir de una factura existente. Los datos se cargarán automáticamente."
            className="mb-6"
          />
        )}
        
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
                  disabled={isCaeMode}
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
                    disabled={isCaeMode}
                    error={validationErrors.DocNro}
                    className="flex-1"
                  />
                  
                  {!isCaeMode && (
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
                  )}
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
            
            {!isCaeMode && (
              <Card title="Comprobantes Asociados" className="mt-4">
                <div className="space-y-4">
                  {formData.CbtesAsoc.length > 0 ? (
                    <div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-medium">Facturas asociadas:</p>
                        <ul className="mt-2 space-y-2">
                          {formData.CbtesAsoc.map((cbte, index) => (
                            <li key={index} className="flex justify-between items-center">
                              <span>
                                Factura {getInvoiceTypeFromCode(cbte.Tipo)} {cbte.PtoVta}-{cbte.Nro}
                              </span>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    CbtesAsoc: prev.CbtesAsoc.filter((_, i) => i !== index),
                                  }));
                                }}
                              >
                                Quitar
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                        <div>
                          <p className="font-medium text-yellow-800">No hay facturas asociadas</p>
                          <p className="text-sm text-yellow-700">Debe asociar al menos una factura para generar la nota de crédito</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
          
          <div>
            <Card title="Datos de la Nota de Crédito">
              <div className="space-y-4">
                <FormInput
                  label="Punto de Venta"
                  name="PtoVta"
                  type="number"
                  value={formData.PtoVta}
                  onChange={handleInputChange}
                  placeholder="Ej: 1"
                  disabled={isCaeMode}
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
                  disabled={isCaeMode}
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
            
            {originalInvoice && (
              <Card title="Factura Original" className="mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-medium">Factura {originalInvoice.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Número:</span>
                    <span className="font-medium">{originalInvoice.punto_venta}-{originalInvoice.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Importe Total:</span>
                    <span className="font-medium">
                      ${originalInvoice.importe_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </Card>
            )}
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
            isLoading={isCreatingCreditNote || isLoadingInvoice}
            leftIcon={<FileText size={16} />}
          >
            {isCaeMode ? 'Generar Nota de Crédito Automática' : `Generar Nota de Crédito ${type.toUpperCase()}`}
          </Button>
        </div>
      </form>
    );
  };
  
  const getInvoiceTypeFromCode = (typeCode: number) => {
    // Map invoice type code to letter according to AFIP
    const typeMap: Record<number, string> = {
      1: 'A',
      6: 'B',
      11: 'C',
    };
    
    return typeMap[typeCode] || '?';
  };

  const tabs = [
    {
      id: 'a',
      label: 'Nota de Crédito A',
      content: renderCreditNoteForm('a'),
    },
    {
      id: 'b',
      label: 'Nota de Crédito B',
      content: renderCreditNoteForm('b'),
    },
    {
      id: 'c',
      label: 'Nota de Crédito C',
      content: renderCreditNoteForm('c'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {cae ? 'Crear Nota de Crédito Automática' : 'Crear Nota de Crédito'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Complete los datos para generar una nueva nota de crédito</p>
      </div>

      {isLoadingInvoice ? (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <Tabs
          tabs={tabs}
          defaultTabId="a"
          onChange={setActiveTab}
          variant="pills"
        />
      )}
    </div>
  );
};

export default CreateCreditNote;