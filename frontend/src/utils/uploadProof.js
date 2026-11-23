import { documentsAPI } from '../services/api';

export async function uploadProof(file, { title, relatedEntity = 'general' } = {}) {
  if (!file) return '';
  const response = await documentsAPI.uploadDocument(file, {
    title: title || file.name,
    relatedEntity,
    documentType: 'receipt',
    description: title || file.name,
  });
  return response.data?.data?.document?.fileUrl || '';
}
