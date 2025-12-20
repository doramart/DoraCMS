import { $t } from '@/locales';
export function beforeAvatarUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const isValidType = allowedTypes.includes(file.type);

  if (!isImage || !isValidType) {
    window.$message?.error($t('page.document.content.form.imageFormatError'));
    return false;
  }
  if (!isLt2M) {
    window.$message?.error($t('page.document.content.form.imageSizeError'));
    return false;
  }
  return true;
}
