import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import CatalogView from '../components/catalog/CatalogView';

export default function Catalog() {
  return (
    <Layout>
      <Header title="My Catalog" />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        <CatalogView />
      </div>
    </Layout>
  );
}
