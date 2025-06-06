const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la solicitud');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Invoice Endpoints
export const invoiceApi = {
  // Generate Invoice Type A
  createInvoiceA: (invoiceData: any) => {
    return apiRequest('/invoices/a', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },
  
  // Generate Invoice Type B
  createInvoiceB: (invoiceData: any) => {
    return apiRequest('/invoices/b', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },
  
  // Generate Invoice Type C
  createInvoiceC: (invoiceData: any) => {
    return apiRequest('/invoices/c', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  },
  
  // Get all invoices with pagination and filters
  getInvoices: (page = 1, limit = 10, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return apiRequest(`/db/invoices?${queryParams}`);
  },
  
  // Get specific invoice details
  getInvoiceDetails: (type: string, puntoVenta: number, numero: number) => {
    return apiRequest(`/db/invoices/${type}/${puntoVenta}/${numero}`);
  },
};

// Credit Note Endpoints
export const creditNoteApi = {
  // Generate Credit Note Type A
  createCreditNoteA: (creditNoteData: any) => {
    return apiRequest('/credit-notes/a', {
      method: 'POST',
      body: JSON.stringify(creditNoteData),
    });
  },
  
  // Generate Credit Note Type B
  createCreditNoteB: (creditNoteData: any) => {
    return apiRequest('/credit-notes/b', {
      method: 'POST',
      body: JSON.stringify(creditNoteData),
    });
  },
  
  // Generate Credit Note Type C
  createCreditNoteC: (creditNoteData: any) => {
    return apiRequest('/credit-notes/c', {
      method: 'POST',
      body: JSON.stringify(creditNoteData),
    });
  },
  
  // Generate Credit Note from CAE
  createCreditNoteFromCae: (cae: string, data?: any) => {
    return apiRequest(`/credit-notes/from-cae/${cae}`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  
  // Get last credit note number
  getLastCreditNoteNumber: (type: string, puntoVenta: number) => {
    return apiRequest(`/credit-notes/last/${type}/${puntoVenta}`);
  },
};

// Taxpayer Endpoints
export const taxpayerApi = {
  // Get all taxpayers
  getAllTaxpayers: () => {
    return apiRequest('/taxpayers');
  },

  // Get taxpayer information by CUIT
  getTaxpayer: (cuit: string) => {
    return apiRequest(`/taxpayers/${cuit}`);
  },
  
  // Get multiple taxpayers information
  getMultipleTaxpayers: (cuits: string[]) => {
    return apiRequest('/taxpayers/multiple', {
      method: 'POST',
      body: JSON.stringify({ taxIds: cuits }),
    });
  },
};

export default {
  invoice: invoiceApi,
  creditNote: creditNoteApi,
  taxpayer: taxpayerApi,
};