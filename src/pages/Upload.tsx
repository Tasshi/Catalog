import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Header from '../components/layout/Header';
import UploadZone from '../components/upload/UploadZone';
import MetadataPanel from '../components/upload/MetadataPanel';
import { useUpload } from '../hooks/useUpload';
import { useApp } from '../contexts/AppContext';

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const { uploadFile, uploading, progress } = useUpload();
  const { showToast } = useApp();
  const navigate = useNavigate();

  async function handleSubmit(meta) {
    try {
      await uploadFile(meta);
      showToast(`"${meta.file.name}" uploaded successfully!`);
      navigate('/catalog');
    } catch (e) {
      showToast(e.message || 'Upload failed', 'error');
    }
  }

  return (
    <Layout>
      <Header title="Upload File" />
      <div className="flex-1 overflow-y-auto p-6 animate-slideIn">
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 380px' }}>
          <UploadZone
            file={selectedFile}
            onFilesSelected={setSelectedFile}
            onClear={() => setSelectedFile(null)}
          />
          <MetadataPanel
            file={selectedFile}
            onSubmit={handleSubmit}
            uploading={uploading}
            progress={progress}
          />
        </div>
      </div>
    </Layout>
  );
}
