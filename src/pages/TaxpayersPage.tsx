import { useState, useEffect } from 'react';
import { taxpayerApi } from '../services/api';

interface Domicilio {
  id?: number;
  tipo_domicilio: string;
  calle: string;
  numero: number;
  piso?: string;
  oficina_dpto_local?: string;
  localidad: string;
  codigo_postal: string;
  id_provincia: number;
  descripcion_provincia: string;
  estado_domicilio: string;
  direccion: string;
}

interface Contribuyente {
  id?: number;
  id_persona: number;
  nombre: string;
  apellido: string;
  numero_documento: string;
  tipo_documento: string;
  tipo_clave: string;
  tipo_persona: string;
  estado_clave: string;
  fecha_nacimiento?: Date;
  fecha_fallecimiento?: Date;
  mes_cierre?: number;
  actividad_principal_id?: number;
  descripcion_actividad_principal?: string;
  periodo_actividad_principal?: number;
  domicilios: Domicilio[];
  created_at?: Date;
  updated_at?: Date;
}

export default function TaxpayersPage() {
  const [taxpayers, setTaxpayers] = useState<Contribuyente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCuit, setSearchCuit] = useState('');

  // Cargar contribuyentes al montar el componente
  useEffect(() => {
    loadTaxpayers();
  }, []);

  // Cargar todos los contribuyentes
  const loadTaxpayers = async () => {
    try {
      setLoading(true);
      const data = await taxpayerApi.getAllTaxpayers();
      setTaxpayers(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los contribuyentes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Consultar un nuevo contribuyente
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCuit || searchCuit.length !== 11) {
      setError('El CUIT debe tener 11 dígitos');
      return;
    }

    try {
      setLoading(true);
      await taxpayerApi.getTaxpayer(searchCuit);
      await loadTaxpayers(); // Recargar la lista
      setSearchCuit('');
      setError(null);
    } catch (err) {
      setError('Error al consultar el contribuyente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Contribuyentes Consultados</h1>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchCuit}
            onChange={(e) => setSearchCuit(e.target.value.replace(/\D/g, ''))}
            placeholder="Ingrese CUIT (11 dígitos)"
            className="flex-1 p-2 border rounded"
            maxLength={11}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Consultando...' : 'Consultar CUIT'}
          </button>
        </div>
      </form>

      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Lista de contribuyentes */}
      <div className="grid gap-6">
        {taxpayers.map((taxpayer) => (
          <div
            key={taxpayer.id_persona}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {taxpayer.nombre} {taxpayer.apellido}
                </h2>
                <p className="text-gray-600">CUIT: {taxpayer.id_persona}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                taxpayer.estado_clave === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {taxpayer.estado_clave}
              </span>
            </div>

            {/* Información principal */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">Documento</p>
                <p>{taxpayer.tipo_documento}: {taxpayer.numero_documento}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo de Persona</p>
                <p>{taxpayer.tipo_persona}</p>
              </div>
              {taxpayer.descripcion_actividad_principal && (
                <div className="col-span-2">
                  <p className="text-gray-600">Actividad Principal</p>
                  <p>{taxpayer.descripcion_actividad_principal}</p>
                </div>
              )}
            </div>

            {/* Domicilios */}
            {taxpayer.domicilios && taxpayer.domicilios.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Domicilios</h3>
                <div className="grid gap-3">
                  {taxpayer.domicilios.map((domicilio, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{domicilio.tipo_domicilio}</span>
                        <span className="text-sm text-gray-600">{domicilio.estado_domicilio}</span>
                      </div>
                      <p className="text-sm mt-1">{domicilio.direccion}</p>
                      <p className="text-sm text-gray-600">
                        {domicilio.localidad}, {domicilio.descripcion_provincia} ({domicilio.codigo_postal})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && taxpayers.length === 0 && (
          <div className="text-center text-gray-600 py-8">
            No hay contribuyentes consultados
          </div>
        )}
      </div>
    </div>
  );
} 