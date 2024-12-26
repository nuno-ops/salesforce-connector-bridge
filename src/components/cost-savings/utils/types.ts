export interface User {
  Id: string;
  Username: string;
  LastLoginDate: string | null;
  UserType: string;
  Profile: {
    Name: string;
  };
}

export interface OAuthToken {
  Id: string;
  AppName: string;
  LastUsedDate: string;
  UseCount: number;
  UserId: string;
}

export interface License {
  name: string;
  total: number;
  used: number;
}