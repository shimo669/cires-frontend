export const validateNationalId = (id: string) => {
  return /^\d{16}$/.test(id);
};
export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};