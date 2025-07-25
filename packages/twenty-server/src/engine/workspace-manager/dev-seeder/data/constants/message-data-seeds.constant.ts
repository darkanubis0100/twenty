import { MESSAGE_THREAD_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/data/constants/message-thread-data-seeds.constant';

type MessageDataSeed = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  receivedAt: Date;
  text: string;
  subject: string;
  messageThreadId: string;
  headerMessageId: string;
};

export const MESSAGE_DATA_SEED_COLUMNS: (keyof MessageDataSeed)[] = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'receivedAt',
  'text',
  'subject',
  'messageThreadId',
  'headerMessageId',
];

export const MESSAGE_DATA_SEED_IDS = {
  ID_1: '20202020-2b8a-405d-8f42-e820ca921421',
  ID_2: '20202020-04c8-4f24-93f2-764948e95014',
  ID_3: '20202020-ac6b-4f86-87a2-5f5f9d1b6481',
};

export const MESSAGE_DATA_SEEDS: MessageDataSeed[] = [
  {
    id: MESSAGE_DATA_SEED_IDS.ID_1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    receivedAt: new Date(),
    text: 'Hello, \n I hope this email finds you well. I am writing to request a meeting. I believe it would be beneficial for both parties to collaborate and explore potential opportunities. Would you be available for a meeting sometime next week? Please let me know your availability, and I will arrange a suitable time. \n Looking forward to your response.\n Best regards',
    subject: 'Meeting Request',
    messageThreadId: MESSAGE_THREAD_DATA_SEED_IDS.ID_1,
    headerMessageId: '99ef24a8-2b8a-405d-8f42-e820ca921421',
  },
  {
    id: MESSAGE_DATA_SEED_IDS.ID_2,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    receivedAt: new Date(),
    text: 'Good Morning,\n I am writing to inquire about information. Could you please provide me with details regarding this topic? \n Your assistance in this matter would be greatly appreciated. Thank you in advance for your prompt response. \n Best regards,Tim',
    subject: 'Inquiry Regarding Topic',
    messageThreadId: MESSAGE_THREAD_DATA_SEED_IDS.ID_2,
    headerMessageId: '8f804a9a-04c8-4f24-93f2-764948e95014',
  },
  {
    id: MESSAGE_DATA_SEED_IDS.ID_3,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    receivedAt: new Date(),
    text: 'Good Evening,\nI wanted to extend my sincere gratitude for taking the time to meet with me earlier today. It was a pleasure discussing with you, and I am excited about the potential opportunities for collaboration. \n Please feel free to reach out if you have any further questions or require additional information. I look forward to our continued communication. Best regards.',
    subject: 'Thank You for the Meeting',
    messageThreadId: MESSAGE_THREAD_DATA_SEED_IDS.ID_1,
    headerMessageId: '3939d68a-ac6b-4f86-87a2-5f5f9d1b6481',
  },
];
