import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Alert from '../components/ui/Alert';
import { taxpayerApi } from '../services/api';
import { Search, RefreshCw } from 'lucide-react';

interface Taxpayer {
  idPersona: string;
  nombre: string;
  tipoPersona: string;
  tipoClave: string;
  estadoClave: string;
  direccion?: string;
  localidad?: string;
  codPostal?: string;
  provincia?: string;
  impuestos?: { 
    idImpuesto: number; 
    descripcionImpuesto: string;
  }[];
  actividades?: {
    idActividad: number;
    descripcionActividad: string;
  }[];
  categoriaAutonomo?: string;
  categoriaMonotributo?: string;
  domicilioFiscal?: {
    codPostal: string;
    direccion: string;
    localidad: string;
    provincia: string;
  };
}

const TaxpayerLookup = () => {
  const [cuitInput, setCuitInput] = useState('');
  const [multipleInput, setMultipleInput] = useState('');
  const [taxpayer, setTaxpayer] = useState<Taxpayer | null>(null);
  const [multipleTaxpayers, setMultipleTaxpayers] = useState<{
    successful: Taxpayer[];
    failed: { taxId: string; error: string }[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingMultiple, setIsSearchingMultiple] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [multipleError, setMultipleError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'multiple'>('single');

  const handleSearchTaxpayer = async () => {
    if (!cuitInput.trim()) {
      setError('Debe ingresar un CUIT/CUIL');
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      setTaxpayer(null);
      
      const response = await taxpayerApi.getTaxpayer(cuitInput.trim());
      
      if (response.success) {
        setTaxpayer(response.data);
      } else {
        setError('No se encontró el contribuyente');
      }
    } catch (error) {
      console.error('Error searching taxpayer:', error);
      setError('Error al buscar el contribuyente');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchMultiple = async () => {
    if (!multipleInput.trim()) {
      setMultipleError('Debe ingresar al menos un CUIT/CUIL');
      return;
    }

    try {
      setIsSearchingMultiple(true);
      setMultipleError(null);
      setMultipleTaxpayers(null);
      
      // Parse input - split by comma, newline, or space
      const cuits = multipleInput
        .split(/[\s,]+/)
        .map(cuit => cuit.trim())
        .filter(cuit => cuit.length > 0);
      
      if (cuits.length === 0) {
        setMultipleError('Debe ingresar al menos un CUIT/CUIL válido');
        setIsSearchingMultiple(false);
        return;
      }
      
      const response = await taxpayerApi.getMultipleTaxpayers(cuits);
      
      if (response.success) {
        setMultipleTaxpayers(response.data);
      } else {
        setMultipleError('Error al consultar los contribuyentes');
      }
    } catch (error) {
      console.error('Error searching multiple taxpayers:', error);
      setMultipleError('Error al consultar los contribuyentes');
    } finally {
      setIsSearchingMultiple(false);
    }
  };

  const renderTaxpayerDetails = (taxpayer: Taxpayer) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Información General</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre / Razón Social:</p>
              <p className="font-medium">{taxpayer.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{taxpayer.tipoClave}:</p>
              <p className="font-medium">{taxpayer.idPersona}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo de Persona:</p>
              <p className="font-medium">{taxpayer.tipoPersona}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado:</p>
              <p className="font-medium">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  taxpayer.estadoClave === 'ACTIVO' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {taxpayer.estadoClave}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {taxpayer.domicilioFiscal && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Domicilio Fiscal</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Dirección:</p>
                <p className="font-medium">{taxpayer.domicilioFiscal.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Localidad:</p>
                <p className="font-medium">{taxpayer.domicilioFiscal.localidad}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Código Postal:</p>
                <p className="font-medium">{taxpayer.domicilioFiscal.codPostal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provincia:</p>
                <p className="font-medium">{taxpayer.domicilioFiscal.provincia}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {taxpayer.impuestos && taxpayer.impuestos.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Impuestos</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <ul className="space-y-2">
              {taxpayer.impuestos.map((impuesto, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-gray-700">{impuesto.descripcionImpuesto}</span>
                  <span className="text-gray-500">({impuesto.idImpuesto})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {taxpayer.actividades && taxpayer.actividades.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Actividades Económicas</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <ul className="space-y-2">
              {taxpayer.actividades.map((actividad, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-gray-700">{actividad.descripcionActividad}</span>
                  <span className="text-gray-500">({actividad.idActividad})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {taxpayer.categoriaAutonomo && (
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm font-medium text-blue-800">Categoría Autónomo</p>
            <p className="text-lg font-semibold text-blue-900">{taxpayer.categoriaAutonomo}</p>
          </div>
        )}
        
        {taxpayer.categoriaMonotributo && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm font-medium text-green-800">Categoría Monotributo</p>
            <p className="text-lg font-semibold text-green-900">{taxpayer.categoriaMonotributo}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMultipleTaxpayers = () => {
    if (!multipleTaxpayers) return null;
    
    return (
      <div className="space-y-6">
        {multipleTaxpayers.successful.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contribuyentes Encontrados ({multipleTaxpayers.successful.length})</h3>
            <div className="space-y-4">
              {multipleTaxpayers.successful.map((taxpayer, index) => (
                <Card key={index}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre / Razón Social:</p>
                      <p className="font-medium">{taxpayer.nombre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{taxpayer.tipoClave}:</p>
                      <p className="font-medium">{taxpayer.idPersona}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Persona:</p>
                      <p className="font-medium">{taxpayer.tipoPersona}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado:</p>
                      <p className="font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          taxpayer.estadoClave === 'ACTIVO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {taxpayer.estadoClave}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {taxpayer.impuestos && taxpayer.impuestos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Impuestos:</p>
                      <div className="flex flex-wrap gap-2">
                        {taxpayer.impuestos.map((impuesto, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {impuesto.descripcionImpuesto}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {multipleTaxpayers.failed.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contribuyentes No Encontrados ({multipleTaxpayers.failed.length})</h3>
            <div className="bg-red-50 p-4 rounded-md">
              <ul className="space-y-2">
                {multipleTaxpayers.failed.map((failed, index) => (
                  <li key={index} className="flex justify-between">
                    <span className="text-red-800">{failed.taxId}</span>
                    <span className="text-red-600">{failed.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Consulta de Contribuyentes</h1>
        <p className="mt-1 text-sm text-gray-500">Consulta información de contribuyentes en AFIP</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'single'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('single')}
            >
              Consulta Individual
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${
                activeTab === 'multiple'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('multiple')}
            >
              Consulta Masiva
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          {activeTab === 'single' ? (
            <div>
              <div className="flex space-x-2">
                <FormInput
                  label="CUIT / CUIL"
                  type="text"
                  placeholder="Ej: 20301234567"
                  value={cuitInput}
                  onChange={(e) => setCuitInput(e.target.value)}
                  error={error || undefined}
                  className="flex-1"
                />
                
                <div className="self-end">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSearchTaxpayer}
                    isLoading={isSearching}
                    leftIcon={<Search size={16} />}
                  >
                    Consultar
                  </Button>
                </div>
              </div>
              
              {taxpayer && (
                <div className="mt-6">
                  {renderTaxpayerDetails(taxpayer)}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label htmlFor="multiple-cuits" className="block text-sm font-medium text-gray-700 mb-1">
                  Múltiples CUIT / CUIL
                </label>
                <textarea
                  id="multiple-cuits"
                  rows={5}
                  className={`block w-full px-4 py-2 bg-white border rounded-md shadow-sm
                    placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500
                    ${multipleError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ingrese uno o más CUIT/CUIL separados por comas, espacios o saltos de línea. Ej: 20301234567, 27123456789"
                  value={multipleInput}
                  onChange={(e) => setMultipleInput(e.target.value)}
                ></textarea>
                {multipleError && <p className="mt-1 text-sm text-red-600">{multipleError}</p>}
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSearchMultiple}
                  isLoading={isSearchingMultiple}
                  leftIcon={<RefreshCw size={16} />}
                >
                  Consultar Todos
                </Button>
              </div>
              
              {multipleTaxpayers && (
                <div className="mt-6">
                  {renderMultipleTaxpayers()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxpayerLookup;