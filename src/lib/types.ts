export type GymScale = "compact" | "standard" | "serious";

export type GearItem = {
  name: string;
  maker: string;
  price: number;
  url: string;
  category: string;
};

export type HomeGymPost = {
  id: string;
  slug: string;
  title: string;
  owner: string;
  location: string;
  scale: GymScale;
  areaSqm: number;
  budget: number;
  monthlyMaintenance: number;
  tags: string[];
  summary: string;
  highlights: string[];
  images: string[];
  gear: GearItem[];
  sns: {
    instagram?: string;
    youtube?: string;
    x?: string;
  };
  likes: number;
  saved: number;
};
