export const formatDate = (date: Date) => date.toLocaleDateString();
export const formatSLA = (deadline: Date) => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} days remaining`;
};