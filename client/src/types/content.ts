export type ContentType = {
  id: number;
  sourceId: string;
  source: string;
  title: string;
  excerpt?: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
  url: string;
  fetchedAt: Date;
};
