import { useQuery } from "@tanstack/react-query";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  maxFinalists: number;
  demodayId: string;
  createdAt: string;
  updatedAt: string;
}

type ErrorResponse = {
  error: string;
};

export function useCategories(demodayId: string | null) {
  return useQuery<Category[], Error>({
    queryKey: ["categories", demodayId],
    queryFn: async () => {
      if (!demodayId) {
        return [];
      }
      const response = await fetch(`/api/categories?demodayId=${demodayId}`);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Failed to fetch categories");
      }
      return response.json();
    },
    enabled: !!demodayId,
  });
} 