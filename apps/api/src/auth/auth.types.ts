export type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  canViewAllQuizzes: boolean;
};
