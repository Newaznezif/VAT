import InvoiceForm from './InvoiceForm';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>VAT Cash Sales Invoice Generator</h1>
        <p>Create, calculate, and export professional VAT invoices</p>
      </header>
      <main>
        <InvoiceForm />
      </main>
    </div>
  );
}

export default App;
