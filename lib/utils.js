// Tạo random string với các tùy chọn
export const generateRandomString = (length = 32, options = {}) => {
  const { 
    numbersOnly = false,
    uppercaseOnly = false 
  } = options;

  let chars;
  if (numbersOnly) {
    chars = '0123456789';
  } else if (uppercaseOnly) {
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else {
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  }

  return Array(length)
    .fill()
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join('');
};
  
  // Format slug từ tên album
  export const formatSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[áàảãạâấầẩẫậăắằẳẵặ]/g, 'a')
      .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
      .replace(/[íìỉĩị]/g, 'i')
      .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
      .replace(/[úùủũụưứừửữự]/g, 'u')
      .replace(/[ýỳỷỹỵ]/g, 'y')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };
  
  // Tạo URL cho album
  export const generateAlbumUrl = (name, randomString) => {
    const slug = formatSlug(name);
    return `${slug}-${randomString}`;
  };