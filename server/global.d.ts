export {};

declare global {
  interface User {
    sub: string;
    email: string;
    firstName: string;
    lastName: string;
  }
}
