export interface Flower {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  image: string;
  preOrder?: boolean;
}

export interface CartItem extends Flower {
  quantity: number;
}

export interface CheckoutFormData {
  fullName: string;
  mobile: string;
  email: string;
  poojaDate: Date;
  preferredTime: string;
  deliveryMethod: "pickup";
  specialNote?: string;
}
