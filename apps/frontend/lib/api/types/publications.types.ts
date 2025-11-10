export interface Publication {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  price: number;
  discountPrice?: number;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  previewUrl?: string;
  grade: Array<string | { id: string; name: string; code?: string }>;
  subject: Array<string | { id: string; name: string; code?: string }>;
  medium?: string | { id: string; name: string; code?: string };
  author?: string;
  publisher?: string;
  isbn?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt?: string;
  downloads: number;
  views: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  hasPurchased?: boolean;
}

export interface CreatePublicationData {
  title: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  price: number;
  discountPrice?: number;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  previewUrl?: string;
  gradeId?: string;
  subjectId?: string;
  mediumId?: string;
  author?: string;
  publisher?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface UpdatePublicationData extends Partial<CreatePublicationData> {}

export interface PublicationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  subject?: string;
  medium?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

export interface PublicationsResponse {
  publications: Publication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
