const API_URL = 'http://localhost:8080';

export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
}

export const ENDPOINTS = {
  jadwal: (kelas: string) => `${API_URL}/jadwal/${kelas}`,
  uts: (kelas: string) => `${API_URL}/uts/${kelas}`
};
