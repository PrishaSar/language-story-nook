import { randomUUID } from "crypto";
import { readJsonFile, writeJsonFile } from "./file-store";
import {
  DEFAULT_CEFR_LEVEL,
  type LanguageProgress,
  type UserLanguage,
} from "../types";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  interests: string[];
  /** Story genres the learner wants (mystery, fantasy, etc.). */
  preferredGenres: string[];
  /** Optional existing fictional world they love (e.g. "Middle-earth", "Star Wars"). */
  preferredWorld: string | null;
  languages: UserLanguage[];
  onboarded: boolean;
  createdAt: string;
};

const USERS_FILE = "users.json";

function emptyProgress(): LanguageProgress {
  return { storiesCompleted: 0, chaptersRead: 0, wordsLearned: 0 };
}

function normalizeUser(raw: User): User {
  return {
    ...raw,
    languages: raw.languages ?? [],
    interests: raw.interests ?? [],
    preferredGenres: raw.preferredGenres ?? [],
    preferredWorld: raw.preferredWorld ?? null,
  };
}

async function readUsers(): Promise<User[]> {
  const users = await readJsonFile<User[]>(USERS_FILE, []);
  return users.map(normalizeUser);
}

async function writeUsers(users: User[]): Promise<void> {
  await writeJsonFile(USERS_FILE, users);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await readUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const users = await readUsers();
  const user: User = {
    id: randomUUID(),
    email: email.trim().toLowerCase(),
    passwordHash,
    name: null,
    interests: [],
    preferredGenres: [],
    preferredWorld: null,
    languages: [],
    onboarded: false,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

export async function updateUser(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "name"
      | "interests"
      | "preferredGenres"
      | "preferredWorld"
      | "onboarded"
      | "languages"
    >
  >,
): Promise<User | null> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  await writeUsers(users);
  return users[idx];
}

export async function addUserLanguage(
  userId: string,
  input: {
    languageCode: string;
    languageName: string;
    level?: UserLanguage["level"];
    reasonForLearning: string;
  },
): Promise<UserLanguage | null> {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const hasActive = users[idx].languages.some((l) => l.isActive);
  const language: UserLanguage = {
    id: randomUUID(),
    languageCode: input.languageCode.trim().toLowerCase(),
    languageName: input.languageName.trim(),
    level: input.level ?? DEFAULT_CEFR_LEVEL,
    reasonForLearning: input.reasonForLearning.trim(),
    progress: emptyProgress(),
    isActive: !hasActive,
    createdAt: new Date().toISOString(),
  };

  users[idx].languages.push(language);
  await writeUsers(users);
  return language;
}

export async function getActiveLanguage(userId: string): Promise<UserLanguage | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  return user.languages.find((l) => l.isActive) ?? user.languages[0] ?? null;
}

export async function getUserLanguageById(
  userId: string,
  languageId: string,
): Promise<UserLanguage | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  return user.languages.find((l) => l.id === languageId) ?? null;
}

export async function listUserLanguages(userId: string): Promise<UserLanguage[]> {
  const user = await findUserById(userId);
  return user?.languages ?? [];
}

export async function updateLanguageProgress(
  userId: string,
  languageId: string,
  patch: Partial<LanguageProgress>,
): Promise<UserLanguage | null> {
  const users = await readUsers();
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx === -1) return null;

  const langIdx = users[userIdx].languages.findIndex((l) => l.id === languageId);
  if (langIdx === -1) return null;

  users[userIdx].languages[langIdx].progress = {
    ...users[userIdx].languages[langIdx].progress,
    ...patch,
  };
  await writeUsers(users);
  return users[userIdx].languages[langIdx];
}
