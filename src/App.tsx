import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InvoicesList from './pages/InvoicesList';
import CreateInvoice from './pages/CreateInvoice';
import CreateCreditNote from './pages/CreateCreditNote';
import InvoiceDetails from './pages/InvoiceDetails';
import TaxpayerLookup from './pages/TaxpayerLookup';
import CreditNoteConfirmation from './pages/CreditNoteConfirmation';
import TaxpayersPage from './pages/TaxpayersPage';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<InvoicesList />} />
              <Route path="invoices/:type/:puntoVenta/:numero" element={<InvoiceDetails />} />
              <Route path="create-invoice" element={<CreateInvoice />} />
              <Route path="create-credit-note" element={<CreateCreditNote />} />
              <Route path="create-credit-note/:cae" element={<CreateCreditNote />} />
              <Route path="taxpayer-lookup" element={<TaxpayerLookup />} />
              <Route path="credit-note-confirmation" element={<CreditNoteConfirmation />} />
              <Route path="taxpayers" element={<TaxpayersPage />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App