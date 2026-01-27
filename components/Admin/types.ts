export enum AssetType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  MIXED = 'mixed'
}

export interface PropertyImage {
  id: string;
  url: string;
  isMain: boolean;
}

export interface PropertyData {
  name: string;
  location: string;
  assetType: AssetType | string;
  description: string;
  totalValue: string;
  sharePrice: string;
  yield: string;
  images: PropertyImage[];
  documents?: any[];
}
